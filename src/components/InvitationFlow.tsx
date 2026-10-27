import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check,
  X,
  Plus,
  Minus,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Users,
  Phone,
  User,
  MessageSquareHeart,
  RotateCcw,
  Heart,
  Send,
  Camera,
  Music,
  Flame,
  Crown,
  PartyPopper,
  Vote
} from 'lucide-react';
import {
  WeddingEventConfig,
  GuestInvitationRecord,
  RsvpDraftInput,
  RsvpResponseRecord,
  WeddingThemeOption,
  WEDDING_FOOD_ITEMS,
  adjustGuestCount,
  normalizeRsvpForAttendanceChange,
  validateRsvpInput
} from '../utils/rsvpLogic';
import { MandalaCrest, FloralDivider } from './WeddingMotifs';

export type InvitationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface InvitationFlowProps {
  eventConfig: WeddingEventConfig;
  personalInvitation: GuestInvitationRecord | null;
  inviteToken: string;
  currentStep: InvitationStep;
  onStepChange: (step: InvitationStep) => void;
  onSubmitRsvp: (draft: RsvpDraftInput) => Promise<RsvpResponseRecord>;
  isCloudConnected: boolean;
  activeTheme: WeddingThemeOption;
  resetSignal?: number;
}

const STEP_META: { step: InvitationStep; label: string; subtitle: string }[] = [
  { step: 1, label: '01. Royal Cover', subtitle: 'Palace Welcome' },
  { step: 2, label: '02. Couple Moments', subtitle: 'Visual Story' },
  { step: 3, label: '03. Sangeet & Baraat', subtitle: 'Live Motion' },
  { step: 4, label: '04. Venue & Muhurtham', subtitle: 'Palace & Date' },
  { step: 5, label: '05. Ceremony Timeline', subtitle: '3 Grand Events' },
  { step: 6, label: '06. Royal Feast', subtitle: '6 Signature Dishes' },
  { step: 7, label: '07. RSVP & Food Poll', subtitle: 'Confirm & Vote' },
  { step: 8, label: '08. Royal Entry Pass', subtitle: 'VIP Summary' }
];

const COUPLE_MOMENT_CARDS = [
  {
    id: 'udaipur-sunset',
    title: 'Udaipur Palace Sunset',
    tag: 'Pre-Wedding Shoot',
    location: 'Lake Pichola, Udaipur',
    imageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    badge: 'Golden Hour'
  },
  {
    id: 'sacred-rings',
    title: 'Roka & Ring Exchange',
    tag: 'Sacred Promise',
    location: 'Rambagh Courtyard',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    badge: 'Blessed Moment'
  },
  {
    id: 'royal-walk',
    title: 'Heritage Jharokha Walk',
    tag: 'Royal Portrait',
    location: 'Amer Fort Archway',
    imageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    badge: 'Forever Begins'
  }
];

const CEREMONY_VISUAL_CARDS = [
  {
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    tag: 'Royal Swagat & Dhol'
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
    tag: 'Lotus Mandap Vows'
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    tag: 'Shahi Dastarkhwan'
  }
];

