"""API tests for sales endpoints — transactional create/delete and item status transitions."""

import pytest

pytestmark = pytest.mark.asyncio


async def _create_item(client, name="Sale Item", cost=100.0):
    resp = await client.post("/api/v1/items", json={
        "name": name,
        "allocated_purchase_cost": cost,
        "status": "LISTED",
    })
    assert resp.status_code == 201
    return resp.json()


async def test_create_sale(client, seed_data):
    item = await _create_item(client)

    resp = await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item["id"], "sale_price": 200.0}],
    })
    assert resp.status_code == 201
    sale = resp.json()
    assert sale["customer_id"] == seed_data["customer_id"]
    assert len(sale["line_items"]) == 1
    assert sale["line_items"][0]["sale_price"] == 200.0

    # Verify item status changed to SOLD
    item_resp = await client.get(f"/api/v1/items/{item['id']}")
    assert item_resp.json()["status"] == "SOLD"


async def test_create_sale_multiple_items(client, seed_data):
    item1 = await _create_item(client, name="Sale Item 1")
    item2 = await _create_item(client, name="Sale Item 2")

    resp = await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [
            {"item_id": item1["id"], "sale_price": 150.0},
            {"item_id": item2["id"], "sale_price": 250.0},
        ],
    })
    assert resp.status_code == 201
    assert len(resp.json()["line_items"]) == 2


async def test_delete_sale_resets_items(client, seed_data):
    item = await _create_item(client)

    # Create sale
    sale_resp = await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item["id"], "sale_price": 200.0}],
    })
    sale_id = sale_resp.json()["id"]

    # Verify item is SOLD
    item_resp = await client.get(f"/api/v1/items/{item['id']}")
    assert item_resp.json()["status"] == "SOLD"

    # Delete sale
    del_resp = await client.delete(f"/api/v1/sales/{sale_id}")
    assert del_resp.status_code == 200

    # Item should be back to LISTED
    item_resp = await client.get(f"/api/v1/items/{item['id']}")
    assert item_resp.json()["status"] == "LISTED"


async def test_list_sales(client, seed_data):
    item = await _create_item(client)
    await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item["id"], "sale_price": 200.0}],
    })

    resp = await client.get("/api/v1/sales")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_sale(client, seed_data):
    item = await _create_item(client)
    sale_resp = await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item["id"], "sale_price": 200.0}],
    })
    sale_id = sale_resp.json()["id"]

    resp = await client.get(f"/api/v1/sales/{sale_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == sale_id


async def test_update_sale_notes(client, seed_data):
    item = await _create_item(client)
    sale_resp = await client.post("/api/v1/sales", json={
        "customer_id": seed_data["customer_id"],
        "line_items": [{"item_id": item["id"], "sale_price": 200.0}],
    })
    sale_id = sale_resp.json()["id"]

    resp = await client.patch(f"/api/v1/sales/{sale_id}", json={"notes": "Updated notes"})
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Updated notes"


async def test_delete_nonexistent_sale(client, seed_data):
    resp = await client.delete("/api/v1/sales/nonexistent-id")
    assert resp.status_code == 404
