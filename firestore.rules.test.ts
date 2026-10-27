import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Deterministic Security Rules Evaluator & Dirty Dozen Verification Suite
 * Evaluates the exact boolean predicates defined in firestore.rules against
 * the Dirty Dozen attack payloads and valid operational payloads.
 */

const ADMIN_EMAIL = 'kshivanshu35@gmail.com';
const SERVER_TIME = 1793000000000;

interface AuthContext {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 4 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isVerifiedAdmin(auth: AuthContext | null): boolean {
  return (
    auth !== null &&
    auth.email_verified === true &&
    auth.email === ADMIN_EMAIL
  );
}

function hasAllAndOnlyKeys(data: Record<string, unknown>, requiredKeys: string[], allowedKeys: string[]): boolean {
  const keys = Object.keys(data);
  const hasAll = requiredKeys.every((k) => keys.includes(k));
  const hasOnly = keys.every((k) => allowedKeys.includes(k));
  return hasAll && hasOnly;
}

function isValidRsvp(data: Record<string, unknown>): boolean {
  const keys = [
    'rsvpId', 'eventId', 'inviteToken', 'fullName', 'mobileNumber',
    'attendanceStatus', 'attendeeCount', 'mealPreference',
    'messageToFamily', 'submittedAt', 'updatedAt'
  ];
  if (!hasAllAndOnlyKeys(data, keys, keys)) return false;
  if (typeof data.rsvpId !== 'string' || data.rsvpId.length < 6 || data.rsvpId.length > 128 || !/^[a-zA-Z0-9_\-]+$/.test(data.rsvpId)) return false;
  if (data.eventId !== 'main_wedding') return false;
  if (typeof data.inviteToken !== 'string' || data.inviteToken.length < 4 || data.inviteToken.length > 64 || !/^[a-zA-Z0-9_\-]+$/.test(data.inviteToken)) return false;
  if (typeof data.fullName !== 'string' || data.fullName.length < 2 || data.fullName.length > 100) return false;
  if (typeof data.mobileNumber !== 'string' || data.mobileNumber.length < 10 || data.mobileNumber.length > 20 || !/^[0-9+\-\s()]{10,20}$/.test(data.mobileNumber)) return false;
  if (data.attendanceStatus !== 'confirmed' && data.attendanceStatus !== 'declined') return false;
  if (typeof data.attendeeCount !== 'number' || !Number.isInteger(data.attendeeCount)) return false;

  const validAttendanceState =
    (data.attendanceStatus === 'confirmed' && data.attendeeCount >= 1 && data.attendeeCount <= 15 && (data.mealPreference === 'vegetarian' || data.mealPreference === 'non-vegetarian')) ||
    (data.attendanceStatus === 'declined' && data.attendeeCount === 0 && data.mealPreference === 'none');
  if (!validAttendanceState) return false;

  if (typeof data.messageToFamily !== 'string' || data.messageToFamily.length > 400) return false;
  if (typeof data.submittedAt !== 'number' || typeof data.updatedAt !== 'number') return false;
  return true;
}

function evaluateRsvpCreate(rsvpId: string, incoming: Record<string, unknown>): 'ALLOW' | 'PERMISSION_DENIED' {
  const ok =
    isValidId(rsvpId) &&
    isValidRsvp(incoming) &&
    incoming.rsvpId === rsvpId &&
    incoming.submittedAt === SERVER_TIME &&
    incoming.updatedAt === SERVER_TIME;
  return ok ? 'ALLOW' : 'PERMISSION_DENIED';
}

function evaluateRsvpRead(auth: AuthContext | null, rsvpId: string): 'ALLOW' | 'PERMISSION_DENIED' {
  return isVerifiedAdmin(auth) && isValidId(rsvpId) ? 'ALLOW' : 'PERMISSION_DENIED';
}

function evaluateRsvpUpdate(
  auth: AuthContext | null,
  rsvpId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): 'ALLOW' | 'PERMISSION_DENIED' {
  const allowedDiff = [
    'fullName', 'mobileNumber', 'attendanceStatus',
    'attendeeCount', 'mealPreference', 'messageToFamily', 'updatedAt'
  ];
  const changedKeys = Object.keys(incoming).filter((k) => incoming[k] !== existing[k]);
  const diffOnlyAllowed = changedKeys.every((k) => allowedDiff.includes(k));

  const ok =
    isVerifiedAdmin(auth) &&
    isValidId(rsvpId) &&
    isValidRsvp(incoming) &&
    incoming.rsvpId === existing.rsvpId &&
    incoming.eventId === existing.eventId &&
    incoming.inviteToken === existing.inviteToken &&
    incoming.submittedAt === existing.submittedAt &&
    incoming.updatedAt === SERVER_TIME &&
    diffOnlyAllowed;

  return ok ? 'ALLOW' : 'PERMISSION_DENIED';
}

function makeValidRsvpPayload(): Record<string, unknown> {
  return {
    rsvpId: 'rsvp_guest_101',
    eventId: 'main_wedding',
    inviteToken: 'public_link',
    fullName: 'Aarav Sharma',
    mobileNumber: '+91 9876543210',
    attendanceStatus: 'confirmed',
    attendeeCount: 3,
    mealPreference: 'vegetarian',
    messageToFamily: 'Warmest congratulations to both families!',
    submittedAt: SERVER_TIME,
    updatedAt: SERVER_TIME
  };
}

test('firestore.rules file contains all required structural safety gates', () => {
  const rulesText = fs.readFileSync('firestore.rules', 'utf8');
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('allow read, write: if false;'));
  assert.ok(rulesText.includes("request.auth.token.email_verified == true"));
  assert.ok(rulesText.includes("request.auth.token.email == 'kshivanshu35@gmail.com'"));
  assert.ok(rulesText.includes('match /events/{eventId}'));
  assert.ok(rulesText.includes('match /invitations/{inviteToken}'));
  assert.ok(rulesText.includes('match /rsvps/{rsvpId}'));
});

