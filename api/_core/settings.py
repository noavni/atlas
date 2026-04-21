from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven runtime settings.

    Loaded once per cold start. All Supabase / AI credentials are server-side
    only; never expose via Next.js client code.
    """

    model_config = SettingsConfigDict(env_file=".env.local", case_sensitive=False, extra="ignore")

    # --- Supabase (public) ---
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # --- Supabase (server) ---
    supabase_service_role_key: str = ""

    # --- Worker shared secret (header presented by pg_cron) ---
    worker_shared_secret: str = ""

    # --- AI providers ---
    anthropic_api_key: str = ""
    voyage_api_key: str = ""
    # OpenAI + ElevenLabs come online in later phases; keys stay optional.
    openai_api_key: str = ""
    elevenlabs_api_key: str = ""

    # --- Runtime knobs ---
    worker_drain_deadline_seconds: float = 40.0
    embed_batch_size: int = 20


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
