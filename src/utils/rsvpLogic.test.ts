import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustGuestCount,
  normalizeRsvpForAttendanceChange,
  validateRsvpInput,
  calculateDashboardStats,
  calculateFoodVoteStats,
  calculatePartySizeBuckets,
  buildUnifiedGuestRows,
  generateGuestListCsv,
  buildWhatsAppShareUrl,
  verifyAdminCredentials,
  encodeMessageWithFoodVotes,
  decodeMessageAndFoodVotes,
  generateInviteToken,
  extractThemeFromInviteToken,
  WEDDING_THEMES,
  WEDDING_FOOD_ITEMS,
  INITIAL_DEMO_INVITATIONS,
  INITIAL_DEMO_RSVPS,
  DEPLOYED_SHARED_APP_URL
} from './rsvpLogic';

test('adjustGuestCount enforces minimum of 1 and host-configured maximum', () => {
  assert.equal(adjustGuestCount(1, -1, 6), 1);
  assert.equal(adjustGuestCount(1, 1, 6), 2);
  assert.equal(adjustGuestCount(6, 1, 6), 6);
  assert.equal(adjustGuestCount(15, 1, 20), 15);
});

test('normalizeRsvpForAttendanceChange zeroes count, meal, and food votes when declined and restores when confirmed', () => {
  const initial = {
    fullName: 'Anjali Verma',
    mobileNumber: '+91 9876543210',
    attendanceStatus: 'confirmed' as const,
    attendeeCount: 3,
    mealPreference: 'vegetarian' as const,
    votedFoodItems: ['paneer-tikka', 'dal-makhani'],
    messageToFamily: 'See you there!'
  };

  const declined = normalizeRsvpForAttendanceChange(initial, 'declined');
  assert.equal(declined.attendanceStatus, 'declined');
  assert.equal(declined.attendeeCount, 0);
  assert.equal(declined.mealPreference, 'none');
  assert.deepEqual(declined.votedFoodItems, []);

  const restored = normalizeRsvpForAttendanceChange(declined, 'confirmed');
  assert.equal(restored.attendanceStatus, 'confirmed');
  assert.equal(restored.attendeeCount, 1);
  assert.equal(restored.mealPreference, 'vegetarian');
  assert.ok(Array.isArray(restored.votedFoodItems) && restored.votedFoodItems.length > 0);
});

test('validateRsvpInput validates name, phone, guest count, and meal preference accurately', () => {
  const validConfirmed = validateRsvpInput(
    {
      fullName: 'Rohan Sharma',
      mobileNumber: '+91 98201 44510',
      attendanceStatus: 'confirmed',
      attendeeCount: 4,
      mealPreference: 'vegetarian',
      messageToFamily: 'Congratulations!'
    },
    6
  );
  assert.equal(validConfirmed.valid, true);

  const invalidPhoneAndName = validateRsvpInput(
    {
      fullName: 'A',
      mobileNumber: '12345',
      attendanceStatus: 'confirmed',
      attendeeCount: 8,
      mealPreference: 'vegetarian',
      messageToFamily: ''
    },
    6
  );
  assert.equal(invalidPhoneAndName.valid, false);
  assert.ok(invalidPhoneAndName.errors.fullName);
  assert.ok(invalidPhoneAndName.errors.mobileNumber);
  assert.ok(invalidPhoneAndName.errors.attendeeCount);
});

test('calculateDashboardStats distinguishes invitation records from total attending people and meal counts', () => {
  const stats = calculateDashboardStats(INITIAL_DEMO_RSVPS, INITIAL_DEMO_INVITATIONS);
  assert.equal(stats.totalInvitationsSent, 7);
  assert.equal(stats.confirmedResponses, 4);
  assert.equal(stats.pendingResponses, 2);
  assert.equal(stats.declinedResponses, 1);
  assert.equal(stats.totalConfirmedPeople, 14);
  assert.equal(stats.vegetarianMeals, 6);
  assert.equal(stats.nonVegetarianMeals, 8);
});

