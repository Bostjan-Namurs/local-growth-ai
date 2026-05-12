from app.config import Settings


def test_settings_defaults() -> None:
    settings = Settings()
    assert settings.app_env == "local"
    assert settings.llm_mode == "fake"
    assert not settings.enable_real_outreach
    assert not settings.enable_production_deploy
