export interface ScheduleItem {
  time: string;
  title: string;
  description: string;
}

export interface WeddingEventConfig {
  eventId: string;
  coupleNames: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  dayOfWeek: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  city: string;
  eventType: string;
  mapUrl: string;
  coverSubtitle: string;
  welcomeHeading: string;
  welcomeMessage: string;
  familyMessage: string;
  familySignOff: string;
  maxGuestsPerRsvp: number;
  schedule: ScheduleItem[];
  themeId?: string;
  updatedAt?: string | number;
  updatedBy?: string;
}

export type AttendanceStatus = 'confirmed' | 'declined';
export type InvitationStatus = 'pending' | 'confirmed' | 'declined';
export type MealPreference = 'vegetarian' | 'non-vegetarian' | 'none';

export interface GuestInvitationRecord {
  inviteToken: string;
  eventId: string;
  guestDisplayName: string;
  maxAllowedGuests: number;
  status: InvitationStatus;
  themeId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface RsvpResponseRecord {
  rsvpId: string;
  eventId: string;
  inviteToken: string;
  fullName: string;
  mobileNumber: string;
  attendanceStatus: AttendanceStatus;
  attendeeCount: number;
  mealPreference: MealPreference;
  votedFoodItems?: string[];
  messageToFamily: string;
  submittedAt: number;
  updatedAt: number;
}

export interface RsvpDraftInput {
  fullName: string;
  mobileNumber: string;
  attendanceStatus: AttendanceStatus;
  attendeeCount: number;
  mealPreference: MealPreference;
  votedFoodItems?: string[];
  messageToFamily: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    fullName?: string;
    mobileNumber?: string;
    attendeeCount?: string;
    mealPreference?: string;
    messageToFamily?: string;
  };
}

export interface DashboardStats {
  totalInvitationsSent: number;
  confirmedResponses: number;
  pendingResponses: number;
  declinedResponses: number;
  totalConfirmedPeople: number;
  vegetarianMeals: number;
  nonVegetarianMeals: number;
}

export interface UnifiedGuestRow {
  id: string;
  recordType: 'rsvp' | 'invitation';
  guestName: string;
  mobileNumber: string;
  status: InvitationStatus;
  attendeeCount: number;
  mealPreference: MealPreference;
  votedFoodItems: string[];
  themeId: string;
  inviteToken: string;
  timestamp: number;
  note: string;
  rsvpRecord?: RsvpResponseRecord;
  invitationRecord?: GuestInvitationRecord;
}

export const DEPLOYED_SHARED_APP_URL =
  'https://ais-pre-ioylug6s6sv5c7jnhqls54-282916706319.asia-northeast1.run.app';

export interface WeddingThemeOption {
  id: string;
  code: string;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  background: string;
  surfaceTint: string;
  textDark: string;
  textMuted: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
}

export const DEFAULT_THEME_ID = 'royal-crimson';

export const WEDDING_THEMES: WeddingThemeOption[] = [
  {
    id: 'royal-crimson',
    code: 'rc',
    name: 'Royal Sindoor & Champagne Gold',
    tagline: 'Regal Rajasthani Palace Crimson & Gold',
    primary: '#9E1B32',
    secondary: '#D4AF37',
    background: '#FDFBF7',
    surfaceTint: '#FFF5F6',
    textDark: '#2B1419',
    textMuted: '#7A5C61',
    bg: '#FDFBF7',
    surface: '#FFF5F6',
    text: '#2B1419',
    muted: '#7A5C61'
  },
  {
    id: 'marigold-glass',
    code: 'mg',
    name: 'Udaipur Marigold & Warm Ivory',
    tagline: 'Festive Haldi & Marigold Blossom',
    primary: '#F47B20',
    secondary: '#FFAD58',
    background: '#FFFAF5',
    surfaceTint: '#FFF4E8',
    textDark: '#34251E',
    textMuted: '#8E7A6E',
    bg: '#FFFAF5',
    surface: '#FFF4E8',
    text: '#34251E',
    muted: '#8E7A6E'
  },
  {
    id: 'jaipur-rose',
    code: 'jr',
    name: 'Jaipur Lotus Pink & Rose Gold',
    tagline: 'Romantic Pink City Floral Glass',
    primary: '#B81D65',
    secondary: '#E59866',
    background: '#FFF9FB',
    surfaceTint: '#FCEEF4',
    textDark: '#2E1522',
    textMuted: '#7D5B6B',
    bg: '#FFF9FB',
    surface: '#FCEEF4',
    text: '#2E1522',
    muted: '#7D5B6B'
  },
  {
    id: 'emerald-mehndi',
    code: 'em',
    name: 'Royal Emerald & Antique Gold',
    tagline: 'Heritage Sangeet & Mehndi Jewel Tones',
    primary: '#16654E',
    secondary: '#C59B27',
    background: '#F7FBF9',
    surfaceTint: '#EBF5F0',
    textDark: '#132A23',
    textMuted: '#537067',
    bg: '#F7FBF9',
    surface: '#EBF5F0',
    text: '#132A23',
    muted: '#537067'
  }
];

