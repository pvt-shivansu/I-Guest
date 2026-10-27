import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  WeddingEventConfig,
  DEFAULT_WEDDING_EVENT,
  GuestInvitationRecord,
  RsvpResponseRecord,
  RsvpDraftInput,
  createDeterministicRsvpId,
  encodeMessageWithFoodVotes,
  decodeMessageAndFoodVotes,
  extractThemeFromInviteToken,
  DEFAULT_THEME_ID
} from './utils/rsvpLogic';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id' &&
    firebaseConfig.apiKey
);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'kshivanshu35@gmail.com';

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'events', 'main_wedding'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

function parseTimestampMillis(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val === 'number') {
    return val;
  }
  if (
    val &&
    typeof val === 'object' &&
    'seconds' in val &&
    typeof (val as { seconds: number }).seconds === 'number'
  ) {
    return (val as { seconds: number }).seconds * 1000;
  }
  return Date.now();
}

export async function fetchWeddingEventConfig(): Promise<{
  config: WeddingEventConfig;
  fromCloud: boolean;
}> {
  try {
    const snap = await getDoc(doc(db, 'events', 'main_wedding'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        config: {
          ...DEFAULT_WEDDING_EVENT,
          ...data,
          schedule:
            Array.isArray(data.schedule) && data.schedule.length > 0
              ? data.schedule
              : DEFAULT_WEDDING_EVENT.schedule,
          updatedAt: parseTimestampMillis(data.updatedAt)
        } as WeddingEventConfig,
        fromCloud: true
      };
    }
    return { config: DEFAULT_WEDDING_EVENT, fromCloud: false };
  } catch (error) {
    console.warn('Using default wedding event configuration:', error);
    return { config: DEFAULT_WEDDING_EVENT, fromCloud: false };
  }
}

export async function fetchInvitationByToken(
  inviteToken: string
): Promise<GuestInvitationRecord | null> {
  if (!inviteToken || inviteToken === 'public_link' || !/^[a-zA-Z0-9_\-]+$/.test(inviteToken)) {
    return null;
  }
  const path = `invitations/${inviteToken}`;
  try {
    const snap = await getDoc(doc(db, 'invitations', inviteToken));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      inviteToken: data.inviteToken,
      eventId: data.eventId,
      guestDisplayName: data.guestDisplayName,
      maxAllowedGuests: data.maxAllowedGuests,
      status: data.status,
      themeId: extractThemeFromInviteToken(data.inviteToken) || DEFAULT_THEME_ID,
      createdBy: data.createdBy,
      createdAt: parseTimestampMillis(data.createdAt),
      updatedAt: parseTimestampMillis(data.updatedAt)
    };
  } catch (error) {
    console.warn(`Could not fetch invitation token ${path}:`, error);
    return null;
  }
}

