# PAYEMS March 2025 vintage history

**Mode:** live ALFRED API v1. **Observed information window:** 2025-04-04 to 2026-10-06. **Units:** thousands of persons, seasonally adjusted. **Sample:** selected fixture dates when offline; otherwise all PAYEMS series-change dates returned by the FRED vintage-date endpoint within the window, plus both endpoints. Raw API responses are pinned in the local cache and checksummed in the manifest.

## Replay by information date

| Information date | February level | March level | March growth | Below 150 thousand |
|---|---:|---:|---:|---|
| 2025-04-04 | 159170 | 159398 | 228 | no flag |
| 2025-05-02 | 159155 | 159340 | 185 | no flag |
| 2025-06-06 | 159155 | 159275 | 120 | flag |
| 2025-07-03 | 159155 | 159275 | 120 | flag |
| 2025-08-01 | 159155 | 159275 | 120 | flag |
| 2025-09-05 | 159155 | 159275 | 120 | flag |
| 2025-11-20 | 159155 | 159275 | 120 | flag |
| 2025-12-16 | 159155 | 159275 | 120 | flag |
| 2026-01-09 | 159155 | 159275 | 120 | flag |
| 2026-02-11 | 158310 | 158377 | 67 | flag |
| 2026-03-06 | 158310 | 158377 | 67 | flag |
| 2026-04-03 | 158310 | 158377 | 67 | flag |
| 2026-05-08 | 158310 | 158377 | 67 | flag |
| 2026-06-05 | 158310 | 158377 | 67 | flag |
| 2026-07-02 | 158310 | 158377 | 67 | flag |
| 2026-08-07 | 158310 | 158377 | 67 | flag |
| 2026-09-04 | 158310 | 158377 | 67 | flag |
| 2026-10-02 | 158310 | 158377 | 67 | flag |
| 2026-10-06 | 158310 | 158377 | 67 | flag |

February and March levels are always taken from the same date's exact as-of query. A vintage date can reflect a change elsewhere in PAYEMS, so adjacent rows may be identical here.

## Decision disagreement with 2026-10-06

The reference is the decision on 2026-10-06. The denominator includes every earlier listed date with both February and March levels; the reference date is excluded. Rates weight dates equally and are descriptive of this sampled window, not a probability or a general economic performance measure. The **150-thousand threshold was predeclared**; the others are sensitivity checks.

| Threshold | Disagreements / eligible earlier dates | Rate | Dates disagreeing with reference | Adjacent decision flips |
|---:|---:|---:|---|---|
| 50 | 0/18 | 0.0% | none | none |
| 100 | 9/18 | 50.0% | 2025-04-04, 2025-05-02, 2025-06-06, 2025-07-03, 2025-08-01, 2025-09-05, 2025-11-20, 2025-12-16, 2026-01-09 | 2026-01-09 → 2026-02-11 |
| 150 | 2/18 | 11.1% | 2025-04-04, 2025-05-02 | 2025-05-02 → 2025-06-06 |
| 200 | 1/18 | 5.6% | 2025-04-04 | 2025-04-04 → 2025-05-02 |
| 250 | 0/18 | 0.0% | none | none |

## Observed stabilization within the window

| Quantity | First observed | 2026-10-06 | Value changes observed | Last observed change date | Unchanged since | Days from 2025-04-04 to last change |
|---|---:|---:|---:|---|---|---:|
| february | 159170 | 158310 | 2 | 2026-02-11 | 2026-02-11 | 313 |
| march | 159398 | 158377 | 3 | 2026-02-11 | 2026-02-11 | 313 |
| growth | 228 | 67 | 3 | 2026-02-11 | 2026-02-11 | 313 |

“Unchanged since” is conditional on the sampled vintage dates through 2026-10-06. It is **right censored** there: later revisions can occur, so it is not a claim of permanent stabilization. A date from the vintage-date endpoint identifies a series release/revision, not necessarily a change to these observations.

## Provenance

Source: U.S. Bureau of Labor Statistics via [FRED/ALFRED PAYEMS](https://fred.stlouisfed.org/series/PAYEMS). The [vintage-date endpoint](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html) lists dates on which series values changed. [manifest.json](manifest.json) records every parameter set, response checksum, and retrieval time; [history.csv](history.csv) provides the normalized replay table. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. [Terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply.