export interface WeddingFoodItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  dietary: 'vegetarian' | 'non-vegetarian';
  color: string;
  imageUrl: string;
  badge: string;
}

export const WEDDING_FOOD_ITEMS: WeddingFoodItem[] = [
  {
    id: 'paneer-tikka',
    name: 'Shahi Zafrani Paneer Tikka',
    shortName: 'Paneer Tikka',
    category: 'Royal Tandoor Starter',
    dietary: 'vegetarian',
    color: '#E67E22',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    badge: 'Live Sigri'
  },
  {
    id: 'chaat-counter',
    name: 'Banarasi Raj Kachori Chaat',
    shortName: 'Banarasi Chaat',
    category: 'Street Chaat Lounge',
    dietary: 'vegetarian',
    color: '#D35400',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    badge: 'Crowd Hit'
  },
  {
    id: 'dal-makhani',
    name: '24-Hr Dal Makhani & Butter Naan',
    shortName: 'Dal Makhani',
    category: 'Signature North Indian',
    dietary: 'vegetarian',
    color: '#9E1B32',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    badge: 'Slow Cooked'
  },
  {
    id: 'hyderabadi-biryani',
    name: 'Awadhi Dum Pukht Handi Biryani',
    shortName: 'Shahi Biryani',
    category: 'Royal Copper Handi',
    dietary: 'vegetarian',
    color: '#D4AF37',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    badge: 'Saffron Infused'
  },
  {
    id: 'butter-chicken',
    name: 'Old Delhi Smoked Butter Chicken',
    shortName: 'Butter Chicken',
    category: 'Mughlai Dastarkhwan',
    dietary: 'non-vegetarian',
    color: '#C0392B',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
    badge: 'Chef Special'
  },
  {
    id: 'gulab-jamun-rabri',
    name: 'Hot Kesar Jalebi & Pistachio Rabri',
    shortName: 'Jalebi & Rabri',
    category: 'Shahi Halwai Counter',
    dietary: 'vegetarian',
    color: '#B81D65',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    badge: 'Royal Sweet'
  }
];

export interface FoodVoteStatItem {
  foodId: string;
  name: string;
  shortName: string;
  category: string;
  dietary: 'vegetarian' | 'non-vegetarian';
  color: string;
  imageUrl: string;
  voteCount: number;
  headcountDemand: number;
  percentageOfVoters: number;
}

export interface PartySizeBucket {
  label: string;
  range: string;
  familyCount: number;
  totalGuests: number;
  color: string;
}

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'wedding2026';

