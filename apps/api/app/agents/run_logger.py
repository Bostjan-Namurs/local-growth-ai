from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4


@dataclass
class AgentRun:
    agent_name: str
    input_hash: str
    output_hash: str | None = None
    status: str = "started"
    metadata: dict[str, Any] = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class InMemoryAgentRunLogger:
    """Temporary logger for tests. Replace with database-backed logger later."""

    def __init__(self) -> None:
        self.runs: list[AgentRun] = []

    def start(self, agent_name: str, input_hash: str, metadata: dict[str, Any] | None = None) -> AgentRun:
        run = AgentRun(agent_name=agent_name, input_hash=input_hash, metadata=metadata or {})
        self.runs.append(run)
        return run

    def finish(self, run_id: str, output_hash: str, status: str = "completed") -> AgentRun:
        for run in self.runs:
            if run.id == run_id:
                run.output_hash = output_hash
                run.status = status
                return run
        raise KeyError(f"Unknown agent run: {run_id}")