export async function submitGuestRsvpToFirestore(
  draft: RsvpDraftInput,
  inviteToken: string = 'public_link'
): Promise<RsvpResponseRecord> {
  const safeInviteToken =
    inviteToken && /^[a-zA-Z0-9_\-]+$/.test(inviteToken)
      ? inviteToken.slice(0, 64)
      : 'public_link';
  const rsvpId = createDeterministicRsvpId(draft.mobileNumber, safeInviteToken);
  const path = `rsvps/${rsvpId}`;

  const safeFoodVotes =
    draft.attendanceStatus === 'confirmed' && Array.isArray(draft.votedFoodItems)
      ? draft.votedFoodItems
      : [];

  const encodedMessage = encodeMessageWithFoodVotes(draft.messageToFamily || '', safeFoodVotes);
  const { cleanMessage } = decodeMessageAndFoodVotes(encodedMessage);

  const cleanPayload = {
    rsvpId,
    eventId: 'main_wedding',
    inviteToken: safeInviteToken,
    fullName: draft.fullName.trim().slice(0, 100),
    mobileNumber: draft.mobileNumber.trim().slice(0, 20),
    attendanceStatus: draft.attendanceStatus,
    attendeeCount: draft.attendanceStatus === 'confirmed' ? Math.floor(draft.attendeeCount) : 0,
    mealPreference: draft.attendanceStatus === 'confirmed' ? draft.mealPreference : 'none',
    messageToFamily: encodedMessage,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'rsvps', rsvpId), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  // If the guest opened a pending personal invitation token, update its status to match
  if (safeInviteToken !== 'public_link') {
    try {
      const invRef = doc(db, 'invitations', safeInviteToken);
      const invSnap = await getDoc(invRef);
      if (invSnap.exists() && invSnap.data().status === 'pending') {
        const invData = invSnap.data();
        await setDoc(invRef, {
          inviteToken: invData.inviteToken,
          eventId: invData.eventId,
          guestDisplayName: invData.guestDisplayName,
          maxAllowedGuests: invData.maxAllowedGuests,
          status: draft.attendanceStatus,
          createdBy: invData.createdBy,
          createdAt: invData.createdAt,
          updatedAt: serverTimestamp()
        });
      }
    } catch (invErr) {
      console.warn('Could not update invitation token status:', invErr);
    }
  }

  const now = Date.now();
  return {
    rsvpId,
    eventId: 'main_wedding',
    inviteToken: safeInviteToken,
    fullName: cleanPayload.fullName,
    mobileNumber: cleanPayload.mobileNumber,
    attendanceStatus: cleanPayload.attendanceStatus,
    attendeeCount: cleanPayload.attendeeCount,
    mealPreference: cleanPayload.mealPreference as RsvpResponseRecord['mealPreference'],
    votedFoodItems: safeFoodVotes,
    messageToFamily: cleanMessage,
    submittedAt: now,
    updatedAt: now
  };
}

