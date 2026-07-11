from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from .federated import run_federated_demo
from .pipeline import run_pipeline
from .submission_pack import build_submission_pack


def _write_or_print(payload: Dict[str, Any], output_path: str | None) -> None:
    text = json.dumps(payload, indent=2)
    if output_path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text + "\n", encoding="utf-8")
        print(f"Wrote {path}")
    else:
        print(text)


def main() -> None:
    parser = argparse.ArgumentParser(description="Cross-border HL7 FHIR IPS agent demo.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="Run one clinical report through the agent pipeline.")
    run_parser.add_argument("report", help="Path to a synthetic/de-identified clinical report.")
    run_parser.add_argument("--source", default="India", help="Source country or ecosystem.")
    run_parser.add_argument("--target", default="USA", help="Target country or ecosystem.")
    run_parser.add_argument("--out", help="Optional output JSON path.")

    fed_parser = subparsers.add_parser("federated-demo", help="Run the genuine four-site FedAvg terminology-linking case study.")
    fed_parser.add_argument("--out", help="Optional output JSON path.")
    fed_parser.add_argument("--rounds", type=int, default=5, help="Federated training rounds (default: 5).")
    fed_parser.add_argument("--seed", type=int, default=42, help="Deterministic training seed (default: 42).")
    fed_parser.add_argument("--hash-dim", type=int, default=1024, help="Signed hashing feature dimension (default: 1024).")

    pack_parser = subparsers.add_parser("submission-pack", help="Build the judge-facing evidence pack.")
    pack_parser.add_argument("--out", default="outputs/submission_pack", help="Output directory for the pack.")
    pack_parser.add_argument("--rounds", type=int, default=5, help="Federated training rounds (default: 5).")
    pack_parser.add_argument("--seed", type=int, default=42, help="Deterministic training seed (default: 42).")
    pack_parser.add_argument("--hash-dim", type=int, default=1024, help="Signed hashing feature dimension (default: 1024).")
    pack_parser.add_argument(
        "--validator-jar",
        help="Optional official HL7 FHIR validator_cli.jar path for base R4 and IPS Bundle-profile logs.",
    )

    args = parser.parse_args()
    if args.command == "run":
        report_text = Path(args.report).read_text(encoding="utf-8")
        payload = run_pipeline(report_text, source_country=args.source, target_country=args.target)
        _write_or_print(payload, args.out)
    elif args.command == "federated-demo":
        base_dir = Path(__file__).resolve().parents[2]
        if args.rounds < 1 or args.hash_dim < 1:
            parser.error("--rounds and --hash-dim must be positive integers.")
        payload = run_federated_demo(base_dir, rounds=args.rounds, seed=args.seed, hash_dim=args.hash_dim)
        _write_or_print(payload, args.out)
    elif args.command == "submission-pack":
        base_dir = Path(__file__).resolve().parents[2]
        if args.rounds < 1 or args.hash_dim < 1:
            parser.error("--rounds and --hash-dim must be positive integers.")
        validator_jar = Path(args.validator_jar) if args.validator_jar else None
        payload = build_submission_pack(
            base_dir=base_dir,
            output_dir=Path(args.out),
            rounds=args.rounds,
            seed=args.seed,
            hash_dim=args.hash_dim,
            validator_jar=validator_jar,
        )
        print(f"Wrote submission evidence pack to {Path(args.out)}")
        print(json.dumps({
            "semantic_transfer_accuracy": payload["federated_evidence"]["semantic_mapping_validation"],
            "official_validator_results": payload["official_validator_results"],
        }, indent=2))


if __name__ == "__main__":
    main()
