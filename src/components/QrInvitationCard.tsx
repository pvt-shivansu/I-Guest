import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Share2,
  Eye,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WeddingEventConfig, GuestInvitationRecord } from '../utils/rsvpLogic';
import { MandalaCrest, FloralDivider } from './WeddingMotifs';

interface QrInvitationCardProps {
  eventConfig: WeddingEventConfig;
  invitationUrl: string;
  whatsappUrl: string;
  whatsappMessage: string;
  selectedInvitation?: GuestInvitationRecord | null;
  onTestLink?: () => void;
}

export function QrInvitationCard({
  eventConfig,
  invitationUrl,
  whatsappUrl,
  whatsappMessage,
  selectedInvitation,
  onTestLink
}: QrInvitationCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(invitationUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#2A1215',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });
    return () => {
      active = false;
    };
  }, [invitationUrl]);

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const slug = selectedInvitation
      ? selectedInvitation.inviteToken
      : 'iguest-wedding-invitation';
    link.href = qrDataUrl;
    link.download = `${slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Printable Physical Wedding Invitation QR Card Insert */}
      <div className="lg:col-span-6 flex flex-col items-center">
        <div
          id="printable-qr-card"
          className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border-2 border-[var(--theme-gold)]/60 shadow-xl text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-primary)] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>I-Guest Digital RSVP Card Insert</span>
          </div>

          <div className="flex justify-center my-2">
            <MandalaCrest className="w-14 h-14" />
          </div>

          <p className="text-xs text-[var(--theme-muted)]">
            {selectedInvitation
              ? `Personal Invitation for ${selectedInvitation.guestDisplayName}`
              : 'Shubh Vivah Celebration'}
          </p>

          <h4 className="text-3xl font-serif-display font-bold text-[var(--theme-text)] mt-1">
            {eventConfig.coupleNames}
          </h4>

          <p className="text-xs font-medium text-[var(--theme-muted)] mt-1">
            {eventConfig.dayOfWeek}, {eventConfig.weddingDate} · {eventConfig.city}
          </p>

          <div className="flex justify-center my-3">
            <FloralDivider className="w-40 h-5" />
          </div>

          {/* Scannable QR Code Frame */}
          <div className="mx-auto my-3 p-3.5 rounded-2xl bg-[#FCF6F2] border border-[var(--theme-gold)]/50 inline-flex flex-col items-center justify-center shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${eventConfig.coupleNames} wedding invitation`}
                className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl object-contain bg-white p-2 border border-[var(--theme-gold)]/30"
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-white flex items-center justify-center text-xs text-[var(--theme-muted)]">
                Generating QR...
              </div>
            )}
            <span className="mt-2 text-[11px] font-semibold text-[var(--theme-primary)] flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan to Open Digital Invitation &amp; RSVP</span>
            </span>
          </div>

          <p className="text-[11px] text-[var(--theme-muted)] leading-relaxed max-w-xs mx-auto mt-1">
            Point your smartphone camera at this QR code to view ceremony timings, venue map, and
            confirm your attendance online.
          </p>

          <p className="text-[10px] font-mono-tabular text-[var(--theme-muted)]/80 mt-2 truncate px-2">
            {invitationUrl}
          </p>
        </div>
      </div>

      {/* Right Column: Print, Download & WhatsApp Share Controls */}
      <div className="lg:col-span-6 space-y-5">
        <div className="p-5 rounded-3xl glass-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl glass-btn-icon flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-serif-display font-bold text-[var(--theme-text)]">
                Print QR for Physical Wedding Cards
              </h4>
              <p className="text-xs text-[var(--theme-muted)]">
                Download high-resolution PNG or print directly onto card inserts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl glass-btn-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download QR PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCard}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl glass-btn-secondary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0 text-[var(--theme-primary)]" />
              <span>Print QR Card</span>
            </button>
          </div>

          {/* Copy Invitation URL */}
          <div className="pt-2 border-t border-[var(--theme-text)]/10">
            <label className="block text-xs font-semibold text-[var(--theme-text)] mb-1.5">
              Direct Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={invitationUrl}
                aria-label="Direct Invitation Link"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white/90 border border-[var(--theme-gold)]/40 text-xs font-mono-tabular text-[var(--theme-text)]"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy Invitation URL"
                title="Copy Invitation URL"
                className="min-h-[44px] px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-[#1F7A54]" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--theme-primary)]" />
                )}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Share Box */}
        <div className="p-5 rounded-3xl glass-card space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--theme-muted)] mb-1.5">
              WhatsApp Invitation Message Preview
            </p>
            <p className="text-xs sm:text-sm text-[var(--theme-text)] leading-relaxed bg-white/85 p-3.5 rounded-2xl border border-[var(--theme-gold)]/30">
              {whatsappMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-[#1F7A54] text-white text-xs sm:text-sm font-semibold shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Invitation on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>

            {onTestLink && (
              <button
                type="button"
                onClick={onTestLink}
                title="Open & Test Invitation Link"
                className="min-h-[48px] px-4 py-3 rounded-2xl glass-btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4 text-[var(--theme-primary)]" />
                <span>Open Link</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