export function verifyAdminCredentials(
  inputUsername: string,
  inputPassword: string,
  expectedUsername: string = DEFAULT_ADMIN_USERNAME,
  expectedPassword: string = DEFAULT_ADMIN_PASSWORD
): boolean {
  const cleanUser = (inputUsername || '').trim().toLowerCase();
  const cleanExpectedUser = (expectedUsername || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  return cleanUser === cleanExpectedUser && inputPassword === expectedPassword;
}

const FOOD_VOTE_TAG_REGEX = /\s*\[FOOD:([a-z0-9,\-_]+)\]\s*$/i;

export function encodeMessageWithFoodVotes(
  cleanMessage: string,
  votedFoodItems?: string[]
): string {
  const stripped = (cleanMessage || '').replace(FOOD_VOTE_TAG_REGEX, '').trim();
  const validFoodIds = new Set(WEDDING_FOOD_ITEMS.map((f) => f.id));
  const safeVotes = Array.isArray(votedFoodItems)
    ? votedFoodItems.filter((id) => validFoodIds.has(id))
    : [];
  if (safeVotes.length === 0) {
    return stripped.slice(0, 400);
  }
  const tag = ` [FOOD:${safeVotes.join(',')}]`;
  const maxMsgLen = Math.max(0, 400 - tag.length);
  return `${stripped.slice(0, maxMsgLen)}${tag}`.trim();
}

export function decodeMessageAndFoodVotes(rawMessage: string): {
  cleanMessage: string;
  votedFoodItems: string[];
} {
  const str = rawMessage || '';
  const match = str.match(FOOD_VOTE_TAG_REGEX);
  if (!match) {
    return { cleanMessage: str.trim(), votedFoodItems: [] };
  }
  const validFoodIds = new Set(WEDDING_FOOD_ITEMS.map((f) => f.id));
  const items = match[1]
    .split(',')
    .map((s) => s.trim())
    .filter((id) => validFoodIds.has(id));
  const cleanMessage = str.replace(FOOD_VOTE_TAG_REGEX, '').trim();
  return { cleanMessage, votedFoodItems: items };
}

export function extractThemeFromInviteToken(inviteToken?: string): string | null {
  if (!inviteToken) return null;
  const match = inviteToken.match(/^inv_(rc|mg|jr|em)_/);
  if (!match) return null;
  const code = match[1];
  const found = WEDDING_THEMES.find((t) => t.code === code);
  return found ? found.id : null;
}

export const DEFAULT_WEDDING_EVENT: WeddingEventConfig = {
  eventId: 'main_wedding',
  coupleNames: 'Ananya & Aarav',
  brideName: 'Ananya',
  groomName: 'Aarav',
  weddingDate: 'December 18, 2026',
  dayOfWeek: 'Friday',
  ceremonyTime: '6:30 PM Onwards',
  venueName: 'The Suryagarh Heritage Courtyard (Demo Venue)',
  venueAddress: 'Plot 14, Palace Road, Civil Lines, Jaipur, Rajasthan 302006',
  city: 'Jaipur, Rajasthan',
  eventType: 'Subh Muhurtham & Grand Wedding Reception',
  mapUrl: 'https://maps.google.com/?q=Jaipur+Rajasthan+India',
  coverSubtitle:
    'Together with our parents and families, we joyfully invite you to celebrate the beginning of our forever.',
  welcomeHeading: 'With Joy in Our Hearts & Blessings of Our Elders',
  welcomeMessage:
    'Two families, two journeys, and one sacred promise. Your presence and blessings mean the world to us as we step into this new chapter of our lives together.',
  familyMessage:
    'The wedding host can customize all names, dates, venue coordinates, fixed theme colors, and schedule items in the Admin Dashboard.',
  familySignOff: 'With love & warm regards, The Sharma & Verma Families',
  maxGuestsPerRsvp: 6,
  themeId: 'royal-crimson',
  schedule: [
    {
      time: '5:30 PM',
      title: 'Guest Welcome & Royal Baraat Swagat',
      description: 'Shehnai melodies, vintage baraat procession & floral welcome.'
    },
    {
      time: '6:45 PM',
      title: 'Jaimala & Subh Muhurtham Vows',
      description: 'Sacred garland exchange on the lotus mandap under the stars.'
    },
    {
      time: '8:30 PM',
      title: 'Grand Shahi Dastarkhwan & Sangeet Gala',
      description: 'Live royal feast counters, folk melodies & reception blessings.'
    }
  ]
};

export const INITIAL_DEMO_INVITATIONS: GuestInvitationRecord[] = [
  {
    inviteToken: 'inv_rc_rajesh_family_01',
    eventId: 'main_wedding',
    guestDisplayName: 'Rajesh & Sunita Kulkarni Family',
    maxAllowedGuests: 4,
    status: 'confirmed',
    themeId: 'royal-crimson',
    createdBy: 'demo_host',
    createdAt: 1761500000000,
    updatedAt: 1761510000000
  },
  {
    inviteToken: 'inv_mg_priya_nair_02',
    eventId: 'main_wedding',
    guestDisplayName: 'Dr. Priya Nair & Family',
    maxAllowedGuests: 3,
    status: 'confirmed',
    themeId: 'marigold-glass',
    createdBy: 'demo_host',
    createdAt: 1761502000000,
    updatedAt: 1761512000000
  },
  {
    inviteToken: 'inv_jr_vikram_singh_03',
    eventId: 'main_wedding',
    guestDisplayName: 'Vikramaditya Singhania',
    maxAllowedGuests: 2,
    status: 'declined',
    themeId: 'jaipur-rose',
    createdBy: 'demo_host',
    createdAt: 1761504000000,
    updatedAt: 1761514000000
  },
  {
    inviteToken: 'inv_em_meera_deshmukh_04',
    eventId: 'main_wedding',
    guestDisplayName: 'Prof. Meera Deshmukh & Family',
    maxAllowedGuests: 5,
    status: 'pending',
    themeId: 'emerald-mehndi',
    createdBy: 'demo_host',
    createdAt: 1761506000000,
    updatedAt: 1761506000000
  },
  {
    inviteToken: 'inv_rc_kabir_malhotra_05',
    eventId: 'main_wedding',
    guestDisplayName: 'Kabir & Neha Malhotra',
    maxAllowedGuests: 2,
    status: 'pending',
    themeId: 'royal-crimson',
    createdBy: 'demo_host',
    createdAt: 1761508000000,
    updatedAt: 1761508000000
  }
];

export const INITIAL_DEMO_RSVPS: RsvpResponseRecord[] = [
  {
    rsvpId: 'rsvp_demo_rajesh_01',
    eventId: 'main_wedding',
    inviteToken: 'inv_rc_rajesh_family_01',
    fullName: 'Rajesh Kulkarni',
    mobileNumber: '+91 98201 44510',
    attendanceStatus: 'confirmed',
    attendeeCount: 4,
    mealPreference: 'vegetarian',
    votedFoodItems: ['paneer-tikka', 'chaat-counter', 'dal-makhani', 'gulab-jamun-rabri'],
    messageToFamily:
      'Heartiest congratulations to Ananya and Aarav! Looking forward to the Jaipur celebration.',
    submittedAt: 1761510000000,
    updatedAt: 1761510000000
  },
  {
    rsvpId: 'rsvp_demo_priya_02',
    eventId: 'main_wedding',
    inviteToken: 'inv_mg_priya_nair_02',
    fullName: 'Dr. Priya Nair',
    mobileNumber: '+91 98450 77821',
    attendanceStatus: 'confirmed',
    attendeeCount: 3,
    mealPreference: 'non-vegetarian',
    votedFoodItems: ['butter-chicken', 'hyderabadi-biryani', 'paneer-tikka', 'gulab-jamun-rabri'],
    messageToFamily: 'So happy for both of you! We will arrive by 5:15 PM for the Baraat Swagat.',
    submittedAt: 1761512000000,
    updatedAt: 1761512000000
  },
  {
    rsvpId: 'rsvp_demo_vikram_03',
    eventId: 'main_wedding',
    inviteToken: 'inv_jr_vikram_singh_03',
    fullName: 'Vikramaditya Singhania',
    mobileNumber: '+91 98112 33904',
    attendanceStatus: 'declined',
    attendeeCount: 0,
    mealPreference: 'none',
    votedFoodItems: [],
    messageToFamily:
      'Warmest blessings to the couple! Travelling abroad that week, will visit soon after.',
    submittedAt: 1761514000000,
    updatedAt: 1761514000000
  },
  {
    rsvpId: 'rsvp_demo_rohan_04',
    eventId: 'main_wedding',
    inviteToken: 'public_link',
    fullName: 'Rohan & Aditi Joshi',
    mobileNumber: '+91 97654 11209',
    attendanceStatus: 'confirmed',
    attendeeCount: 2,
    mealPreference: 'vegetarian',
    votedFoodItems: ['chaat-counter', 'dal-makhani', 'hyderabadi-biryani', 'gulab-jamun-rabri'],
    messageToFamily: 'Counting down the days! Wishing the couple a lifetime of happiness.',
    submittedAt: 1761516000000,
    updatedAt: 1761516000000
  },
  {
    rsvpId: 'rsvp_demo_siddharth_05',
    eventId: 'main_wedding',
    inviteToken: 'public_link',
    fullName: 'Siddharth & Kavya Kapoor',
    mobileNumber: '+91 98180 55219',
    attendanceStatus: 'confirmed',
    attendeeCount: 5,
    mealPreference: 'non-vegetarian',
    votedFoodItems: ['butter-chicken', 'paneer-tikka', 'chaat-counter', 'hyderabadi-biryani', 'gulab-jamun-rabri'],
    messageToFamily: 'Cannot wait for the Sangeet night and the royal feast!',
    submittedAt: 1761518000000,
    updatedAt: 1761518000000
  }
];

export function adjustGuestCount(currentCount: number, delta: number, maxGuests: number): number {
  const safeMax = Math.min(15, Math.max(1, Math.floor(maxGuests || 6)));
  const next = Math.floor(currentCount) + delta;
  if (next < 1) return 1;
  if (next > safeMax) return safeMax;
  return next;
}

export function normalizeRsvpForAttendanceChange(
  draft: RsvpDraftInput,
  newStatus: AttendanceStatus
): RsvpDraftInput {
  if (newStatus === 'declined') {
    return {
      ...draft,
      attendanceStatus: 'declined',
      attendeeCount: 0,
      mealPreference: 'none',
      votedFoodItems: []
    };
  }
  return {
    ...draft,
    attendanceStatus: 'confirmed',
    attendeeCount: draft.attendeeCount >= 1 ? draft.attendeeCount : 1,
    mealPreference: draft.mealPreference === 'none' ? 'vegetarian' : draft.mealPreference,
    votedFoodItems:
      Array.isArray(draft.votedFoodItems) && draft.votedFoodItems.length > 0
        ? draft.votedFoodItems
        : ['paneer-tikka', 'gulab-jamun-rabri']
  };
}

export function validateRsvpInput(
  input: RsvpDraftInput,
  maxGuestsPerRsvp: number
): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const trimmedName = (input.fullName || '').trim();
  const trimmedMobile = (input.mobileNumber || '').trim();
  const trimmedMessage = (input.messageToFamily || '').trim();
  const safeMax = Math.min(15, Math.max(1, maxGuestsPerRsvp || 6));

  if (trimmedName.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  } else if (trimmedName.length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer.';
  }

  const digitsOnly = trimmedMobile.replace(/\D/g, '');
  if (
    trimmedMobile.length < 10 ||
    trimmedMobile.length > 20 ||
    !/^[0-9+\-\s()]{10,20}$/.test(trimmedMobile) ||
    digitsOnly.length < 10 ||
    digitsOnly.length > 15
  ) {
    errors.mobileNumber = 'Please enter a valid 10-digit mobile number (e.g. +91 98765 43210).';
  }

  if (input.attendanceStatus === 'confirmed') {
    if (
      !Number.isInteger(input.attendeeCount) ||
      input.attendeeCount < 1 ||
      input.attendeeCount > safeMax
    ) {
      errors.attendeeCount = `Guest count must be between 1 and ${safeMax}.`;
    }
    if (input.mealPreference !== 'vegetarian' && input.mealPreference !== 'non-vegetarian') {
      errors.mealPreference = 'Please select a meal preference (Vegetarian or Non-vegetarian).';
    }
  } else if (input.attendanceStatus === 'declined') {
    if (input.attendeeCount !== 0) {
      errors.attendeeCount = 'Attendee count must be 0 when declining.';
    }
    if (input.mealPreference !== 'none') {
      errors.mealPreference = 'Meal preference must be none when declining.';
    }
  }

  if (trimmedMessage.length > 400) {
    errors.messageToFamily = 'Message to the family must be 400 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function createDeterministicRsvpId(mobileNumber: string, inviteToken: string): string {
  const digits = mobileNumber.replace(/\D/g, '').slice(-10);
  const safeToken =
    (inviteToken || 'public_link').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'public_link';
  const suffix = Math.random().toString(36).substring(2, 8);
  return `rsvp_${safeToken}_${digits || 'guest'}_${suffix}`;
}

export function generateInviteToken(
  guestDisplayName: string,
  themeId: string = DEFAULT_THEME_ID
): string {
  const foundTheme = WEDDING_THEMES.find((t) => t.id === themeId);
  const themeCode = foundTheme ? foundTheme.code : 'rc';
  const slug =
    guestDisplayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 16) || 'guest';
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `inv_${themeCode}_${slug}_${randomSuffix}`;
}

