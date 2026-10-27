import React, { useState, useEffect, useCallback } from 'react';
import {
  FilePlus2,
  Shield,
  Sparkles,
  BookOpen,
  Calendar,
  MapPin,
  Send,
  HeartHandshake,
  Camera,
  PartyPopper,
  Utensils
} from 'lucide-react';
import {
  WeddingEventConfig,
  GuestInvitationRecord,
  RsvpResponseRecord,
  RsvpDraftInput,
  DEFAULT_WEDDING_EVENT,
  INITIAL_DEMO_INVITATIONS,
  INITIAL_DEMO_RSVPS,
  WEDDING_THEMES,
  DEFAULT_THEME_ID,
  WeddingThemeOption,
  createDeterministicRsvpId,
  generateInviteToken,
  extractThemeFromInviteToken
} from './utils/rsvpLogic';
import {
  auth,
  User,
  onAuthStateChanged,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isFirebaseConfigured,
  fetchWeddingEventConfig,
  fetchInvitationByToken,
  submitGuestRsvpToFirestore,
  saveWeddingEventConfigToFirestore,
  updateRsvpInFirestore,
  deleteRsvpFromFirestore,
  createInvitationInFirestore,
  deleteInvitationFromFirestore,
  subscribeToAdminFirestoreData,
  signInAdminWithGoogle,
  signOutAdmin
} from './firebase';
import { FloatingPetalsBackdrop, IGuestBrandLogo } from './components/WeddingMotifs';
import { InvitationFlow, InvitationStep } from './components/InvitationFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectGuideModal } from './components/ProjectGuideModal';

