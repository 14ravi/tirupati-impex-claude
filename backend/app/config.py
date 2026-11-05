from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8")

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str
    db_user: str
    db_password: str

    # Signs login sessions. Leave empty in local development to use a temporary key.
    secret_key: str = ""
    # Set to true when the site runs over HTTPS, so the session cookie is never sent over plain HTTP.
    cookie_secure: bool = False
    session_days: int = 7

    @property
    def database_url(self) -> str:
        # quote_plus keeps special characters such as "@" in the password from breaking the URL.
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        return f"postgresql+psycopg://{user}:{password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