export function calculateDashboardStats(
  rsvps: RsvpResponseRecord[],
  invitations: GuestInvitationRecord[]
): DashboardStats {
  const respondedTokens = new Set(
    rsvps.map((r) => r.inviteToken).filter((t) => t && t !== 'public_link')
  );

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending' && !respondedTokens.has(inv.inviteToken)
  );

  const confirmedRsvps = rsvps.filter((r) => r.attendanceStatus === 'confirmed');
  const declinedRsvps = rsvps.filter((r) => r.attendanceStatus === 'declined');

  const totalConfirmedPeople = confirmedRsvps.reduce(
    (sum, r) => sum + (Number.isFinite(r.attendeeCount) ? r.attendeeCount : 0),
    0
  );

  const vegetarianMeals = confirmedRsvps
    .filter((r) => r.mealPreference === 'vegetarian')
    .reduce((sum, r) => sum + (Number.isFinite(r.attendeeCount) ? r.attendeeCount : 0), 0);

  const nonVegetarianMeals = confirmedRsvps
    .filter((r) => r.mealPreference === 'non-vegetarian')
    .reduce((sum, r) => sum + (Number.isFinite(r.attendeeCount) ? r.attendeeCount : 0), 0);

  const totalInvitationsSent = rsvps.length + pendingInvitations.length;

  return {
    totalInvitationsSent,
    confirmedResponses: confirmedRsvps.length,
    pendingResponses: pendingInvitations.length,
    declinedResponses: declinedRsvps.length,
    totalConfirmedPeople,
    vegetarianMeals,
    nonVegetarianMeals
  };
}

