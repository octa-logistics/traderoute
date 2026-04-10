"""API tests for the dashboard stats endpoint."""

import pytest

pytestmark = pytest.mark.asyncio


async def test_dashboard_stats_empty(client, seed_data):
    """Dashboard with no items."""
    resp = await client.get("/api/v1/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_items"] == 0
    assert stats["total_inventory_items"] == 0
    assert stats["total_sold_items"] == 0
    assert stats["total_inventory_value"] == 0.0
    assert stats["total_sold_revenue"] == 0.0
    assert stats["overall_margin_pct"] == 0.0


async def test_dashboard_stats_with_inventory(client, seed_data):
    """Dashboard with unsold inventory items."""
    await client.post("/api/v1/items", json={
        "name": "Inv Item 1",
        "allocated_purchase_cost": 100.0,
        "allocated_fees": 5.0,
        "status": "LISTED",
        "category_id": seed_data["category_id"],
    })
    await client.post("/api/v1/items", json={
        "name": "Inv Item 2",
        "allocated_purchase_cost": 200.0,
        "allocated_fees": 10.0,
        "status": "ACQUIRED",
        "category_id": seed_data["category_id"],
    })

    resp = await client.get("/api/v1/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_items"] == 2
    assert stats["total_inventory_items"] == 2
    assert stats["total_sold_items"] == 0
    assert stats["total_inventory_value"] > 0
    assert stats["total_sold_revenue"] == 0.0


async def test_dashboard_stats_with_sales(client, seed_data):
    """Dashboard with sold items — verifies margin calculations."""
    # Create items
    item1_resp = await client.post("/api/v1/items", json={
        "name": "Sold Item 1",
        "allocated_purchase_cost": 100.0,
        "allocated_fees": 0.0,
        "status": "LISTED",
        "category_id": seed_data["category_id"],
    })
    item1_id = item1_resp.json()["id"]

    # Sell it
    await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item1_id, "sale_price": 200.0}],
    })

    resp = await client.get("/api/v1/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_sold_items"] == 1
    assert stats["total_sold_revenue"] == 200.0
    assert stats["total_sold_cost"] > 0
    assert stats["overall_margin_pct"] > 0
    assert len(stats["top_categories_by_margin"]) == 1
    assert stats["top_categories_by_margin"][0]["name"] == "Electronics"
