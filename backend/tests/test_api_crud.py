"""API tests for CRUD endpoints: vendors, customers, categories, storage locations, purchase deals."""

import pytest
from uuid import uuid4

pytestmark = pytest.mark.asyncio


# --- Vendors ---

async def test_vendor_crud(client, seed_data):
    # Create
    resp = await client.post("/api/v1/vendors", json={"name": "Acme Corp"})
    assert resp.status_code == 201
    vendor = resp.json()
    assert vendor["name"] == "Acme Corp"
    vendor_id = vendor["id"]

    # List
    resp = await client.get("/api/v1/vendors")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Get
    resp = await client.get(f"/api/v1/vendors/{vendor_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Corp"

    # Update
    resp = await client.patch(f"/api/v1/vendors/{vendor_id}", json={"name": "Acme Inc"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Inc"

    # Delete
    resp = await client.delete(f"/api/v1/vendors/{vendor_id}")
    assert resp.status_code == 200

    resp = await client.get(f"/api/v1/vendors/{vendor_id}")
    assert resp.status_code == 404


# --- Customers ---

async def test_customer_crud(client, seed_data):
    # Seed already has one customer; create another
    resp = await client.post("/api/v1/customers", json={"name": "New Customer"})
    assert resp.status_code == 201
    customer_id = resp.json()["id"]

    resp = await client.get("/api/v1/customers")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2  # seed + new

    resp = await client.patch(f"/api/v1/customers/{customer_id}", json={"name": "Updated Customer"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Customer"

    resp = await client.delete(f"/api/v1/customers/{customer_id}")
    assert resp.status_code == 200


# --- Categories ---

async def test_category_crud(client, seed_data):
    resp = await client.post("/api/v1/categories", json={"name": "Furniture"})
    assert resp.status_code == 201
    cat_id = resp.json()["id"]

    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2  # seed + new

    resp = await client.patch(f"/api/v1/categories/{cat_id}", json={"name": "Home Furniture"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Home Furniture"

    resp = await client.delete(f"/api/v1/categories/{cat_id}")
    assert resp.status_code == 200


# --- Storage Locations ---

async def test_storage_location_crud(client, seed_data):
    resp = await client.post("/api/v1/storage-locations", json={"name": "Warehouse A"})
    assert resp.status_code == 201
    loc_id = resp.json()["id"]

    resp = await client.get("/api/v1/storage-locations")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = await client.patch(f"/api/v1/storage-locations/{loc_id}", json={"name": "Warehouse B"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Warehouse B"

    resp = await client.delete(f"/api/v1/storage-locations/{loc_id}")
    assert resp.status_code == 200


# --- Purchase Deals ---

async def test_purchase_deal_crud(client, seed_data):
    # Need a vendor first
    vendor_resp = await client.post("/api/v1/vendors", json={"name": "Deal Vendor"})
    vendor_id = vendor_resp.json()["id"]

    resp = await client.post("/api/v1/purchase-deals", json={
        "vendor_id": vendor_id,
        "total_price": 5000.0,
        "fees": 200.0,
        "notes": "Bulk Buy Q1",
    })
    assert resp.status_code == 201
    deal = resp.json()
    assert deal["total_price"] == 5000.0
    deal_id = deal["id"]

    resp = await client.get("/api/v1/purchase-deals")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = await client.get(f"/api/v1/purchase-deals/{deal_id}")
    assert resp.status_code == 200

    resp = await client.patch(f"/api/v1/purchase-deals/{deal_id}", json={"notes": "Bulk Buy Q2"})
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Bulk Buy Q2"

    resp = await client.delete(f"/api/v1/purchase-deals/{deal_id}")
    assert resp.status_code == 200


# --- Health ---

async def test_health_endpoint(client, seed_data):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
