# I-Guest — Smart Wedding Guest & RSVP Management Website

**I-Guest** is a mobile-first Indian wedding digital invitation and real-time RSVP guest management platform designed for B.Tech mini-project demonstrations and real wedding celebrations.

## 1. Key Features

- **6-Screen Animated Guest Invitation Flow**:
  1. **Invitation Cover**: Displays I-Guest branding, Indian lotus/mandala SVG crest, Couple Names, Wedding Date, welcoming sentence, and an *Open Invitation* glass button.
  2. **Welcome Message**: Heartfelt greeting from the couple and both families with *Back* and *See the Details* navigation.
  3. **Wedding Details**: Displays Wedding Date, Day of the Week, Ceremony Time, Venue Name, Full Address, City, Event Type, Family Note, and an optional *Get Directions* Google Maps link.
  4. **Wedding Schedule**: Vertical itinerary timeline with times, titles, and descriptions for each ceremony.
  5. **RSVP Form**: Mobile-friendly form collecting Full Name, Mobile Number, Attendance Status (*Yes, I'll attend* / *Sorry, I can't attend*), Guest Count (`+` / `-` stepper starting at 1 up to host-configured limit), Meal Preference (*Vegetarian* / *Non-vegetarian*), optional message to the family, and a privacy notice. Automatically disables guest count and meal preference when a guest declines.
  6. **Thank-You Confirmation**: Displays a personalized confirmation message, animated checkmark, and compact RSVP summary card after saving.
- **Host Admin Dashboard**:
  - **7 Live Summary Cards**: Total Invitations Sent, Confirmed Responses, Pending Responses, Declined Responses, Total Confirmed People (distinguishing invitation records from total headcount), Vegetarian Meal Count, and Non-Vegetarian Meal Count.
  - **Guest Response Table**: Search by name or phone number, filter by Confirmed/Pending/Declined, sort by submission date or guest name, edit responses with validation, delete with confirmation, and export to CSV.
  - **Event & Schedule Configuration**: Edit couple names, date, time, venue, welcome text, max guests per RSVP, and schedule items with live preview.
  - **WhatsApp Invitation Sharing**: Generates genuine `https://wa.me/?text=...` share links using the live deployed URL and unpredictable personal invitation tokens (never exposing guest phone numbers in URLs).

## 2. Project File Structure

```text
/
├── index.html                        # HTML5 entry point & Google Fonts
├── firebase-applet-config.json       # Provisioned Firebase project configuration
├── firebase-blueprint.json           # Firestore schema blueprint
├── firestore.rules                   # Hardened Zero-Trust Firestore security rules
├── firestore.rules.test.ts           # Dirty Dozen security rules unit test suite
├── security_spec.md                  # Security invariants & threat model specification
└── src/
    ├── main.tsx                      # Application bootstrap
    ├── index.css                     # White & Orange (#FFFAF5 / #F47B20) glassmorphism styles
    ├── App.tsx                       # Top-level navigation & state controller
    ├── firebase.ts                   # Firebase Auth & Cloud Firestore operations
    ├── components/
    │   ├── WeddingMotifs.tsx         # Custom Indian wedding SVG crests & floating petals
    │   ├── InvitationFlow.tsx        # 6-screen guest invitation & RSVP form
    │   ├── AdminDashboard.tsx        # Host dashboard, KPIs, table, config & WhatsApp share
    │   └── ProjectGuideModal.tsx     # In-app B.Tech project architecture & testing checklist
    └── utils/
        ├── rsvpLogic.ts              # Pure validation, headcount math, CSV & WhatsApp helpers
        └── rsvpLogic.test.ts         # Fast-feedback unit tests for business logic
```