test('calculateFoodVoteStats and calculatePartySizeBuckets compute accurate chart data for 6 dishes', () => {
  assert.equal(WEDDING_FOOD_ITEMS.length, 6);
  const foodStats = calculateFoodVoteStats(INITIAL_DEMO_RSVPS);
  assert.equal(foodStats.length, 6);

  const jalebiStat = foodStats.find((f) => f.foodId === 'gulab-jamun-rabri');
  assert.ok(jalebiStat);
  assert.equal(jalebiStat.voteCount, 4);
  assert.equal(jalebiStat.headcountDemand, 14);
  assert.equal(jalebiStat.percentageOfVoters, 100);

  const buckets = calculatePartySizeBuckets(INITIAL_DEMO_RSVPS);
  assert.equal(buckets.length, 3);
  assert.equal(buckets[0].familyCount, 1); // 2 guests
  assert.equal(buckets[1].familyCount, 2); // 3 & 4 guests
  assert.equal(buckets[2].familyCount, 1); // 5 guests
});

test('encodeMessageWithFoodVotes and decodeMessageAndFoodVotes round-trip food votes and generateInviteToken embeds Admin theme', () => {
  const encoded = encodeMessageWithFoodVotes('Warmest wishes!', [
    'paneer-tikka',
    'hyderabadi-biryani'
  ]);
  const decoded = decodeMessageAndFoodVotes(encoded);
  assert.equal(decoded.cleanMessage, 'Warmest wishes!');
  assert.deepEqual(decoded.votedFoodItems, ['paneer-tikka', 'hyderabadi-biryani']);

  const token = generateInviteToken('Sharma Family', 'jaipur-rose');
  assert.equal(extractThemeFromInviteToken(token), 'jaipur-rose');
});

test('buildUnifiedGuestRows supports search, status filtering, and sorting', () => {
  const confirmedOnly = buildUnifiedGuestRows(INITIAL_DEMO_RSVPS, INITIAL_DEMO_INVITATIONS, {
    statusFilter: 'confirmed'
  });
  assert.equal(confirmedOnly.length, 4);

  const pendingOnly = buildUnifiedGuestRows(INITIAL_DEMO_RSVPS, INITIAL_DEMO_INVITATIONS, {
    statusFilter: 'pending'
  });
  assert.equal(pendingOnly.length, 2);

  const searchPhone = buildUnifiedGuestRows(INITIAL_DEMO_RSVPS, INITIAL_DEMO_INVITATIONS, {
    searchQuery: '98450'
  });
  assert.equal(searchPhone.length, 1);
  assert.equal(searchPhone[0].guestName, 'Dr. Priya Nair');
});

test('generateGuestListCsv and buildWhatsAppShareUrl produce valid outputs without leaking PII in URLs', () => {
  const rows = buildUnifiedGuestRows(INITIAL_DEMO_RSVPS, INITIAL_DEMO_INVITATIONS);
  const csv = generateGuestListCsv(rows);
  assert.ok(csv.includes('Guest Name,Mobile Number,Attendance Status'));
  assert.ok(csv.includes('Rajesh Kulkarni'));
  assert.ok(csv.includes('Paneer Tikka'));

  const share = buildWhatsAppShareUrl(
    DEPLOYED_SHARED_APP_URL,
    'Ananya & Aarav',
    'inv_em_meera_deshmukh_04',
    'Prof. Meera Deshmukh & Family'
  );
  assert.ok(share.invitationUrl.startsWith(DEPLOYED_SHARED_APP_URL));
  assert.ok(share.invitationUrl.includes('invite=inv_em_meera_deshmukh_04'));
  assert.ok(share.invitationUrl.includes('theme=emerald-mehndi'));
  assert.ok(!share.invitationUrl.includes('98'));
  assert.ok(share.whatsappUrl.includes('https://wa.me/?text='));
});

test('verifyAdminCredentials and WEDDING_THEMES support theme lookup and password verification', () => {
  assert.ok(Array.isArray(WEDDING_THEMES));
  assert.equal(WEDDING_THEMES.length, 4);
  const crimson = WEDDING_THEMES.find((t) => t.id === 'royal-crimson');
  assert.ok(crimson);
  assert.equal(crimson.primary, '#9E1B32');

  assert.equal(verifyAdminCredentials('admin', 'wedding2026'), true);
  assert.equal(verifyAdminCredentials('ADMIN ', 'wedding2026'), true);
  assert.equal(verifyAdminCredentials('admin', 'wrongpass'), false);
});
