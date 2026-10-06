# March 2025 PAYEMS: revision history through 6 October 2026

**Series:** PAYEMS, U.S. total nonfarm employment, monthly, seasonally adjusted, in thousands of persons. **Observation periods:** February and March 2025. **Information window:** 4 April 2025 to 6 October 2026. **Source:** U.S. Bureau of Labor Statistics via [FRED/ALFRED](https://fred.stlouisfed.org/series/PAYEMS).

The FRED API v1 [vintage-date endpoint](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html) returned **18 series-change dates** in this window. The CLI queried both monthly levels on each date and added 6 October 2026 as an end-date snapshot, making **19 information dates**. Every query pinned `realtime_start` and `realtime_end` to the same date. All 20 cached API response hashes (one vintage-date response and 19 observation responses), plus the report and CSV hashes, matched the [run manifest](history-live/manifest.json).

| Information date | February level | March level | March growth | Below 150 thousand? |
|---|---:|---:|---:|---|
| 2025-04-04 | 159,170 | 159,398 | +228 | No |
| 2025-05-02 | 159,155 | 159,340 | +185 | No |
| 2025-06-06 | 159,155 | 159,275 | +120 | Yes |
| 2026-02-11 | 158,310 | 158,377 | +67 | Yes |
| 2026-10-06 | 158,310 | 158,377 | +67 | Yes |

The [full replay table](history-live/report.md) includes the intervening dates. Growth is March minus February **within each vintage**. The predeclared 150-thousand rule first changed from no flag to flag on **6 June 2025**; the February 2026 benchmark reduced the growth figure further without changing that decision. The original and benchmark levels independently match the [4 April 2025 BLS release](https://www.bls.gov/news.release/archives/empsit_04042025.htm) and the [BLS benchmark article](https://www.bls.gov/web/empsit/cesbmart.htm). The benchmark article's “previously published” +120 thousand corresponds to the later prebenchmark value in this replay, not the initial +228 thousand.

## Decision disagreement

Each earlier information date is compared with the **6 October 2026** decision. The end-date snapshot is excluded from the denominator. The denominator weights PAYEMS series-change dates equally; it is not a time-weighted rate or a probability for future releases.

| Threshold, thousands | Disagreements / 18 earlier dates | Rate |
|---:|---:|---:|
| 50 | 0/18 | 0.0% |
| 100 | 9/18 | 50.0% |
| **150 (predeclared)** | **2/18** | **11.1%** |
| 200 | 1/18 | 5.6% |
| 250 | 0/18 | 0.0% |

At 150 thousand, only 4 April and 2 May 2025 disagree with the end-date decision. Revisions after 6 June did **not** change that decision. At 50 thousand, no date flags; at 250 thousand, every date flags. These thresholds demonstrate sensitivity and are not economic policy recommendations.

## Observed stabilization

The February level changed twice, and the March level and their difference each changed three times in the sampled window. Their **last observed change was 11 February 2026**, 313 days after the initial release. All three were unchanged at the eight subsequent series-change dates and at the 6 October end-date snapshot, a span of **237 days**. This is an *observed unchanged period*, right censored on 6 October 2026. It does not establish permanent finality; future benchmark revisions remain possible. A PAYEMS vintage date can reflect a change to some other observation, so identical February/March values at adjacent dates are expected.

The [live report](history-live/report.md), [normalized CSV](history-live/history.csv), and [manifest](history-live/manifest.json) support these calculations. Raw response files remain in the local ignored cache; rerun the command in the [README](../README.md) to reproduce or retrieve them. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. The [API terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply; PAYEMS requests citation.
