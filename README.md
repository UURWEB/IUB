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
| `shared.js` | Firebase config, auth/session, FX engine, transfer engine, staff roles, NPC directory, network switcher |
| `assets/` | Brand logos |
| `firestore.rules` | **Suggested** rules — merge the new parts into yours (see below) |

## Deploy to GitHub Pages

1. Put everything at the **repo root** (keep `assets/` as a folder).
2. Settings → Pages → deploy from `main` / root.
3. Firebase Console → Authentication → Settings → **Authorized domains** → add `YOURNAME.github.io`.
4. Done. Login persists across all pages; signed-out visitors are bounced to `index.html`.

## What you must do once

- **Publish updated Firestore rules.** The rebuild adds three collections — `fx`, `certificates`, `vnbNotices` — and a `manager` role. `firestore.rules` in this folder is a ready-to-merge suggestion.
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
