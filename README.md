# Prova

A structured introspection tool that helps people examine how they think through sustained AI-driven conversation. Each session produces a private PDF report and a collectible card.

## Tech Stack

- **Framework:** React Native + Expo (SDK 55, managed workflow)
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **Backend:** Firebase (Auth, Firestore, Cloud Storage, Cloud Functions v2)
- **AI:** Anthropic Claude API
- **UI:** Custom design system with DM Sans + Instrument Serif fonts

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- An Anthropic API key
- A Firebase project

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password, Google, Apple)
   - Create a Firestore database
   - Enable Cloud Storage
   - Copy your Firebase config values

3. **Set environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase config values (prefixed with `EXPO_PUBLIC_`).

4. **Set Cloud Functions secrets:**
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```

5. **Deploy Cloud Functions:**
   ```bash
   cd functions && npm run deploy
   ```

6. **Deploy Firestore rules and indexes:**
   ```bash
   firebase deploy --only firestore
   firebase deploy --only storage
   ```

7. **Start the dev server:**
   ```bash
   npx expo start
   ```

## Project Structure

```
app/                    # Expo Router screens
├── (auth)/             # Sign in / Sign up
├── (app)/
│   ├── (session)/      # Session flow (intent, onboarding, conversation, ending, reveal)
│   ├── (cards)/        # Card collection + PDF viewer
│   └── (settings)/     # Account settings
components/             # Reusable UI components
├── ui/                 # Button, TextInput, MCQOption, etc.
├── conversation/       # MessageBubble, ChatInput, TypingIndicator
├── cards/              # CardThumbnail, CardRevealAnimation
├── pdf/                # PDFSection, ReadingsCallout
└── layout/             # ScreenWrapper, Header
lib/                    # Firebase config, auth, firestore, storage, API, types
stores/                 # Zustand stores (auth, session, cards)
hooks/                  # Custom hooks (useSession, useMessages, useCards)
constants/              # Theme (colors, typography, spacing) + config
functions/              # Firebase Cloud Functions
└── src/
    ├── prompts/        # AI system prompts (conversation, onboarding, output)
    ├── processMessage  # Core conversation handler
    ├── generatePDF     # PDF content generation
    ├── generateCard    # Card title + art matching
    └── endSession      # Session completion orchestrator
```

## Key Features

- **AI-driven conversation** with genuine intellectual friction
- **Dynamic onboarding** with model-generated MCQ prompts
- **Session intent selection** (open, directed, revisiting)
- **Prova-controlled session ending** based on conversation quality signals
- **Four-layer PDF output** (What you said, How you reasoned, Where you got stuck, What you might not be seeing)
- **Collectible cards** with AI-generated titles and matched artwork
- **Progressive session saving** to Firestore
- **Session resumption** within 24 hours
