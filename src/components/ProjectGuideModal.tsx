import React from 'react';
import { X, ShieldCheck, Smartphone, Database, FileCode } from 'lucide-react';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase';

interface ProjectGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectGuideModal({ isOpen, onClose }: ProjectGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-guide-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-[#FFFAF5] border border-[#F47B20]/30 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#34251E]/10 pb-4">
          <div>
            <p className="text-xs font-semibold text-[#F47B20]">
              B.Tech Mini-Project Demonstration &amp; Architecture Guide
            </p>
            <h2
              id="project-guide-title"
              className="text-2xl sm:text-3xl font-serif-display font-bold text-[#34251E]"
            >
              I-Guest — System Architecture &amp; Viva Checklist
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close Project Guide"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#34251E]/15 flex items-center justify-center text-[#34251E] hover:bg-[#F47B20]/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#F47B20]/20">
            <div className="flex items-center gap-2 text-[#F47B20] font-semibold text-sm mb-1.5">
              <Smartphone className="w-4 h-4" />
              <span>Mobile-First 6-Screen Guest Flow</span>
            </div>
            <p className="text-xs text-[#8E7A6E] leading-relaxed">
              Designed for Android Chrome from 320px upwards. Guests open a WhatsApp link, step
              through Cover → Welcome → Venue Details → Timeline → RSVP Form → Animated
              Confirmation without needing to create an account.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#27845B]/25">
            <div className="flex items-center gap-2 text-[#27845B] font-semibold text-sm mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trust Firestore PII Isolation</span>
            </div>
            <p className="text-xs text-[#8E7A6E] leading-relaxed">
              Public guests can submit an RSVP to <code>/rsvps/&#123;rsvpId&#125;</code> with
              server-enforced schema validation, but cannot read or scrape the guest list. Only
              verified admin (<code>{BOOTSTRAPPED_ADMIN_EMAIL}</code>) can read mobile numbers or
              export CSVs.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#34251E]/10 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#34251E]">
            <FileCode className="w-4 h-4 text-[#F47B20]" />
            <span>Modular Project File Structure</span>
          </div>
          <ul className="text-xs text-[#34251E] space-y-1.5 font-mono-tabular">
            <li>
              • <strong>index.html &amp; src/index.css</strong> — Warm white (#FFFAF5) &amp;
              marigold orange (#F47B20) glassmorphism styling + reduced-motion support.
            </li>
            <li>
              • <strong>src/components/InvitationFlow.tsx</strong> — 6-screen animated guest
              invitation, step navigation, and validated RSVP form.
            </li>
            <li>
              • <strong>src/components/AdminDashboard.tsx</strong> — Host analytics KPIs, search,
              status filter, RSVP editor, event setup, CSV export, and WhatsApp sharing.
            </li>
            <li>
              • <strong>src/utils/rsvpLogic.ts</strong> — Pure validation, headcount vs invitation
              math, CSV builder, and WhatsApp URL generator.
            </li>
            <li>
              • <strong>src/firebase.ts &amp; firestore.rules</strong> — Cloud Firestore SDK setup,
              real-time listeners, and hardened security rules.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#34251E]/10 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#34251E]">
            <Database className="w-4 h-4 text-[#F47B20]" />
            <span>Step-by-Step Testing Checklist (Laptop &amp; Android Phone)</span>
          </div>
          <ol className="text-xs text-[#8E7A6E] space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              <strong className="text-[#34251E]">Test the 6 Invitation Screens:</strong> Click{' '}
              <em>Open Invitation</em> → <em>See the Details</em> → <em>One More Thing</em> →{' '}
              <em>RSVP Now</em>. Verify that Back buttons preserve your place.
            </li>
            <li>
              <strong className="text-[#34251E]">Test Attendance-Dependent Controls:</strong> On
              the RSVP form, toggle between <em>Yes, I&apos;ll attend</em> and{' '}
              <em>Sorry, I can&apos;t attend</em>. Notice how guest count and meal preference
              automatically disable when declining.
            </li>
            <li>
              <strong className="text-[#34251E]">Submit a Real RSVP:</strong> Enter a guest name
              and 10-digit mobile number, set 3 attendees (Vegetarian), and click{' '}
              <em>Submit RSVP</em>. Confirm the Thank-You screen shows your exact summary.
            </li>
            <li>
              <strong className="text-[#34251E]">Verify Admin Dashboard &amp; Catering Math:</strong>{' '}
              Switch to <em>Host Admin</em> in the top bar. Verify that Confirmed Invitations vs
              Total Headcount and Veg/Non-Veg meal counts update automatically.
            </li>
            <li>
              <strong className="text-[#34251E]">Share on WhatsApp &amp; Export CSV:</strong> Test
              the <em>Export CSV</em> button and the <em>WhatsApp Sharing</em> tab on your phone.
            </li>
          </ol>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47B20] text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Got It, Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
