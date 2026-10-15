---
name: reim
# Recommended Agent Skills schema: required name + description.
description: Research and explain real estate investment economics using an auditable deterministic cash-flow model. Use when a user asks for property returns, rental yield, Airbnb vs long-let, occupancy sensitivity, property appreciation, IRR, or alternatives to real estate. Helps collect assumptions in an HTML calculator and produces an eight-page standalone HTML investment report.
license: MIT
compatibility: Best with filesystem access and Node.js 20+. Browser or static host for the optional calculator; network access only when live market research is requested and permitted.
metadata:
  version: "0.1.1"
  author: "REIM contributors"
---

# REIM — Real Estate Investment Intelligence

## Essential rules

1. **Never manufacture evidence.** The model does not contain live property data. Search authoritative local registries where legitimately accessible, use actual sold prices rather than asking prices where possible, note date, geography, unit type and coverage. Do not assert true historical property IRR without matching the same property sale or verified actual owner ledger.
2. Classify **each input**: registered sale or lease (`verified registry`), third-party market observation (`market`), traveler-provided quote (`user-provided`), or scenario assumption (`estimate`). Keep sources in `sources` with the date. If unavailable, explain it.
3. One observed nightly short-stay quote is **not** annual realized ADR, and platform availability is not the same as confirmed nights booked. Seasonality must be evaluated monthly for the full year.
4. Use the packaged **deterministic calculation engine** for cash flows, NPV and IRR. Do not ask the LLM to invent the math or reverse-engineer an IRR informally.
5. Clearly distinguish **historical actual**, **market backtest**, and **forward scenario**. This tool v0.1 implements forward annual cash-flow scenarios; a real historical ledger requires additional property-specific evidence.
6. Never claim current rates/taxes have been fetched by REIM automatically. Research the jurisdiction if web access exists, or request informed input. Note which taxes/fees are excluded.
7. Protect privacy. Do not upload client financial data to any service without permission; the calculator runs locally without a server. Do not insert a residential unit number or personal financial identifiers in published examples.
8. The report is educational. Avoid categorical 'buy / do not buy' recommendations; show risks, uncertainty and validation needed.

## Workflow

1. Identify country, city, project, property type, purchase price, currency and hold period. Research local transaction registration and long-term rental benchmarks if allowed. **Do not conflate area with project or different-sized units.**
2. Read [`references/data-contract.md`](references/data-contract.md) for required JSON and provenance. Read [`references/methodology.md`](references/methodology.md) for calculations and assumptions.
3. Start from one of `assets/examples/*.json` inside this skill or create a new JSON input. Replace examples with sourced, dated data whenever possible. Do not copy example figures into another jurisdiction.
4. Let the user inspect and adjust JSON in `assets/reim-calculator.html`, a completely offline standalone calculator. Click **Import JSON**, adjust inputs, then **Export JSON** to return the updated file to the agent. Where a browser is unavailable, collect the same JSON in chat.
5. Run `node scripts/reim.mjs validate INPUT.json` and `node scripts/reim.mjs analyze INPUT.json`. Correct invalid input. Compare base, cautious and optimistic values. If short-let is inferior to long-let, report both rather than only the larger gross revenue.
6. Run `node scripts/reim.mjs report INPUT.json output/report.html`. Give user the HTML file. It is standalone and offline: eight sections, navigation, print-to-PDF. State the top driver and the most uncertain parameter in plain language.
7. If requested, compare a **user-input** benchmark of comparable currency, duration and tax regime. Remember that nominal yield spread is not risk-adjusted performance.

## Delivery checklist

- All currency numbers consistent; if FX conversion occurs, state rate and effective date.
- Realized vs predicted not confused; market listings not labeled sales.
- Property value change and rental streams combined with dated cash flows, not added as percentages.
- Monthly ADR × occupancy × calendar days, with 365-day occupancy basis.
- Purchase/exit and recurring charges accounted for once each.
- Assumption sensitivity and data limitations clearly disclosed.
- HTML report should remain functional without internet connection.

## Commands

```bash
node scripts/reim.mjs validate assets/examples/damac-heights.json
node scripts/reim.mjs analyze assets/examples/damac-heights.json
node scripts/reim.mjs report assets/examples/damac-heights.json output/damac-report.html
```

## Off-plan extension (v0.1.1 beta): **MANDATORY routing**

A project without rental occupancy yet (e.g., Yas Living II expected handover Q4 2028) **MUST NOT** be modeled with the standard `analyze`/`report` CLI: that v0.1 engine incorrectly starts rental income from year 1 and assumes immediate purchase payment. Instead use:

```bash
node scripts/offplan.mjs validate assets/examples/yas-living-2br-maid-offplan.json
node scripts/offplan.mjs analyze assets/examples/yas-living-2br-maid-offplan.json
node scripts/offplan.mjs report assets/examples/yas-living-2br-maid-offplan.json yas-living-report.html
```

The off-plan JSON has `purchaseYear`, `rentalStartYear`, `exitYear`, and `paymentShares` (per-year tranches summing to 1). The same modeled **total purchase price** is distributed among payments, not counted more than once. Closing fees are assessed separately on total price in the purchase year. If the resale assignment contract contains a seller premium and developer balance, obtain the **actual** installment dates/amounts; a developer's original 65/35 marketing plan does NOT necessarily describe a secondary buyer's remaining obligations. Report both a conservative full-payment case and a clearly illustrative staggered-payment case only when relevant. No rent before expected handover; unknown property service charge must be labeled estimated. Bank annual deposit quotes are not ten-year guaranteed returns; US Treasury constant-maturity yields are reference rates, not an investable bond quote. This extension does not yet integrate the offline main calculator; edit the off-plan JSON or ask an agent to update it.
