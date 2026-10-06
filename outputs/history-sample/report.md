# PAYEMS March 2025 vintage history

**Mode:** synthetic self-authored fixture. **Observed information window:** 2025-04-04 to 2026-02-11. **Units:** thousands of persons, seasonally adjusted. **Sample:** selected fixture dates when offline; otherwise all PAYEMS series-change dates returned by the FRED vintage-date endpoint within the window, plus both endpoints. All values below are invented for testing and are not PAYEMS findings.

## Replay by information date

| Information date | February level | March level | March growth | Below 150 thousand |
|---|---:|---:|---:|---|
| 2025-04-04 | 100100 | 100300 | 200 | no flag |
| 2025-05-02 | 100120 | 100280 | 160 | no flag |
| 2026-02-11 | 99950 | 100030 | 80 | flag |

February and March levels are always taken from the same date's exact as-of query. A vintage date can reflect a change elsewhere in PAYEMS, so adjacent rows may be identical here.

## Decision disagreement with 2026-02-11

The reference is the decision on 2026-02-11. The denominator includes every earlier listed date with both February and March levels; the reference date is excluded. Rates weight dates equally and are descriptive of this sampled window, not a probability or a general economic performance measure. The **150-thousand threshold was predeclared**; the others are sensitivity checks.

| Threshold | Disagreements / eligible earlier dates | Rate | Dates disagreeing with reference | Adjacent decision flips |
|---:|---:|---:|---|---|
| 50 | 0/2 | 0.0% | none | none |
| 100 | 2/2 | 100.0% | 2025-04-04, 2025-05-02 | 2025-05-02 → 2026-02-11 |
| 150 | 2/2 | 100.0% | 2025-04-04, 2025-05-02 | 2025-05-02 → 2026-02-11 |
| 200 | 1/2 | 50.0% | 2025-04-04 | 2025-04-04 → 2025-05-02 |
| 250 | 0/2 | 0.0% | none | none |

## Observed stabilization within the window

| Quantity | First observed | 2026-02-11 | Value changes observed | Last observed change date | Unchanged since | Days from 2025-04-04 to last change |
|---|---:|---:|---:|---|---|---:|
| february | 100100 | 99950 | 2 | 2026-02-11 | 2026-02-11 | 313 |
| march | 100300 | 100030 | 2 | 2026-02-11 | 2026-02-11 | 313 |
| growth | 200 | 80 | 2 | 2026-02-11 | 2026-02-11 | 313 |

“Unchanged since” is conditional on the sampled vintage dates through 2026-02-11. It is **right censored** there: later revisions can occur, so it is not a claim of permanent stabilization. A date from the vintage-date endpoint identifies a series release/revision, not necessarily a change to these observations.

## Provenance

Source: U.S. Bureau of Labor Statistics via [FRED/ALFRED PAYEMS](https://fred.stlouisfed.org/series/PAYEMS). The [vintage-date endpoint](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html) lists dates on which series values changed. [manifest.json](manifest.json) records every parameter set, response checksum, and retrieval time; [history.csv](history.csv) provides the normalized replay table. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. [Terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply.
