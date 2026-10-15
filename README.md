# REIM — Real Estate Investment Intelligence

> **An agent-native, explainable real-estate investment model.** Turn a few property inputs into an eight-page, bilingual (中文 / English), self-contained HTML report.

REIM is a **free, local-first starter kit**: an [Agent Skills](https://agentskills.io/specification)-compatible skill, a dependency-free HTML calculator, a deterministic financial engine, and a self-contained paginated report generator.

**This repository is a transparent decision-support tool, not a real-estate listing feed, appraisal service, or investment recommendation.** All bundled property examples are **illustrative**, mixing traveler-observed nightly quotes with independently unverified modeling assumptions.

## Quick start

**Zero-install offline calculator:** open [`standalone/reim-calculator.html`](standalone/reim-calculator.html) directly in your browser. It includes all preset examples and has no external script, font, or network dependency.

**Use the editable modular calculator** (requires only Python's basic HTTP server or any static host):

```bash
python3 -m http.server 8000 --directory docs
# open http://localhost:8000
```

1. Choose an example or enter a property; prices and occupancy can be adjusted month by month.
2. Review live long-let vs short-let net income and the 10-year IRR.
3. Download an **eight-page, standalone HTML report**, or export `reim-input.json` to share with your AI agent.
4. Open the report on any device (or print to PDF). Report navigation works offline.

**Run through an AI agent:** copy the self-contained `skills/reim/` folder into your agent's supported skills directory, then ask it to analyze a property using REIM. The agent can research sources (if it has browsing), open the calculator for corrections, and run:

```bash
node bin/reim.mjs validate examples/ansam-1.json
node bin/reim.mjs analyze examples/ansam-1.json
node bin/reim.mjs report examples/ansam-1.json out/report.html
```

The copied Skill folder contains its own calculator, scripts and examples. Run `node scripts/reim.mjs report assets/examples/ansam-1.json output.html` **from that Skill folder**. Requires Node 20+ for the optional CLI. The web UI itself requires no Node and no build step. Not all agents support running local scripts or opening a browser—follow your particular agent's permissions and installation guide.

## Architecture

```text
Agent Skill (research, evidence, explanations)
          │
          ▼
Static calculator (docs/index.html) ◄──► JSON schema
          │                           (download + import)
          ▼
Pure JS financial engine (docs/engine.mjs)
          │
          ▼
Self-contained 8-page HTML report (docs/report.mjs)
```

- **Calculator:** no server-side storage, no tracking, no paid API, no account requirement. Do not paste sensitive identifiers or exact residential addresses into shared reports.
- **Reports:** paginated, accessible keyboard navigation, single `.html` file, offline/printable, bilingual.
- **Reproducibility:** Node's native test runner; deterministic annual IRR/NPV calculation.
- **A source-aware workflow:** case-study data provenance and uncertainty are kept visible in reports.

## Financial model

The first period invests `purchasePrice + purchaseCostsPct + furnishing`. For years 1–N, the model recognizes annual operating income. At the end of year N it recognizes predicted resale value minus `saleCostsPct`. No loan financing, taxes, or currency conversion are inferred. Taxes that are already known may be entered as cost parameters, but local advice should be obtained before investment.

`short gross rent = Σ (calendar days in month × occupancy% × nightly ADR)`. First-year short rent deducts platform/management, tourism levy, service charge, repairs, utilities, fixed expense and costs per booked night.

`long gross rent = annualRent × (1 − vacancy%)`. First-year long rent deducts management, service charge, repairs and other operating expenses.

Both rents grow annually by `rentGrowthPct`. Sale value grows at `appreciationPct`, independently. The model calculates gross and net yields, NPV, total return, annual IRR, three scenarios and the short-let occupancy needed to match long-let net income.

**IRR is not the sum of yield and appreciation.** Resale valuation and occupancy are assumptions until substantiated. Benchmark comparison is a *nominal spread*, not proof of a risk premium.

See [`skills/reim/references/methodology.md`](skills/reim/references/methodology.md) and [`skills/reim/references/data-contract.md`](skills/reim/references/data-contract.md).

## Example projects

Four **illustrative, non-address-specific** examples: `ansam-1`, `ajwan-c`, `damac-heights`, `sobha-waves`. Values **must not be presented as confirmed recent listings, settled transactions, or annual Airbnb performance**. Examples are for learning and regression testing only.

## Publish to GitHub / GitHub Pages

If you have GitHub CLI access on your computer, run `gh auth login` once and then `bash scripts/publish-github.sh reim-open public` from this directory to create a **new** repository and push the code. This explicitly requires your local GitHub credentials and does not affect any other existing repository. Alternatively create a GitHub repository manually and upload/push these files.

Once the repository is on GitHub, In **Settings → Pages**, select **Deploy from a branch → main → /docs**. GitHub Pages serves `docs/index.html` with no build process. The calculator can also be used on other static hosting. Never publish confidential user-filled JSON files.

## Safety, attribution, license

- Data source authorization and legal rights matter; do not scrape or redistribute proprietary listings without permission.
- No automated appraisal, investment, tax or legal advice is promised.
- Each report should differentiate registered transactions, listings, user observations and model estimates.
- This software is provided **as-is**, with no guarantee of fitness for investment decisions.
- MIT licensed. PRs welcome.


## NEW — Yas Living off-plan QA beta (v0.1.1)

The original v0.1 long-/short-rental calculator assumes a ready property. **Do not use it directly for off-plan acquisitions.** The independent off-plan extension handles delayed rental and annual installment schedules:

```bash
node skills/reim/scripts/offplan.mjs validate skills/reim/assets/examples/yas-living-2br-maid-offplan.json
node skills/reim/scripts/offplan.mjs analyze skills/reim/assets/examples/yas-living-2br-maid-offplan.json
node skills/reim/scripts/offplan.mjs report skills/reim/assets/examples/yas-living-2br-maid-offplan.json out/yas-living-report.html
npm test
```

`skills/reim/` is still a standalone Skills folder: copy it to your agent's skill directory and run from within it. The `offplan` CLI creates an eight-page offline HTML report. **The original interactive HTML calculator has not yet been extended to support off-plan fields; edit the dedicated JSON directly.** The included Yas Living quote, rent and charges are dated and labeled by evidence tier. In a secondary off-plan deal, obtain the real seller/developer installment ledger; do not assume the initial developer 65/35 payment schedule transfers unchanged. This version is an educational beta, not verified property performance.

## 2026-10-15 research case: Yas Living II

A research snapshot is available at [`docs/case-study-yas-living.html`](docs/case-study-yas-living.html). It expands the eight-page off-plan calculator demonstration into 13 editorial pages covering Aldar's original sell-out announcement, the difference between primary sales and off-plan resales, listing-price changes, and benchmark return thresholds. The report distinguishes **registered transactions, advertised listings, and modeling assumptions**. Individual title/contract price and actual seller gains remain unverified.

The 13-page editorial report is a dated example, **not** output automatically generated by the current skill. For reproducible deterministic calculations use `node skills/reim/scripts/offplan.mjs report examples/yas-living-2br-maid-offplan.json out/yas-living-report.html`.

## Release notes v0.1.2

- Adds the Yas Living II off-plan research case and its matching sample JSON in the main examples directory.
- Updates the package version and publication script version label.
- Preserves the 18 passing automated checks from v0.1.1.
- GitHub Pages requires a separate repository Pages setting; source-code publication alone does not make the app live.

### Publishing when repository creation is not permitted through your integration

Create an **empty public** repository named `reim-open` under your own GitHub account (do **not** initialize with a README, license or gitignore). From this extracted directory run:

```bash
git init -b main
git add .
git commit -m 'Release REIM Open v0.1.2'
git remote add origin https://github.com/YOUR-USERNAME/reim-open.git
git push -u origin main
```

You need working Git authentication on your machine. The GitHub website's repo creation page is https://github.com/new?name=reim-open .
