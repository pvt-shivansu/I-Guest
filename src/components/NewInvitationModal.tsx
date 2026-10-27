import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Sparkles,
  Users,
  RotateCcw,
  Eye
} from 'lucide-react';
import {
  WeddingEventConfig,
  GuestInvitationRecord,
  buildWhatsAppShareUrl,
  DEPLOYED_SHARED_APP_URL
} from '../utils/rsvpLogic';
import { QrInvitationCard } from './QrInvitationCard';

interface NewInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventConfig: WeddingEventConfig;
  onCreateInvitation: (
    guestDisplayName: string,
    maxAllowedGuests: number
  ) => Promise<GuestInvitationRecord>;
  onOpenInvitationWithToken: (inviteToken: string) => void;
  onStartFreshPublicInvitation: () => void;
}

export function NewInvitationModal({
  isOpen,
  onClose,
  eventConfig,
  onCreateInvitation,
  onOpenInvitationWithToken,
  onStartFreshPublicInvitation
}: NewInvitationModalProps) {
  const [guestName, setGuestName] = useState('');
  const [maxGuests, setMaxGuests] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<GuestInvitationRecord | null>(null);

  if (!isOpen) return null;

  const baseAppUrl =
    typeof window !== 'undefined' && window.location.origin.includes('run.app')
      ? window.location.origin
      : DEPLOYED_SHARED_APP_URL;

  const activeToken = createdInvite ? createdInvite.inviteToken : 'public_link';
  const shareBundle = buildWhatsAppShareUrl(
    baseAppUrl,
    eventConfig.coupleNames,
    activeToken,
    createdInvite?.guestDisplayName
  );

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const invite = await onCreateInvitation(guestName.trim(), maxGuests);
      setCreatedInvite(invite);
      setGuestName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-invitation-modal-title"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-[var(--theme-bg)] border-2 border-[var(--theme-gold)]/50 shadow-2xl p-5 sm:p-8 my-8 max-h-[92vh] overflow-y-auto space-y-6 animate-card-reveal">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--theme-text)]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl glass-btn-primary flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--theme-primary)]">
                Instant Guest Link &amp; Printable QR Generator
              </p>
              <h2
                id="new-invitation-modal-title"
                className="text-2xl sm:text-3xl font-serif-display font-bold text-[var(--theme-text)]"
              >
                Create &amp; Share New Wedding Invitation
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close New Invitation Modal"
            title="Close"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl glass-btn-icon flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to generate personalized guest token */}
        <form
          onSubmit={handleGenerateInvite}
          className="p-5 rounded-3xl glass-card flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1">
            <label
              htmlFor="modal-new-guest-name"
              className="block text-xs font-semibold text-[var(--theme-text)] mb-1"
            >
              Invited Guest or Family Name
            </label>
            <input
              id="modal-new-guest-name"
              type="text"
              required
              placeholder="e.g. Mr. & Mrs. Kapoor Family"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white/90 border border-[var(--theme-gold)]/40 text-sm text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <div className="w-full sm:w-44">
            <label
              htmlFor="modal-new-max-guests"
              className="block text-xs font-semibold text-[var(--theme-text)] mb-1"
            >
              Max Guests Allowed
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-[var(--theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="modal-new-max-guests"
                type="number"
                min={1}
                max={15}
                value={maxGuests}
                onChange={(e) => setMaxGuests(Math.min(15, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl bg-white/90 border border-[var(--theme-gold)]/40 text-sm font-mono-tabular text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !guestName.trim()}
            className="min-h-[46px] px-6 py-2.5 rounded-xl glass-btn-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isCreating ? 'Generating...' : 'Generate Invite & QR'}</span>
          </button>
        </form>

        {createdInvite && (
          <div className="p-4 rounded-2xl bg-[#1F7A54]/10 border border-[#1F7A54]/30 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-[#1F7A54] font-semibold">
              Personal invitation created for <strong>{createdInvite.guestDisplayName}</strong> (Token:{' '}
              <code className="font-mono-tabular">{createdInvite.inviteToken}</code>)
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenInvitationWithToken(createdInvite.inviteToken);
                onClose();
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl glass-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Open Personalized Cover</span>
            </button>
          </div>
        )}

        {/* QR Code & Printable Card Preview */}
        <QrInvitationCard
          eventConfig={eventConfig}
          invitationUrl={shareBundle.invitationUrl}
          whatsappUrl={shareBundle.whatsappUrl}
          whatsappMessage={shareBundle.message}
          selectedInvitation={createdInvite}
          onTestLink={() => {
            if (createdInvite) {
              onOpenInvitationWithToken(createdInvite.inviteToken);
            } else {
              onStartFreshPublicInvitation();
            }
            onClose();
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--theme-text)]/10">
          <button
            type="button"
            onClick={() => {
              onStartFreshPublicInvitation();
              onClose();
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[var(--theme-primary)]" />
            <span>Reset &amp; Start Fresh Guest Invitation</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl glass-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
