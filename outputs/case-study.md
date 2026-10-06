# March 2025 PAYEMS: a verified two-vintage replay

**Observation period:** March 2025. **Information dates:** 4 April 2025 and 11 February 2026, 313 days apart. **Source:** U.S. Bureau of Labor Statistics via [FRED/ALFRED PAYEMS](https://fred.stlouisfed.org/series/PAYEMS). **Units:** thousands of persons, seasonally adjusted. **Retrieval:** 6 October 2026 UTC.

| Information date | February level | March level | March monthly change | Rule: flag change below 150 |
|---|---:|---:|---:|---|
| 2025-04-04 | 159,170 | 159,398 | +228 | No flag |
| 2026-02-11 | 158,310 | 158,377 | +67 | Flag |

Each change subtracts February from March **within the same information date**. The March level fell by 1,021 thousand (-0.6405% of the initial level), while the calculated monthly change fell by 161 thousand. The predeclared illustrative 150-thousand rule therefore changes decision. At thresholds of 100 and 200 thousand it also changes; at 50 thousand neither vintage flags, and at 250 thousand both flag. These are examples of revision sensitivity, not economic policy recommendations or evidence that a revision was an error.

The [original BLS release](https://www.bls.gov/news.release/archives/empsit_04042025.htm), dated 4 April 2025, gives February and March levels of 159,170 and 159,398 thousand in table B-1. The [BLS benchmark article](https://www.bls.gov/web/empsit/cesbmart.htm) states that the annual revision was released on 11 February 2026 and gives revised levels of 158,310 and 158,377 thousand. The locally cached ALFRED API v1 responses for exact `realtime_start=realtime_end` dates match both pairs. The benchmark article's 120-thousand “previously published” March change is a later prebenchmark value, not the initial 228-thousand value.

The API response SHA-256 hashes are `84b4e7ca444a02d7e4b8a61d234c60a7d2f7bff642c3355a138aefe2e01d2557` for 2025-04-04 and `35deadfa0bc3c8525861546053fff72915e38234e9dfdc98aa04ed92c25c3913` for 2026-02-11. Both hashes were checked against the local cache. The [live manifest](live/manifest.json) records exact parameters, retrieval times, and report/CSV checksums; [live report](live/report.md) provides all three period rows and the plot. The local raw cache is excluded from Git. Re-run the live command in the [README](../README.md) to retrieve or replay it.

The two chosen dates support this specific replay. They do not establish the date when the series stabilized or a general decision disagreement rate across historical releases. The API's row `realtime_start` on a pinned as-of request is not proof of a value's first publication date. The documented BLS release dates supply the timing used here.

This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. Use of the API is subject to its [terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html); the PAYEMS page requests citation.
