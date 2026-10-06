# Local cache

`data/cache/` is created during live runs and excluded from Git. Each response is keyed by a SHA-256 hash of API request parameters (without the key); its `.meta.json` sidecar records retrieval time, parameters, and response hash. Cache reuse checks the raw response against that hash. The API key is never stored. Preserve the cache with a run if you need exact later reproduction; removing it causes fresh API retrieval and may produce a different result if the source changes. Review current FRED series notes and terms before sharing cached API responses.
