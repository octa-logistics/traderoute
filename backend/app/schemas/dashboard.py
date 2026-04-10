from pydantic import BaseModel


class CategoryMargin(BaseModel):
    category_id: str
    name: str
    revenue: float
    cost: float
    margin: float
    margin_pct: float


class DashboardStats(BaseModel):
    total_items: int
    total_inventory_items: int
    total_sold_items: int
    total_inventory_value: float
    total_sold_revenue: float
    total_sold_cost: float
    overall_margin_pct: float
    top_categories_by_margin: list[CategoryMargin]
