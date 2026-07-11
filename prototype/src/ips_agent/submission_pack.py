from __future__ import annotations

import csv
import json
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from .federated import run_federated_demo
from .pipeline import run_pipeline


WALKTHROUGH_REPORT = "usa_local_1.txt"
WALKTHROUGH_SOURCE = "USA"
WALKTHROUGH_TARGETS = ("India", "Australia", "Europe")
IPS_BUNDLE_PROFILE = "http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips"
IPS_IG = "hl7.fhir.uv.ips#2.0.1"


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _write_csv(path: Path, rows: Iterable[Dict[str, Any]], fieldnames: List[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def _target_slug(target: str) -> str:
    return target.lower().replace(" ", "_")


def _extract_validator_counts(text: str) -> Dict[str, Optional[int]]:
    match = re.search(r"Success:\s+(\d+)\s+errors?,\s+(\d+)\s+warnings?,\s+(\d+)\s+notes?", text)
    if not match:
        return {"errors": None, "warnings": None, "notes": None}
    return {
        "errors": int(match.group(1)),
        "warnings": int(match.group(2)),
        "notes": int(match.group(3)),
    }


def _run_validator_command(command: List[str], log_path: Path) -> Dict[str, Any]:
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=240,
        )
        output = (completed.stdout or "") + ("\n" if completed.stdout and completed.stderr else "") + (completed.stderr or "")
        log_path.write_text(output, encoding="utf-8")
        counts = _extract_validator_counts(output)
        return {
            "status": "passed" if completed.returncode == 0 and counts.get("errors") == 0 else "failed",
            "returncode": completed.returncode,
            "log": str(log_path),
            **counts,
        }
    except FileNotFoundError as error:
        log_path.write_text(str(error) + "\n", encoding="utf-8")
        return {
            "status": "not_run",
            "reason": str(error),
            "log": str(log_path),
            "errors": None,
            "warnings": None,
            "notes": None,
        }
    except subprocess.TimeoutExpired as error:
        output = (error.stdout or "") + ("\n" if error.stdout and error.stderr else "") + (error.stderr or "")
        log_path.write_text(output + "\nTimed out after 240 seconds.\n", encoding="utf-8")
        return {
            "status": "timeout",
            "reason": "FHIR validator command exceeded 240 seconds.",
            "log": str(log_path),
            "errors": None,
            "warnings": None,
            "notes": None,
        }


def _run_official_validation(validator_jar: Path, bundle_path: Path, validation_dir: Path, stem: str) -> Dict[str, Any]:
    if not validator_jar.exists():
        return {
            "status": "not_run",
            "reason": f"Validator jar not found: {validator_jar}",
            "base_fhir_r4": None,
            "ips_bundle_profile": None,
        }

    validation_dir.mkdir(parents=True, exist_ok=True)
    base_log = validation_dir / f"{stem}_base_fhir_r4.txt"
    ips_log = validation_dir / f"{stem}_ips_bundle_profile.txt"
    base = _run_validator_command(
        ["java", "-jar", str(validator_jar), str(bundle_path), "-version", "4.0.1"],
        base_log,
    )
    ips = _run_validator_command(
        [
            "java",
            "-jar",
            str(validator_jar),
            str(bundle_path),
            "-version",
            "4.0.1",
            "-ig",
            IPS_IG,
            "-profile",
            IPS_BUNDLE_PROFILE,
        ],
        ips_log,
    )
    return {
        "status": "passed" if base["status"] == "passed" and ips["status"] == "passed" else "failed",
        "base_fhir_r4": base,
        "ips_bundle_profile": ips,
    }


def _walkthrough_summary(payload: Dict[str, Any], target: str, output_file: Path, bundle_file: Path) -> Dict[str, Any]:
    return {
        "source_country": WALKTHROUGH_SOURCE,
        "target_country": target,
        "output_file": str(output_file),
        "bundle_file": str(bundle_file),
        "fhir_bundle_type": payload["fhir_bundle"].get("type"),
        "composition_first": payload["fhir_bundle"]["entry"][0]["resource"].get("resourceType") == "Composition",
        "facts_extracted": payload["quality_metrics"]["facts_extracted"],
        "facts_mapped": payload["quality_metrics"]["facts_mapped"],
        "terminology_mapping_coverage": payload["quality_metrics"]["terminology_mapping_coverage"],
        "internal_validation_errors": payload["quality_metrics"]["internal_validation_errors"],
        "target_country_gap_codes": [gap["code"] for gap in payload["target_country_gaps"]],
        "concept_maps_created": len(payload["concept_maps"]),
        "translation_results": len(payload["translation_results"]),
        "code_validation_results": len(payload["code_validation_results"]),
        "audit_trace_examples": payload["audit_trace"][:3],
    }


def _federated_summary(payload: Dict[str, Any], output_file: Path) -> Dict[str, Any]:
    semantic_rows = payload["semantic_mapping_validation"]
    correct = sum(1 for row in semantic_rows if row["correct"])
    return {
        "output_file": str(output_file),
        "configuration": payload["configuration"],
        "data_summary": payload["data_summary"],
        "quality_metrics": payload["quality_metrics"],
        "privacy_report": payload["privacy_report"],
        "globally_unseen_benchmarks": payload["benchmarks"]["globally_unseen"],
        "cross_site_transfer_by_receiver": payload["benchmarks"]["cross_site_transfer_by_receiver"],
        "semantic_mapping_validation": {
            "correct": correct,
            "total": len(semantic_rows),
            "accuracy": round(correct / len(semantic_rows), 6) if semantic_rows else 0.0,
        },
        "terminology_validation_counts": {
            "translation_results": len(payload["fhir_terminology_validation"]["translation_results"]),
            "code_validation_results": len(payload["fhir_terminology_validation"]["code_validation_results"]),
        },
        "mapping_reuse_benefit": {
            "first_lookup_sources": payload["mapping_reuse_benefit"]["first_lookup"]["mapping_sources"],
            "second_lookup_sources": payload["mapping_reuse_benefit"]["second_lookup"]["mapping_sources"],
            "first_lookup_trace_events": [
                item["event"]
                for item in payload["mapping_reuse_benefit"]["first_lookup"]["terminology_service_trace"]
            ],
            "second_lookup_trace_events": [
                item["event"]
                for item in payload["mapping_reuse_benefit"]["second_lookup"]["terminology_service_trace"]
            ],
        },
    }


def _write_pack_readme(path: Path, summary: Dict[str, Any]) -> None:
    lines = [
        "# Submission Evidence Pack",
        "",
        "This folder is generated by:",
        "",
        "```bash",
        "PYTHONPATH=src python3 -m ips_agent.cli submission-pack --out outputs/submission_pack",
        "```",
        "",
        "## Judge Demo Order",
        "",
    ]
    for index, step in enumerate(summary["judge_demo_order"], start=1):
        lines.append(f"{index}. {step}")
    lines.extend([
        "",
        "## Key Evidence Files",
        "",
        "- `evidence_summary.json`: one-file summary of the walkthrough, FL evidence, validation status, and limitations.",
        "- `federated_demo.json`: full four-site FedAvg case-study output.",
        "- `semantic_mapping_validation.csv`: transfer examples with expected and predicted canonical concepts.",
        "- `mapping_reuse_benefit.json`: registry miss, federated prediction, ConceptMap creation, and learned-cache reuse.",
        "- `fhir_bundles/`: FHIR R4 IPS-style document Bundles for the USA walkthrough.",
        "- `official_validation/`: official HL7 validator logs when `--validator-jar` is supplied.",
        "",
        "## Important Limitations",
        "",
    ])
    for limitation in summary["limitations"]:
        lines.append(f"- {limitation}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_submission_pack(
    base_dir: Path,
    output_dir: Path,
    rounds: int = 5,
    seed: int = 42,
    hash_dim: int = 1024,
    validator_jar: Optional[Path] = None,
) -> Dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    bundle_dir = output_dir / "fhir_bundles"
    validation_dir = output_dir / "official_validation"

    report_path = base_dir / "examples" / "reports" / WALKTHROUGH_REPORT
    report_text = report_path.read_text(encoding="utf-8")
    walkthroughs: List[Dict[str, Any]] = []
    validator_results: Dict[str, Any] = {}

    for target in WALKTHROUGH_TARGETS:
        payload = run_pipeline(report_text, source_country=WALKTHROUGH_SOURCE, target_country=target)
        stem = f"usa_local_1_to_{_target_slug(target)}"
        output_file = output_dir / f"{stem}.json"
        bundle_file = bundle_dir / f"{stem}_bundle.json"
        _write_json(output_file, payload)
        _write_json(bundle_file, payload["fhir_bundle"])
        walkthrough = _walkthrough_summary(payload, target, output_file, bundle_file)
        if validator_jar is not None:
            validator_results[target] = _run_official_validation(validator_jar, bundle_file, validation_dir, stem)
        else:
            validator_results[target] = {
                "status": "not_run",
                "reason": "Run with --validator-jar /path/to/validator_cli.jar to capture official validator logs.",
                "base_fhir_r4": None,
                "ips_bundle_profile": None,
            }
        walkthrough["official_validator"] = validator_results[target]
        walkthroughs.append(walkthrough)

    federated_file = output_dir / "federated_demo.json"
    federated_payload = run_federated_demo(base_dir, rounds=rounds, seed=seed, hash_dim=hash_dim)
    _write_json(federated_file, federated_payload)
    _write_json(output_dir / "semantic_mapping_validation.json", federated_payload["semantic_mapping_validation"])
    _write_csv(
        output_dir / "semantic_mapping_validation.csv",
        federated_payload["semantic_mapping_validation"],
        [
            "id",
            "owner_site",
            "receiver_site",
            "split",
            "category",
            "mention",
            "expected_canonical_concept",
            "predicted_canonical_concept",
            "confidence",
            "correct",
        ],
    )
    _write_json(output_dir / "fhir_terminology_validation.json", federated_payload["fhir_terminology_validation"])
    _write_json(output_dir / "mapping_reuse_benefit.json", federated_payload["mapping_reuse_benefit"])

    summary = {
        "project": "Cross-Border IPS AI Agent",
        "claim": (
            "Federated terminology learning resolves local clinical phrases without centralizing reports; "
            "FHIR terminology artifacts make mappings auditable; FHIR IPS packages the result for cross-border exchange."
        ),
        "walkthrough_report": {
            "source_report": str(report_path),
            "source_country": WALKTHROUGH_SOURCE,
            "target_countries": list(WALKTHROUGH_TARGETS),
            "conversions": walkthroughs,
        },
        "federated_evidence": _federated_summary(federated_payload, federated_file),
        "interoperability_evidence": {
            "data_interoperability": "FHIR R4 document Bundle with Composition first and IPS-style resource spine.",
            "semantic_interoperability": "SNOMED CT, ICD-10, LOINC, RxNorm, UCUM, and FHIR ConceptMap/ValueSet/CodeSystem artifacts.",
            "terminology_operations": "Local simulated FHIR $translate, $lookup, and $validate-code operations for prototype evidence.",
        },
        "official_validator_results": validator_results,
        "judge_demo_order": [
            "Show the USA diabetes report as the local source note.",
            "Show the clinical fact model and audit trace.",
            "Show registry hit/miss behavior and the federated terminology linker on unknown local phrasing.",
            "Show FHIR ConceptMap, $translate, and $validate-code evidence.",
            "Show learned mapping cache reuse on the second lookup.",
            "Show the FHIR IPS-style Bundle and receiver readiness gaps.",
            "Show official FHIR/IPS validator logs if generated.",
            "Show the federated evidence: transfer non-regression, aggregate transfer improvement, and privacy payload.",
        ],
        "limitations": [
            "Synthetic diabetes data only; no real patient data.",
            "Rule-backed extraction in the prototype; pretrained clinical NER is future work.",
            "FedAvg provides data locality only; model updates can leak information without DP-SGD or secure aggregation.",
            "FHIR terminology operations are simulated locally; live terminology servers are future work.",
            "US Core, ABDM, AU Core, and European Patient Summary checks are readiness-only, not formal certification.",
        ],
    }
    _write_json(output_dir / "evidence_summary.json", summary)
    _write_pack_readme(output_dir / "README.md", summary)
    return summary
