# U.U.R. Finance Network — Bank Ownership and Business Accounts

## Business accounts

A business account is not another shared login. The player signs in with their normal personal account, then the Finance Services page shows every approved business they are authorized to operate.

- Personal and business balances remain separate.
- The business has a permanent `businessId` that does not change when ownership or staff changes.
- Each business bank account contains `ownerType: "business"` and its `businessId`.
- Access comes from `businessMembers`, with roles and permissions such as owner, administrator, accountant, payroll, invoices, stock, or reports.
- A business can own stock in another business, receive dividends, vote, hold investment funds, and own an economic stake in a bank.
- Removing a person from a business does not delete the business or its financial history.
- Legacy business logins can be migrated while preserving their account IDs, balances, transactions, loans, bills, and stock positions.

## Bank ownership

Bank ownership is economic ownership only. It does not let an owner inspect or spend customer deposits.

### Collections

- `bankOwnershipSettings`: treasury account, native currency, default owner pool, and capital target for each bank.
- `bankEquity`: personal or business ownership stakes.
- `bankPeriods`: declared bank revenue, expenses, credit losses, reserve transfer, and net result.
- `bankOwnerSettlements`: profit distributions and collected loss contributions.
- `bankOwnerLiabilities`: unpaid capital calls when an owner account cannot cover its full loss share.

### Initial setup

1. In the core Admin Console, create or identify a treasury/capital account for IUB, MERALD, and VNB.
2. The IUB and MERALD treasury accounts must use U.U.R. Emerul (`EM`).
3. The VNB treasury account must use Valorian Franks (`VF`).
4. Open **Programs & Economy → Bank Ownership**.
5. Select a bank and its treasury account.
6. Set the default percentage of each bank result that participates in owner profit and loss.
7. Save the bank configuration.

### Adding an owner

1. Choose the bank.
2. Choose a player or approved business.
3. Choose a settlement account in the correct currency.
4. Enter the ownership percentage.
5. Save the ownership stake.

Active ownership for one bank cannot exceed 100%.

### Declaring profit or loss

Enter:

- Gross revenue
- Operating expenses
- Credit losses
- Reserve transfer
- Owner participation percentage

The system calculates:

`Net result = revenue − expenses − credit losses − reserve transfer`

The owner pool is:

`Owner pool = net result × owner participation percentage`

Each owner then receives or owes:

`Owner settlement = owner pool × ownership percentage`

### Profits

A positive owner settlement is transferred from the bank treasury account to the owner’s nominated settlement account. Both the owner account and treasury ledger receive transaction records.

### Losses

A negative owner settlement is collected from the owner’s nominated account and credited to the bank treasury account. The system never automatically pushes the owner account below zero.

When the account cannot pay the full loss:

- Available funds are collected.
- The remaining amount becomes an open capital-call liability.
- An administrator can later use **Collect available** after the owner funds the account.

### What owners see

Finance Services contains a **Bank Ownership** tab showing:

- Active ownership stakes
- Ownership percentages
- Nominated settlement accounts
- Profit and loss history
- Outstanding capital calls

Each individual banking app also displays an ownership card when the signed-in player or one of their businesses owns part of that bank.

## Collapsible activity

The Recent Activity or Ledger panel in IUB, MERALD, and VNB has a **Minimize** button. The selected state is stored in the browser, so it remains minimized or expanded the next time that banking app opens.
