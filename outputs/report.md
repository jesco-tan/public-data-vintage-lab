# PAYEMS vintage comparison

**Mode:** synthetic fixture — not observed PAYEMS data. **Observation window:** 2025-01-01 to 2025-03-01. **Information dates:** 2025-04-04 and 2026-02-11. **Units:** thousands of persons, seasonally adjusted.

## Values and revisions

| Observation period | First information date value | Second information date value | Revision | Revision % | First row realtime start | Second row realtime start | Status |
|---|---:|---:|---:|---:|---|---|---|
| 2025-01-01 | 100000 | 99900 | -100 | -0.1000 | 2025-02-07 | 2026-02-11 | ok |
| 2025-02-01 | 100100 | 99950 | -150 | -0.1499 | 2025-03-07 | 2026-02-11 | ok |
| 2025-03-01 | 100300 | 100030 | -270 | -0.2692 | 2025-04-04 | 2026-02-11 | ok |

Revision is second minus first; percent uses the absolute first level as denominator. Row realtime starts are returned validity metadata and do not by themselves establish the first publication date.

## Largest level revisions

| Observation period | First information date value | Second information date value | Revision | Revision % | First row realtime start | Second row realtime start | Status |
|---|---:|---:|---:|---:|---|---|---|
| 2025-03-01 | 100300 | 100030 | -270 | -0.2692 | 2025-04-04 | 2026-02-11 | ok |
| 2025-02-01 | 100100 | 99950 | -150 | -0.1499 | 2025-03-07 | 2026-02-11 | ok |
| 2025-01-01 | 100000 | 99900 | -100 | -0.1000 | 2025-02-07 | 2026-02-11 | ok |

## Decision replay

Predeclared illustrative rule: flag March 2025 job growth below 150 thousand, calculated as March minus February within each information date. Sensitivity thresholds of 100 and 200 thousand are shown. This demonstrates revision sensitivity and is not an economic policy recommendation.

| Threshold (thousands) | 2025-04-04 growth | 2025-04-04 decision | 2026-02-11 growth | 2026-02-11 decision |
|---:|---:|---|---:|---|
| 150 | 200 | no flag | 80 | flag |
| 100 | 200 | no flag | 80 | flag |
| 200 | 200 | no flag | 80 | flag |

Decision disagreement rate over the selected date comparison at the 150-thousand threshold: 1/1. This is not a population estimate.

## Synthetic fixture history

This section uses three invented dates and is not a historical PAYEMS finding. It compares adjacent vintage decisions, so the denominator is two transitions. At the 150-thousand rule, April to May does not change the decision; May to February does.

| Threshold | 2025-04-04 | 2025-05-02 | 2026-02-11 | Adjacent disagreement rate |
|---:|---|---|---|---:|
| 150 | 200 / no flag | 160 / no flag | 80 / flag | 1/2 |
| 100 | 200 / no flag | 160 / no flag | 80 / flag | 1/2 |
| 200 | 200 / no flag | 160 / flag | 80 / flag | 1/2 |


## BLS cross-check

The [original BLS release](https://www.bls.gov/news.release/archives/empsit_04042025.htm) reports February and March levels of 159170 and 159398 thousand (growth 228). The [benchmark article](https://www.bls.gov/web/empsit/cesbmart.htm) reports revised levels of 158310 and 158377 thousand (growth 67). Synthetic fixture values cannot verify these BLS figures.


## Plot

See [plot.html](plot.html).

## Provenance

Source: U.S. Bureau of Labor Statistics via [FRED/ALFRED](https://fred.stlouisfed.org/series/PAYEMS). Raw response hashes and request parameters are in [manifest.json](manifest.json). A retrieved date is separate from both observation and information dates. Cached responses are pinned and validated before reuse. The normalized [observations.csv](observations.csv) contains both snapshots.

This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. [FRED API terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply to users of this application.
