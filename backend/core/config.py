from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    bedrock_model_lite: str = "amazon.nova-lite-v1:0"
    bedrock_model_pro: str = "amazon.nova-pro-v1:0"
    telegram_bot_token: str
    telegram_webhook_secret: str = "" # Optional, defaults to empty. Setup script will fallback.
    telegram_mini_app_url: str
    duffel_access_token: str
    duffel_webhook_secret: str
    geoapify_api_key: str
    searchapi_key: str
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    google_service_account_json: str
    google_demo_calendar_id: str
    render_external_url: str
    environment: str = "sandbox"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
