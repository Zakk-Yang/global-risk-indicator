# Project Instructions

## Design Philosophy
- Prefer business-facing, plain-language schema and field names over engineering-heavy abstractions.
- Optimize for clarity to human readers first. A slightly less normalized model is acceptable if it is easier to understand and operate.
- Start from the minimum data model that supports the real workflow. Do not introduce extra tables, ids, enums, or metadata layers unless they solve a current problem.
- Prefer real-world names when they improve readability, such as `region_name` values like `Europe` or `Middle East`, instead of surrogate ids.
- Keep time semantics explicit and practical. Separate observation date, source coverage dates, and system update datetime only when they serve a concrete business purpose.
- Default to a raw-data-first design. Store source observations in a simple raw table first, then store derived or calculated values in a separate computed table.
- Avoid platform-style schema design unless the project is clearly moving toward a shared data platform.

## Schema Guidance
- Use dimension tables only when they express a clear business mapping, such as `indicator_name -> risk_category -> driver_category`.
- Do not add configuration fields to mapping tables. Mapping tables should remain narrow and easy to read.
- Avoid surrogate primary keys unless a natural business key is unclear or unstable.
- Do not keep redundant status fields when one simpler field is enough.
- Do not precompute fields like trend if they can be derived cheaply at query time for the requested timeframe.

## Communication Style
- When proposing schema or pipeline changes, prefer practical language and concrete examples over abstract modeling terminology.
- If a design is technically cleaner but harder to understand, favor the more understandable option unless there is a strong operational reason not to.
- Explicitly call out when a proposal is becoming over-engineered.
