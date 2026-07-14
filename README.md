# Union of the United Republics (U.U.R.) Finance Network — Multi-Site Portal

One login. Five connected sites for the Union of the United Republics. Same Firebase project (`uurweb`), same saved data.

## Files

| File | What it is |
|---|---|
| `index.html` | Union of the United Republics network portal — login/register + hub with net worth, brand tiles, your relationship team |
| `iub.html` | **IUB** — the Union's central bank. Accounts, transfers, savings, **Certificates of Deposit**, loans, bill pay, Manager Desk, full Admin ops |
| `merald.html` | **MERALD** — neobank. Card view, vaults, Transfer Guard, spending insights |
| `vnb.html` | **VNB** — Valorianische Nationalbank. Frank (₣) accounts, exchange desk, fixing-rate board, admin monetary authority |
| `cse.html` | **CSE** — Central Stock Exchange. Live quotes, charts, buy/sell with fees/spread/hold-locks, portfolio, watchlist, per-stock ownership percentages, and a dedicated admin-only exchange console |
| `casino.html` | **OC Online Casino** — Slots, Dice, Coin, Blackjack, Roulette, Crash, Mines, Hi-Lo, Wheel |
| `services.html` | **Finance Services** — scheduled payments, savings goals, credit, taxes, insurance, businesses, payroll, invoices, investing, notifications, and statements |
| `admin.html` | Core network administration for banks, users, ledgers, casino, CSE, VNB policy, announcements, and diagnostics |
| `advanced-admin.html` | Programs, economy, business migration, markets, approvals, tournaments, and institution-specific staff |
| `business-migration-guide.html` | Browser-friendly step-by-step guide for converting legacy business logins |
| `BUSINESS-MIGRATION-GUIDE.md` | Markdown copy of the migration guide |
| `shared.js` | Firebase config, auth/session, FX engine, transfer engine, staff roles, business access, presence, announcements, and network switcher |
| `assets/` | Brand logos |
| `firestore.rules` | **Suggested** rules — merge the new parts into yours (see below) |

## Deploy to GitHub Pages

1. Put everything at the **repo root** (keep `assets/` as a folder).
2. Settings → Pages → deploy from `main` / root.
3. Firebase Console → Authentication → Settings → **Authorized domains** → add `YOURNAME.github.io`.
4. Done. Login persists across all pages; signed-out visitors are bounced to `index.html`.

## What you must do once

- **Publish the included updated Firestore rules.** The expanded network adds business, program, approval, investment, tournament, notification, and migration collections, plus institution-scoped manager roles. Test the rules in Firebase Rules Playground before publishing.
- Optional: on CSE, press **Seed default stocks** if you want the expanded board (existing tickers are never overwritten).

## Your existing data

Nothing moved. Same collections, same document IDs. Existing users keep their IUB + MERALD accounts and history. A **VNB ₣ account is created automatically** the first time a legacy user opens one (new registrations get all three at once).

## New since the single-file app

- **VNB** national bank issuing the **Valorian Frank (₣)** — admins set the ₣/Emerul rate and spread in `fx/settings`; all cross-currency transfers convert automatically.
- **Manager role** — promote a player from the IUB Admin panel (`role: manager`, scoped to one bank or ALL). Managers get staff desks on each bank page: credit/debit, freeze, loan approvals.
- **NPC relationship teams** on every brand, with a deterministic "your manager" assignment per user.
- **IUB Certificates of Deposit** — 7/30/90/180-day terms with early-redemption penalty.
- **Six new casino games** joining the legacy three; all settle through the same transaction pattern (`casinoPlays`, `casinoPlayers`, `transactions`) so old stats keep counting. New admin edges: `crashEdge`, `wheelEdge`.
- **Floating U.U.R switcher** (bottom-left on every page) to hop between sites.

## Admins

`minekid123`, `adamenek`, `purpleaki123` — unchanged, plus anything in the `admins` collection or `users/{uid}.role == 'admin'`.

## Network Administration update

