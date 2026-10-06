# Public Data Vintage Lab

A small, reproducible CLI for comparing what `PAYEMS` showed on two information dates. Version one supports only `PAYEMS` (monthly U.S. total nonfarm employment, seasonally adjusted, **thousands of persons**). Observation periods, information dates, publication intervals, and retrieval times are kept distinct.

Requires Node.js 20 or newer. No package install or build is needed.

```powershell
node --test
node src/cli.js --offline --series PAYEMS --start 2025-01-01 --end 2025-03-01 --first 2025-04-04 --second 2026-02-11 --out outputs
node src/history-cli.js --offline --series PAYEMS --first 2025-04-04 --second 2026-02-11 --out outputs/history-sample
```

The offline fixture is synthetic and only supports three explicit dates listed in `tests/fixtures/README.md`. Its numbers are **not** observed payroll levels. The command writes `report.md`, `plot.html`, `observations.csv`, and `manifest.json`; `plot.html` opens directly in a browser. Each missing period or value is shown explicitly. The `as_of(date)` contract is implemented by `fixture(date, request)` or `live(request)`, both requiring a request whose realtime start and end equal the selected date. Neither path substitutes today's data.

## Live retrieval

Register for your own FRED API version 1 key at the [official key page](https://fred.stlouisfed.org/docs/api/api_key.html). In a local PowerShell session, set it without saving it in this project:

```powershell
$env:FRED_API_KEY = Read-Host 'FRED API v1 key'
node src/cli.js --live --series PAYEMS --start 2025-01-01 --end 2025-03-01 --first 2025-04-04 --second 2026-02-11 --out outputs/live
Remove-Item Env:FRED_API_KEY
```

Do not put the key in a command argument, URL, Git file, or chat. The client sends it only in the required API v1 query parameter and never logs the URL. It retries transient failures, paginates, caches raw JSON under `data/cache/`, and checks cached SHA-256 hashes on reuse. The cache is ignored by Git. Repeating the same live command reuses pinned cache bytes without requiring the key; a new or refreshed request does require it. Delete a cached response deliberately to refresh it. The manifest records request parameters without the key, response hashes, retrieval timestamps, code revision when available, and report hash.

For a broader history through 6 October 2026, run this while the key is set locally:

```powershell
node src/history-cli.js --live --series PAYEMS --first 2025-04-04 --second 2026-10-06 --out outputs/history-live
```

The [FRED vintage-date endpoint](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html) enumerates PAYEMS series-change dates. The CLI requests January–March 2025 observations with `realtime_start` and `realtime_end` pinned to each date, and writes a report, normalized CSV, and checksummed manifest. Previously cached pages replay without a key; uncached pages require one.

The verified [history case study](outputs/history-case-study.md) covers 19 information dates through 6 October 2026. At the predeclared 150-thousand threshold, 2 of 18 earlier dates disagree with the end-date decision (11.1%). February and March levels and their monthly difference last changed on 11 February 2026 and were unchanged through 6 October 2026. This is observed stability within the window, not permanent finality.

## Interpretation and provenance

The predeclared replay flags March 2025 monthly growth below **150 thousand**. It subtracts February from March within each vintage, then shows sensitivity at 50, 100, 200, and 250 thousand. The rule is illustrative, not an economic policy recommendation. A two-date comparison is insufficient to estimate a general historical disagreement rate or stabilization time. API row `realtime_start` is validity metadata and may reflect the pinned query interval; it does not alone establish first publication. The report lists largest level revisions and a plot of paired levels. A change in PAYEMS definitions, units, or seasonal adjustment methodology requires manual review of BLS and FRED notes before interpreting a difference as an ordinary revision.

The [BLS 4 April 2025 release](https://www.bls.gov/news.release/archives/empsit_04042025.htm) states initial March growth of 228,000; its table B-1 gives February and March levels of **159,170 and 159,398 thousand** (`159398 − 159170 = 228`). The [BLS benchmark article](https://www.bls.gov/web/empsit/cesbmart.htm) says the annual revision was released 11 February 2026 and reports March 2025 revised growth of 67,000, with February and March revised levels of **158,310 and 158,377 thousand** (`158377 − 158310 = 67`). The live ALFRED API v1 responses retrieved on 6 October 2026 match both pairs, confirming the decision flip for these dates. See the [case study](outputs/case-study.md) and [live report](outputs/live/report.md). The benchmark article's “previously published” March growth is 120,000, which reflects a later prebenchmark vintage; it must not be confused with the original 228,000.

Source: U.S. Bureau of Labor Statistics via [FRED/ALFRED PAYEMS](https://fred.stlouisfed.org/series/PAYEMS). FRED lists it as public domain with citation requested. Its [notes](https://fred.stlouisfed.org/series/PAYEMS) identify the source, monthly frequency, units, and seasonal adjustment. The [FRED API terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) say third-party series can have restrictions and should be rechecked before redistribution. This repository commits only self-authored fixture data, not API extracts. By using this application with FRED data, users agree to the FRED API Terms of Use.

This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.