export const InvitationFlow: React.FC<InvitationFlowProps> = ({
  eventConfig,
  personalInvitation,
  currentStep,
  onStepChange,
  onSubmitRsvp,
  isCloudConnected,
  activeTheme,
  resetSignal
}) => {
  const maxGuests = personalInvitation
    ? personalInvitation.maxAllowedGuests
    : eventConfig.maxGuestsPerRsvp || 6;

  const [draft, setDraft] = useState<RsvpDraftInput>({
    fullName: personalInvitation?.guestDisplayName || '',
    mobileNumber: '',
    attendanceStatus: 'confirmed',
    attendeeCount: 2,
    mealPreference: 'vegetarian',
    votedFoodItems: ['paneer-tikka', 'hyderabadi-biryani', 'gulab-jamun-rabri'],
    messageToFamily: ''
  });

  const [spotlightPhotoIdx, setSpotlightPhotoIdx] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<RsvpResponseRecord | null>(null);

  // Pre-fill guest name if personal invitation loads
  useEffect(() => {
    if (personalInvitation?.guestDisplayName && !draft.fullName) {
      setDraft((prev) => ({
        ...prev,
        fullName: personalInvitation.guestDisplayName,
        attendeeCount: Math.min(prev.attendeeCount, personalInvitation.maxAllowedGuests)
      }));
    }
  }, [personalInvitation, draft.fullName]);

  // Reset form when New Invitation header button is clicked
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setDraft({
        fullName: '',
        mobileNumber: '',
        attendanceStatus: 'confirmed',
        attendeeCount: 2,
        mealPreference: 'vegetarian',
        votedFoodItems: ['paneer-tikka', 'hyderabadi-biryani', 'gulab-jamun-rabri'],
        messageToFamily: ''
      });
      setFieldErrors({});
      setSubmitError(null);
      setSubmittedRecord(null);
    }
  }, [resetSignal]);

  const handleAttendanceToggle = (status: 'confirmed' | 'declined') => {
    setDraft((prev) => normalizeRsvpForAttendanceChange(prev, status));
    setFieldErrors({});
  };

  const handleCountAdjust = (delta: number) => {
    setDraft((prev) => ({
      ...prev,
      attendeeCount: adjustGuestCount(prev.attendeeCount, delta, maxGuests)
    }));
  };

  const handleToggleFoodVote = (foodId: string) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.votedFoodItems) ? prev.votedFoodItems : [];
      const exists = current.includes(foodId);
      const next = exists ? current.filter((id) => id !== foodId) : [...current, foodId];
      return {
        ...prev,
        votedFoodItems: next
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateRsvpInput(draft, maxGuests);
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const saved = await onSubmitRsvp(draft);
      setSubmittedRecord(saved);
      onStepChange(8);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to save your RSVP right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const votedCount = Array.isArray(draft.votedFoodItems) ? draft.votedFoodItems.length : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Left Rail: 8-Page Invitation Progress & Host-Fixed Theme Badge */}
        <aside
          aria-label="Invitation Journey Steps"
          className="hidden lg:flex lg:col-span-4 flex-col justify-between glass-card-surface rounded-3xl p-6 sticky top-20"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#7A5C61] mb-4">
              <span className="uppercase tracking-widest font-semibold text-[#9E1B32]">
                Interactive Visual Invite
              </span>
              <span className="font-mono-tabular">Step {currentStep} of 8</span>
            </div>

            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#9E1B32]/15">
              <MandalaCrest
                className="w-11 h-11 shrink-0"
                primaryColor={activeTheme.primary}
                secondaryColor={activeTheme.secondary}
              />
              <div>
                <p
                  className="text-[11px] uppercase tracking-widest font-semibold"
                  style={{ color: activeTheme.primary }}
                >
                  Shubh Vivah Celebration
                </p>
                <h2 className="text-xl font-serif-display font-bold text-[#2B1419]">
                  {eventConfig.coupleNames}
                </h2>
                <p className="text-xs text-[#7A5C61]">
                  {eventConfig.weddingDate} · {eventConfig.city}
                </p>
              </div>
            </div>

            {/* 8 Step Navigation Buttons */}
            <nav aria-label="Invitation Screen Selector" className="space-y-1.5">
              {STEP_META.map((item) => {
                const isActive = currentStep === item.step;
                const isLocked = item.step === 8 && !submittedRecord;
                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onStepChange(item.step)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition-all flex items-center justify-between ${
                      isActive
                        ? 'btn-glass-primary text-white shadow-md'
                        : isLocked
                        ? 'opacity-40 cursor-not-allowed text-[#7A5C61]'
                        : 'hover:bg-white/90 text-[#2B1419] cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? 'text-white/85' : 'text-[#7A5C61]'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#7A5C61]'}`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Host-Locked Wedding Palette Indicator (Read-only for Guests) */}
            <div className="mt-4 pt-4 border-t border-[#9E1B32]/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shadow-xs border border-white"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.secondary})`
                  }}
                />
                <span className="text-[11px] font-semibold text-[#2B1419]">
                  {activeTheme.name.split('&')[0].trim()} Theme
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#9E1B32]/10 font-semibold text-[#9E1B32]">
                Fixed by Host
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#9E1B32]/15 flex items-center justify-between text-[11px] text-[#7A5C61]">
            <span>{isCloudConnected ? 'Live Cloud Firestore' : 'Demo Storage'}</span>
            <span>I-Guest Smart RSVP</span>
          </div>
        </aside>

        {/* Active Invitation Card — Mobile-First Glassmorphism Container */}
        <section
          aria-live="polite"
          className="lg:col-span-8 glass-card-surface rounded-3xl p-5 sm:p-8 relative overflow-hidden min-h-[560px] flex flex-col justify-between"
        >
          {/* Mobile Progress Indicator Bar */}
          <div className="flex lg:hidden items-center justify-between gap-2 mb-4 pb-3 border-b border-[#9E1B32]/15">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: activeTheme.primary }}
            >
              {STEP_META[currentStep - 1].label}
            </span>
            <div className="flex items-center gap-1" aria-label={`Step ${currentStep} of 8`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === currentStep ? 'w-5' : 'w-1.5 opacity-30'
                  }`}
                  style={{ backgroundColor: activeTheme.primary }}
                />
              ))}
            </div>
          </div>

          {/* SCREEN 1: ROYAL INVITATION COVER (Visual Arch + Animated Diyas) */}
          {currentStep === 1 && (
            <div className="my-auto text-center py-2 sm:py-4 flex flex-col items-center animate-slide-up-fade">
              {/* Visual Palace Arch Hero Card */}
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-xl border-2 border-white mb-5 group">
                <img
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80"
                  alt={`${eventConfig.coupleNames} Royal Wedding Cover`}
                  className="w-full h-56 sm:h-64 object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E0A0E]/90 via-[#1E0A0E]/35 to-transparent" />

                {/* Animated Floating Sparkles & Diya Glow Overlay */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/45 backdrop-blur-md border border-white/25 text-[11px] font-semibold text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span>Shubh Vivah · {eventConfig.city}</span>
                </div>

                <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-black/45 backdrop-blur-md border border-white/25 text-[11px] font-semibold text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>Live Invite</span>
                </div>

                <div className="absolute bottom-4 inset-x-4 text-white text-center">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300 font-semibold mb-1">
                    Together Forever
                  </p>
                  <h1 className="text-3xl sm:text-5xl font-serif-display font-bold tracking-tight drop-shadow-md">
                    {eventConfig.coupleNames}
                  </h1>
                </div>
              </div>

              {personalInvitation && (
                <div className="mb-3 px-4 py-1.5 rounded-xl bg-[#9E1B32]/10 border border-[#9E1B32]/25 text-xs font-semibold text-[#2B1419] animate-slide-up-fade stagger-1">
                  VIP Invite for: <span style={{ color: activeTheme.primary }}>{personalInvitation.guestDisplayName}</span>
                </div>
              )}

              {/* Visual Date & City Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5 animate-slide-up-fade stagger-2">
                <div className="glass-card-interactive px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#2B1419]">
                  <Calendar className="w-4 h-4" style={{ color: activeTheme.primary }} />
                  <span>
                    {eventConfig.dayOfWeek}, {eventConfig.weddingDate}
                  </span>
                </div>
                <div className="glass-card-interactive px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#2B1419]">
                  <MapPin className="w-4 h-4" style={{ color: activeTheme.primary }} />
                  <span>{eventConfig.city}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStepChange(2)}
                className="btn-glass-primary min-h-[50px] px-8 py-3.5 rounded-2xl font-semibold text-base shadow-lg cursor-pointer inline-flex items-center gap-2.5 animate-slide-up-fade stagger-3"
              >
                <Sparkles className="w-5 h-5" />
                <span>Open Visual Invitation</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* SCREEN 2: COUPLE VISUAL STORY & ANIMATED MOMENTS GALLERY (Zero Wall-of-Text) */}
          {currentStep === 2 && (
            <div className="my-auto py-1 flex flex-col justify-between">
              <div className="text-center mb-4 animate-slide-up-fade">
                <p
                  className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                  style={{ color: activeTheme.primary }}
                >
                  Captured Memories · Pre-Wedding Story
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                  {eventConfig.brideName} &amp; {eventConfig.groomName}&apos;s Royal Journey
                </h2>
              </div>

              {/* Main Spotlight Animated Cinema Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-white mb-4 h-56 sm:h-64 animate-slide-up-fade stagger-1">
                <img
                  src={COUPLE_MOMENT_CARDS[spotlightPhotoIdx].imageUrl}
                  alt={COUPLE_MOMENT_CARDS[spotlightPhotoIdx].title}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Animated Floating Hearts & Camera Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md text-xs font-bold text-[#2B1419] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" style={{ color: activeTheme.primary }} />
                  <span>{COUPLE_MOMENT_CARDS[spotlightPhotoIdx].badge}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-rose-300 animate-bounce">
                    <Heart className="w-4 h-4 fill-current" />
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                      {COUPLE_MOMENT_CARDS[spotlightPhotoIdx].tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif-display font-bold">
                      {COUPLE_MOMENT_CARDS[spotlightPhotoIdx].title}
                    </h3>
                  </div>
                  <span className="text-xs bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-300" />
                    {COUPLE_MOMENT_CARDS[spotlightPhotoIdx].location}
                  </span>
                </div>
              </div>

              {/* 3 Interactive Visual Polaroid Cards with Staggered Entry */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {COUPLE_MOMENT_CARDS.map((card, idx) => {
                  const selected = idx === spotlightPhotoIdx;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSpotlightPhotoIdx(idx)}
                      className={`glass-card-interactive rounded-2xl p-2 text-left cursor-pointer animate-slide-up-fade stagger-${
                        idx + 2
                      } ${selected ? 'ring-2 ring-[#9E1B32]' : ''}`}
                    >
                      <div className="relative h-20 sm:h-24 rounded-xl overflow-hidden mb-1.5">
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/15" />
                      </div>
                      <div className="text-[11px] font-bold text-[#2B1419] truncate">
                        {card.title}
                      </div>
                      <div className="text-[10px] text-[#7A5C61] truncate">{card.location}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(1)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Cover</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(3)}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Sangeet &amp; Baraat</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: SANGEET & BARAAT LIVE ANIMATED MOTION SHOWCASE (GIF-Style Visuals) */}
          {currentStep === 3 && (
            <div className="my-auto py-1 flex flex-col justify-between">
              <div className="text-center mb-4 animate-slide-up-fade">
                <p
                  className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                  style={{ color: activeTheme.primary }}
                >
                  Royal Festivities · Live Motion Showcase
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                  Dhol, Sangeet &amp; Starlit Baraat
                </h2>
              </div>

              {/* Animated Fireworks & Palace Night Sky Scene (GIF-Style Continuous Motion) */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#1A091E] via-[#3B122B] to-[#6E1831] p-5 text-white shadow-xl mb-4 animate-slide-up-fade stagger-1">
                {/* Animated Firework Bursts */}
                <svg
                  viewBox="0 0 400 130"
                  className="w-full h-28 sm:h-32 overflow-visible"
                  aria-label="Animated Wedding Fireworks and Royal Palace"
                >
                  {/* Firework 1 */}
                  <g className="animate-firework" style={{ transformOrigin: '80px 45px' }}>
                    <circle cx="80" cy="45" r="3" fill="#FFD700" />
                    <circle cx="80" cy="20" r="2.5" fill="#FFAD58" />
                    <circle cx="80" cy="70" r="2.5" fill="#FFAD58" />
                    <circle cx="55" cy="45" r="2.5" fill="#FFD700" />
                    <circle cx="105" cy="45" r="2.5" fill="#FFD700" />
                    <circle cx="62" cy="27" r="2" fill="#FF6B8B" />
                    <circle cx="98" cy="27" r="2" fill="#FF6B8B" />
                    <circle cx="62" cy="63" r="2" fill="#FF6B8B" />
                    <circle cx="98" cy="63" r="2" fill="#FF6B8B" />
                  </g>
                  {/* Firework 2 */}
                  <g className="animate-firework-delayed" style={{ transformOrigin: '315px 40px' }}>
                    <circle cx="315" cy="40" r="3" fill="#FFD700" />
                    <circle cx="315" cy="14" r="2.5" fill="#FFD700" />
                    <circle cx="315" cy="66" r="2.5" fill="#FFD700" />
                    <circle cx="289" cy="40" r="2.5" fill="#FFAD58" />
                    <circle cx="341" cy="40" r="2.5" fill="#FFAD58" />
                    <circle cx="297" cy="22" r="2" fill="#58D68D" />
                    <circle cx="333" cy="22" r="2" fill="#58D68D" />
                    <circle cx="297" cy="58" r="2" fill="#58D68D" />
                    <circle cx="333" cy="58" r="2" fill="#58D68D" />
                  </g>
                  {/* Jaipur Palace Silhouette */}
                  <path
                    d="M140 125 L140 85 L155 70 L170 85 L170 65 L200 40 L230 65 L230 85 L245 70 L260 85 L260 125 Z"
                    fill="rgba(212, 175, 55, 0.28)"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                  />
                  {/* Glowing Diya Lamps along Palace Courtyard */}
                  <circle cx="155" cy="118" r="3.5" fill="#FFD700" className="animate-ping" />
                  <circle cx="200" cy="118" r="4" fill="#FFAD58" className="animate-pulse" />
                  <circle cx="245" cy="118" r="3.5" fill="#FFD700" className="animate-ping" />
                </svg>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-300 animate-bounce" />
                    <span className="text-xs font-bold tracking-wide text-amber-200">
                      ROYAL SANGEET &amp; DHOL NIGHT
                    </span>
                  </div>
                  {/* Animated Soundwave Equalizer Bars */}
                  <div className="flex items-end gap-1 h-5" aria-hidden="true">
                    <span className="w-1 h-4 bg-amber-300 rounded-full animate-sound-wave" />
                    <span
                      className="w-1 h-5 bg-rose-400 rounded-full animate-sound-wave"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="w-1 h-3 bg-amber-200 rounded-full animate-sound-wave"
                      style={{ animationDelay: '0.3s' }}
                    />
                    <span
                      className="w-1 h-5 bg-amber-400 rounded-full animate-sound-wave"
                      style={{ animationDelay: '0.45s' }}
                    />
                    <span
                      className="w-1 h-3.5 bg-rose-300 rounded-full animate-sound-wave"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3 Visual Celebration Motion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="glass-card-interactive rounded-2xl p-3 animate-slide-up-fade stagger-2">
                  <div className="relative h-28 rounded-xl overflow-hidden mb-2">
                    <img
                      src="https://images.unsplash.com/photo-1545232972-907690a852b6?auto=format&fit=crop&w=600&q=80"
                      alt="Haldi Marigold Shower"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-bold">
                      11:00 AM
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2B1419]">Haldi Carnival</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  </div>
                </div>

                <div className="glass-card-interactive rounded-2xl p-3 animate-slide-up-fade stagger-3">
                  <div className="relative h-28 rounded-xl overflow-hidden mb-2">
                    <img
                      src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80"
                      alt="Royal Vintage Baraat"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[#9E1B32]/90 text-white text-[10px] font-bold">
                      5:30 PM
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2B1419]">Royal Baraat</span>
                    <Crown className="w-3.5 h-3.5 text-[#9E1B32] animate-bounce" />
                  </div>
                </div>

                <div className="glass-card-interactive rounded-2xl p-3 animate-slide-up-fade stagger-4">
                  <div className="relative h-28 rounded-xl overflow-hidden mb-2">
                    <img
                      src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80"
                      alt="Starlit Sangeet Gala"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-700/90 text-white text-[10px] font-bold">
                      8:30 PM
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2B1419]">Sangeet Gala</span>
                    <Music className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(2)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Moments</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(4)}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Palace Venue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: VENUE & MUHURTHAM (Staggered Slide-Up Fade-In Glassmorphism Cards) */}
          {currentStep === 4 && (
            <div className="my-auto py-1 flex flex-col justify-between">
              <div>
                <div className="text-center mb-4 animate-slide-up-fade">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                    style={{ color: activeTheme.primary }}
                  >
                    Royal Destination &amp; Timings
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                    {eventConfig.venueName}
                  </h2>
                </div>

                {/* Visual Venue Banner Card */}
                <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden mb-4 border border-white shadow-md animate-slide-up-fade stagger-1">
                  <img
                    src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80"
                    alt={eventConfig.venueName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent flex items-center p-5">
                    <div className="text-white max-w-xs">
                      <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                        {eventConfig.eventType}
                      </span>
                      <p className="text-lg font-serif-display font-bold mt-0.5">
                        {eventConfig.venueAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Staggered Slide-Up Fade-In Detail Glass Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  <div className="glass-card-interactive rounded-2xl p-4 flex items-center gap-3.5 animate-slide-up-fade stagger-2">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${activeTheme.primary}15`,
                        color: activeTheme.primary
                      }}
                    >
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-[#7A5C61]">
                        Wedding Date
                      </div>
                      <div className="text-sm font-bold text-[#2B1419]">
                        {eventConfig.weddingDate}
                      </div>
                      <div className="text-xs text-[#7A5C61]">{eventConfig.dayOfWeek}</div>
                    </div>
                  </div>

                  <div className="glass-card-interactive rounded-2xl p-4 flex items-center gap-3.5 animate-slide-up-fade stagger-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${activeTheme.primary}15`,
                        color: activeTheme.primary
                      }}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-[#7A5C61]">
                        Subh Muhurtham
                      </div>
                      <div className="text-sm font-bold text-[#2B1419]">
                        {eventConfig.ceremonyTime}
                      </div>
                      <div className="text-xs text-[#7A5C61]">Baraat &amp; Varmala</div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 glass-card-interactive rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 animate-slide-up-fade stagger-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${activeTheme.primary}15`,
                          color: activeTheme.primary
                        }}
                      >
                        <MapPin className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2B1419]">
                          {eventConfig.city}
                        </div>
                        <div className="text-[11px] text-[#7A5C61]">
                          Valet Parking &amp; Royal Courtyards Available
                        </div>
                      </div>
                    </div>
                    {eventConfig.mapUrl && (
                      <a
                        href={eventConfig.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glass px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                        style={{ color: activeTheme.primary }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(3)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sangeet</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(5)}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Timeline</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: CEREMONY TIMELINE (Staggered Slide-Up Fade-In Animated Timeline Items) */}
          {currentStep === 5 && (
            <div className="my-auto py-1 flex flex-col justify-between">
              <div>
                <div className="text-center mb-4 animate-slide-up-fade">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                    style={{ color: activeTheme.primary }}
                  >
                    Order of Celebrations
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                    Wedding Ceremony Timeline
                  </h2>
                </div>

                <div className="space-y-3.5 mb-5">
                  {eventConfig.schedule.map((item, idx) => {
                    const visual = CEREMONY_VISUAL_CARDS[idx % CEREMONY_VISUAL_CARDS.length];
                    return (
                      <div
                        key={`${item.time}-${idx}`}
                        className={`glass-card-interactive rounded-2xl p-3.5 flex items-center gap-4 animate-slide-up-fade stagger-${
                          idx + 1
                        }`}
                      >
                        <img
                          src={visual.imageUrl}
                          alt={item.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-white shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono-tabular font-bold text-white"
                              style={{ backgroundColor: activeTheme.primary }}
                            >
                              {item.time}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A5C61]">
                              {visual.tag}
                            </span>
                          </div>
                          <h3 className="text-base font-serif-display font-bold text-[#2B1419] truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[#7A5C61] line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(4)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Venue</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(6)}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Royal Feast Menu</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6: ROYAL FEAST SHOWCASE (6 Visual Signature Dishes with Animated Steam) */}
          {currentStep === 6 && (
            <div className="my-auto py-1 flex flex-col justify-between">
              <div>
                <div className="text-center mb-3 animate-slide-up-fade">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                    style={{ color: activeTheme.primary }}
                  >
                    Shahi Dastarkhwan · 6 Signature Delicacies
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                    Preview &amp; Tap to Pre-Vote Your Feast
                  </h2>
                </div>

                {/* 6 Visual Dish Cards with Animated Steam & Instant Vote Toggle */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {WEDDING_FOOD_ITEMS.map((dish, idx) => {
                    const isSelected = (draft.votedFoodItems || []).includes(dish.id);
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => handleToggleFoodVote(dish.id)}
                        className={`glass-card-interactive rounded-2xl p-2.5 text-left cursor-pointer relative overflow-hidden animate-slide-up-fade stagger-${
                          idx + 1
                        } ${isSelected ? 'ring-2 ring-[#9E1B32] bg-white/95' : ''}`}
                      >
                        <div className="relative h-24 rounded-xl overflow-hidden mb-2">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                          {/* Animated Steam Rising SVG */}
                          <svg
                            viewBox="0 0 40 24"
                            className="w-7 h-5 absolute bottom-1 left-2 text-white/80 animate-steam pointer-events-none"
                          >
                            <path
                              d="M10 20 Q6 12 12 6 T10 0 M20 22 Q16 14 22 8 T20 2 M30 20 Q26 12 32 6 T30 0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>

                          <span
                            className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${
                              dish.dietary === 'vegetarian' ? 'bg-emerald-700/90' : 'bg-rose-800/90'
                            }`}
                          >
                            {dish.dietary === 'vegetarian' ? 'VEG' : 'NON-VEG'}
                          </span>

                          <span
                            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#9E1B32] text-white scale-105 shadow-md'
                                : 'bg-white/80 text-[#7A5C61]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="text-xs font-bold text-[#2B1419] truncate">
                          {dish.shortName}
                        </div>
                        <div className="text-[10px] text-[#7A5C61] truncate">{dish.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(5)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(7)}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Vote className="w-4 h-4" />
                  <span>Confirm RSVP ({votedCount} Dishes Voted)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 7: INTERACTIVE GUEST RSVP & LIVE FOOD VOTING */}
          {currentStep === 7 && (
            <form onSubmit={handleFormSubmit} noValidate className="my-auto py-1 space-y-4">
              <div className="flex items-center justify-between animate-slide-up-fade">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] font-semibold"
                    style={{ color: activeTheme.primary }}
                  >
                    Step 7 · Attendance &amp; Feast Poll
                  </p>
                  <h2 className="text-2xl font-serif-display font-bold text-[#2B1419]">
                    Confirm Your RSVP
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#9E1B32]/10 text-xs font-bold text-[#9E1B32]">
                  {votedCount}/6 Dishes Voted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-slide-up-fade stagger-1">
                <div>
                  <label
                    htmlFor="rsvp-full-name"
                    className="block text-xs font-semibold text-[#2B1419] mb-1"
                  >
                    Guest / Family Full Name <span className="text-[#E45D52]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#7A5C61] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="rsvp-full-name"
                      type="text"
                      required
                      value={draft.fullName}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      placeholder="e.g. Rajesh & Sunita Sharma"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-white/90 border border-[#2B1419]/15 text-sm text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p role="alert" className="text-xs text-[#E45D52] mt-1 font-medium">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rsvp-mobile-number"
                    className="block text-xs font-semibold text-[#2B1419] mb-1"
                  >
                    Mobile Number (WhatsApp) <span className="text-[#E45D52]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#7A5C61] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="rsvp-mobile-number"
                      type="tel"
                      inputMode="tel"
                      required
                      value={draft.mobileNumber}
                      onChange={(e) => setDraft({ ...draft, mobileNumber: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-white/90 border border-[#2B1419]/15 text-sm text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>
                  {fieldErrors.mobileNumber && (
                    <p role="alert" className="text-xs text-[#E45D52] mt-1 font-medium">
                      {fieldErrors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Attendance Status Selector */}
              <div className="grid grid-cols-2 gap-3 animate-slide-up-fade stagger-2">
                <button
                  type="button"
                  onClick={() => handleAttendanceToggle('confirmed')}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    draft.attendanceStatus === 'confirmed'
                      ? 'bg-[#27845B] text-white border-[#27845B] shadow-sm'
                      : 'btn-glass text-[#2B1419]'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Joyfully Attending</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAttendanceToggle('declined')}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    draft.attendanceStatus === 'declined'
                      ? 'bg-[#E45D52] text-white border-[#E45D52] shadow-sm'
                      : 'btn-glass text-[#2B1419]'
                  }`}
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span>Regretfully Unable</span>
                </button>
              </div>

              {/* Conditional Guest Count, Meal Preference & 6-Item Food Poll */}
              {draft.attendanceStatus === 'confirmed' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-white/75 border border-[#9E1B32]/20 animate-slide-up-fade stagger-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="flex items-center justify-between gap-2 bg-white/90 px-3 py-2 rounded-xl border border-[#2B1419]/10">
                      <span className="text-xs font-semibold text-[#2B1419] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" style={{ color: activeTheme.primary }} />
                        Guests (Max {maxGuests})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Decrease guest count"
                          disabled={draft.attendeeCount <= 1}
                          onClick={() => handleCountAdjust(-1)}
                          className="w-8 h-8 rounded-lg btn-glass flex items-center justify-center text-[#2B1419] disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          aria-live="polite"
                          className="w-6 text-center text-base font-mono-tabular font-bold text-[#2B1419]"
                        >
                          {draft.attendeeCount}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase guest count"
                          disabled={draft.attendeeCount >= maxGuests}
                          onClick={() => handleCountAdjust(1)}
                          className="w-8 h-8 rounded-lg btn-glass flex items-center justify-center text-[#2B1419] disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, mealPreference: 'vegetarian' })}
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          draft.mealPreference === 'vegetarian'
                            ? 'btn-glass-primary text-white'
                            : 'btn-glass text-[#2B1419]'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Pure Veg</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, mealPreference: 'non-vegetarian' })}
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          draft.mealPreference === 'non-vegetarian'
                            ? 'btn-glass-primary text-white'
                            : 'btn-glass text-[#2B1419]'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>

                  {/* Vote 6 Signature Wedding Food Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#2B1419] flex items-center gap-1.5">
                        <Vote className="w-3.5 h-3.5" style={{ color: activeTheme.primary }} />
                        Vote Your Favorite Wedding Dishes (Tap to Select)
                      </span>
                      <span className="text-[11px] font-semibold text-[#7A5C61]">
                        Live Catering Poll
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {WEDDING_FOOD_ITEMS.map((food) => {
                        const isVoted = (draft.votedFoodItems || []).includes(food.id);
                        return (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => handleToggleFoodVote(food.id)}
                            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                              isVoted
                                ? 'bg-[#9E1B32]/10 border-[#9E1B32] shadow-xs'
                                : 'bg-white/80 border-[#2B1419]/10 hover:bg-white'
                            }`}
                          >
                            <img
                              src={food.imageUrl}
                              alt={food.shortName}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-[#2B1419] truncate">
                                {food.shortName}
                              </div>
                              <div className="text-[9px] text-[#7A5C61] truncate">
                                {food.badge}
                              </div>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isVoted
                                  ? 'bg-[#9E1B32] text-white'
                                  : 'border border-[#7A5C61]/40 text-transparent'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Short Blessing Input */}
              <div className="animate-slide-up-fade stagger-4">
                <div className="relative">
                  <MessageSquareHeart className="w-4 h-4 text-[#7A5C61] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="rsvp-message"
                    type="text"
                    value={draft.messageToFamily}
                    onChange={(e) => setDraft({ ...draft, messageToFamily: e.target.value })}
                    placeholder="Optional short blessing or arrival note..."
                    className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl bg-white/90 border border-[#2B1419]/15 text-xs text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
                  />
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#E45D52]/10 border border-[#E45D52]/30 text-xs text-[#E45D52] font-medium"
                >
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#9E1B32]/10">
                <button
                  type="button"
                  onClick={() => onStepChange(6)}
                  className="btn-glass min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Feast Menu</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-glass-primary min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit RSVP & Food Votes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 8: ROYAL ENTRY PASS & CONFIRMATION */}
          {currentStep === 8 && submittedRecord && (
            <div className="my-auto text-center py-4 flex flex-col items-center animate-slide-up-fade">
              <div className="w-16 h-16 rounded-full bg-[#27845B]/15 border-2 border-[#27845B] flex items-center justify-center text-[#27845B] mb-3 animate-check-pop">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>

              <p
                className="text-xs uppercase tracking-[0.2em] font-semibold mb-1"
                style={{ color: activeTheme.primary }}
              >
                Royal Wedding Pass Confirmed
              </p>
              <h2 className="text-3xl font-serif-display font-bold text-[#2B1419] mb-2">
                Dhanyawad, {submittedRecord.fullName}!
              </h2>

              <FloralDivider
                primaryColor={activeTheme.primary}
                secondaryColor={activeTheme.secondary}
              />

              {/* Summary Royal Pass Card */}
              <div className="w-full max-w-md rounded-2xl bg-white/90 border border-[#9E1B32]/25 p-5 text-left space-y-2.5 mb-5 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7A5C61]">Status</span>
                  <span
                    className={`font-bold uppercase px-2.5 py-0.5 rounded-md ${
                      submittedRecord.attendanceStatus === 'confirmed'
                        ? 'bg-[#27845B]/15 text-[#27845B]'
                        : 'bg-[#E45D52]/15 text-[#E45D52]'
                    }`}
                  >
                    {submittedRecord.attendanceStatus}
                  </span>
                </div>
                {submittedRecord.attendanceStatus === 'confirmed' && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7A5C61]">Confirmed Guests</span>
                      <span className="font-mono-tabular font-bold text-[#2B1419]">
                        {submittedRecord.attendeeCount}{' '}
                        {submittedRecord.attendeeCount === 1 ? 'Person' : 'People'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7A5C61]">Dietary Preference</span>
                      <span className="font-semibold capitalize text-[#2B1419]">
                        {submittedRecord.mealPreference}
                      </span>
                    </div>
                    {Array.isArray(submittedRecord.votedFoodItems) &&
                      submittedRecord.votedFoodItems.length > 0 && (
                        <div className="pt-2 border-t border-[#2B1419]/10">
                          <span className="text-[11px] text-[#7A5C61] block mb-1.5">
                            Your Voted Royal Feast Dishes:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {submittedRecord.votedFoodItems.map((id) => {
                              const dish = WEDDING_FOOD_ITEMS.find((f) => f.id === id);
                              return (
                                <span
                                  key={id}
                                  className="px-2 py-0.5 rounded-lg bg-[#9E1B32]/10 text-[#9E1B32] text-[10px] font-bold"
                                >
                                  {dish ? dish.shortName : id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onStepChange(7)}
                  className="btn-glass min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-[#2B1419] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit RSVP / Votes</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange(1)}
                  className="btn-glass-primary min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Back to Cover</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
