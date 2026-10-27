import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Utensils,
  Search,
  Download,
  Share2,
  Plus,
  Trash2,
  Edit3,
  LogIn,
  LogOut,
  Settings,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Database,
  QrCode,
  Printer,
  Palette,
  Lock,
  KeyRound,
  UserCheck,
  Eye,
  Save,
  X,
  PieChart,
  BarChart3,
  Crown,
  Vote
} from 'lucide-react';
import {
  WeddingEventConfig,
  GuestInvitationRecord,
  RsvpResponseRecord,
  RsvpDraftInput,
  WeddingThemeOption,
  WEDDING_THEMES,
  WEDDING_FOOD_ITEMS,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_ADMIN_PASSWORD,
  verifyAdminCredentials,
  calculateDashboardStats,
  calculateFoodVoteStats,
  calculatePartySizeBuckets,
  buildUnifiedGuestRows,
  generateGuestListCsv,
  buildWhatsAppShareUrl,
  buildPublicInvitationUrl,
  DEPLOYED_SHARED_APP_URL,
  UnifiedGuestRow
} from '../utils/rsvpLogic';
import { User } from '../firebase';
import { MandalaCrest } from './WeddingMotifs';

interface AdminDashboardProps {
  currentUser: User | null;
  isVerifiedAdminUser: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  eventConfig: WeddingEventConfig;
  rsvps: RsvpResponseRecord[];
  invitations: GuestInvitationRecord[];
  onSaveEventConfig: (newConfig: WeddingEventConfig) => Promise<void>;
  onUpdateRsvp: (record: RsvpResponseRecord, updated: RsvpDraftInput) => Promise<void>;
  onDeleteRsvp: (rsvpId: string) => Promise<void>;
  onCreateInvitation: (
    guestDisplayName: string,
    maxAllowedGuests: number,
    themeId: string
  ) => Promise<GuestInvitationRecord>;
  onDeleteInvitation: (inviteToken: string) => Promise<void>;
  onSeedCloudDemoData: () => Promise<void>;
  onPreviewInvitation: (inviteToken?: string, themeId?: string) => void;
  firestoreError: string | null;
  activeTheme: WeddingThemeOption;
  onSelectTheme: (themeId: string) => void;
  openNewInviteTrigger?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  isVerifiedAdminUser,
  onSignInGoogle,
  onSignOut,
  eventConfig,
  rsvps,
  invitations,
  onSaveEventConfig,
  onUpdateRsvp,
  onDeleteRsvp,
  onCreateInvitation,
  onDeleteInvitation,
  onSeedCloudDemoData,
  onPreviewInvitation,
  firestoreError,
  activeTheme,
  onSelectTheme,
  openNewInviteTrigger
}) => {
  // Password & Username Admin Authentication State
  const [adminUsername, setAdminUsername] = useState<string>(() => {
    try {
      return localStorage.getItem('iguest_admin_username') || DEFAULT_ADMIN_USERNAME;
    } catch {
      return DEFAULT_ADMIN_USERNAME;
    }
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('iguest_admin_password') || DEFAULT_ADMIN_PASSWORD;
    } catch {
      return DEFAULT_ADMIN_PASSWORD;
    }
  });
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('iguest_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [loginUserDraft, setLoginUserDraft] = useState('');
  const [loginPassDraft, setLoginPassDraft] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'guests' | 'analytics' | 'qr' | 'settings' | 'share'
  >('guests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'declined'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Share & Invite creation state (with Admin-Fixed Theme Selection)
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestMax, setNewGuestMax] = useState(4);
  const [newGuestThemeId, setNewGuestThemeId] = useState<string>(activeTheme.id);
  const [createdInvite, setCreatedInvite] = useState<GuestInvitationRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isQuickInviteModalOpen, setIsQuickInviteModalOpen] = useState(false);

  // QR Code Generator state
  const [qrTargetToken, setQrTargetToken] = useState<string>('public_link');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrStatusMsg, setQrStatusMsg] = useState<string | null>(null);

  // Edit RSVP Modal state
  const [editingRsvp, setEditingRsvp] = useState<RsvpResponseRecord | null>(null);
  const [editDraft, setEditDraft] = useState<RsvpDraftInput>({
    fullName: '',
    mobileNumber: '',
    attendanceStatus: 'confirmed',
    attendeeCount: 1,
    mealPreference: 'vegetarian',
    votedFoodItems: [],
    messageToFamily: ''
  });

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<{
    id: string;
    type: 'rsvp' | 'invitation';
    name: string;
  } | null>(null);

  // Event Config Form state
  const [configDraft, setConfigDraft] = useState<WeddingEventConfig>(eventConfig);
  const [newAdminUserDraft, setNewAdminUserDraft] = useState(adminUsername);
  const [newAdminPassDraft, setNewAdminPassDraft] = useState(adminPassword);
  const [configSaveStatus, setConfigSaveStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const stats = useMemo(() => calculateDashboardStats(rsvps, invitations), [rsvps, invitations]);
  const foodVoteStats = useMemo(() => calculateFoodVoteStats(rsvps), [rsvps]);
  const partySizeBuckets = useMemo(() => calculatePartySizeBuckets(rsvps), [rsvps]);

  const topVotedDish = useMemo(() => {
    const sorted = [...foodVoteStats].sort(
      (a, b) => b.voteCount - a.voteCount || b.headcountDemand - a.headcountDemand
    );
    return sorted[0] || null;
  }, [foodVoteStats]);

  const rows = useMemo(
    () =>
      buildUnifiedGuestRows(rsvps, invitations, {
        searchQuery,
        statusFilter,
        sortBy,
        sortDir
      }),
    [rsvps, invitations, searchQuery, statusFilter, sortBy, sortDir]
  );

  const publicShare = useMemo(
    () => buildWhatsAppShareUrl(DEPLOYED_SHARED_APP_URL, eventConfig.coupleNames, undefined, undefined, activeTheme.id),
    [eventConfig.coupleNames, activeTheme.id]
  );

  // Open Quick New Invitation Modal when header "New Invitation" icon button is triggered in Admin
  useEffect(() => {
    if (openNewInviteTrigger && openNewInviteTrigger > 0) {
      setIsPasswordAuthenticated(true);
      setNewGuestThemeId(activeTheme.id);
      setIsQuickInviteModalOpen(true);
    }
  }, [openNewInviteTrigger, activeTheme.id]);

  const selectedQrInvitation = useMemo(() => {
    if (qrTargetToken === 'public_link') return null;
    return invitations.find((i) => i.inviteToken === qrTargetToken) || null;
  }, [qrTargetToken, invitations]);

  // Generate QR code whenever target token or theme changes
  const activeQrUrl = useMemo(() => {
    const fixedTheme = selectedQrInvitation?.themeId || activeTheme.id;
    return buildPublicInvitationUrl(
      DEPLOYED_SHARED_APP_URL,
      qrTargetToken === 'public_link' ? undefined : qrTargetToken,
      fixedTheme
    );
  }, [qrTargetToken, selectedQrInvitation, activeTheme.id]);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(activeQrUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: activeTheme.primary,
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });
    return () => {
      mounted = false;
    };
  }, [activeQrUrl, activeTheme.primary]);

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(loginUserDraft, loginPassDraft, adminUsername, adminPassword)) {
      setIsPasswordAuthenticated(true);
      setLoginError(null);
      try {
        sessionStorage.setItem('iguest_admin_unlocked', 'true');
      } catch {
        // Ignore storage errors
      }
    } else {
      setLoginError('Invalid username or password. Default is admin / wedding2026');
    }
  };

  const handleLockAdmin = () => {
    setIsPasswordAuthenticated(false);
    try {
      sessionStorage.removeItem('iguest_admin_unlocked');
    } catch {
      // Ignore
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const handleExportCsv = () => {
    const csvContent = generateGuestListCsv(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `i-guest-rsvp-list-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const suffix = qrTargetToken === 'public_link' ? 'wedding-invite' : qrTargetToken;
    link.setAttribute('download', `i-guest-qr-${suffix}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setQrStatusMsg('QR Code PNG downloaded for printing!');
    setTimeout(() => setQrStatusMsg(null), 3000);
  };

  const handlePrintQrCard = () => {
    window.print();
  };

  const handleCreatePersonalInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    setIsCreatingInvite(true);
    try {
      const record = await onCreateInvitation(newGuestName.trim(), newGuestMax, newGuestThemeId);
      // Also apply the selected theme globally so the Admin sees the exact theme they fixed
      onSelectTheme(newGuestThemeId);
      setCreatedInvite(record);
      setQrTargetToken(record.inviteToken);
      setNewGuestName('');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const openEditModal = (row: UnifiedGuestRow) => {
    if (!row.rsvpRecord) return;
    setEditingRsvp(row.rsvpRecord);
    setEditDraft({
      fullName: row.rsvpRecord.fullName,
      mobileNumber: row.rsvpRecord.mobileNumber,
      attendanceStatus: row.rsvpRecord.attendanceStatus,
      attendeeCount:
        row.rsvpRecord.attendanceStatus === 'confirmed' ? row.rsvpRecord.attendeeCount : 1,
      mealPreference:
        row.rsvpRecord.attendanceStatus === 'confirmed'
          ? row.rsvpRecord.mealPreference
          : 'vegetarian',
      votedFoodItems: Array.isArray(row.rsvpRecord.votedFoodItems)
        ? row.rsvpRecord.votedFoodItems
        : [],
      messageToFamily: row.rsvpRecord.messageToFamily
    });
  };

  const handleSaveEditRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRsvp) return;
    await onUpdateRsvp(editingRsvp, editDraft);
    setEditingRsvp(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    if (confirmDeleteId.type === 'rsvp') {
      await onDeleteRsvp(confirmDeleteId.id);
    } else {
      await onDeleteInvitation(confirmDeleteId.id);
    }
    setConfirmDeleteId(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaveStatus('Saving changes...');
    try {
      if (newAdminUserDraft.trim() && newAdminPassDraft.trim()) {
        setAdminUsername(newAdminUserDraft.trim());
        setAdminPassword(newAdminPassDraft.trim());
        try {
          localStorage.setItem('iguest_admin_username', newAdminUserDraft.trim());
          localStorage.setItem('iguest_admin_password', newAdminPassDraft.trim());
        } catch {
          // Ignore storage error
        }
      }
      await onSaveEventConfig({ ...configDraft, themeId: activeTheme.id });
      setConfigSaveStatus('Wedding configuration, fixed theme & admin credentials saved!');
      setTimeout(() => setConfigSaveStatus(null), 3500);
    } catch (err) {
      setConfigSaveStatus(
        err instanceof Error ? err.message : 'Could not save settings.'
      );
    }
  };

  // Donut Chart SVG Helper
  const renderDonutSvg = (
    segments: { value: number; color: string; label: string }[],
    centerTop: string,
    centerValue: string | number,
    centerSub: string
  ) => {
    const total = Math.max(
      1,
      segments.reduce((acc, s) => acc + Math.max(0, s.value), 0)
    );
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let cumulativeFraction = 0;

    return (
      <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(43,20,25,0.07)"
            strokeWidth="16"
          />
          {segments.map((seg, i) => {
            if (seg.value <= 0) return null;
            const fraction = seg.value / total;
            const dashLength = fraction * circumference;
            const dashOffset = -cumulativeFraction * circumference;
            cumulativeFraction += fraction;
            return (
              <circle
                key={`${seg.label}-${i}`}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7A5C61]">
            {centerTop}
          </span>
          <span className="text-2xl font-mono-tabular font-bold text-[#2B1419]">
            {centerValue}
          </span>
          <span className="text-[10px] text-[#7A5C61]">{centerSub}</span>
        </div>
      </div>
    );
  };

  // ADMIN LOGIN GATE (Username & Password OR Verified Google Admin)
  if (!isPasswordAuthenticated && !isVerifiedAdminUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-10">
        <div className="glass-card-surface rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden animate-slide-up-fade">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.secondary})`
            }}
          >
            <Lock className="w-7 h-7" />
          </div>

          <p
            className="text-xs uppercase tracking-widest font-semibold mb-1"
            style={{ color: activeTheme.primary }}
          >
            Protected Wedding Host Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419] mb-2">
            Host Admin Sign In
          </h1>
          <p className="text-xs text-[#7A5C61] mb-6">
            Enter your host username &amp; password or sign in with Google to manage guest RSVPs,
            live food poll charts, fixed wedding themes, and printable QR cards.
          </p>

          <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="admin-login-username"
                className="block text-xs font-semibold text-[#2B1419] mb-1.5"
              >
                Admin Username
              </label>
              <input
                id="admin-login-username"
                type="text"
                required
                value={loginUserDraft}
                onChange={(e) => setLoginUserDraft(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white/90 border border-[#2B1419]/20 text-sm text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-semibold text-[#2B1419] mb-1.5"
              >
                Admin Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                required
                value={loginPassDraft}
                onChange={(e) => setLoginPassDraft(e.target.value)}
                placeholder="Enter password"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white/90 border border-[#2B1419]/20 text-sm text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#E45D52]/10 border border-[#E45D52]/30 text-xs text-[#E45D52] font-medium"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] btn-glass-primary rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Admin Dashboard</span>
            </button>
          </form>

          <div className="my-5 pt-4 border-t border-[#2B1419]/10 flex flex-col gap-2.5">
            <div className="p-3 rounded-xl bg-[#FFF5F6] border border-[#9E1B32]/20 text-xs text-[#2B1419] flex items-center justify-between gap-2">
              <div className="text-left">
                <div className="font-semibold">Demo Host Credentials</div>
                <div className="font-mono-tabular text-[11px] text-[#7A5C61]">
                  User: <strong>{adminUsername}</strong> · Pass: <strong>{adminPassword}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginUserDraft(adminUsername);
                  setLoginPassDraft(adminPassword);
                  setIsPasswordAuthenticated(true);
                  try {
                    sessionStorage.setItem('iguest_admin_unlocked', 'true');
                  } catch {
                    // Ignore
                  }
                }}
                className="btn-glass px-3 py-2 rounded-xl text-xs font-semibold text-[#9E1B32] cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Quick Unlock</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onSignInGoogle}
              className="w-full min-h-[44px] btn-glass rounded-xl text-xs font-semibold text-[#2B1419] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#9E1B32]" />
              <span>Sign in with Google ({ 'kshivanshu35@gmail.com' })</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Admin Status & Mode Banner */}
      <div className="glass-card-surface rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up-fade">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#7A5C61]">
              Host Admin Console
            </span>
            {isVerifiedAdminUser ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#27845B]/15 text-[#27845B] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27845B]" />
                Live Cloud Firestore ({currentUser?.email})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#9E1B32]/15 text-[#9E1B32] text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5" />
                Unlocked as Host ({adminUsername})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
            {eventConfig.coupleNames} — Guest, Feast &amp; QR Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5C61]">
            Fix wedding theme colours for invitations, analyze live food poll pie &amp; bar charts, and print QR cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Admin-Exclusive Global Wedding Theme Switcher */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 border border-[#9E1B32]/20"
            title="Admin Fixed Wedding Theme Colour"
          >
            <Palette className="w-4 h-4 text-[#9E1B32] mr-1" />
            {WEDDING_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Fix wedding theme ${t.name}`}
                title={`Fix Theme: ${t.name}`}
                onClick={() => onSelectTheme(t.id)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                  activeTheme.id === t.id ? 'scale-115 ring-2 ring-[#2B1419]' : 'opacity-75 hover:opacity-100'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                  borderColor: '#fff'
                }}
              />
            ))}
          </div>

          {/* Quick New Invitation Button with Icon */}
          <button
            type="button"
            onClick={() => {
              setNewGuestThemeId(activeTheme.id);
              setIsQuickInviteModalOpen(true);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl btn-glass-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Invite + Theme</span>
          </button>

          {!isVerifiedAdminUser ? (
            <button
              type="button"
              onClick={onSignInGoogle}
              title="Sign in with Google for Live Cloud Sync"
              className="min-h-[42px] px-3.5 py-2 rounded-xl btn-glass text-xs font-semibold text-[#2B1419] flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#9E1B32]" />
              <span>Cloud Sync</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isSeeding}
                onClick={async () => {
                  setIsSeeding(true);
                  try {
                    await onSeedCloudDemoData();
                  } finally {
                    setIsSeeding(false);
                  }
                }}
                title="Seed sample Indian wedding records to Cloud Firestore"
                className="min-h-[42px] px-3.5 py-2 rounded-xl btn-glass text-xs font-semibold text-[#9E1B32] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Syncing...' : 'Seed Data'}</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out Google"
                className="min-h-[42px] px-3 py-2 rounded-xl btn-glass text-xs font-semibold text-[#2B1419] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleLockAdmin}
            aria-label="Lock Admin Portal"
            title="Lock Admin Portal"
            className="min-h-[42px] px-3 py-2 rounded-xl btn-glass text-xs font-semibold text-[#7A5C61] hover:text-[#E45D52] flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {firestoreError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#E45D52]/10 border border-[#E45D52]/30 text-xs text-[#E45D52] flex items-center gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Cloud Firestore Notice: {firestoreError}</span>
        </div>
      )}

      {/* Summary Statistics Cards (7 Key Metrics) */}
      <section aria-label="Wedding Attendance and Catering Summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-serif-display font-bold text-[#2B1419]">
            Live Attendance &amp; Catering Summary
          </h2>
          <p className="text-xs text-[#7A5C61]">
            Note: <strong className="text-[#2B1419]">{stats.confirmedResponses} confirmed invitations</strong>{' '}
            represent <strong className="text-[#9E1B32]">{stats.totalConfirmedPeople} total attending people</strong>{' '}
            (including family members)
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-1">
            <div className="flex items-center justify-between text-xs text-[#7A5C61] mb-1">
              <span>Total Invites</span>
              <Users className="w-4 h-4 text-[#9E1B32]" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#2B1419]">
              {stats.totalInvitationsSent}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Invitation records</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-2">
            <div className="flex items-center justify-between text-xs text-[#27845B] font-medium mb-1">
              <span>Confirmed</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#27845B]">
              {stats.confirmedResponses}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Families attending</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-3">
            <div className="flex items-center justify-between text-xs text-[#E8A32B] font-medium mb-1">
              <span>Pending</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#E8A32B]">
              {stats.pendingResponses}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Awaiting reply</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-4">
            <div className="flex items-center justify-between text-xs text-[#E45D52] font-medium mb-1">
              <span>Declined</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#E45D52]">
              {stats.declinedResponses}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Unable to attend</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 ring-1 ring-[#9E1B32]/30 animate-slide-up-fade stagger-5">
            <div className="flex items-center justify-between text-xs text-[#9E1B32] font-semibold mb-1">
              <span>Total Headcount</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#2B1419]">
              {stats.totalConfirmedPeople}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Confirmed people</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-6">
            <div className="flex items-center justify-between text-xs text-[#27845B] font-medium mb-1">
              <span>Veg Meals</span>
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#2B1419]">
              {stats.vegetarianMeals}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Plates required</div>
          </div>

          <div className="glass-card-interactive rounded-2xl p-4 animate-slide-up-fade stagger-6">
            <div className="flex items-center justify-between text-xs text-[#9E1B32] font-medium mb-1">
              <span>Non-Veg Meals</span>
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#2B1419]">
              {stats.nonVegetarianMeals}
            </div>
            <div className="text-[11px] text-[#7A5C61] mt-0.5">Plates required</div>
          </div>
        </div>
      </section>

      {/* Dashboard Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B1419]/10 pb-3">
        <div
          role="tablist"
          aria-label="Admin Workspace Sections"
          className="flex flex-wrap items-center gap-2 bg-white/75 p-1.5 rounded-2xl border border-[#2B1419]/10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guests'}
            onClick={() => setActiveTab('guests')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guests'
                ? 'btn-glass-primary text-white'
                : 'text-[#7A5C61] hover:text-[#2B1419]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Guest List ({rows.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'btn-glass-primary text-white'
                : 'text-[#7A5C61] hover:text-[#2B1419]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Charts &amp; Food Poll</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'qr'}
            onClick={() => setActiveTab('qr')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'btn-glass-primary text-white'
                : 'text-[#7A5C61] hover:text-[#2B1419]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code &amp; Print Card</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'btn-glass-primary text-white'
                : 'text-[#7A5C61] hover:text-[#2B1419]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Event &amp; Admin Setup</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'share'}
            onClick={() => setActiveTab('share')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'btn-glass-primary text-white'
                : 'text-[#7A5C61] hover:text-[#2B1419]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Share</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onPreviewInvitation('public_link', activeTheme.id)}
          className="min-h-[40px] px-4 py-2 rounded-xl btn-glass text-xs font-semibold text-[#9E1B32] flex items-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Invitation</span>
        </button>
      </div>

      {/* TAB 1: GUEST LIST MANAGEMENT */}
      {activeTab === 'guests' && (
        <div className="glass-card-surface rounded-3xl p-5 sm:p-6 space-y-4 animate-slide-up-fade">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7A5C61] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search guest by name, phone, or note"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest by name, mobile number, or note..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white/90 border border-[#2B1419]/15 text-sm text-[#2B1419] focus:outline-none focus:border-[#9E1B32]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'confirmed', 'pending', 'declined'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#2B1419] text-white'
                      : 'btn-glass text-[#7A5C61] hover:text-[#2B1419]'
                  }`}
                >
                  {status}
                </button>
              ))}

              <select
                aria-label="Sort guest records"
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split('-') as ['date' | 'name', 'asc' | 'desc'];
                  setSortBy(by);
                  setSortDir(dir);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#2B1419]/15 text-xs font-semibold text-[#2B1419]"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
              </select>

              <button
                type="button"
                onClick={handleExportCsv}
                className="min-h-[40px] px-4 py-2 rounded-xl btn-glass text-xs font-semibold text-[#9E1B32] flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-[#FFF5F6]/60 border border-dashed border-[#2B1419]/15">
              <Users className="w-8 h-8 text-[#9E1B32] mx-auto mb-2 opacity-75" />
              <h3 className="text-base font-bold text-[#2B1419] mb-1">
                No Matching Guest Records
              </h3>
              <p className="text-xs text-[#7A5C61] max-w-md mx-auto">
                No guest responses match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2B1419]/10 text-[11px] uppercase tracking-wider text-[#7A5C61]">
                    <th className="py-3 px-3">Guest &amp; Theme</th>
                    <th className="py-3 px-3">Mobile</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Guests</th>
                    <th className="py-3 px-3">Meal &amp; Voted Dishes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B1419]/10 text-sm">
                  {rows.map((row) => {
                    const rowTheme =
                      WEDDING_THEMES.find((t) => t.id === row.themeId) || WEDDING_THEMES[0];
                    return (
                      <tr key={row.id} className="hover:bg-[#FFF5F6]/60 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#2B1419]">{row.guestName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{
                                background: `linear-gradient(135deg, ${rowTheme.primary}, ${rowTheme.secondary})`
                              }}
                            />
                            <span className="text-[10px] font-semibold text-[#7A5C61]">
                              {rowTheme.name.split('&')[0].trim()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular text-xs text-[#2B1419]">
                          {row.mobileNumber}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold capitalize ${
                              row.status === 'confirmed'
                                ? 'bg-[#27845B]/15 text-[#27845B]'
                                : row.status === 'pending'
                                ? 'bg-[#E8A32B]/20 text-[#966209]'
                                : 'bg-[#E45D52]/15 text-[#E45D52]'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono-tabular font-bold text-[#2B1419]">
                          {row.attendeeCount}
                        </td>
                        <td className="py-3.5 px-3 text-xs">
                          <div className="capitalize font-semibold text-[#2B1419] mb-1">
                            {row.mealPreference}
                          </div>
                          {row.votedFoodItems.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {row.votedFoodItems.map((fid) => {
                                const dish = WEDDING_FOOD_ITEMS.find((f) => f.id === fid);
                                return (
                                  <span
                                    key={fid}
                                    className="px-1.5 py-0.5 rounded bg-[#9E1B32]/10 text-[#9E1B32] text-[10px] font-semibold"
                                  >
                                    {dish ? dish.shortName : fid}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {row.recordType === 'invitation' && (
                              <>
                                <button
                                  type="button"
                                  title="Open QR Code for this invitation"
                                  aria-label={`QR Code for ${row.guestName}`}
                                  onClick={() => {
                                    setQrTargetToken(row.inviteToken);
                                    setActiveTab('qr');
                                  }}
                                  className="p-2 rounded-lg btn-glass text-[#9E1B32] cursor-pointer"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Preview Guest Invitation in Fixed Theme"
                                  aria-label={`Preview invitation for ${row.guestName}`}
                                  onClick={() => onPreviewInvitation(row.inviteToken, row.themeId)}
                                  className="p-2 rounded-lg btn-glass text-[#2B1419] cursor-pointer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {row.recordType === 'rsvp' && (
                              <button
                                type="button"
                                aria-label={`Edit RSVP for ${row.guestName}`}
                                title="Edit RSVP"
                                onClick={() => openEditModal(row)}
                                className="p-2 rounded-lg btn-glass text-[#2B1419] cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`Delete record for ${row.guestName}`}
                              title="Delete Record"
                              onClick={() =>
                                setConfirmDeleteId({
                                  id: row.id,
                                  type: row.recordType,
                                  name: row.guestName
                                })
                              }
                              className="p-2 rounded-lg btn-glass text-[#E45D52] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHARTS & LIVE FOOD POLL ANALYTICS (Pie Charts + Bar Graphs) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-slide-up-fade">
          {/* Top Row: Two Interactive Donut / Pie Charts + Party Size Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart 1: Attendance Status Breakdown */}
            <div className="glass-card-surface rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E1B32] flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5" />
                    Pie Chart 01
                  </span>
                  <span className="text-xs font-mono-tabular font-semibold text-[#7A5C61]">
                    {stats.totalInvitationsSent} Total
                  </span>
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#2B1419] mb-4">
                  RSVP Response Breakdown
                </h3>
              </div>

              {renderDonutSvg(
                [
                  {
                    value: stats.confirmedResponses,
                    color: '#27845B',
                    label: 'Confirmed'
                  },
                  {
                    value: stats.pendingResponses,
                    color: '#E8A32B',
                    label: 'Pending'
                  },
                  {
                    value: stats.declinedResponses,
                    color: '#E45D52',
                    label: 'Declined'
                  }
                ],
                'Confirmed',
                `${Math.round(
                  (stats.confirmedResponses / Math.max(1, stats.totalInvitationsSent)) * 100
                )}%`,
                `${stats.confirmedResponses} of ${stats.totalInvitationsSent} Families`
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#2B1419]/10 text-center">
                <div className="p-2 rounded-xl bg-[#27845B]/10">
                  <div className="text-xs font-bold text-[#27845B]">
                    {stats.confirmedResponses}
                  </div>
                  <div className="text-[10px] text-[#7A5C61]">Confirmed</div>
                </div>
                <div className="p-2 rounded-xl bg-[#E8A32B]/15">
                  <div className="text-xs font-bold text-[#966209]">{stats.pendingResponses}</div>
                  <div className="text-[10px] text-[#7A5C61]">Pending</div>
                </div>
                <div className="p-2 rounded-xl bg-[#E45D52]/10">
                  <div className="text-xs font-bold text-[#E45D52]">{stats.declinedResponses}</div>
                  <div className="text-[10px] text-[#7A5C61]">Declined</div>
                </div>
              </div>
            </div>

            {/* Pie Chart 2: Dietary Plate Ratio (Veg vs Non-Veg) */}
            <div className="glass-card-surface rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#16654E] flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5" />
                    Pie Chart 02
                  </span>
                  <span className="text-xs font-mono-tabular font-semibold text-[#7A5C61]">
                    {stats.totalConfirmedPeople} Plates
                  </span>
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#2B1419] mb-4">
                  Catering Dietary Split
                </h3>
              </div>

              {renderDonutSvg(
                [
                  {
                    value: stats.vegetarianMeals,
                    color: '#16654E',
                    label: 'Pure Veg'
                  },
                  {
                    value: stats.nonVegetarianMeals,
                    color: '#9E1B32',
                    label: 'Non-Veg'
                  }
                ],
                'Total Plates',
                stats.totalConfirmedPeople,
                'Confirmed Guests'
              )}

              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-[#2B1419]/10">
                <div className="p-2.5 rounded-xl bg-[#16654E]/10 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#16654E]">Pure Veg</div>
                    <div className="text-[10px] text-[#7A5C61]">
                      {Math.round(
                        (stats.vegetarianMeals / Math.max(1, stats.totalConfirmedPeople)) * 100
                      )}
                      % Share
                    </div>
                  </div>
                  <span className="text-base font-mono-tabular font-bold text-[#16654E]">
                    {stats.vegetarianMeals}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#9E1B32]/10 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#9E1B32]">Non-Veg</div>
                    <div className="text-[10px] text-[#7A5C61]">
                      {Math.round(
                        (stats.nonVegetarianMeals / Math.max(1, stats.totalConfirmedPeople)) * 100
                      )}
                      % Share
                    </div>
                  </div>
                  <span className="text-base font-mono-tabular font-bold text-[#9E1B32]">
                    {stats.nonVegetarianMeals}
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Graph 1: Family Party Size Distribution */}
            <div className="glass-card-surface rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E1B32] flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Bar Graph 01
                  </span>
                  <span className="text-xs font-semibold text-[#7A5C61]">Table Planning</span>
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#2B1419] mb-4">
                  Family Group Size Graph
                </h3>

                <div className="space-y-4 my-2">
                  {partySizeBuckets.map((bucket) => {
                    const maxFam = Math.max(
                      1,
                      ...partySizeBuckets.map((b) => b.totalGuests)
                    );
                    const widthPct = Math.max(12, Math.round((bucket.totalGuests / maxFam) * 100));
                    return (
                      <div key={bucket.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#2B1419]">
                            {bucket.label}{' '}
                            <span className="text-[#7A5C61] font-normal">({bucket.range})</span>
                          </span>
                          <span className="font-mono-tabular font-bold text-[#9E1B32]">
                            {bucket.familyCount} Families ({bucket.totalGuests} Guests)
                          </span>
                        </div>
                        <div className="h-3.5 w-full rounded-full bg-[#2B1419]/8 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: bucket.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {topVotedDish && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#9E1B32]/10 to-[#D4AF37]/15 border border-[#9E1B32]/20 flex items-center gap-3">
                  <img
                    src={topVotedDish.imageUrl}
                    alt={topVotedDish.shortName}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E1B32] flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      #1 Most Voted Wedding Dish
                    </div>
                    <div className="text-sm font-bold text-[#2B1419] truncate">
                      {topVotedDish.name}
                    </div>
                    <div className="text-[11px] text-[#7A5C61]">
                      Voted by {topVotedDish.percentageOfVoters}% of families ({topVotedDish.headcountDemand} plates)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Full-Width Bar Graph for 6 Signature Wedding Food Items */}
          <div className="glass-card-surface rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9E1B32] mb-1">
                  <Vote className="w-4 h-4" />
                  <span>Live Guest Food Poll Bar Graph (6 Signature Dishes)</span>
                </div>
                <h3 className="text-2xl font-serif-display font-bold text-[#2B1419]">
                  Shahi Dastarkhwan Dish Popularity &amp; Plate Demand
                </h3>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-[#FFF5F6] border border-[#9E1B32]/20 text-xs font-semibold text-[#2B1419]">
                Guests vote directly during RSVP Step 6 &amp; Step 7
              </div>
            </div>

            {/* Vertical Column Bar Chart for 6 Dishes */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 items-end pt-6 pb-4 px-3 rounded-2xl bg-white/75 border border-[#2B1419]/10 mb-6">
              {foodVoteStats.map((dish) => {
                const maxDemand = Math.max(
                  1,
                  ...foodVoteStats.map((d) => d.headcountDemand)
                );
                const barHeightPx = Math.max(
                  28,
                  Math.round((dish.headcountDemand / maxDemand) * 150)
                );
                const isTop = topVotedDish?.foodId === dish.foodId && dish.voteCount > 0;
                return (
                  <div
                    key={dish.foodId}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="text-xs font-mono-tabular font-bold text-[#2B1419] mb-1">
                      {dish.headcountDemand} plates
                    </div>
                    <div className="text-[10px] font-semibold text-[#7A5C61] mb-2">
                      ({dish.voteCount} votes · {dish.percentageOfVoters}%)
                    </div>

                    <div className="w-full max-w-[64px] h-[155px] bg-[#2B1419]/5 rounded-2xl flex items-end justify-center p-1 overflow-hidden">
                      <div
                        className="w-full rounded-xl transition-all duration-700 relative flex items-start justify-center pt-1.5 shadow-sm"
                        style={{
                          height: `${barHeightPx}px`,
                          background: `linear-gradient(180deg, ${dish.color}, ${activeTheme.primary})`
                        }}
                      >
                        {isTop && <Crown className="w-4 h-4 text-amber-200 animate-bounce" />}
                      </div>
                    </div>

                    <img
                      src={dish.imageUrl}
                      alt={dish.shortName}
                      className="w-10 h-10 rounded-xl object-cover -mt-3 z-10 border-2 border-white shadow-md mb-1.5"
                    />
                    <div className="text-xs font-bold text-[#2B1419] line-clamp-1">
                      {dish.shortName}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        dish.dietary === 'vegetarian'
                          ? 'bg-emerald-700/15 text-emerald-800'
                          : 'bg-rose-800/15 text-rose-800'
                      }`}
                    >
                      {dish.dietary === 'vegetarian' ? 'VEG' : 'NON-VEG'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detailed Horizontal Progress Bar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodVoteStats.map((dish) => (
                <div
                  key={`horiz-${dish.foodId}`}
                  className="p-3.5 rounded-2xl bg-white/85 border border-[#2B1419]/10 flex items-center gap-3.5"
                >
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-white shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#2B1419] truncate">
                        {dish.name}
                      </span>
                      <span className="text-xs font-mono-tabular font-bold text-[#9E1B32] shrink-0">
                        {dish.percentageOfVoters}% ({dish.voteCount} families)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#2B1419]/10 overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(8, dish.percentageOfVoters)}%`,
                          backgroundColor: dish.color
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#7A5C61]">
                      <span>{dish.category}</span>
                      <span className="font-semibold text-[#2B1419]">
                        Est. Catering Demand: {dish.headcountDemand} servings
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QR CODE GENERATOR & PRINTABLE PHYSICAL CARD INSERT */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up-fade">
          <div className="lg:col-span-5 glass-card-surface rounded-3xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E1B32] mb-1">
                <QrCode className="w-4 h-4" />
                <span>Print-Ready Wedding Card QR Studio</span>
              </div>
              <h2 className="text-2xl font-serif-display font-bold text-[#2B1419]">
                Invitation QR Code Generator
              </h2>
              <p className="text-xs text-[#7A5C61] mt-1">
                Generate a high-resolution QR code with your fixed wedding theme colour for physical
                wedding invitation cards.
              </p>
            </div>

            <div>
              <label
                htmlFor="qr-target-select"
                className="block text-xs font-semibold text-[#2B1419] mb-1.5"
              >
                Choose Invitation Link for QR Code
              </label>
              <select
                id="qr-target-select"
                value={qrTargetToken}
                onChange={(e) => setQrTargetToken(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white border border-[#2B1419]/20 text-xs font-semibold text-[#2B1419]"
              >
                <option value="public_link">
                  General Public Invitation URL (Recommended for Bulk Printed Cards)
                </option>
                {invitations.map((inv) => (
                  <option key={inv.inviteToken} value={inv.inviteToken}>
                    VIP Personal Card: {inv.guestDisplayName} ({inv.inviteToken})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#2B1419] mb-1.5">
                Encoded Destination URL (Includes Fixed Theme)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeQrUrl}
                  aria-label="QR Code Destination URL"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white/90 border border-[#2B1419]/15 text-xs font-mono-tabular text-[#2B1419]"
                />
                <button
                  type="button"
                  onClick={() => handleCopyText(activeQrUrl, 'qr-url')}
                  aria-label="Copy QR URL"
                  title="Copy URL"
                  className="min-h-[42px] px-3.5 py-2 rounded-xl btn-glass text-xs font-semibold text-[#2B1419] flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedId === 'qr-url' ? (
                    <Check className="w-4 h-4 text-[#27845B]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {qrStatusMsg && (
              <div className="p-3 rounded-xl bg-[#27845B]/15 text-[#27845B] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{qrStatusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadQrImage}
                className="min-h-[48px] px-4 py-3 rounded-2xl btn-glass-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download QR PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintQrCard}
                className="min-h-[48px] px-4 py-3 rounded-2xl btn-glass text-xs font-semibold text-[#2B1419] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#9E1B32]" />
                <span>Print Physical QR Card</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex items-center justify-center">
            <div
              id="printable-qr-card"
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-xl text-center relative overflow-hidden"
              style={{ borderColor: activeTheme.secondary }}
            >
              <div
                className="rounded-2xl p-5 border"
                style={{
                  borderColor: `${activeTheme.primary}30`,
                  backgroundColor: activeTheme.surfaceTint
                }}
              >
                <div className="flex justify-center mb-2">
                  <MandalaCrest
                    className="w-12 h-12"
                    primaryColor={activeTheme.primary}
                    secondaryColor={activeTheme.secondary}
                  />
                </div>

                <p
                  className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-1"
                  style={{ color: activeTheme.primary }}
                >
                  Shubh Vivah RSVP Insert
                </p>
                <h3 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#2B1419]">
                  {eventConfig.coupleNames}
                </h3>
                <p className="text-xs text-[#7A5C61] mt-0.5 mb-3">
                  {eventConfig.dayOfWeek}, {eventConfig.weddingDate} · {eventConfig.city}
                </p>

                {selectedQrInvitation && (
                  <div className="mb-3 px-3 py-1 rounded-lg bg-white/90 border border-[#9E1B32]/20 text-xs font-semibold text-[#9E1B32] inline-block">
                    Reserved for: {selectedQrInvitation.guestDisplayName}
                  </div>
                )}

                <div
                  className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-md border-2 flex items-center justify-center mb-3"
                  style={{ borderColor: activeTheme.primary }}
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Wedding Invitation QR Code for ${eventConfig.coupleNames}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-[#7A5C61]">Generating QR...</div>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#2B1419] mb-1">
                  Scan to View Animated Invitation, Vote Feast Menu &amp; Confirm RSVP
                </p>
                <p className="text-[11px] text-[#7A5C61]">
                  Open your phone camera and point it at the QR code above
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEDDING EVENT DETAILS & ADMIN CREDENTIALS SETUP */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="glass-card-surface rounded-3xl p-5 sm:p-6 space-y-5 animate-slide-up-fade"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B1419]/10 pb-4">
            <div>
              <h2 className="text-xl font-serif-display font-bold text-[#2B1419]">
                Customize Wedding Details, Fixed Theme &amp; Host Credentials
              </h2>
              <p className="text-xs text-[#7A5C61]">
                Only the Admin can fix the default wedding theme colour and configure host login credentials.
              </p>
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl btn-glass-primary text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save All Configuration</span>
            </button>
          </div>

          {configSaveStatus && (
            <div className="p-3 rounded-xl bg-[#27845B]/15 text-[#27845B] text-xs font-semibold">
              {configSaveStatus}
            </div>
          )}

          {/* Admin-Exclusive Fixed Wedding Theme Colour Selector */}
          <div className="p-4 rounded-2xl bg-white/80 border border-[#9E1B32]/20">
            <h3 className="text-sm font-bold text-[#2B1419] mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#9E1B32]" />
              <span>Admin-Fixed Default Wedding Theme Colour</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {WEDDING_THEMES.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-white ring-2 ring-[#9E1B32] border-[#9E1B32] shadow-sm'
                        : 'bg-white/60 border-[#2B1419]/10 hover:bg-white'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full shrink-0 border border-white shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2B1419] truncate">{theme.name}</div>
                      <div className="text-[10px] text-[#7A5C61] truncate">{theme.tagline}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Host Admin Username & Password Settings */}
          <div className="p-4 rounded-2xl bg-[#FFF5F6] border border-[#9E1B32]/20">
            <h3 className="text-sm font-bold text-[#2B1419] mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#9E1B32]" />
              <span>Host Admin Login Credentials (Username &amp; Password)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={newAdminUserDraft}
                  onChange={(e) => setNewAdminUserDraft(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                  Admin Password
                </label>
                <input
                  type="text"
                  value={newAdminPassDraft}
                  onChange={(e) => setNewAdminPassDraft(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm font-mono-tabular"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                Couple Display Names
              </label>
              <input
                type="text"
                value={configDraft.coupleNames}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, coupleNames: e.target.value })
                }
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                Wedding Date
              </label>
              <input
                type="text"
                value={configDraft.weddingDate}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, weddingDate: e.target.value })
                }
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                Ceremony Time
              </label>
              <input
                type="text"
                value={configDraft.ceremonyTime}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, ceremonyTime: e.target.value })
                }
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={configDraft.venueName}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, venueName: e.target.value })
                }
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                City &amp; State
              </label>
              <input
                type="text"
                value={configDraft.city}
                onChange={(e) => setConfigDraft({ ...configDraft, city: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 5: WHATSAPP INVITATION LINK & PERSONAL INVITE GENERATOR (WITH FIXED THEME) */}
      {activeTab === 'share' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-fade">
          <div className="glass-card-surface rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E1B32]">
              <Share2 className="w-4 h-4" />
              <span>Public Wedding Link</span>
            </div>
            <h2 className="text-xl font-serif-display font-bold text-[#2B1419]">
              Share General Invitation on WhatsApp
            </h2>

            <div className="p-3.5 rounded-2xl bg-[#FFF5F6] border border-[#9E1B32]/20 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A5C61]">
                Deployed Invitation URL (Theme: {activeTheme.name.split('&')[0].trim()})
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicShare.invitationUrl}
                  aria-label="Public Invitation URL"
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#2B1419]/15 text-xs font-mono-tabular text-[#2B1419]"
                />
                <button
                  type="button"
                  onClick={() => handleCopyText(publicShare.invitationUrl, 'public-url')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-glass text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedId === 'public-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#27845B]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={publicShare.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#27845B] text-white text-xs font-semibold hover:bg-[#1f6b49] transition-colors inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Personal Guest Invite Token Generator with Admin-Fixed Theme */}
          <div className="glass-card-surface rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E1B32]">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Family Link + Fixed Theme</span>
            </div>
            <h2 className="text-xl font-serif-display font-bold text-[#2B1419]">
              Create Personal Guest Invitation
            </h2>

            <form onSubmit={handleCreatePersonalInvite} className="space-y-3.5">
              <div>
                <label
                  htmlFor="invite-guest-name"
                  className="block text-xs font-semibold text-[#2B1419] mb-1"
                >
                  Guest or Family Name
                </label>
                <input
                  id="invite-guest-name"
                  type="text"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="e.g. Sharma Family / Dr. Priya Nair"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-max-guests"
                  className="block text-xs font-semibold text-[#2B1419] mb-1"
                >
                  Maximum Allowed Guests
                </label>
                <input
                  id="invite-max-guests"
                  type="number"
                  min={1}
                  max={15}
                  value={newGuestMax}
                  onChange={(e) => setNewGuestMax(Number(e.target.value) || 4)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/15 text-sm font-mono-tabular"
                />
              </div>

              {/* Admin-Exclusive Theme Selector while Inviting */}
              <div>
                <span className="block text-xs font-semibold text-[#2B1419] mb-1.5">
                  Fix Wedding Theme Colour for this Guest Invitation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {WEDDING_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewGuestThemeId(t.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                        newGuestThemeId === t.id
                          ? 'bg-white ring-2 ring-[#9E1B32] border-[#9E1B32]'
                          : 'bg-white/60 border-[#2B1419]/10'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                        }}
                      />
                      <span className="text-[11px] font-bold text-[#2B1419] truncate">
                        {t.name.split('&')[0].trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingInvite}
                className="min-h-[44px] px-5 py-2.5 rounded-xl btn-glass-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isCreatingInvite ? 'Generating...' : 'Generate Personal Invite & Lock Theme'}
                </span>
              </button>
            </form>

            {createdInvite && (
              <div className="p-4 rounded-2xl bg-[#27845B]/10 border border-[#27845B]/30 space-y-2.5">
                <div className="text-xs font-bold text-[#27845B]">
                  Created Invite for {createdInvite.guestDisplayName}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewInvitation(createdInvite.inviteToken, createdInvite.themeId)
                    }
                    className="px-3 py-1.5 rounded-xl btn-glass-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Invite</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrTargetToken(createdInvite.inviteToken);
                      setActiveTab('qr');
                    }}
                    className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold text-[#9E1B32] flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Card</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK CREATE NEW INVITATION MODAL (Triggered by Header Icon Button or "New Invite + Theme") */}
      {isQuickInviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-invite-modal-title"
          className="fixed inset-0 z-50 bg-[#2B1419]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="glass-card-surface rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9E1B32]" />
                <h3
                  id="quick-invite-modal-title"
                  className="text-xl font-serif-display font-bold text-[#2B1419]"
                >
                  New Guest Invitation &amp; Fixed Theme
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsQuickInviteModalOpen(false)}
                className="p-2 rounded-xl btn-glass text-[#7A5C61] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                await handleCreatePersonalInvite(e);
                setIsQuickInviteModalOpen(false);
                setActiveTab('qr');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                  Guest / Family Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="e.g. Kapoor Family & Friends"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                  Maximum Allowed Guests
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={newGuestMax}
                  onChange={(e) => setNewGuestMax(Number(e.target.value) || 4)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#2B1419]/20 text-sm font-mono-tabular"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#2B1419] mb-1.5">
                  Admin Fixed Wedding Theme Colour
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {WEDDING_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewGuestThemeId(t.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                        newGuestThemeId === t.id
                          ? 'bg-white ring-2 ring-[#9E1B32] border-[#9E1B32]'
                          : 'bg-white/60 border-[#2B1419]/10'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                        }}
                      />
                      <span className="text-xs font-bold text-[#2B1419] truncate">
                        {t.name.split('&')[0].trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickInviteModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl btn-glass text-xs font-semibold text-[#7A5C61] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl btn-glass-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Create &amp; Generate QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RSVP MODAL */}
      {editingRsvp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-rsvp-title"
          className="fixed inset-0 z-50 bg-[#2B1419]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveEditRsvp}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#9E1B32]/20"
          >
            <h3 id="edit-rsvp-title" className="text-xl font-serif-display font-bold text-[#2B1419]">
              Edit Guest RSVP
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editDraft.fullName}
                onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#2B1419]/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={editDraft.mobileNumber}
                onChange={(e) => setEditDraft({ ...editDraft, mobileNumber: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#2B1419]/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2B1419] mb-1">Status</label>
                <select
                  value={editDraft.attendanceStatus}
                  onChange={(e) =>
                    setEditDraft({
                      ...editDraft,
                      attendanceStatus: e.target.value as 'confirmed' | 'declined'
                    })
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#2B1419]/20 text-sm"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {editDraft.attendanceStatus === 'confirmed' && (
                <div>
                  <label className="block text-xs font-semibold text-[#2B1419] mb-1">
                    Attendee Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={editDraft.attendeeCount}
                    onChange={(e) =>
                      setEditDraft({
                        ...editDraft,
                        attendeeCount: Number(e.target.value) || 1
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#2B1419]/20 text-sm font-mono-tabular"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRsvp(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl btn-glass text-xs font-semibold text-[#7A5C61] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-5 py-2 rounded-xl btn-glass-primary text-xs font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 bg-[#2B1419]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E45D52]/30">
            <h3
              id="delete-confirm-title"
              className="text-xl font-serif-display font-bold text-[#2B1419]"
            >
              Remove Guest Record?
            </h3>
            <p className="text-xs text-[#7A5C61]">
              Are you sure you want to delete the record for{' '}
              <strong className="text-[#2B1419]">{confirmDeleteId.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl btn-glass text-xs font-semibold text-[#7A5C61] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E45D52] text-white text-xs font-semibold hover:bg-[#c94b41] cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
