# U.U.R. Finance Network — Implemented Feature Map

## Personal finance
- Scheduled and recurring transfers — `services.html`
- Savings goals with dedicated goal accounts — `services.html`
- Credit-score estimate — `services.html`
- Tax filings — `services.html`
- Insurance applications — `services.html`
- Bankruptcy-protection applications — `services.html`
- Collateral-backed loan applications — `services.html`
- Notifications inbox — `services.html`
- Printable and CSV monthly statements — `services.html`

## Business system
- Business-account applications under a normal user login — `services.html`
- Administrator approval and account creation — `advanced-admin.html`
- Multiple authorized business members — `advanced-admin.html`, `shared.js`
- Payroll schedules — `services.html`
- Invoices and payment requests — `services.html`
- Business financial reports — `services.html`
- CSE listing applications — `services.html`
- Mergers and acquisitions with administrator approval — `services.html`, `advanced-admin.html`
- Legacy standalone-login migration — `advanced-admin.html`
- Detailed migration documentation — `business-migration-guide.html`

## CSE and investing
- Business-owned stock portfolios — `cse.html`, `services.html`
- Businesses may own shares in other businesses — `cse.html`
- Per-stock ownership percentages — `cse.html`
- Top Market Owners leaderboard — `cse.html`
- Repaired watchlist, including legacy random document IDs — `cse.html`
- Direct star toggle from the stock table — `cse.html`
- Limit orders for personal and business portfolios — `services.html`, `advanced-admin.html`
- Dividends — `advanced-admin.html`
- Shareholder voting with personal and represented-business shares — `services.html`, `advanced-admin.html`
- Stock splits and reverse splits — `advanced-admin.html`
- U.U.R. government bonds — `services.html`, `advanced-admin.html`
- Investment funds — `services.html`, `advanced-admin.html`

## Administration and economy
- Unified application and loan approval queue — `advanced-admin.html`
- Institution-specific staff roles — `advanced-admin.html`
- Benchmark interest-rate policy — `advanced-admin.html`
- Reserve requirement and coverage estimates — `advanced-admin.html`
- Small-server-adjusted inflation pressure — `advanced-admin.html`
- Cost-of-living index estimate — `advanced-admin.html`
- Wealth concentration, top-holder shares, median, Gini estimate — `advanced-admin.html`
- Business and personal tax rates — `advanced-admin.html`
- Economic estimate snapshots — `advanced-admin.html`

## Casino
- Loyalty points and Bronze/Silver/Gold/VIP tiers — `casino.html`, `advanced-admin.html`
- Administrator-scheduled tournaments — `casino.html`, `advanced-admin.html`

## Execution limitation
Because the site is hosted as static client-side pages, scheduled payments, payroll, limit orders, and similar engines run when a user or administrator opens the relevant page and presses the run button. Fully unattended execution requires Firebase Cloud Functions or another trusted server scheduler.


## Bank Ownership and Collapsible Activity

- Administrators can assign personal or business ownership percentages in IUB, MERALD, and VNB.
- Each bank uses a treasury/capital account in the bank’s native currency.
- Declared profits credit owner settlement accounts. Declared losses debit available funds and create capital-call liabilities for unpaid portions.
- Owners can review stakes, settlements, and liabilities in Finance Services.
- Customer deposits remain separate from shareholder equity and are never exposed to bank owners.
- Recent Activity/Ledger panels in IUB, MERALD, and VNB can be minimized; the preference is saved in the browser.
