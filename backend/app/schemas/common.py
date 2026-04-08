from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    limit: int
