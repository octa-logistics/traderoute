"""API tests for items and processing logs endpoints."""

import pytest
import pytest_asyncio
from uuid import uuid4

pytestmark = pytest.mark.asyncio


async def test_create_item(client, seed_data):
    resp = await client.post("/api/v1/items", json={
        "name": "Widget A",
        "description": "A test widget",
        "sku": "WDG-001",
        "allocated_purchase_cost": 150.0,
        "allocated_fees": 10.0,
        "category_id": seed_data["category_id"],
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Widget A"
    assert data["status"] == "ACQUIRED"
    assert data["allocated_purchase_cost"] == 150.0
    assert data["organization_id"] == seed_data["org_id"]


async def test_list_items(client, seed_data):
    # Create two items
    await client.post("/api/v1/items", json={"name": "Item 1", "allocated_purchase_cost": 100.0})
    await client.post("/api/v1/items", json={"name": "Item 2", "allocated_purchase_cost": 200.0})

    resp = await client.get("/api/v1/items")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2


async def test_list_items_filter_by_status(client, seed_data):
    await client.post("/api/v1/items", json={"name": "Acquired Item", "status": "ACQUIRED"})
    await client.post("/api/v1/items", json={"name": "Listed Item", "status": "LISTED"})

    resp = await client.get("/api/v1/items", params={"status": "LISTED"})
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["name"] == "Listed Item"


async def test_get_item_detail_with_costs(client, seed_data):
    # Create item
    create_resp = await client.post("/api/v1/items", json={
        "name": "Costed Item",
        "allocated_purchase_cost": 500.0,
        "allocated_fees": 25.0,
    })
    item_id = create_resp.json()["id"]

    # Add a processing log
    await client.post(f"/api/v1/items/{item_id}/processing-logs", json={
        "description": "Cleaning",
        "cost": 15.0,
    })

    resp = await client.get(f"/api/v1/items/{item_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["costs"] is not None
    assert data["costs"]["allocated_purchase_cost"] == 500.0
    assert data["costs"]["allocated_fees"] == 25.0
    assert data["costs"]["processing_cost"] == 15.0
    assert data["costs"]["cost_before_interest"] == 540.0


async def test_update_item(client, seed_data):
    create_resp = await client.post("/api/v1/items", json={"name": "Old Name"})
    item_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/v1/items/{item_id}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


async def test_delete_item(client, seed_data):
    create_resp = await client.post("/api/v1/items", json={"name": "To Delete"})
    item_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/v1/items/{item_id}")
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True

    # Confirm gone
    resp = await client.get(f"/api/v1/items/{item_id}")
    assert resp.status_code == 404


async def test_get_nonexistent_item(client, seed_data):
    resp = await client.get(f"/api/v1/items/{uuid4()}")
    assert resp.status_code == 404


async def test_create_processing_log(client, seed_data):
    create_resp = await client.post("/api/v1/items", json={"name": "Logged Item"})
    item_id = create_resp.json()["id"]

    resp = await client.post(f"/api/v1/items/{item_id}/processing-logs", json={
        "description": "Polish",
        "cost": 20.0,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["description"] == "Polish"
    assert data["cost"] == 20.0
    assert data["item_id"] == item_id


async def test_list_processing_logs(client, seed_data):
    create_resp = await client.post("/api/v1/items", json={"name": "Multi-Log Item"})
    item_id = create_resp.json()["id"]

    await client.post(f"/api/v1/items/{item_id}/processing-logs", json={"description": "Step 1", "cost": 10.0})
    await client.post(f"/api/v1/items/{item_id}/processing-logs", json={"description": "Step 2", "cost": 20.0})

    resp = await client.get(f"/api/v1/items/{item_id}/processing-logs")
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) == 2