export default function App() {
  const [activeView, setActiveView] = useState<'guest' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'admin' || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'guest';
  });

  const [currentStep, setCurrentStep] = useState<InvitationStep>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 2;
      }
    }
    return 1;
  });

  const [inviteToken, setInviteToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('invite') || 'public_link';
    }
    return 'public_link';
  });

  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme && WEDDING_THEMES.some((t) => t.id === urlTheme)) {
        return urlTheme;
      }
      const urlInvite = params.get('invite');
      const tokenTheme = extractThemeFromInviteToken(urlInvite || undefined);
      if (tokenTheme) {
        return tokenTheme;
      }
      try {
        return window.localStorage.getItem('iguest_theme_id') || DEFAULT_THEME_ID;
      } catch {
        return DEFAULT_THEME_ID;
      }
    }
    return DEFAULT_THEME_ID;
  });

  const safeThemes = Array.isArray(WEDDING_THEMES) ? WEDDING_THEMES : [];
  const activeTheme: WeddingThemeOption =
    safeThemes.find((t) => t.id === activeThemeId) ||
    safeThemes[0] || {
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
    };

  // Sync CSS custom properties whenever activeTheme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--theme-bg', activeTheme.background);
      root.style.setProperty('--theme-surface', activeTheme.surfaceTint);
      root.style.setProperty('--theme-primary', activeTheme.primary);
      root.style.setProperty('--theme-secondary', activeTheme.secondary);
      root.style.setProperty('--theme-text', activeTheme.textDark);
      root.style.setProperty('--theme-muted', activeTheme.textMuted);
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('iguest_theme_id', activeTheme.id);
      } catch {
        // Ignore storage errors
      }
    }
  }, [activeTheme]);

  const [resetSignal, setResetSignal] = useState<number>(0);
  const [openNewInviteTrigger, setOpenNewInviteTrigger] = useState<number>(0);
  const [quickBannerMessage, setQuickBannerMessage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Wedding Event Configuration state
  const [eventConfig, setEventConfig] = useState<WeddingEventConfig>(DEFAULT_WEDDING_EVENT);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isFirebaseConfigured);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isVerifiedAdminUser = Boolean(
    currentUser &&
      currentUser.emailVerified &&
      currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL
  );

  // Cloud vs Demo Guest Lists
  const [cloudRsvps, setCloudRsvps] = useState<RsvpResponseRecord[]>([]);
  const [cloudInvitations, setCloudInvitations] = useState<GuestInvitationRecord[]>([]);
  const [demoRsvps, setDemoRsvps] = useState<RsvpResponseRecord[]>(INITIAL_DEMO_RSVPS);
  const [demoInvitations, setDemoInvitations] = useState<GuestInvitationRecord[]>(
    INITIAL_DEMO_INVITATIONS
  );
  const [personalInvitation, setPersonalInvitation] = useState<GuestInvitationRecord | null>(
    null
  );
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Track Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Load wedding event configuration from Cloud Firestore on boot
  useEffect(() => {
    let mounted = true;
    fetchWeddingEventConfig().then(({ config, fromCloud }) => {
      if (!mounted) return;
      if (fromCloud) {
        setEventConfig(config);
      }
      setIsCloudConnected(isFirebaseConfigured);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Resolve personal invitation token & apply its Admin-fixed theme colour
  useEffect(() => {
    let mounted = true;
    if (!inviteToken || inviteToken === 'public_link') {
      setPersonalInvitation(null);
      return;
    }

    const tokenTheme = extractThemeFromInviteToken(inviteToken);
    if (tokenTheme) {
      setActiveThemeId(tokenTheme);
    }

    const safeDemoInvites = Array.isArray(demoInvitations) ? demoInvitations : [];
    const safeCloudInvites = Array.isArray(cloudInvitations) ? cloudInvitations : [];
    const localMatch =
      safeDemoInvites.find((inv) => inv.inviteToken === inviteToken) ||
      safeCloudInvites.find((inv) => inv.inviteToken === inviteToken) ||
      null;

    if (localMatch) {
      setPersonalInvitation(localMatch);
      if (localMatch.themeId) {
        setActiveThemeId(localMatch.themeId);
      }
    }

    fetchInvitationByToken(inviteToken).then((cloudInv) => {
      if (!mounted) return;
      if (cloudInv) {
        setPersonalInvitation(cloudInv);
        if (cloudInv.themeId) {
          setActiveThemeId(cloudInv.themeId);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [inviteToken, demoInvitations, cloudInvitations]);

  // Attach real-time Firestore listeners when verified admin is signed in
  useEffect(() => {
    if (!isVerifiedAdminUser) return;
    setFirestoreError(null);
    const unsub = subscribeToAdminFirestoreData(
      (rsvps) => setCloudRsvps(rsvps),
      (invitations) => setCloudInvitations(invitations),
      (errMsg) => setFirestoreError(errMsg)
    );
    return () => unsub();
  }, [isVerifiedAdminUser]);

  const activeRsvps = isVerifiedAdminUser ? cloudRsvps : demoRsvps;
  const activeInvitations = isVerifiedAdminUser ? cloudInvitations : demoInvitations;

  // Trigger New Invitation action from header icon button
  const handleNewInvitationAction = () => {
    if (activeView === 'admin') {
      setOpenNewInviteTrigger((prev) => prev + 1);
    } else {
      setInviteToken('public_link');
      setPersonalInvitation(null);
      setCurrentStep(1);
      setResetSignal((prev) => prev + 1);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      setQuickBannerMessage(
        'Fresh wedding invitation ready! Only Host Admin can create custom links and fix theme colours.'
      );
      setTimeout(() => {
        setQuickBannerMessage(null);
      }, 3600);
    }
  };

  // Submit Guest RSVP (saves to Cloud Firestore AND updates local session state)
  const handleGuestRsvpSubmit = useCallback(
    async (draft: RsvpDraftInput): Promise<RsvpResponseRecord> => {
      let savedRecord: RsvpResponseRecord;
      const safeVotes =
        draft.attendanceStatus === 'confirmed' && Array.isArray(draft.votedFoodItems)
          ? draft.votedFoodItems
          : [];

      if (isFirebaseConfigured) {
        try {
          savedRecord = await submitGuestRsvpToFirestore(
            { ...draft, votedFoodItems: safeVotes },
            inviteToken
          );
          setIsCloudConnected(true);
        } catch (err) {
          console.warn('Cloud RSVP save fallback to demo session:', err);
          const now = Date.now();
          savedRecord = {
            rsvpId: createDeterministicRsvpId(draft.mobileNumber, inviteToken),
            eventId: 'main_wedding',
            inviteToken: inviteToken || 'public_link',
            fullName: draft.fullName.trim(),
            mobileNumber: draft.mobileNumber.trim(),
            attendanceStatus: draft.attendanceStatus,
            attendeeCount: draft.attendanceStatus === 'confirmed' ? draft.attendeeCount : 0,
            mealPreference: draft.attendanceStatus === 'confirmed' ? draft.mealPreference : 'none',
            votedFoodItems: safeVotes,
            messageToFamily: draft.messageToFamily.trim(),
            submittedAt: now,
            updatedAt: now
          };
        }
      } else {
        const now = Date.now();
        savedRecord = {
          rsvpId: createDeterministicRsvpId(draft.mobileNumber, inviteToken),
          eventId: 'main_wedding',
          inviteToken: inviteToken || 'public_link',
          fullName: draft.fullName.trim(),
          mobileNumber: draft.mobileNumber.trim(),
          attendanceStatus: draft.attendanceStatus,
          attendeeCount: draft.attendanceStatus === 'confirmed' ? draft.attendeeCount : 0,
          mealPreference: draft.attendanceStatus === 'confirmed' ? draft.mealPreference : 'none',
          votedFoodItems: safeVotes,
          messageToFamily: draft.messageToFamily.trim(),
          submittedAt: now,
          updatedAt: now
        };
      }

      setDemoRsvps((prev) => {
        const filtered = prev.filter((r) => r.rsvpId !== savedRecord.rsvpId);
        return [savedRecord, ...filtered];
      });

      if (inviteToken && inviteToken !== 'public_link') {
        setDemoInvitations((prev) =>
          prev.map((inv) =>
            inv.inviteToken === inviteToken
              ? { ...inv, status: draft.attendanceStatus, updatedAt: Date.now() }
              : inv
          )
        );
      }

      return savedRecord;
    },
    [inviteToken]
  );

  // Admin: Save Event Configuration
  const handleSaveEventConfig = async (newConfig: WeddingEventConfig) => {
    setEventConfig(newConfig);
    if (newConfig.themeId) {
      setActiveThemeId(newConfig.themeId);
    }
    if (isVerifiedAdminUser) {
      await saveWeddingEventConfigToFirestore(newConfig);
    }
  };

  // Admin: Update RSVP
  const handleUpdateRsvp = async (record: RsvpResponseRecord, updated: RsvpDraftInput) => {
    if (isVerifiedAdminUser) {
      await updateRsvpInFirestore(record, updated);
    }
    setDemoRsvps((prev) =>
      prev.map((item) =>
        item.rsvpId === record.rsvpId
          ? {
              ...item,
              fullName: updated.fullName.trim(),
              mobileNumber: updated.mobileNumber.trim(),
              attendanceStatus: updated.attendanceStatus,
              attendeeCount:
                updated.attendanceStatus === 'confirmed' ? updated.attendeeCount : 0,
              mealPreference:
                updated.attendanceStatus === 'confirmed' ? updated.mealPreference : 'none',
              votedFoodItems:
                updated.attendanceStatus === 'confirmed'
                  ? updated.votedFoodItems ?? item.votedFoodItems ?? []
                  : [],
              messageToFamily: updated.messageToFamily.trim(),
              updatedAt: Date.now()
            }
          : item
      )
    );
  };

  // Admin: Delete RSVP
  const handleDeleteRsvp = async (rsvpId: string) => {
    if (isVerifiedAdminUser) {
      await deleteRsvpFromFirestore(rsvpId);
    }
    setDemoRsvps((prev) => prev.filter((r) => r.rsvpId !== rsvpId));
  };

  // Admin: Create Personal Invitation Link with Admin-Fixed Theme Colour
  const handleCreateInvitation = async (
    guestDisplayName: string,
    maxAllowedGuests: number,
    themeId: string = activeTheme.id
  ): Promise<GuestInvitationRecord> => {
    const token = generateInviteToken(guestDisplayName, themeId);
    const now = Date.now();
    const newInvite: GuestInvitationRecord = {
      inviteToken: token,
      eventId: 'main_wedding',
      guestDisplayName: guestDisplayName.trim(),
      maxAllowedGuests,
      status: 'pending',
      themeId,
      createdBy: currentUser?.uid || 'demo_host',
      createdAt: now,
      updatedAt: now
    };

    if (isVerifiedAdminUser) {
      await createInvitationInFirestore(token, guestDisplayName, maxAllowedGuests);
    }
    setDemoInvitations((prev) => [newInvite, ...prev]);
    return newInvite;
  };

  // Admin: Delete Invitation
  const handleDeleteInvitation = async (token: string) => {
    if (isVerifiedAdminUser) {
      await deleteInvitationFromFirestore(token);
    }
    setDemoInvitations((prev) => prev.filter((i) => i.inviteToken !== token));
  };

  // Admin: Seed Cloud Demo Data
  const handleSeedCloudDemoData = async () => {
    if (!isVerifiedAdminUser) return;
    await saveWeddingEventConfigToFirestore(eventConfig);
    for (const inv of INITIAL_DEMO_INVITATIONS) {
      await createInvitationInFirestore(
        inv.inviteToken,
        inv.guestDisplayName,
        inv.maxAllowedGuests
      );
    }
    for (const rsvp of INITIAL_DEMO_RSVPS) {
      await submitGuestRsvpToFirestore(
        {
          fullName: rsvp.fullName,
          mobileNumber: rsvp.mobileNumber,
          attendanceStatus: rsvp.attendanceStatus,
          attendeeCount: rsvp.attendeeCount,
          mealPreference: rsvp.mealPreference,
          votedFoodItems: rsvp.votedFoodItems,
          messageToFamily: rsvp.messageToFamily
        },
        rsvp.inviteToken
      );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative transition-colors duration-500"
      style={{ backgroundColor: activeTheme.background, color: activeTheme.textDark }}
    >
      <FloatingPetalsBackdrop
        primaryColor={activeTheme.primary}
        secondaryColor={activeTheme.secondary}
      />

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header
        className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs"
        style={{ borderColor: `${activeTheme.primary}22` }}
      >
        {/* Zone 1: Aesthetic I-Guest Royal Emblem Logo */}
        <a
          href="#invitation"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('guest');
            setCurrentStep(1);
          }}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 group focus:outline-none"
          aria-label="I-Guest Home"
        >
          <IGuestBrandLogo
            primaryColor={activeTheme.primary}
            secondaryColor={activeTheme.secondary}
          />
        </a>

        {/* Zone 2: Concise single-line navigation links with icons */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-4 lg:gap-5 text-xs font-semibold"
          style={{ color: activeTheme.textMuted }}
        >
          <a
            href="#cover"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(1);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 1 ? activeTheme.primary : undefined
            }}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Cover</span>
          </a>
          <a
            href="#moments"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(2);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 2 ? activeTheme.primary : undefined
            }}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Moments</span>
          </a>
          <a
            href="#sangeet"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(3);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 3 ? activeTheme.primary : undefined
            }}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Sangeet</span>
          </a>
          <a
            href="#venue"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(4);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 4 ? activeTheme.primary : undefined
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Venue</span>
          </a>
          <a
            href="#feast"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(6);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 6 ? activeTheme.primary : undefined
            }}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Feast</span>
          </a>
          <a
            href="#rsvp"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('guest');
              setCurrentStep(7);
            }}
            className="inline-flex items-center gap-1.5 hover:opacity-100 opacity-85 hover:underline underline-offset-4 transition-all whitespace-nowrap shrink-0"
            style={{
              color: activeView === 'guest' && currentStep === 7 ? activeTheme.primary : undefined
            }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>RSVP &amp; Vote</span>
          </a>
        </nav>

        {/* Zone 3: Icon-Only Frosted Glass Action Buttons (New Invitation + Host Admin) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleNewInvitationAction}
            aria-label="New Invitation"
            title={
              activeView === 'admin'
                ? 'Create New Guest Invitation & Fix Theme'
                : 'New Invitation (Reset / Start Fresh)'
            }
            className="btn-glass min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer"
            style={{ color: activeTheme.primary }}
          >
            <FilePlus2 className="w-5 h-5" />
          </button>

          {activeView === 'guest' ? (
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              aria-label="Host Admin"
              title="Host Admin Dashboard"
              className="btn-glass-primary min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer"
            >
              <Shield className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('guest')}
              aria-label="Guest Invitation"
              title="Back to Guest Wedding Invitation"
              className="btn-glass-primary min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Subtle Toast Notification for New Invitation Action */}
      {quickBannerMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] px-4 py-3 rounded-2xl glass-card-surface shadow-lg flex items-center justify-between gap-3 text-xs font-medium animate-slide-up-fade">
          <span style={{ color: activeTheme.textDark }}>{quickBannerMessage}</span>
          <button
            type="button"
            onClick={() => {
              setQuickBannerMessage(null);
              setActiveView('admin');
              setOpenNewInviteTrigger((prev) => prev + 1);
            }}
            className="btn-glass-primary px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Admin Invite</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col justify-center">
        {activeView === 'guest' ? (
          <InvitationFlow
            eventConfig={eventConfig}
            personalInvitation={personalInvitation}
            inviteToken={inviteToken}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onSubmitRsvp={handleGuestRsvpSubmit}
            isCloudConnected={isCloudConnected}
            activeTheme={activeTheme}
            resetSignal={resetSignal}
          />
        ) : (
          <AdminDashboard
            currentUser={currentUser}
            isVerifiedAdminUser={isVerifiedAdminUser}
            onSignInGoogle={async () => {
              await signInAdminWithGoogle();
            }}
            onSignOut={signOutAdmin}
            eventConfig={eventConfig}
            rsvps={activeRsvps}
            invitations={activeInvitations}
            onSaveEventConfig={handleSaveEventConfig}
            onUpdateRsvp={handleUpdateRsvp}
            onDeleteRsvp={handleDeleteRsvp}
            onCreateInvitation={handleCreateInvitation}
            onDeleteInvitation={handleDeleteInvitation}
            onSeedCloudDemoData={handleSeedCloudDemoData}
            onPreviewInvitation={(token, themeId) => {
              if (token) setInviteToken(token);
              if (themeId) setActiveThemeId(themeId);
              setActiveView('guest');
              setCurrentStep(1);
            }}
            firestoreError={firestoreError}
            activeTheme={activeTheme}
            onSelectTheme={setActiveThemeId}
            openNewInviteTrigger={openNewInviteTrigger}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer
        className="relative z-10 py-5 px-4 sm:px-6 border-t text-xs"
        style={{
          borderColor: `${activeTheme.primary}18`,
          color: activeTheme.textMuted
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: activeTheme.textDark }}>
              I-Guest
            </span>
            <span aria-hidden="true">·</span>
            <span>Smart Wedding Guest &amp; RSVP Management</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="btn-glass px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              style={{ color: activeTheme.primary }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>B.Tech Project Guide &amp; Checklist</span>
            </button>
          </div>
        </div>
      </footer>

      <ProjectGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
