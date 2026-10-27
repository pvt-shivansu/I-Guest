# I-Guest Security Specification (Payload-First Security TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched under `/events/{eventId}`, `/invitations/{inviteToken}`, or `/rsvps/{rsvpId}` is unconditionally denied (`allow read, write: if false;`).
2. **PII Isolation & Zero Public Scraping**:
   - `/rsvps/{rsvpId}` contains guest PII (`mobileNumber`, `fullName`, `messageToFamily`). Public visitors (`request.auth == null`) and non-admin authenticated users CANNOT `get`, `list`, `update`, or `delete` any document in `/rsvps/{rsvpId}`.
   - Only a verified administrator (`request.auth != null && request.auth.token.email_verified == true && request.auth.token.email == 'kshivanshu35@gmail.com'`) can `get`, `list`, `update`, or `delete` documents in `/rsvps/{rsvpId}`.
3. **Strict Public RSVP Submission Gate**:
   - Public guests can `create` a document in `/rsvps/{rsvpId}` ONLY if:
     - `isValidId(rsvpId)` matches `^[a-zA-Z0-9_\-]+$` and length is `6..128`.
     - `incoming().rsvpId == rsvpId` and `incoming().eventId == 'main_wedding'`.
     - Exact keys check (`hasAll` and `hasOnly`) prevents shadow fields.
     - When `attendanceStatus == 'confirmed'`, `attendeeCount >= 1 && attendeeCount <= 15` and `mealPreference in ['vegetarian', 'non-vegetarian']`.
     - When `attendanceStatus == 'declined'`, `attendeeCount == 0` and `mealPreference == 'none'`.
     - `submittedAt == request.time` and `updatedAt == request.time` (Temporal Integrity).
4. **Invitation Token Isolation**:
   - `/invitations/{inviteToken}` stores non-PII token greeting metadata. Public visitors can `get` a single invitation by knowing its unpredictable `inviteToken`, but `list` is strictly restricted to verified admins with `resource.data.eventId == 'main_wedding'`.
5. **Event Configuration Protection**:
   - `/events/{eventId}` can be read via `get` by guests (`eventId == 'main_wedding'`), while `create`, `update`, and `delete` require `isVerifiedAdmin()` and full schema validation (`isValidWeddingEvent`).

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Shadow Field Injection on RSVP Create)**: Adds `"isAdmin": true` to `/rsvps/rsvp_123456`. Rejected by `hasOnly()`.
2. **Payload 2 (Unverified Admin Email Spoof on RSVP List/Get)**: Authenticated user with `email: 'kshivanshu35@gmail.com'` but `email_verified: false` attempts `get` on `/rsvps/rsvp_123456`. Rejected by `request.auth.token.email_verified == true`.
3. **Payload 3 (Public Guest List Scraping)**: Unauthenticated user or non-admin user attempts `get` or `list` on `/rsvps`. Rejected by `isVerifiedAdmin()`.
4. **Payload 4 (Client Timestamp Forgery on RSVP Create)**: Submits `submittedAt: Timestamp.fromMillis(1000000)` instead of `request.time`. Rejected by `incoming().submittedAt == request.time`.
5. **Payload 5 (Invalid Attendee Count Poisoning)**: Submits `attendanceStatus: 'confirmed'` with `attendeeCount: 500` (or `0`). Rejected by `attendeeCount >= 1 && attendeeCount <= 15`.
6. **Payload 6 (Declined RSVP State Mismatch)**: Submits `attendanceStatus: 'declined'` with `attendeeCount: 4` or `mealPreference: 'vegetarian'`. Rejected by state-dependent validation (`attendeeCount == 0 && mealPreference == 'none'`).
7. **Payload 7 (Denial-of-Wallet Oversized String)**: Submits `messageToFamily` with a 5,000-character string or `fullName` with 500 characters. Rejected by `.size() <= 400` and `.size() <= 100`.
8. **Payload 8 (ID Poisoning Attack)**: Attempts to create `/rsvps/bad$id!with spaces` or ID longer than 128 chars. Rejected by `isValidId(rsvpId)`.
9. **Payload 9 (Unauthorized Public Overwrite of Existing RSVP)**: Public guest attempts `update` on an existing `/rsvps/rsvp_123456` document to alter someone else's response. Rejected because `allow update` requires `isVerifiedAdmin()`.
10. **Payload 10 (Immortal Field Mutation on Admin RSVP Update)**: Admin attempts to change `submittedAt` or `rsvpId` or `eventId` during an update. Rejected by immutability checks (`incoming().submittedAt == existing().submittedAt`).
11. **Payload 11 (Unauthorized Wedding Event Modification)**: Non-admin user attempts to `update` `/events/main_wedding` venue address. Rejected by `isVerifiedAdmin()`.
12. **Payload 12 (Terminal Invitation Status Reversal by Public Guest)**: Public guest attempts to update `/invitations/inv_token1` after it is already `'confirmed'` or attempts to change `guestDisplayName`. Rejected by terminal state lock (`existing().status == 'pending'`) and `affectedKeys().hasOnly(['status', 'updatedAt'])`.
