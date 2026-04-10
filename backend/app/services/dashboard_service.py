"""Dashboard stats aggregation — port of /api/dashboard/stats."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.item import Item
from app.models.organization import Organization
from app.schemas.dashboard import CategoryMargin, DashboardStats
from app.services.cost_calculator import calculate_item_costs


async def get_dashboard_stats(db: AsyncSession, org_id: str) -> DashboardStats:
    # Load organization
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one()

    # Load all items with relations
    items_result = await db.execute(
        select(Item)
        .where(Item.organization_id == org_id)
        .options(
            selectinload(Item.processing_logs),
            selectinload(Item.sale_line_item),
            selectinload(Item.category),
        )
    )
    items = items_result.scalars().all()

    total_inventory_value = 0.0
    total_sold_revenue = 0.0
    total_sold_cost = 0.0
    category_margins: dict[str, dict] = {}

    for item in items:
        processing_total = sum(log.cost for log in item.processing_logs)
        sale_price = item.sale_line_item.sale_price if item.sale_line_item else None
        costs = calculate_item_costs(item, org, processing_total, sale_price)

        if item.status.value != "SOLD":
            total_inventory_value += costs.total_cost
        elif costs.sale_price is not None:
            total_sold_revenue += costs.sale_price
            total_sold_cost += costs.total_cost

            cat_name = item.category.name if item.category else "Uncategorized"
            cat_id = item.category_id or "uncategorized"
            if cat_id not in category_margins:
                category_margins[cat_id] = {"revenue": 0.0, "cost": 0.0, "name": cat_name}
            category_margins[cat_id]["revenue"] += costs.sale_price
            category_margins[cat_id]["cost"] += costs.total_cost

    overall_margin_pct = (
        ((total_sold_revenue - total_sold_cost) / total_sold_revenue) * 100
        if total_sold_revenue > 0
        else 0.0
    )

    top_categories = sorted(
        [
            CategoryMargin(
                category_id=cid,
                name=data["name"],
                revenue=data["revenue"],
                cost=data["cost"],
                margin=data["revenue"] - data["cost"],
                margin_pct=(
                    ((data["revenue"] - data["cost"]) / data["revenue"]) * 100
                    if data["revenue"] > 0
                    else 0.0
                ),
            )
            for cid, data in category_margins.items()
        ],
        key=lambda c: c.margin,
        reverse=True,
    )

    return DashboardStats(
        total_items=len(items),
        total_inventory_items=sum(1 for i in items if i.status.value != "SOLD"),
        total_sold_items=sum(1 for i in items if i.status.value == "SOLD"),
        total_inventory_value=total_inventory_value,
        total_sold_revenue=total_sold_revenue,
        total_sold_cost=total_sold_cost,
        overall_margin_pct=overall_margin_pct,
        top_categories_by_margin=top_categories,
    )
