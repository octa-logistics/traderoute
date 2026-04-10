"""Transactional sale creation and deletion."""

from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.item import Item
from app.models.base import ItemStatus
from app.models.sale import Sale
from app.models.sale_line_item import SaleLineItem
from app.schemas.sale import SaleCreate


async def create_sale(db: AsyncSession, org_id: str, data: SaleCreate) -> Sale:
    """Create a sale with line items and mark items as SOLD — atomic."""
    async with db.begin_nested():
        sale = Sale(
            id=str(uuid4()),
            customer_id=data.customer_id,
            organization_id=org_id,
            date=data.date,
            notes=data.notes,
        )
        db.add(sale)
        await db.flush()

        item_ids = []
        for li in data.line_items:
            line_item = SaleLineItem(
                id=str(uuid4()),
                sale_id=sale.id,
                item_id=li.item_id,
                sale_price=li.sale_price,
            )
            db.add(line_item)
            item_ids.append(li.item_id)

        # Mark items as SOLD
        await db.execute(
            update(Item).where(Item.id.in_(item_ids)).values(status=ItemStatus.SOLD)
        )

    await db.commit()

    # Reload with relations
    result = await db.execute(
        select(Sale)
        .where(Sale.id == sale.id)
        .options(
            selectinload(Sale.customer),
            selectinload(Sale.line_items),
        )
    )
    return result.scalar_one()


async def delete_sale(db: AsyncSession, sale_id: str) -> None:
    """Delete a sale and reset items back to LISTED — atomic."""
    result = await db.execute(
        select(Sale)
        .where(Sale.id == sale_id)
        .options(selectinload(Sale.line_items))
    )
    sale = result.scalar_one_or_none()
    if sale is None:
        raise ValueError("Sale not found")

    item_ids = [li.item_id for li in sale.line_items]

    async with db.begin_nested():
        # Reset items to LISTED
        if item_ids:
            await db.execute(
                update(Item).where(Item.id.in_(item_ids)).values(status=ItemStatus.LISTED)
            )
        await db.delete(sale)

    await db.commit()
