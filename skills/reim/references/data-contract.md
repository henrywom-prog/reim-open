# JSON data contract — REIM v0.1

The calculator and CLI take a single JSON object. Four illustrative objects are in `examples/`.

## Required fields

- `purchasePrice`: positive number in chosen currency.
- `holdYears`: integer 1–40.
- `monthly`: exactly 12 entries, each with `adr` (nonnegative number in selected currency / night) and `occupancy` (0–100 percentage points, **not** decimal fractions).

## Recommended fields

`project`, `city`, `country`, `currency` (e.g. AED, USD, EUR, CNY), `language` (`zh` or `en`), `purchaseCostsPct`, `saleCostsPct`, `furnishing`, `appreciationPct`, `rentGrowthPct`, `discountRatePct`, `benchmarkYieldPct`, `longRent`, `longVacancyPct`, `longManagementPct`, `longExtraCosts`, `serviceCharge`, `maintenance`, `utilities`, `shortFixedCosts`, `shortManagementPct`, `tourismPct`, `tourismPerNight`, `cleaningPerNight`, `notes`.

Currency amount inputs all use the SAME currency. No FX is computed automatically. `Pct` keys expect values like `5` for 5%.

## Provenance

`sources` is an array of `{ "label":"...", "url":"https://...", "quality":"verified registry|market|user-provided|estimate", "date":"YYYY-MM-DD" }`.

The example source notes warn that inputs are illustrative. Do not imply that a spreadsheet row, scraped listing or landlord story is government-verified. If using DLD or ADREC, verify the precise property identity, transaction type and date. A project-level historical price index **cannot** establish same-unit realized investment return.

## Agent ↔ calculator handoff

Agent saves JSON → user clicks **Import JSON** in `docs/index.html` → user edits/exports new JSON → agent runs CLI against returned JSON. No direct callback server is needed. Agent can use CLI directly when a web browser is unavailable. Avoid passing financial data through URL query strings.


## Off-plan JSON extension (v0.1.1 beta)

Do not feed an off-plan case into the existing standard CLI or browser calculator, because they assume rent starts immediately. Use `node scripts/offplan.mjs report assets/examples/yas-living-2br-maid-offplan.json out.html` and the following JSON fields:

- `purchaseYear` (first investment calendar year), `rentalStartYear` (first *full* year of expected rent), `exitYear` (sale year).
- `paymentShares`: `[{"year": 2026, "share": 1}]` or true installment years/amount fractions. The sum must be 1 and counts **the total contract purchase price only once**.
- `purchasePrice` is the *entire* economic purchase price including amounts payable to developer and assignment seller, excluding costs in `purchaseCostsPct`. For off-plan resales verify settlement account before modeling.
- `furnishOnHandover`, `longRent` at rental start, `serviceCharge`, `maintenance`, `otherAnnualCosts`, `vacancyPct`, `managementPct`, `appreciationPct`, `rentGrowthPct`, `costGrowthPct`, `purchaseCostsPct`, `saleCostsPct`.

Cash flows: construction installments before rent, 0 rent before rentalStartYear, operating NOI in rental years, terminal sale less exit fee. Dates modeled at year-end (except year 0); intra-year finance needs more granular data. Comparisons with 12-month deposits are **single-period reference rates** and not guaranteed ten-year reinvestment yields.