export async function saveWeddingEventConfigToFirestore(
  config: WeddingEventConfig
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Admin authentication required to save wedding event configuration.');
  }
  const path = 'events/main_wedding';
  const payload = {
    eventId: 'main_wedding',
    coupleNames: config.coupleNames.trim().slice(0, 120),
    brideName: config.brideName.trim().slice(0, 60),
    groomName: config.groomName.trim().slice(0, 60),
    weddingDate: config.weddingDate.trim().slice(0, 40),
    dayOfWeek: config.dayOfWeek.trim().slice(0, 30),
    ceremonyTime: config.ceremonyTime.trim().slice(0, 40),
    venueName: config.venueName.trim().slice(0, 120),
    venueAddress: config.venueAddress.trim().slice(0, 250),
    city: config.city.trim().slice(0, 80),
    eventType: config.eventType.trim().slice(0, 80),
    mapUrl: (config.mapUrl || '').trim().slice(0, 500),
    coverSubtitle: config.coverSubtitle.trim().slice(0, 200),
    welcomeHeading: config.welcomeHeading.trim().slice(0, 120),
    welcomeMessage: config.welcomeMessage.trim().slice(0, 800),
    familyMessage: config.familyMessage.trim().slice(0, 400),
    familySignOff: config.familySignOff.trim().slice(0, 120),
    maxGuestsPerRsvp: Math.min(15, Math.max(1, Math.floor(config.maxGuestsPerRsvp || 6))),
    schedule: config.schedule.slice(0, 10).map((item) => ({
      time: item.time.trim().slice(0, 40),
      title: item.title.trim().slice(0, 100),
      description: item.description.trim().slice(0, 300)
    })),
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid
  };

  try {
    await setDoc(doc(db, 'events', 'main_wedding'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateRsvpInFirestore(
  existingRecord: RsvpResponseRecord,
  updatedFields: RsvpDraftInput
): Promise<void> {
  const path = `rsvps/${existingRecord.rsvpId}`;
  try {
    const snap = await getDoc(doc(db, 'rsvps', existingRecord.rsvpId));
    const originalSubmittedAt = snap.exists()
      ? snap.data().submittedAt
      : Timestamp.fromMillis(existingRecord.submittedAt);

    const safeVotes =
      updatedFields.attendanceStatus === 'confirmed'
        ? updatedFields.votedFoodItems ?? existingRecord.votedFoodItems ?? []
        : [];
    const encodedMessage = encodeMessageWithFoodVotes(
      updatedFields.messageToFamily || '',
      safeVotes
    );

    await setDoc(doc(db, 'rsvps', existingRecord.rsvpId), {
      rsvpId: existingRecord.rsvpId,
      eventId: 'main_wedding',
      inviteToken: existingRecord.inviteToken,
      fullName: updatedFields.fullName.trim().slice(0, 100),
      mobileNumber: updatedFields.mobileNumber.trim().slice(0, 20),
      attendanceStatus: updatedFields.attendanceStatus,
      attendeeCount:
        updatedFields.attendanceStatus === 'confirmed'
          ? Math.floor(updatedFields.attendeeCount)
          : 0,
      mealPreference:
        updatedFields.attendanceStatus === 'confirmed'
          ? updatedFields.mealPreference
          : 'none',
      messageToFamily: encodedMessage,
      submittedAt: originalSubmittedAt,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRsvpFromFirestore(rsvpId: string): Promise<void> {
  const path = `rsvps/${rsvpId}`;
  try {
    await deleteDoc(doc(db, 'rsvps', rsvpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createInvitationInFirestore(
  inviteToken: string,
  guestDisplayName: string,
  maxAllowedGuests: number
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Admin authentication required to create an invitation.');
  }
  const eventRef = doc(db, 'events', 'main_wedding');
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) {
    await saveWeddingEventConfigToFirestore(DEFAULT_WEDDING_EVENT);
  }

  const path = `invitations/${inviteToken}`;
  try {
    await setDoc(doc(db, 'invitations', inviteToken), {
      inviteToken,
      eventId: 'main_wedding',
      guestDisplayName: guestDisplayName.trim().slice(0, 100),
      maxAllowedGuests: Math.min(15, Math.max(1, Math.floor(maxAllowedGuests || 4))),
      status: 'pending',
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteInvitationFromFirestore(inviteToken: string): Promise<void> {
  const path = `invitations/${inviteToken}`;
  try {
    await deleteDoc(doc(db, 'invitations', inviteToken));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAdminFirestoreData(
  onRsvpsUpdate: (rsvps: RsvpResponseRecord[]) => void,
  onInvitationsUpdate: (invitations: GuestInvitationRecord[]) => void,
  onError: (errMessage: string) => void
): () => void {
  const rsvpsQuery = query(collection(db, 'rsvps'), where('eventId', '==', 'main_wedding'));
  const invitationsQuery = query(
    collection(db, 'invitations'),
    where('eventId', '==', 'main_wedding')
  );

  const unsubRsvps = onSnapshot(
    rsvpsQuery,
    (snapshot) => {
      const list: RsvpResponseRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const { cleanMessage, votedFoodItems } = decodeMessageAndFoodVotes(
          data.messageToFamily || ''
        );
        return {
          rsvpId: data.rsvpId,
          eventId: data.eventId,
          inviteToken: data.inviteToken,
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          attendanceStatus: data.attendanceStatus,
          attendeeCount: data.attendeeCount,
          mealPreference: data.mealPreference,
          votedFoodItems,
          messageToFamily: cleanMessage,
          submittedAt: parseTimestampMillis(data.submittedAt),
          updatedAt: parseTimestampMillis(data.updatedAt)
        };
      });
      onRsvpsUpdate(list);
    },
    (error) => {
      onError(error.message);
      try {
        handleFirestoreError(error, OperationType.LIST, 'rsvps');
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );

  const unsubInvitations = onSnapshot(
    invitationsQuery,
    (snapshot) => {
      const list: GuestInvitationRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          inviteToken: data.inviteToken,
          eventId: data.eventId,
          guestDisplayName: data.guestDisplayName,
          maxAllowedGuests: data.maxAllowedGuests,
          status: data.status,
          themeId: extractThemeFromInviteToken(data.inviteToken) || DEFAULT_THEME_ID,
          createdBy: data.createdBy,
          createdAt: parseTimestampMillis(data.createdAt),
          updatedAt: parseTimestampMillis(data.updatedAt)
        };
      });
      onInvitationsUpdate(list);
    },
    (error) => {
      onError(error.message);
      try {
        handleFirestoreError(error, OperationType.LIST, 'invitations');
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );

  return () => {
    unsubRsvps();
    unsubInvitations();
  };
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User };
