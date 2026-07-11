from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .pipeline import run_pipeline


BASE_DIR = Path(__file__).resolve().parents[2]
REPORT_DIR = BASE_DIR / "examples" / "reports"
SUBMISSION_PACK_DIR = BASE_DIR / "outputs" / "submission_pack"
VALIDATION_DIR = SUBMISSION_PACK_DIR / "official_validation"


class PipelineRequest(BaseModel):
    report_text: str = Field(min_length=1)
    source_country: str = "USA"
    target_country: str = "India"


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path.relative_to(BASE_DIR)}")
    return json.loads(path.read_text(encoding="utf-8"))


def _infer_source_country(path: Path) -> str:
    name = path.name.lower()
    if name.startswith("india") or "_india_" in name:
        return "India"
    if name.startswith("usa") or "_usa_" in name:
        return "USA"
    if name.startswith("australia") or "_australia_" in name:
        return "Australia"
    if name.startswith("europe") or name.startswith("eu") or "_europe_" in name:
        return "Europe"
    return "India"


def _report_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8").strip().splitlines()
    return text[0] if text else path.stem.replace("_", " ").title()


def create_app() -> FastAPI:
    app = FastAPI(title="Cross-Border IPS AI Agent API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> Dict[str, str]:
        return {"status": "ok", "project": "Cross-Border IPS AI Agent"}

    @app.get("/api/reports")
    def reports() -> List[Dict[str, Any]]:
        if not REPORT_DIR.exists():
            raise HTTPException(status_code=404, detail="examples/reports folder not found")
        items = []
        for path in sorted(REPORT_DIR.glob("*.txt")):
            items.append({
                "id": path.name,
                "title": _report_title(path),
                "source_country": _infer_source_country(path),
                "text": path.read_text(encoding="utf-8"),
                "is_relay": path.name.startswith("relay_"),
            })
        return items

    @app.post("/api/pipeline")
    def pipeline(request: PipelineRequest) -> Dict[str, Any]:
        return run_pipeline(
            request.report_text,
            source_country=request.source_country,
            target_country=request.target_country,
        )

    @app.get("/api/evidence")
    def evidence() -> Dict[str, Any]:
        return _read_json(SUBMISSION_PACK_DIR / "evidence_summary.json")

    @app.get("/api/federated")
    def federated() -> Dict[str, Any]:
        full = _read_json(SUBMISSION_PACK_DIR / "federated_demo.json")
        return {
            "configuration": full["configuration"],
            "data_summary": full["data_summary"],
            "quality_metrics": full["quality_metrics"],
            "privacy_report": full["privacy_report"],
            "benchmarks": full["benchmarks"],
            "semantic_mapping_validation": full["semantic_mapping_validation"],
            "mapping_reuse_benefit": full["mapping_reuse_benefit"],
            "fhir_terminology_validation": full["fhir_terminology_validation"],
        }

    @app.get("/api/validator-log/{filename}")
    def validator_log(filename: str) -> Dict[str, Optional[str]]:
        if "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid validator log filename")
        path = VALIDATION_DIR / filename
        if not path.exists() or path.suffix != ".txt":
            raise HTTPException(status_code=404, detail="Validator log not found")
        return {"filename": filename, "text": path.read_text(encoding="utf-8")}

    return app


app = create_app()