export function calculateFoodVoteStats(rsvps: RsvpResponseRecord[]): FoodVoteStatItem[] {
  const confirmedRsvps = rsvps.filter((r) => r.attendanceStatus === 'confirmed');
  const totalVoters = Math.max(1, confirmedRsvps.length);

  return WEDDING_FOOD_ITEMS.map((item) => {
    let voteCount = 0;
    let headcountDemand = 0;

    for (const rsvp of confirmedRsvps) {
      const votes = Array.isArray(rsvp.votedFoodItems) ? rsvp.votedFoodItems : [];
      if (votes.includes(item.id)) {
        voteCount += 1;
        headcountDemand += Math.max(1, rsvp.attendeeCount || 1);
      }
    }

    const percentageOfVoters =
      confirmedRsvps.length === 0 ? 0 : Math.round((voteCount / totalVoters) * 100);

    return {
      foodId: item.id,
      name: item.name,
      shortName: item.shortName,
      category: item.category,
      dietary: item.dietary,
      color: item.color,
      imageUrl: item.imageUrl,
      voteCount,
      headcountDemand,
      percentageOfVoters
    };
  });
}

export function calculatePartySizeBuckets(rsvps: RsvpResponseRecord[]): PartySizeBucket[] {
  const confirmedRsvps = rsvps.filter((r) => r.attendanceStatus === 'confirmed');
  const buckets: PartySizeBucket[] = [
    { label: 'Solo / Couple', range: '1–2 Guests', familyCount: 0, totalGuests: 0, color: '#D4AF37' },
    { label: 'Nuclear Family', range: '3–4 Guests', familyCount: 0, totalGuests: 0, color: '#9E1B32' },
    { label: 'Joint Family', range: '5+ Guests', familyCount: 0, totalGuests: 0, color: '#16654E' }
  ];

  for (const rsvp of confirmedRsvps) {
    const count = rsvp.attendeeCount || 1;
    if (count <= 2) {
      buckets[0].familyCount += 1;
      buckets[0].totalGuests += count;
    } else if (count <= 4) {
      buckets[1].familyCount += 1;
      buckets[1].totalGuests += count;
    } else {
      buckets[2].familyCount += 1;
      buckets[2].totalGuests += count;
    }
  }

  return buckets;
}

