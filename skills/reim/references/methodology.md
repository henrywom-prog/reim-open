# REIM v0.1 financial methodology

## Model scope

Annual discrete cash flows with a full-year first rent and sale at the end of holding year N. The model assumes unleveraged ownership, no interim sales, zero terminal furnishing recovery, 365-day average year. A leap year changes actual rental capacity marginally. Partial years, financed deals and inflation-adjusted returns are not yet implemented. This model is **not** a tax calculator and makes **no automated inference about national legal or tax rules**.

## Year 0

`CF0 = -(purchasePrice + purchasePrice × buyingCost% + furnishing)`.

## Year t rent

Long let: `contractAnnualRent × (1 + rentGrowth)^(t-1) × (1 - vacancy%)`. Management fee applies to effective rental receipts. Service charges, maintenance, other costs then deducted.

Short let: `Σ_m days_m × occupancy_m × ADR_m × (1 + rentGrowth)^(t-1)`. Deductions: gross × (shortMgmt% + tourismPct%) + bookedNights × (tourismPerNight + cleaningPerNight) + serviceCharge + maintenance + utilities + shortFixedCosts. Extra guest-paid taxes should not be deducted twice; adapt inputs to reflect who bears them.

## Exit and return metrics

`saleValue = resaleAnchorPrice(default purchasePrice) × (1 + appreciation%)^N`.

`CFN = netRentalN + saleValue × (1 - saleCost%)`.

IRR solves `Σ CFt / (1+r)^t = 0`; NPV uses user-input discount rate. Gross and net yield use year-one receipts and net rent respectively, divided by purchase price (not the full all-in cost). Make this denominator clear.

## Scenario rules

- Cautious: appreciation -2 percentage points; rental growth -1 percentage point; all short-let occupancies -10 percentage points and nightly ADR -10%; long rent -10%.
- Base: provided inputs.
- Optimistic: appreciation +2 percentage points; rental growth +1 percentage point; all short-let occupancies +8 percentage points and ADR +10%; long rent +10%.

These are sensitivity **scenarios**, not estimated probabilities.

## Reverse pricing

With a target IRR, the maximum purchase price keeps the **resale anchor fixed** to the externally determined reference market value (`base.purchasePrice`) even as the bid price changes. The assumption must be stated: purchase discount cannot imply a lower independent market valuation automatically. Cases where no feasible crossing exists return null.

## Known limitations for version 0.1

- No loans, interest, property tax, income tax, capital-gains tax, depreciation tax shields, ground rent, irregular owner-association levies, selling delays, or FX volatility. Users can approximate recurring costs with cost fields but this is not a substitute for localized tax modeling.
- No XIRR daily timestamp or off-plan staged-payment schedule. Do not represent this engine as a historical backtest of off-plan acquisitions.
- Short-let cost per booked night approximates cleaning. Per-stay fixed cleaning is not represented because average stay length is unknown.
- No live data ingestion, no current-rate lookup; `sources` are explicitly provided by user/agent.
- Occupancy based on 365 days available. If calendar blocked for personal use, adjust appropriately. Platform market occupancy can be defined differently.
