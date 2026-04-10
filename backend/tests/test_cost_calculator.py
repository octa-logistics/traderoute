"""Tests for cost calculator — verifies parity with the original TypeScript implementation."""

import math
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

from app.models.base import ItemStatus
from app.services.cost_calculator import calculate_item_costs


def _make_item(
    *,
    allocated_purchase_cost: float = 100.0,
    allocated_fees: float = 10.0,
    status: str = "LISTED",
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
):
    """Create a mock Item with the fields the calculator uses."""
    item = MagicMock()
    item.allocated_purchase_cost = allocated_purchase_cost
    item.allocated_fees = allocated_fees
    item.status = MagicMock()
    item.status.value = status
    item.created_at = created_at or datetime.now(timezone.utc) - timedelta(days=30)
    item.updated_at = updated_at or datetime.now(timezone.utc)
    return item


def _make_org(financing_rate: float = 0.12):
    org = MagicMock()
    org.financing_rate = financing_rate
    return org


class TestCostCalculatorParity:
    """Verify Python port produces same results as the TS version."""

    def test_basic_cost_no_sale(self):
        """Unsold item with 30 days held at 12% annual."""
        now = datetime.now(timezone.utc)
        created = now - timedelta(days=30)
        item = _make_item(
            allocated_purchase_cost=1000.0,
            allocated_fees=50.0,
            status="LISTED",
            created_at=created,
            updated_at=now,
        )
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=25.0, sale_price=None)

        assert costs.allocated_purchase_cost == 1000.0
        assert costs.allocated_fees == 50.0
        assert costs.processing_cost == 25.0
        assert costs.cost_before_interest == 1075.0  # 1000 + 50 + 25
        assert costs.days_held == 30
        # daily_rate = 0.12/365, interest = 1075 * (0.12/365) * 30
        expected_interest = 1075.0 * (0.12 / 365) * 30
        assert abs(costs.financing_interest - expected_interest) < 0.01
        assert abs(costs.total_cost - (1075.0 + expected_interest)) < 0.01
        assert costs.sale_price is None
        assert costs.margin is None

    def test_sold_item_with_margin(self):
        """Sold item — end_date should be updated_at (the sold timestamp)."""
        now = datetime.now(timezone.utc)
        created = now - timedelta(days=60)
        sold_at = now - timedelta(days=10)
        item = _make_item(
            allocated_purchase_cost=500.0,
            allocated_fees=20.0,
            status="SOLD",
            created_at=created,
            updated_at=sold_at,
        )
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=30.0, sale_price=700.0)

        assert costs.cost_before_interest == 550.0  # 500 + 20 + 30
        # days_held should be from created to sold_at (50 days)
        assert costs.days_held == 50
        expected_interest = 550.0 * (0.12 / 365) * 50
        expected_total = 550.0 + expected_interest
        assert abs(costs.total_cost - expected_total) < 0.01
        assert costs.sale_price == 700.0
        assert abs(costs.margin - (700.0 - expected_total)) < 0.01

    def test_zero_financing_rate(self):
        """No financing rate — interest should be zero."""
        item = _make_item(created_at=datetime.now(timezone.utc) - timedelta(days=100))
        org = _make_org(financing_rate=0.0)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=None)

        assert costs.financing_interest == 0.0
        assert costs.total_cost == costs.cost_before_interest

    def test_same_day_item(self):
        """Item created and queried same day — 0 days held."""
        now = datetime.now(timezone.utc)
        item = _make_item(created_at=now, updated_at=now)
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=None)

        assert costs.days_held == 0
        assert costs.financing_interest == 0.0

    def test_negative_days_protection(self):
        """If updated_at < created_at somehow, days_held should be 0 not negative."""
        now = datetime.now(timezone.utc)
        item = _make_item(
            created_at=now,
            updated_at=now - timedelta(days=5),
            status="SOLD",
        )
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=100.0)

        assert costs.days_held == 0

    def test_days_held_uses_floor(self):
        """Matches Math.floor() in TS — 29.9 days should be 29."""
        now = datetime.now(timezone.utc)
        # 29 days + 23 hours = 29.958 days, should floor to 29
        created = now - timedelta(days=29, hours=23)
        item = _make_item(created_at=created, updated_at=now)
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=None)

        assert costs.days_held == 29

    def test_sold_without_sale_price_uses_now(self):
        """SOLD status but sale_price is None — uses now as end_date (matches TS saleLineItem check)."""
        now = datetime.now(timezone.utc)
        created = now - timedelta(days=10)
        item = _make_item(
            status="SOLD",
            created_at=created,
            updated_at=now - timedelta(days=5),
        )
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=None)

        # Should use `now` not `updated_at` because sale_price is None
        assert costs.days_held == 10

    def test_timezone_naive_handling(self):
        """Timestamps without timezone info should still work (replaced with UTC)."""
        created = datetime(2025, 1, 1, 0, 0, 0)  # naive
        updated = datetime(2025, 1, 31, 0, 0, 0)  # naive
        item = _make_item(
            status="SOLD",
            created_at=created,
            updated_at=updated,
        )
        org = _make_org(financing_rate=0.12)

        costs = calculate_item_costs(item, org, processing_logs_total=0.0, sale_price=200.0)

        assert costs.days_held == 30


class TestCostCalculatorKnownValues:
    """Cross-check with hand-computed values matching what the TS version would produce."""

    def test_ts_parity_example_1(self):
        """
        TS equivalent:
        allocatedPurchaseCost = 200, allocatedFees = 10, processingLogs total = 5
        financingRate = 0.10, daysHeld = 365
        interest = 215 * (0.10/365) * 365 = 21.50
        totalCost = 236.50, salePrice = 300, margin = 63.50
        """
        now = datetime.now(timezone.utc)
        item = _make_item(
            allocated_purchase_cost=200.0,
            allocated_fees=10.0,
            status="SOLD",
            created_at=now - timedelta(days=365),
            updated_at=now,
        )
        org = _make_org(financing_rate=0.10)

        costs = calculate_item_costs(item, org, processing_logs_total=5.0, sale_price=300.0)

        assert costs.cost_before_interest == 215.0
        assert costs.days_held == 365
        # interest = 215 * 0.10/365 * 365 = 215 * 0.10 = 21.50
        assert abs(costs.financing_interest - 21.5) < 0.01
        assert abs(costs.total_cost - 236.5) < 0.01
        assert abs(costs.margin - 63.5) < 0.01
