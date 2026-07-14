# Head Administrator and Economy Update

## Head Administrator

- Username: `Minekid123`
- Immutable Firebase UID: `PTP7igQ2U2TlY5phreKl61H8plu1`
- The Head Administrator role is derived only from this UID.
- Other administrators cannot assign `head_admin`, edit the protected Head Administrator profile, or delete it through Firestore.
- Only this UID can create, read, update, or end documents in `supportSessions`.

## Support mode

Open `admin.html` and choose **Head Admin Support**. Select a member, enter a required reason, and choose the first site to open. A red banner identifies the active session. Authentication remains Minekid123 and no password is exposed.

## Economy charts

Open `advanced-admin.html` and choose **Economy**. The page includes circulation, inflation pressure, bank deposits/reserves, and wealth-concentration charts. Use **Record economy snapshot** to build historical data.

## Files to replace

- `shared.js`
- `admin.html`
- `advanced-admin.html`
- `firestore.rules`
