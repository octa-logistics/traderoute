"""Port of src/lib/costs.ts — calculateItemCosts."""

import math
from datetime import datetime, timezone

from app.models.item import Item
from app.models.organization import Organization
from app.schemas.item import ItemCosts


def calculate_item_costs(
    item: Item,
    organization: Organization,
    processing_logs_total: float,
    sale_price: float | None,
) -> ItemCosts:
    processing_cost = processing_logs_total
    cost_before_interest = item.allocated_purchase_cost + item.allocated_fees + processing_cost

    # Financing interest: daily accrual
    daily_rate = organization.financing_rate / 365
    now = datetime.now(timezone.utc)
    acquired_date = item.created_at
    # Use updated_at as the sold date (matches TS: item.updatedAt when SOLD)
    end_date = item.updated_at if item.status.value == "SOLD" and sale_price is not None else now
    # Ensure both are offset-aware for subtraction
    if acquired_date.tzinfo is None:
        acquired_date = acquired_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    days_held = max(0, math.floor((end_date - acquired_date).total_seconds() / 86400))
    financing_interest = cost_before_interest * daily_rate * days_held

    total_cost = cost_before_interest + financing_interest
    margin = (sale_price - total_cost) if sale_price is not None else None

    return ItemCosts(
        allocated_purchase_cost=item.allocated_purchase_cost,
        allocated_fees=item.allocated_fees,
        processing_cost=processing_cost,
        cost_before_interest=cost_before_interest,
        days_held=days_held,
        financing_interest=financing_interest,
        total_cost=total_cost,
        sale_price=sale_price,
        margin=margin,
    )