export function buildUnifiedGuestRows(
  rsvps: RsvpResponseRecord[],
  invitations: GuestInvitationRecord[],
  options: {
    searchQuery?: string;
    statusFilter?: 'all' | 'confirmed' | 'pending' | 'declined';
    sortBy?: 'name' | 'date';
    sortDir?: 'asc' | 'desc';
  } = {}
): UnifiedGuestRow[] {
  const {
    searchQuery = '',
    statusFilter = 'all',
    sortBy = 'date',
    sortDir = 'desc'
  } = options;

  const respondedTokens = new Set(
    rsvps.map((r) => r.inviteToken).filter((t) => t && t !== 'public_link')
  );

  const rows: UnifiedGuestRow[] = [];

  for (const rsvp of rsvps) {
    const tokenTheme = extractThemeFromInviteToken(rsvp.inviteToken) || DEFAULT_THEME_ID;
    rows.push({
      id: rsvp.rsvpId,
      recordType: 'rsvp',
      guestName: rsvp.fullName,
      mobileNumber: rsvp.mobileNumber,
      status: rsvp.attendanceStatus,
      attendeeCount: rsvp.attendeeCount,
      mealPreference: rsvp.mealPreference,
      votedFoodItems: Array.isArray(rsvp.votedFoodItems) ? rsvp.votedFoodItems : [],
      themeId: tokenTheme,
      inviteToken: rsvp.inviteToken,
      timestamp: rsvp.submittedAt,
      note: rsvp.messageToFamily,
      rsvpRecord: rsvp
    });
  }

  for (const inv of invitations) {
    if (inv.status === 'pending' && !respondedTokens.has(inv.inviteToken)) {
      const tokenTheme =
        inv.themeId || extractThemeFromInviteToken(inv.inviteToken) || DEFAULT_THEME_ID;
      rows.push({
        id: inv.inviteToken,
        recordType: 'invitation',
        guestName: inv.guestDisplayName,
        mobileNumber: 'Awaiting RSVP',
        status: 'pending',
        attendeeCount: 0,
        mealPreference: 'none',
        votedFoodItems: [],
        themeId: tokenTheme,
        inviteToken: inv.inviteToken,
        timestamp: inv.createdAt,
        note: `Invited (up to ${inv.maxAllowedGuests} guests)`,
        invitationRecord: inv
      });
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      row.guestName.toLowerCase().includes(normalizedQuery) ||
      row.mobileNumber.toLowerCase().includes(normalizedQuery) ||
      row.inviteToken.toLowerCase().includes(normalizedQuery) ||
      row.note.toLowerCase().includes(normalizedQuery)
    );
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.guestName.localeCompare(b.guestName);
    } else {
      comparison = a.timestamp - b.timestamp;
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateGuestListCsv(rows: UnifiedGuestRow[]): string {
  const headers = [
    'Guest Name',
    'Mobile Number',
    'Attendance Status',
    'Number of Attendees',
    'Meal Preference',
    'Voted Dishes',
    'Theme ID',
    'Invitation Token',
    'Submission Date',
    'Optional Note'
  ];

  const lines = [headers.join(',')];
  for (const row of rows) {
    const dateStr = new Date(row.timestamp).toISOString().split('T')[0];
    const votedNames = (row.votedFoodItems || [])
      .map((id) => WEDDING_FOOD_ITEMS.find((f) => f.id === id)?.shortName || id)
      .join(' | ');
    const cells = [
      escapeCsvCell(row.guestName),
      escapeCsvCell(row.mobileNumber),
      escapeCsvCell(row.status.toUpperCase()),
      escapeCsvCell(row.attendeeCount),
      escapeCsvCell(row.mealPreference),
      escapeCsvCell(votedNames),
      escapeCsvCell(row.themeId),
      escapeCsvCell(row.inviteToken),
      escapeCsvCell(dateStr),
      escapeCsvCell(row.note)
    ];
    lines.push(cells.join(','));
  }

  return lines.join('\n');
}

export function buildPublicInvitationUrl(
  baseUrl: string,
  inviteToken?: string,
  themeId?: string
): string {
  const cleanBase = (baseUrl || DEPLOYED_SHARED_APP_URL).replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (inviteToken && inviteToken !== 'public_link' && /^[a-zA-Z0-9_\-]+$/.test(inviteToken)) {
    params.set('invite', inviteToken);
  }
  if (themeId && WEDDING_THEMES.some((t) => t.id === themeId)) {
    params.set('theme', themeId);
  }
  const qs = params.toString();
  return qs ? `${cleanBase}/?${qs}` : `${cleanBase}/`;
}

export function buildWhatsAppShareUrl(
  baseUrl: string,
  coupleNames: string,
  inviteToken?: string,
  guestDisplayName?: string,
  themeId?: string
): { invitationUrl: string; message: string; whatsappUrl: string } {
  const resolvedTheme = themeId || extractThemeFromInviteToken(inviteToken) || undefined;
  const invitationUrl = buildPublicInvitationUrl(baseUrl, inviteToken, resolvedTheme);
  const greeting = guestDisplayName ? `Dear ${guestDisplayName}, you're` : "You're";
  const message = `${greeting} warmly invited to celebrate the wedding of ${coupleNames}! Please open your personal invitation, vote for your favorite royal feast dishes, and confirm your attendance here: ${invitationUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  return { invitationUrl, message, whatsappUrl };
}