- `admin.html` is a dedicated administrator-only control center linked at the bottom of the portal for recognized administrators.
- It manages all IUB, MERALD, and VNB accounts; user roles; account creation; bulk interest and fees; loans and bills; OC Casino settings; CSE market settings and listings; VNB exchange policy and notices; online presence; and audit logs.
- The shared Union network switcher now includes **Network Administration** for administrators.
- VNB now has a visible **Network Portal** link in its primary navigation and footer.
- The portal footer now references the **Valorian Banking Act of 1926**.


## July 2026 administration upgrade
- Added the VNB-style `← Network Portal` link to IUB, MERALD, VNB, CSE, OC Casino, and the standalone Admin Console.
- Added Treasury & Ledger tools: administrator cross-bank/cross-currency transfers, a universal transaction ledger, filtering, and CSV export.
- Added bulk account status operations.
- Added System Tools: network-wide announcements, integrity diagnostics, diagnostic CSV, and a JSON network snapshot export.
- Added signed-in network announcement banners across every site.
- Firestore rules now include the `networkNotices` collection.

## Currency terminology

- The Union of the United Republics uses the **U.U.R. Emerul**, displayed as `EM`.
- IUB, MERALD, CSE, and OC settle in Emerul.
- VNB accounts settle in Valorian Franks (`₣`).
- Existing Firestore FX documents that still contain the legacy `vfPerUsd` field are read as a compatibility fallback; new settings use `vfPerEmerul`.


## Presence-status fix

- Presence now sends a heartbeat every 30 seconds while a page is visible.
- Hidden tabs are marked `away`; logout/page-hide attempts mark the user `offline`.
- The admin console no longer trusts a stale `online` Boolean. A user is online only when the last heartbeat is no more than 90 seconds old, recent for 10 minutes, and offline afterward.

## Finance Services expansion

The portal now includes `services.html`, a shared personal and business finance center with:

- Scheduled and recurring transfers (executed when a signed-in user runs due payments)
- Dedicated savings-goal accounts
- Credit estimates
- Personal tax filings tied to administrator policy
- Insurance, collateral-backed lending, and bankruptcy-protection applications
- Business-account applications under a normal player login
- Payroll schedules, invoices, financial reports, and CSE listing applications
- Merger and acquisition proposals
- Limit orders, shareholder voting, government bonds, investment funds, and dividends
- User notifications and printable/downloadable monthly statements

## Programs & Economy administration

`advanced-admin.html` is an administrator-only control center for:

- Unified approval queues
- Business creation and memberships
- Legacy business-login migration
- CSE listing approval with founder treasury shares
- Dividends and stock/reverse-stock splits
- Shareholder votes
- Government bonds and investment funds
- Limit-order execution
- Benchmark rates, reserve requirements, tax rates, wealth concentration, and small-server inflation estimates
- Administrator-scheduled casino tournaments and loyalty tiers
- Institution-specific staff roles for IUB, MERALD, VNB, CSE, OC Casino, or all institutions

## CSE ownership update

- Watchlists now preserve and delete the actual Firestore document ID, including older randomly named records.
- The CSE displays a Top Market Owners leaderboard ranked by market value.
- Approved businesses can trade through their business Emerul accounts and own stock in other businesses.
- Business positions participate in ownership percentages, dividends, voting, limit orders, and the market-owner leaderboard.

## Important scheduler limitation

GitHub Pages cannot execute tasks while nobody has the website open. Scheduled transfers, payroll, limit orders, and other due-item engines run when a user or administrator presses the corresponding run button. Fully automatic execution requires Firebase Cloud Functions or another trusted server-side scheduler.


### Bank ownership
Use **Programs & Economy → Bank Ownership** to select a treasury account, assign ownership percentages, and settle declared financial periods. Owners see their stakes in **Finance Services → Bank Ownership**. Deploy the included Firestore rules before using these collections.

### Collapsible bank activity
The Recent Activity/Ledger cards in IUB, MERALD, and VNB include persistent Minimize/Expand controls.
