# U.U.R. Finance Network — Legacy Business Migration Guide

This guide converts an existing business that currently has its own username/password into a proper business entity under the real owner’s normal player login.

The migration preserves the existing bank accounts and records. It does not recreate balances or erase transaction history.

## Before you begin

1. Deploy the updated website files, including:
   - `advanced-admin.html`
   - `services.html`
   - `shared.js`
   - the updated bank, CSE, casino, and portal pages
2. Publish the included `firestore.rules` in Firebase.
3. Confirm the future owner already has a normal personal login.
4. Sign in as a recognized administrator.
5. Open **Programs & Economy Administration** from the portal or network switcher.
6. Open the **Businesses & Migration** tab.
7. Write down the legacy business’s current balances, stock holdings, loans, and important records as an external backup.
8. For extra safety, export a network JSON snapshot from the core Admin Console before migrating.

## Migration steps

### 1. Select the legacy business login

Under **Legacy business migration**, choose the username that currently represents the business.

This is the old Firebase Auth user whose UID is attached to the business accounts and records.

### 2. Select the new personal owner

Choose the real player’s normal account under **New personal owner**.

The owner will sign in with this personal account after migration. They will not need to use the old business password.

### 3. Enter the business identity

Enter:

- Business name
- Industry
- What should happen to the old login

Available old-login options:

- **Retire login immediately:** Recommended. The old login is blocked by `shared.js` and directs the user to sign in through the owner account.
- **Keep as business manager:** The old login remains available as a limited business staff identity.
- **Keep temporarily active:** Useful for a short verification period before retiring it manually.

### 4. Preview the migration

Press **Preview migration**.

The preview counts records associated with the old UID, including:

- Bank accounts
- Stock positions
- Transactions
- Loans
- Bills
- MERALD vaults
- Certificates
- Casino records
- Bond holdings
- Fund holdings
- Tax records

Review the counts. Stop if the expected business accounts or positions are missing.

### 5. Run the migration

Press **Run migration** and confirm the warning.

The tool then:

1. Creates a document in `businesses/{businessId}`.
2. Adds the new owner in `businessMembers/{businessId}_{ownerUid}` with the `owner` role and `all` permissions.
3. Optionally adds the old login as a limited manager.
4. Converts matching bank accounts into business accounts by adding:
   - `ownerType: "business"`
   - `businessId`
   - `businessName`
   - `legacyOwnerUid`
5. Changes account control to the new owner while preserving the original account document IDs and balances.
6. Converts matching stock positions into business-owned positions.
7. Adds the business ID and legacy UID to identifiable historical records.
8. Updates the old user profile’s `loginStatus`.
9. Creates a record in `businessMigrations` containing the old owner, new owner, business ID, migration mode, affected-record counts, administrator, and timestamps.
10. Creates an entry in `adminLogs`.

## What remains unchanged

The migration intentionally preserves:

- Existing account IDs
- Current balances
- Transaction document IDs
- Loan and bill document IDs
- Stock tickers
- Stock share counts
- Historical descriptions
- Created dates

Past transactions may still display the historical business username in their description. This is intentional and preserves the original record.

## Verify the migration

### Owner verification

1. Sign out of the administrator account.
2. Sign in using the new owner’s normal personal login.
3. Open **Finance Services**.
4. Confirm the business appears in the Business Center selector.
5. Confirm all business bank accounts appear under the business.
6. Open the CSE.
7. Select a business trading account.
8. Confirm the CSE says **Operating as [Business Name]**.
9. Confirm existing stock positions appear in the business portfolio.
10. Confirm the business appears correctly in Share Ownership and Top Market Owners.

### Banking verification

Check each migrated account in the core Admin Console:

- Balance is unchanged.
- Bank is unchanged.
- Currency is unchanged.
- Status is correct.
- `ownerType` is `business`.
- `businessId` points to the new business.
- `legacyOwnerUid` contains the old login UID.

### Record verification

Review:

- Transactions
- Loans
- Bills
- Vaults
- Certificates
- Casino history
- Stocks and positions
- Taxes and investment holdings

The business should be able to operate through the new owner’s login without using the old credentials.

## Retire a temporarily active login later

To retire a legacy login manually:

1. Open Firebase Console.
2. Open Firestore Database.
3. Open `users/{legacyUid}`.
4. Set:

```text
loginStatus: "retired"
```

The next time that login opens the website, `shared.js` signs it out and directs it to the normal owner-login workflow.

## Add additional business staff

In **Programs & Economy Administration**:

1. Open **Businesses & Migration**.
2. Find the business.
3. Press **Add member**.
4. Enter the person’s normal username.
5. Choose a role and permissions.

Suggested permissions:

- Owner: `all`
- Administrator: `all`
- Accountant: `view,reports,invoices`
- Payroll manager: `view,payroll`
- CSE officer: `view,stock`
- Employee: `view`

## Migrating a business that already issued stock

The migration converts positions owned by the old login into positions owned by the business.

After migration:

1. Open the CSE as the new owner.
2. Choose the business account in the Trading Account selector.
3. Verify the business’s shares.
4. Verify ownership percentages.
5. Check that the issuer stock’s `issuerBusinessId` and `issuerAccountId` are correct.
6. If the stock document predates the new business system, an administrator can edit it in the core CSE stock editor and set the issuer account.

## Rollback procedure

There is no one-click rollback because Firestore changes span several collections. The `businessMigrations` document is the rollback map.

To reverse a migration:

1. Open the migration record and copy:
   - `businessId`
   - `oldOwnerUid`
   - `newOwnerUid`
   - affected counts
2. Change the migrated account documents back to:
   - `ownerUid: oldOwnerUid`
   - remove or clear `ownerType`, `businessId`, `businessName`, and `legacyOwnerUid`
3. Change migrated positions back to the old owner UID and remove business fields.
4. Restore any other records using `legacyOwnerUid` as the search field.
5. Change `users/{oldOwnerUid}.loginStatus` back to `active`.
6. Delete the created business-membership documents.
7. Archive or delete the new business document only after confirming no records still reference it.
8. Add an explanatory entry to `adminLogs`.

For important migrations, keep a Firebase export or Admin Console snapshot before starting. That is safer than relying only on manual rollback.

## Firebase Authentication limitation

The website cannot truly disable or delete a Firebase Authentication user from client-side JavaScript. The migration retires the login at the application level using `users/{uid}.loginStatus`.

To permanently disable the old Auth account, use the Firebase Console Authentication user list or a trusted Admin SDK/Cloud Function.
