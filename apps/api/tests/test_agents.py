from app.agents.run_logger import InMemoryAgentRunLogger
from app.config import Settings
from app.llm.client import LLMClient, LLMRequest


def test_fake_classifier_detects_bike_rental() -> None:
    client = LLMClient(Settings())
    response = client.complete(
        LLMRequest(model_alias="classifier", task="classify", input={"text": "e-bike rental shop"})
    )
    assert response.fake is True
    assert response.content["vertical_id"] == "bike_rental"


def test_fake_judge_passes() -> None:
    client = LLMClient(Settings())
    response = client.complete(LLMRequest(model_alias="judge", task="qa", input={}))
    assert response.content["passed"] is True


def test_agent_run_logger() -> None:
    logger = InMemoryAgentRunLogger()
    run = logger.start("SourceComplianceAgent", "abc123")
    finished = logger.finish(run.id, "def456")
    assert finished.status == "completed"
    assert finished.output_hash == "def456"
