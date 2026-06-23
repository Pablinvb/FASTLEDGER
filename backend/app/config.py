from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FastLedger API"
    environment: str = "development"
    api_prefix: str = "/v1"
    allowed_origins: str = (
        "https://pablinvb.github.io,http://localhost:8000,http://127.0.0.1:8765"
    )

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_secret_key: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    resend_api_key: str = ""
    resend_from_email: str = "FastLedger <onboarding@resend.dev>"
    operations_email: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