test('Dirty Dozen #1: Shadow Field Injection on RSVP Create returns PERMISSION_DENIED', () => {
  const payload = { ...makeValidRsvpPayload(), isAdmin: true };
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #2: Unverified Admin Email Spoof on RSVP Read returns PERMISSION_DENIED', () => {
  const spoofAuth: AuthContext = {
    uid: 'attacker_1',
    email: ADMIN_EMAIL,
    email_verified: false
  };
  assert.equal(evaluateRsvpRead(spoofAuth, 'rsvp_guest_101'), 'PERMISSION_DENIED');
});

test('Dirty Dozen #3: Public Guest List Scraping returns PERMISSION_DENIED', () => {
  assert.equal(evaluateRsvpRead(null, 'rsvp_guest_101'), 'PERMISSION_DENIED');
  assert.equal(
    evaluateRsvpRead({ uid: 'user_2', email: 'guest@example.com', email_verified: true }, 'rsvp_guest_101'),
    'PERMISSION_DENIED'
  );
});

test('Dirty Dozen #4: Client Timestamp Forgery on RSVP Create returns PERMISSION_DENIED', () => {
  const payload = { ...makeValidRsvpPayload(), submittedAt: SERVER_TIME - 60000 };
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #5: Invalid Attendee Count Poisoning (500 or 0 when confirmed) returns PERMISSION_DENIED', () => {
  const payloadHigh = { ...makeValidRsvpPayload(), attendeeCount: 500 };
  const payloadZero = { ...makeValidRsvpPayload(), attendeeCount: 0 };
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payloadHigh), 'PERMISSION_DENIED');
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payloadZero), 'PERMISSION_DENIED');
});

test('Dirty Dozen #6: Declined RSVP State Mismatch (declined with >0 guests or meal) returns PERMISSION_DENIED', () => {
  const payload = { ...makeValidRsvpPayload(), attendanceStatus: 'declined', attendeeCount: 2, mealPreference: 'vegetarian' };
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #7: Denial-of-Wallet Oversized String returns PERMISSION_DENIED', () => {
  const payload = { ...makeValidRsvpPayload(), messageToFamily: 'x'.repeat(401) };
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', payload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #8: ID Poisoning Attack returns PERMISSION_DENIED', () => {
  const badId = 'rsvp bad$id!with spaces';
  const payload = { ...makeValidRsvpPayload(), rsvpId: badId };
  assert.equal(evaluateRsvpCreate(badId, payload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #9: Unauthorized Public Overwrite of Existing RSVP returns PERMISSION_DENIED', () => {
  const existing = makeValidRsvpPayload();
  const updated = { ...existing, attendeeCount: 5 };
  assert.equal(evaluateRsvpUpdate(null, 'rsvp_guest_101', existing, updated), 'PERMISSION_DENIED');
});

test('Dirty Dozen #10: Immortal Field Mutation (submittedAt / inviteToken) on Admin Update returns PERMISSION_DENIED', () => {
  const adminAuth: AuthContext = { uid: 'admin_1', email: ADMIN_EMAIL, email_verified: true };
  const existing = makeValidRsvpPayload();
  const mutated = { ...existing, submittedAt: SERVER_TIME + 5000, updatedAt: SERVER_TIME };
  assert.equal(evaluateRsvpUpdate(adminAuth, 'rsvp_guest_101', existing, mutated), 'PERMISSION_DENIED');
});

test('Dirty Dozen #11 & #12: Valid public RSVP creation and verified admin update succeed', () => {
  const validPayload = makeValidRsvpPayload();
  assert.equal(evaluateRsvpCreate('rsvp_guest_101', validPayload), 'ALLOW');

  const adminAuth: AuthContext = { uid: 'admin_1', email: ADMIN_EMAIL, email_verified: true };
  const validAdminEdit = { ...validPayload, attendeeCount: 4, updatedAt: SERVER_TIME };
  assert.equal(evaluateRsvpUpdate(adminAuth, 'rsvp_guest_101', validPayload, validAdminEdit), 'ALLOW');
});
