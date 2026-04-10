from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://traderoute:traderoute@db:5432/traderoute"

    # JWT
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_prefix": "TRADEROUTE_", "env_file": ".env"}


settings = Settings()
