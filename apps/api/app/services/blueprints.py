from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


class BlueprintError(RuntimeError):
    """Raised when blueprint registry or blueprint files are invalid."""


@dataclass(frozen=True)
class BlueprintPaths:
    root: Path

    @property
    def registry_file(self) -> Path:
        return self.root / "registry.yaml"


def default_blueprints_root() -> Path:
    # apps/api/app/services/blueprints.py -> repo root -> blueprints
    return Path(__file__).resolve().parents[4] / "blueprints"


class BlueprintRegistry:
    def __init__(self, root: Path | None = None) -> None:
        self.paths = BlueprintPaths(root=root or default_blueprints_root())

    def load_registry(self) -> dict[str, Any]:
        if not self.paths.registry_file.exists():
            raise BlueprintError(f"Blueprint registry not found: {self.paths.registry_file}")
        data = yaml.safe_load(self.paths.registry_file.read_text()) or {}
        if not isinstance(data, dict) or "verticals" not in data:
            raise BlueprintError("Blueprint registry must contain a 'verticals' mapping")
        if not isinstance(data["verticals"], dict):
            raise BlueprintError("Blueprint registry 'verticals' must be a mapping")
        return data

    def list_verticals(self) -> list[dict[str, Any]]:
        registry = self.load_registry()
        verticals: list[dict[str, Any]] = []
        for vertical_id, value in registry["verticals"].items():
            if not isinstance(value, dict):
                raise BlueprintError(f"Registry entry for {vertical_id} must be a mapping")
            verticals.append({"vertical_id": vertical_id, **value})
        return verticals

    def get_vertical(self, vertical_id: str) -> dict[str, Any]:
        registry = self.load_registry()
        vertical = registry["verticals"].get(vertical_id)
        if vertical is None:
            raise BlueprintError(f"Unknown vertical_id: {vertical_id}")
        if not isinstance(vertical, dict):
            raise BlueprintError(f"Registry entry for {vertical_id} must be a mapping")
        return vertical

    def load_blueprint(self, vertical_id: str) -> dict[str, Any]:
        vertical = self.get_vertical(vertical_id)
        blueprint_path = vertical.get("blueprint_path")
        if blueprint_path:
            path = self.paths.root / blueprint_path
        else:
            normalized = vertical_id.replace("_", "-")
            path = self.paths.root / normalized / "blueprint.yaml"
        if not path.exists():
            raise BlueprintError(f"Blueprint file not found for {vertical_id}: {path}")
        data = yaml.safe_load(path.read_text()) or {}
        if not isinstance(data, dict):
            raise BlueprintError(f"Blueprint file must be a mapping: {path}")
        return {"vertical_id": vertical_id, "registry": vertical, "blueprint": data}
