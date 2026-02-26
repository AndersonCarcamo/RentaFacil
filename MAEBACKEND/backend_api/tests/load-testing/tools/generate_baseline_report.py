#!/usr/bin/env python3
import argparse
import json
import statistics
from pathlib import Path


def _extract_metrics(payload: dict) -> dict:
    metrics = payload.get("metrics", {})

    duration_values = metrics.get("http_req_duration", {}).get("values", {})
    failed_values = metrics.get("http_req_failed", {}).get("values", {})
    req_values = metrics.get("http_reqs", {}).get("values", {})

    return {
        "requests_total": req_values.get("count", 0),
        "throughput_rps": req_values.get("rate", 0.0),
        "p50_ms": duration_values.get("med", 0.0),
        "p95_ms": duration_values.get("p(95)", 0.0),
        "p99_ms": duration_values.get("p(99)", 0.0),
        "avg_ms": duration_values.get("avg", 0.0),
        "error_rate": failed_values.get("rate", 0.0),
    }


def _aggregate(rows: list[dict]) -> dict:
    keys = [
        "requests_total",
        "throughput_rps",
        "p50_ms",
        "p95_ms",
        "p99_ms",
        "avg_ms",
        "error_rate",
    ]

    summary = {}
    for key in keys:
        values = [r[key] for r in rows]
        summary[key] = {
            "mean": statistics.mean(values) if values else 0,
            "min": min(values) if values else 0,
            "max": max(values) if values else 0,
        }

    # reproducibility score: relative spread on p95 and error_rate
    p95_mean = summary["p95_ms"]["mean"] or 1
    p95_spread = (summary["p95_ms"]["max"] - summary["p95_ms"]["min"]) / p95_mean

    err_mean = summary["error_rate"]["mean"] or 1e-6
    err_spread = (summary["error_rate"]["max"] - summary["error_rate"]["min"]) / err_mean

    summary["reproducible"] = bool(p95_spread <= 0.20 and err_spread <= 0.30)
    summary["spread"] = {
        "p95_relative": p95_spread,
        "error_relative": err_spread,
    }

    return summary


def _to_markdown(summary_by_scenario: dict) -> str:
    lines = [
        "# Baseline Report",
        "",
        "| Scenario | Runs | p50 ms | p95 ms | p99 ms | Error % | Throughput RPS | Reproducible |",
        "|---|---:|---:|---:|---:|---:|---:|:---:|",
    ]

    for scenario, data in summary_by_scenario.items():
        runs = data["runs"]
        agg = data["aggregate"]
        lines.append(
            f"| {scenario} | {runs} | "
            f"{agg['p50_ms']['mean']:.2f} | "
            f"{agg['p95_ms']['mean']:.2f} | "
            f"{agg['p99_ms']['mean']:.2f} | "
            f"{agg['error_rate']['mean'] * 100:.2f} | "
            f"{agg['throughput_rps']['mean']:.2f} | "
            f"{'✅' if agg['reproducible'] else '❌'} |"
        )

    lines += ["", "## Run Details", ""]

    for scenario, data in summary_by_scenario.items():
        lines.append(f"### {scenario}")
        lines.append("")
        lines.append("| Run | p50 ms | p95 ms | p99 ms | Error % | Throughput RPS |")
        lines.append("|---|---:|---:|---:|---:|---:|")
        for idx, row in enumerate(data["rows"], start=1):
            lines.append(
                f"| {idx} | {row['p50_ms']:.2f} | {row['p95_ms']:.2f} | {row['p99_ms']:.2f} | "
                f"{row['error_rate'] * 100:.2f} | {row['throughput_rps']:.2f} |"
            )
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate baseline report from k6 summary files.")
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-md", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    files = sorted(input_dir.glob("*.json"))

    grouped = {}
    for file in files:
        name = file.stem
        if "_run" not in name:
            continue
        scenario = name.split("_run")[0]
        payload = json.loads(file.read_text(encoding="utf-8"))
        row = _extract_metrics(payload)
        grouped.setdefault(scenario, []).append(row)

    summary_by_scenario = {}
    for scenario, rows in grouped.items():
        summary_by_scenario[scenario] = {
            "runs": len(rows),
            "rows": rows,
            "aggregate": _aggregate(rows),
        }

    output_json = Path(args.output_json)
    output_json.write_text(json.dumps(summary_by_scenario, indent=2), encoding="utf-8")

    output_md = Path(args.output_md)
    output_md.write_text(_to_markdown(summary_by_scenario), encoding="utf-8")


if __name__ == "__main__":
    main()
