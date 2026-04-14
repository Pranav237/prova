# Prova — Technical Implementation Blueprint
### For use with Cursor AI · React Native + Expo + Firebase

---

## 1. Tech Stack & Versions

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | React Native | Latest stable via Expo |
| Build system | Expo (managed workflow) | SDK 52+ |
| Navigation | Expo Router (file-based) | v4+ |
| State management | Zustand | Lightweight, minimal boilerplate |
| Auth | Firebase Auth | Apple, Google, Email/Password, MFA |
| Database | Cloud Firestore | Real-time listeners for session saving |
| Storage | Firebase Cloud Storage | PDFs + art library |
| Backend functions | Firebase Cloud Functions (v2) | Node.js 20 runtime |
| AI | Anthropic API (Claude) | claude-sonnet-4-20250514 for conversation; claude-sonnet-4-20250514 for output generation |
| PDF generation | Puppeteer in Cloud Function | Higher-memory function (1GB+) |
| 3D card (primary) | expo-three (Three.js bridge) | Card rotation, metallic shader |
| 2D card (fallback) | react-native-reanimated + react-native-skia | Parallax, gradient animation |
| Animations | react-native-reanimated v3 | All transitions, micro-interactions |
| Fonts | Google Fonts: DM Sans, Instrument Serif | Loaded via expo-font |
| Icons | Lucide React Native | Minimal icon set |

---

## 2. Project Structure

```
prova/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (auth gate, font loading, providers)
│   ├── index.tsx                 # Splash screen → redirects based on auth state
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── sign-in.tsx           # Sign in screen
│   │   └── sign-up.tsx           # Sign up screen
│   ├── (app)/
│   │   ├── _layout.tsx           # Main app tab layout (bottom tabs)
│   │   ├── (session)/
│   │   │   ├── _layout.tsx       # Session stack layout
│   │   │   ├── index.tsx         # Session intent selection
│   │   │   ├── onboarding.tsx    # First-time onboarding MCQs
│   │   │   ├── conversation.tsx  # The conversation screen
│   │   │   ├── ending.tsx        # Session ending transition
│   │   │   └── reveal.tsx        # Card reveal screen
│   │   ├── (cards)/
│   │   │   ├── _layout.tsx       # Cards stack layout
│   │   │   ├── index.tsx         # Cards collection grid
│   │   │   └── [sessionId].tsx   # PDF view for a specific session
│   │   └── (settings)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx         # Settings main screen
│   │       └── sessions.tsx      # Past sessions list
├── components/
│   ├── ui/
│   │   ├── Button.tsx            # Reusable button (primary, secondary, ghost)
│   │   ├── TextInput.tsx         # Styled text input
│   │   ├── ProgressDots.tsx      # Onboarding progress indicator
│   │   ├── MCQOption.tsx         # Selectable MCQ option with radio
│   │   ├── ProvaReaction.tsx     # Prova's inline reaction bubble
│   │   └── TabBar.tsx            # Custom bottom tab bar
│   ├── conversation/
│   │   ├── MessageBubble.tsx     # Single message (Prova or user variant)
│   │   ├── ProvaLabel.tsx        # "prova" label above Prova messages
│   │   ├── TypingIndicator.tsx   # Three-dot animation
│   │   ├── ChatInput.tsx         # Text input with send button
│   │   └── SessionTimer.tsx      # Elapsed time in header
│   ├── cards/
│   │   ├── Card3D.tsx            # Three.js 3D card (primary)
│   │   ├── Card2D.tsx            # Skia 2D card (fallback)
│   │   ├── CardThumbnail.tsx     # Grid thumbnail in cards tab
│   │   ├── EmptyCardSlot.tsx     # Dashed "+" placeholder
│   │   └── CardRevealAnimation.tsx # Scale + fade reveal sequence
│   ├── pdf/
│   │   ├── PDFViewer.tsx         # In-app PDF reading view
│   │   ├── PDFSection.tsx        # Single section with label + content
│   │   └── ReadingsCallout.tsx   # Recommended readings box
│   └── layout/
│       ├── ScreenWrapper.tsx     # Safe area + background gradient
│       └── Header.tsx            # Reusable screen header
├── lib/
│   ├── firebase.ts               # Firebase app initialization
│   ├── auth.ts                   # Auth helpers (signIn, signUp, signOut, onAuthStateChanged)
│   ├── firestore.ts              # Firestore read/write helpers
│   ├── storage.ts                # Cloud Storage upload/download helpers
│   ├── api.ts                    # Cloud Function call wrappers
│   └── types.ts                  # TypeScript interfaces for all data models
├── stores/
│   ├── authStore.ts              # Auth state (user, loading, error)
│   ├── sessionStore.ts           # Active session state (messages, status, intent)
│   └── cardsStore.ts             # Card collection state
├── constants/
│   ├── theme.ts                  # Design tokens (colors, typography, spacing)
│   └── config.ts                 # App config (API URLs, feature flags)
├── hooks/
│   ├── useSession.ts             # Session lifecycle hook
│   ├── useMessages.ts            # Real-time message listener
│   └── useCards.ts               # Card collection listener
├── assets/
│   └── fonts/
│       ├── DMSans-Regular.ttf
│       ├── DMSans-Medium.ttf
│       ├── DMSans-SemiBold.ttf
│       ├── DMSans-Bold.ttf
│       └── InstrumentSerif-Regular.ttf
├── functions/                    # Firebase Cloud Functions (deployed separately)
│   ├── src/
│   │   ├── index.ts              # Function exports
│   │   ├── generateOnboarding.ts # MCQ generation
│   │   ├── processMessage.ts     # Core conversation handler
│   │   ├── endSession.ts         # Session ending orchestrator
│   │   ├── generatePDF.ts        # PDF generation with Puppeteer
│   │   ├── generateCard.ts       # Card title + art matching
│   │   └── prompts/
│   │       ├── onboarding.ts     # System prompt for onboarding MCQs
│   │       ├── conversation.ts   # System prompt for Prova conversation mode
│   │       └── output.ts         # System prompt for PDF + card generation
│   ├── package.json
│   └── tsconfig.json
├── app.json                      # Expo config
├── tsconfig.json
├── package.json
└── firebase.json                 # Firebase project config
```

---

## 3. Design System

### 3.1 Colors

```typescript
// constants/theme.ts

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0D0B14',         // Main app background
    elevated: '#13101C',        // Slightly lifted surfaces (modals, sheets)
    card: '#1A1428',            // Card background base
    input: 'rgba(255,255,255,0.04)',  // Text input background
  },

  // Purple accent — the only accent color in the app
  purple: {
    DEFAULT: '#A882FF',         // Primary interactive color
    dark: '#7B5EBF',            // Gradient start, muted states
    soft: 'rgba(168,130,255,0.6)',    // Secondary text, labels
    faint: 'rgba(168,130,255,0.12)',  // Selected backgrounds, subtle fills
    ghost: 'rgba(168,130,255,0.06)',  // Prova reaction bg, hover states
    border: 'rgba(168,130,255,0.2)',  // Active borders, card outlines
    borderStrong: 'rgba(168,130,255,0.4)', // Selected option borders
    glow: 'rgba(120,80,200,0.15)',   // Radial glows, ambient light
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.8)',
    tertiary: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.35)',
    faint: 'rgba(255,255,255,0.25)',
    ghost: 'rgba(255,255,255,0.15)',
  },

  // Borders & dividers
  border: {
    subtle: 'rgba(255,255,255,0.04)',
    light: 'rgba(255,255,255,0.06)',
    DEFAULT: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.1)',
  },

  // Semantic
  white: '#FFFFFF',
  black: '#000000',
  danger: 'rgba(255,100,100,0.6)',

  // Gradients (defined as arrays for LinearGradient)
  gradient: {
    primaryButton: ['#7B5EBF', '#A882FF'],       // 135deg
    cardSurface: ['#1A1428', '#2A1F3D', '#1A1428'], // 145deg
    ambientGlow: ['rgba(120,80,200,0.15)', '#0D0B14'], // Radial
  },
};
```

### 3.2 Typography

```typescript
export const typography = {
  // Display — Instrument Serif
  display: {
    large: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 36,
      letterSpacing: -0.72, // -0.02em
    },
    medium: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 22,
    },
    small: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 18,
      lineHeight: 25, // 1.4
    },
    card: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 14,
      lineHeight: 18, // 1.3
    },
  },

  // Body — DM Sans
  body: {
    large: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      lineHeight: 21, // 1.5
    },
    default: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      lineHeight: 20, // 1.55
    },
    small: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 19, // 1.6
    },
  },

  // Labels — DM Sans, uppercase
  label: {
    large: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
    },
    default: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
    },
    small: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      letterSpacing: 0.55, // 0.05em
    },
    tiny: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      letterSpacing: 0.6, // 0.06em
      textTransform: 'uppercase' as const,
    },
    micro: {
      fontFamily: 'DMSans-Regular',
      fontSize: 9,
      letterSpacing: 0.72, // 0.08em
      textTransform: 'uppercase' as const,
    },
  },

  // Button text — DM Sans
  button: {
    primary: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
    },
    secondary: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
    },
  },
};
```

### 3.3 Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
};

export const radius = {
  sm: 4,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  pill: 20,
  full: 9999,
};
```

### 3.4 Shadows & Effects

```typescript
export const shadows = {
  card: {
    shadowColor: 'rgba(100,60,180,1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
  },
  cardReveal: {
    shadowColor: 'rgba(100,60,180,1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 16,
  },
};
```

---

## 4. Data Models

```typescript
// lib/types.ts

// ─── Auth ───────────────────────────────────────────
interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  hasCompletedOnboarding: boolean;
  sessionCount: number;
}

// ─── Session ────────────────────────────────────────
type SessionIntent = 'open' | 'directed' | 'revisiting';
type SessionStatus = 'active' | 'incomplete' | 'complete';

interface Session {
  id: string;
  userId: string;
  intent: SessionIntent;
  status: SessionStatus;
  revisitingSessionId?: string;       // If intent is 'revisiting'
  directedPrompt?: string;            // If intent is 'directed'
  exchangeCount: number;              // Number of meaningful back-and-forth pairs
  startedAt: Timestamp;
  lastMessageAt: Timestamp;
  completedAt?: Timestamp;
  cardTitle?: string;
  cardArtRef?: string;                // Path in Cloud Storage to art image
  cardMetallicColor?: string;         // Hex color for metallic overlay
  pdfRef?: string;                    // Path in Cloud Storage to generated PDF
}

// ─── Messages ───────────────────────────────────────
type MessageRole = 'prova' | 'user';

interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: Timestamp;
  // Metadata attached by processMessage cloud function
  meta?: {
    isClosingMessage: boolean;        // True if Prova is signaling session end
    sessionQuality: 'building' | 'peaking' | 'winding_down' | 'complete';
    exchangeNumber: number;
  };
}

// ─── PDF Output ─────────────────────────────────────
interface PDFOutput {
  whatYouSaid: string;
  howYouReasoned: string;
  whereYouGotStuck: string;
  whatYouMightNotBeSeeing: string;
  recommendedReadings: Array<{
    title: string;
    author: string;
    reason: string;                   // One sentence on why this is relevant
  }>;
}

// ─── Card ───────────────────────────────────────────
interface Card {
  sessionId: string;
  title: string;                      // e.g. "The Reluctant Empiricist"
  artRef: string;                     // Cloud Storage path
  artUrl?: string;                    // Resolved download URL (client-side)
  metallicColor: string;              // Hex color
  createdAt: Timestamp;
}

// ─── Onboarding MCQ ─────────────────────────────────
interface OnboardingPrompt {
  question: string;                   // The scenario or opinion prompt
  options: string[];                  // 2-3 response options
  provaReactions: Record<number, string>; // Index → reaction string
}

// ─── Art Library ────────────────────────────────────
interface ArtAsset {
  id: string;
  storageRef: string;                 // Cloud Storage path
  tags: string[];                     // e.g. ['solitude', 'nature', 'warm', 'contemplative']
  dominantColor: string;              // Hex, used for metallic treatment
  mood: string;                       // e.g. 'serene', 'intense', 'mysterious'
  source: string;                     // Attribution
  license: string;
}
```

---

## 5. Firestore Schema

```
users/
  {uid}/
    - displayName: string
    - email: string
    - createdAt: timestamp
    - hasCompletedOnboarding: boolean
    - sessionCount: number

    sessions/
      {sessionId}/
        - intent: 'open' | 'directed' | 'revisiting'
        - status: 'active' | 'incomplete' | 'complete'
        - revisitingSessionId?: string
        - directedPrompt?: string
        - exchangeCount: number
        - startedAt: timestamp
        - lastMessageAt: timestamp
        - completedAt?: timestamp
        - cardTitle?: string
        - cardArtRef?: string
        - cardMetallicColor?: string
        - pdfRef?: string

        messages/
          {messageId}/
            - role: 'prova' | 'user'
            - content: string
            - createdAt: timestamp
            - meta?: { isClosingMessage, sessionQuality, exchangeNumber }

artLibrary/
  {artId}/
    - storageRef: string
    - tags: string[]
    - dominantColor: string
    - mood: string
    - source: string
    - license: string
```

**Firestore indexes needed:**
- `users/{uid}/sessions` — composite index on `status` + `completedAt` descending (for cards tab query)
- `users/{uid}/sessions/{sessionId}/messages` — index on `createdAt` ascending (for conversation replay)

---

## 6. Cloud Storage Structure

```
art-library/
  {artId}.jpg              # ~100 curated images, uploaded once

users/
  {uid}/
    pdfs/
      {sessionId}.pdf      # Generated PDF for each completed session
    exports/
      {sessionId}_card.png # Optional: server-rendered card image for sharing
```

---

## 7. Firebase Cloud Functions

### 7.1 generateOnboarding

**Trigger:** Called by client when user starts first session or selects "open" intent.

**Input:**
```typescript
{
  userId: string;
  isFirstSession: boolean;
}
```

**Logic:**
1. If first session, generate 4 MCQ prompts (warm-up + intent selection as final)
2. If returning user with open intent, generate 1 opening prompt
3. Call Anthropic API with onboarding system prompt
4. Return prompts array to client

**System prompt key instructions:**
- Generate scenarios that are relatable and slightly provocative
- Each scenario should have 2-3 response options that reveal different reasoning styles
- Write a 1-sentence Prova reaction for each option — warm, curious, hinting at depth
- The final MCQ for first-timers asks about intent: "Would you like me to find what's worth examining, or do you have something specific?"
- Never generate generic self-help style questions
- Prompts should feel like the beginning of a conversation

**Output:**
```typescript
{
  prompts: OnboardingPrompt[];
}
```

---

### 7.2 processMessage

**Trigger:** Called by client on every user message send.

**Input:**
```typescript
{
  userId: string;
  sessionId: string;
  userMessage: string;
}
```

**Logic:**
1. Read full message history from Firestore: `users/{uid}/sessions/{sessionId}/messages` ordered by `createdAt`
2. If session intent is "revisiting," also load the referenced session's PDF content
3. Read most recent 2 completed session PDFs for silent calibration context (do not reference directly)
4. Construct messages array for Anthropic API:
   - System prompt (conversation mode — see section 8)
   - Full conversation history as alternating user/assistant messages
   - Current user message
5. Call Anthropic API with streaming enabled
6. Write user message to Firestore: `messages/{auto-id}` with role: 'user'
7. Write Prova response to Firestore: `messages/{auto-id}` with role: 'prova'
8. Evaluate session quality signals from the response:
   - Count total meaningful exchanges (both sides substantive)
   - Check if Prova's response contains a closing signal
   - Assess: is conversation building, peaking, winding down, or naturally complete?
9. Update session document: `exchangeCount`, `lastMessageAt`
10. Return response + metadata to client

**Output:**
```typescript
{
  response: string;
  meta: {
    isClosingMessage: boolean;
    sessionQuality: 'building' | 'peaking' | 'winding_down' | 'complete';
    exchangeNumber: number;
  };
}
```

**Streaming approach:**
- Use Anthropic's streaming API
- Forward chunks to client via the HTTP response stream (Cloud Functions v2 supports streaming responses)
- Alternatively, write partial response to a `streamingResponse` field on the session doc and use a Firestore real-time listener on the client

---

### 7.3 endSession

**Trigger:** Called by client when `processMessage` returns `isClosingMessage: true` and user has seen Prova's closing message.

**Input:**
```typescript
{
  userId: string;
  sessionId: string;
}
```

**Logic:**
1. Read full conversation from Firestore
2. Call `generatePDF` (see 7.4)
3. Call `generateCard` (see 7.5)
4. Update session document:
   - `status: 'complete'`
   - `completedAt: now`
   - `pdfRef: storage path`
   - `cardTitle: generated title`
   - `cardArtRef: storage path`
   - `cardMetallicColor: hex`
5. Increment `users/{uid}/sessionCount`
6. If first session, set `users/{uid}/hasCompletedOnboarding: true`
7. Return card + PDF data to client

**Output:**
```typescript
{
  cardTitle: string;
  cardArtUrl: string;
  cardMetallicColor: string;
  pdfUrl: string;
}
```

---

### 7.4 generatePDF

**Called by:** `endSession` (not directly by client)

**Logic:**
1. Send full conversation to Anthropic API with the output system prompt
2. The prompt instructs Claude to produce the four-layer analysis + recommended readings
3. Parse Claude's response into the PDFOutput structure
4. Render PDF using Puppeteer:
   - Load an HTML template with the content
   - Template uses the same design system: dark background, DM Sans + Instrument Serif fonts, purple section labels
   - Render to PDF with A4 dimensions
5. Upload PDF to Cloud Storage: `users/{uid}/pdfs/{sessionId}.pdf`
6. Return storage reference

**PDF HTML template key specs:**
- Background: `#0D0B14`
- Title: Instrument Serif, 24px, white
- Date: DM Sans, 12px, `rgba(255,255,255,0.25)`
- Section labels: DM Sans, 11px, `#A882FF`, uppercase, `0.1em` letter-spacing
- Section body: DM Sans, 13px, `rgba(255,255,255,0.7)`, line-height 1.65
- Section dividers: `1px solid rgba(255,255,255,0.04)`
- Readings callout: rounded box with purple-tinted background
- Page margins: 40px all sides
- Footer: "thinkprova.com" centered, `rgba(255,255,255,0.1)`

---

### 7.5 generateCard

**Called by:** `endSession` (not directly by client)

**Logic:**
1. Send full conversation + PDF output to Anthropic API
2. Prompt instructs Claude to:
   a. Generate a 2–4 word title that captures the user's intellectual character this session
   b. Select the best-matching art asset from the library by returning an art ID
3. Claude receives the full art library metadata (IDs, tags, moods) in the prompt
4. Look up the selected art asset's `dominantColor` for the metallic treatment
5. Return title, art storage ref, and metallic color

**Title generation rules (encoded in prompt):**
- 2–4 words
- Feels like a character class or archetype title
- Should be flattering but honest — something the user would be proud of
- Must be specific to this session, not generic
- Format: "The [Adjective] [Noun]" or similar structures
- Examples: "The Reluctant Empiricist", "Tightrope Walker", "The Quiet Contrarian", "Unfinished Cartographer"
- Never use a philosopher's name as the title
- Never use generic self-help language

---

## 8. System Prompts

### 8.1 Conversation Mode System Prompt

This is the most critical piece of the entire product. The system prompt is stored in `functions/src/prompts/conversation.ts` and is assembled dynamically with context injected.

**Structure of the assembled prompt:**

```
[CORE IDENTITY AND BEHAVIOR]
You are Prova — a structured introspection tool...
[Prova's tone, style, and conversational rules]

[SESSION CONTEXT]
Session intent: {open | directed | revisiting}
{If directed: "The user wants to examine: {directedPrompt}"}
{If revisiting: "Previous session PDF content: {previousPDFContent}"}
Exchange count so far: {number}

[PAST SESSION CONTEXT — SILENT USE ONLY]
{Summary of user's last 2 session PDFs — used to calibrate depth and avoid retreading, never referenced directly}

[CONVERSATION HISTORY]
{Full message history}
```

**Core behavioral instructions for the prompt:**

```
IDENTITY:
- You are Prova. You lead structured introspection conversations.
- You are warm, curious, supportive, and intellectually serious.
- You are NOT a therapist, advisor, coach, or chatbot.
- You never give advice. You never tell the user what to think.
- You are an interlocutor who introduces genuine intellectual friction.

CONVERSATION RULES:
- Ask about what the user DID, not just what they THINK. Behavioral descriptions surface internalized beliefs better than opinion questions.
- When the user gives a vague answer, do not accept it. Ask a follow-up that makes them be specific.
- When you notice a contradiction between something the user said earlier and what they're saying now, name it directly but warmly.
- When the user applies different standards to themselves vs. others, point it out.
- Never ask more than one question per message.
- Never list options or present structured choices during conversation. This is free-flowing dialogue.
- Do not summarize what the user said back to them as a conversation move. Instead, reframe it or challenge it.
- Reference past sessions ONLY if genuinely relevant to what just came up. Never open with "last time we talked about..."
- Use past session data silently to calibrate how deep you can go and what patterns you're watching for.
- Keep messages concise. 2-4 sentences is typical. Never write a wall of text.
- Match the user's register. If they're casual, be casual. If they're precise, be precise.

SESSION MANAGEMENT:
- Track conversation quality internally.
- After the minimum exchange threshold ({MIN_EXCHANGES}), begin watching for natural ending points.
- End signals: something genuine has landed, the user is going in circles, energy is dropping.
- When you decide to end, send ONE closing message that names what emerged. Frame it as a statement, not a question.
- Your closing message should feel like an insight landing, not a goodbye.
- Example closing tone: "You hold yourself to a standard you'd never apply to anyone you love. That gap — between what you give others and what you give yourself — that's the thing."
- After your closing message, append the exact string: [SESSION_COMPLETE]

OUTPUT AWARENESS:
- You know that after the session ends, the full conversation will be analyzed to produce a four-layer document. Do not try to produce this analysis during conversation.
- Your job during conversation is to generate the raw material — the honest, specific, surprising moments — that the analysis will draw from.
```

### 8.2 Output Mode System Prompt

Used by `generatePDF` to analyze the conversation.

```
You are Prova's analysis engine. You have just completed a conversation with a user. Your job is to produce a four-layer introspection document based on the full conversation transcript.

OUTPUT FORMAT — Return valid JSON matching this structure:
{
  "whatYouSaid": "...",
  "howYouReasoned": "...",
  "whereYouGotStuck": "...",
  "whatYouMightNotBeSeeing": "...",
  "recommendedReadings": [
    { "title": "...", "author": "...", "reason": "..." }
  ]
}

LAYER INSTRUCTIONS:

1. WHAT YOU SAID
- Faithfully represent the user's stated positions.
- Use their actual language where possible.
- Organize by theme, not chronologically.
- Do not editorialize. This is a mirror.

2. HOW YOU REASONED
- Describe the patterns in HOW they reached their positions.
- Name the moves: "You consistently started from empathy, then checked it against pragmatism."
- Note when different topics triggered different reasoning styles.
- Be specific — reference actual moments from the conversation.
- Write as observation, not judgment.

3. WHERE YOU GOT STUCK
- Name the specific moments of hesitation, contradiction, circularity, or avoidance.
- Quote or closely paraphrase what they actually said at those moments.
- Do not interpret WHY they got stuck — just name that they did and what the topic was.
- Be honest but not harsh.

4. WHAT YOU MIGHT NOT BE SEEING
- This is the most important and most delicate layer.
- Offer 1-3 genuine observations about blind spots or unexamined assumptions.
- Ground each observation in specific evidence from the conversation.
- Write with care — as an honest friend, not a critic.
- Never pathologize. Never diagnose. Never use clinical language.
- Frame as "you might not be seeing X" not "you have a problem with X."

RECOMMENDED READINGS:
- 2-4 books, essays, or articles genuinely relevant to what emerged.
- Each should have a one-sentence reason connecting it to a specific moment or theme from the session.
- Prefer lesser-known, genuinely insightful works over pop psychology bestsellers.

TONE:
- Write in second person ("you").
- The entire document should feel like it was written by someone who was genuinely paying attention to THIS specific person in THIS specific conversation.
- Nothing should feel templated, generic, or applicable to anyone else.
- Language should be clear and direct, never academic or jargon-heavy.
```

### 8.3 Card Generation Prompt

```
Based on the conversation and analysis below, generate:

1. A TITLE (2-4 words) that captures this person's intellectual character as revealed in this session. It should feel like an archetype name — something between a character class and a chapter title. The user should feel proud to be called this. It must be specific to what actually happened in the conversation. Never use a philosopher's name. Never use generic self-help language.

2. An ART MATCH — select the single best image from the library below based on the mood and themes of the session. Return the art ID.

[ART LIBRARY]
{JSON array of all art assets with id, tags, mood}

Return JSON:
{
  "title": "...",
  "artId": "..."
}
```

---

## 9. Screen-by-Screen Implementation Specs

### 9.1 Splash Screen (`app/index.tsx`)

**Behavior:**
- Shows for 2 seconds, then checks auth state
- If authenticated → navigate to `(app)/(session)/`
- If not authenticated → navigate to `(auth)/sign-in`

**Layout:**
- Full screen, centered vertically
- Background: `colors.bg.primary` with radial gradient centered at 50% 40%, color `colors.purple.glow`, fading to transparent at 70%
- "prova" text: `typography.display.large`, color white, centered
- Tagline "know what you think": `typography.label.micro`, color `colors.purple.soft`, `0.15em` letter-spacing, centered, 8px below title

**Animations:**
- Title fades in + translates up 10px over 600ms, ease-out
- Tagline fades in 300ms after title, same animation

---

### 9.2 Auth Screen (`app/(auth)/sign-in.tsx`)

**Layout:**
- Background: vertical linear gradient from `rgba(120,80,200,0.08)` at top to `colors.bg.primary` at 50%
- Top padding: 40px from safe area
- Horizontal padding: 24px

**Elements top to bottom:**
1. "Welcome" — `typography.display.medium` + 4px extra (28px total), white
2. "Sign in to begin your first session" — `typography.body.default`, `colors.text.muted`, 6px below title, 40px margin bottom
3. Apple button: height 48, radius `radius.xl` (14), white background, black text, Apple logo + "Continue with Apple", `typography.button.primary`
4. Google button: height 48, radius 14, background `colors.bg.input`, border `colors.border.strong`, white text, "G" + "Continue with Google", 12px gap between buttons
5. Divider: horizontal line `colors.border.DEFAULT` with "or" text `colors.text.faint` centered, 16px vertical margin
6. Email input: height 44, radius `radius.lg` (12), bg `colors.bg.input`, border `colors.border.DEFAULT`, placeholder "Email address" in `colors.text.faint`
7. Password input: same styling, 10px below email
8. Sign In button: height 48, radius 14, gradient background `colors.gradient.primaryButton` at 135deg, white text `typography.button.primary`, 20px above
9. Footer text: "Don't have an account? Create one" — `colors.text.muted` with "Create one" in `colors.purple.DEFAULT`, centered, 16px below button

---

### 9.3 Onboarding Screen (`app/(app)/(session)/onboarding.tsx`)

**State:** Array of `OnboardingPrompt` objects from `generateOnboarding` cloud function. Track `currentIndex` and `selectedOption` per prompt.

**Layout:**
- Padding: 20px horizontal, 20px top, 24px bottom

**Elements:**
1. Progress dots: Row of 4 dots, each `flex: 1`, height 3, radius 2. Completed = `colors.purple.DEFAULT`, upcoming = `colors.border.DEFAULT`. Gap 6px. Margin bottom 32px.
2. Question text: `typography.display.small` (18px Instrument Serif), white, line-height 1.4
3. Subtext (e.g. "What's your first instinct?"): `typography.body.small`, `colors.text.muted`, 8px below question, 28px margin bottom
4. Options: Each option is a touchable row with:
   - Padding 14px 16px, radius 14
   - Unselected: bg `rgba(255,255,255,0.03)`, border `colors.border.light`
   - Selected: bg `colors.purple.faint`, border `colors.purple.borderStrong`
   - Radio circle: 18x18, radius 10, border 1.5px `colors.border.ghost` (unselected) or 2px `colors.purple.DEFAULT` (selected) with 8x8 filled circle inside when selected
   - Text: `typography.body.default`, unselected `colors.text.tertiary`, selected `#D4C0FF`
   - Gap between options: 10px
5. Prova reaction (appears after selection with fade-in):
   - 16px margin top
   - Padding 14px 16px, radius 14
   - Background `colors.purple.ghost`
   - Left border: 2px solid `rgba(168,130,255,0.3)`
   - Text: `typography.body.small`, color `rgba(168,130,255,0.7)`
6. Continue button: pinned to bottom, height 48, radius 14, gradient background, white text

**Transitions:** Each prompt slides left 250ms as next one enters from right.

---

### 9.4 Session Intent Screen (`app/(app)/(session)/index.tsx`)

**Layout:**
- Top padding: 30px, horizontal padding: 20px
- Background: radial gradient centered at 50% 20%, `rgba(120,80,200,0.08)` to transparent at 60%

**Elements:**
1. "How do you want to start?" — Instrument Serif 22px, white
2. "You can always change direction mid-session." — DM Sans 12px, `colors.text.muted`, 6px below, 32px margin bottom
3. Three intent cards, each:
   - Padding 18px 16px, radius 16, gap 14px horizontal
   - Background: recommended = `colors.purple.faint`, others = `rgba(255,255,255,0.02)`
   - Border: recommended = `colors.purple.border`, others = `colors.border.light`
   - Icon container: 36x36, radius 10, centered icon/symbol
   - Title: DM Sans 14px semibold, white
   - "Recommended" badge (first option only): 9px uppercase, bg `rgba(168,130,255,0.2)`, color `#C4ABFF`, padding 2px 7px, radius 6
   - Description: DM Sans 12px, `colors.text.muted`, line-height 1.4
   - Gap between cards: 12px

**Behavior:**
- "Let Prova lead" → call `generateOnboarding` for opening prompt, then navigate to conversation
- "I have something" → show a text input overlay for user to type their framing, then navigate to conversation
- "Revisit a session" → show a list of past completed sessions (cards), user selects one, then navigate to conversation with that session's PDF loaded as context

---

### 9.5 Conversation Screen (`app/(app)/(session)/conversation.tsx`)

**This is the most complex screen. Build it as a custom implementation, not using a chat library.**

**Header:**
- Height: ~44px below status bar
- Left: "Session" in Instrument Serif 15px, white
- Right: elapsed time in DM Sans 10px, `colors.purple.soft`, `0.05em` letter-spacing
- Bottom border: `colors.border.subtle`

**Message list (FlatList, inverted: false):**
- Padding: 16px horizontal, 16px top, 8px bottom

- **Prova messages:**
  - "prova" label above: DM Sans 10px, `colors.purple.soft`, uppercase, `0.06em` letter-spacing, 6px margin bottom
  - Bubble: padding 12px 14px, radius `4px 14px 14px 14px` (sharp top-left corner), bg `colors.purple.faint`
  - Text: DM Sans 13px, `colors.text.secondary`, line-height 1.55
  - Margin bottom: 18px

- **User messages:**
  - Right-aligned (alignItems: flex-end)
  - Bubble: padding 12px 14px, radius `14px 4px 14px 14px` (sharp top-right corner), bg `rgba(255,255,255,0.07)`
  - Text: DM Sans 13px, `colors.text.tertiary`, line-height 1.55
  - Max width: 85%
  - Margin bottom: 18px

- **Typing indicator:**
  - Three dots, each 6x6, radius 3, color `rgba(168,130,255,0.3)`
  - Gap: 5px
  - Animate: sequential opacity pulse (0.3 → 1 → 0.3), 200ms stagger between dots
  - Show when waiting for Prova's response

**Input bar:**
- Padding: 8px 16px 16px (accounts for home indicator)
- Container: height 44, radius 22 (pill shape), bg `colors.bg.input`, border `colors.border.DEFAULT`
- Placeholder: "Reply..." in DM Sans 13px, `colors.text.faint`
- Send button: 28x28, radius 14, gradient background, "↑" arrow in white, aligned right inside the pill
- Send button only visible when text is entered
- Keyboard avoiding behavior: `KeyboardAvoidingView` with `behavior="padding"` on iOS

**Streaming behavior:**
- When Prova is responding, show typing indicator
- As streamed chunks arrive, replace typing indicator with the growing message
- Message text should appear to type out smoothly (append each chunk as it arrives)

**Session ending trigger:**
- When `processMessage` returns `meta.isClosingMessage: true`:
  - Display Prova's final message normally
  - After a 2-second pause, auto-navigate to the ending screen
  - The user cannot send another message after the closing message

---

### 9.6 Session Ending Screen (`app/(app)/(session)/ending.tsx`)

**Behavior:** Transition screen shown while `endSession` cloud function runs (PDF + card generation). Navigate to reveal screen when complete.

**Layout:**
- Full screen, centered
- Background: radial gradient centered at 50% 50%, `rgba(120,80,200,0.1)` to `colors.bg.primary` at 70%

**Elements:**
1. Pulsing circle: 64x64, radius 32, border `colors.purple.border`, inner circle 24x24 radius 12 `rgba(168,130,255,0.3)`. Animate: pulse scale 1.0 → 1.15 → 1.0, 2s infinite, ease-in-out
2. Text: "Something real came through here." — Instrument Serif 18px, white, centered, 28px below circle
3. Subtext: "Prova is putting together what it found. This takes a moment." — DM Sans 12px, `colors.text.muted`, centered, 10px below, line-height 1.6
4. Progress bar: 60% container width, height 2px, radius 1, bg `colors.border.light`. Fill animates from 0% to ~90% over 25 seconds (intentionally never reaches 100% until data arrives), gradient fill `colors.gradient.primaryButton` at 90deg

**On data received:** Progress bar jumps to 100%, 500ms pause, then navigate to reveal screen.

---

### 9.7 Card Reveal Screen (`app/(app)/(session)/reveal.tsx`)

**Layout:**
- Full screen, centered
- Background: radial gradient centered at 50% 40%, `rgba(120,80,200,0.12)` to `colors.bg.primary` at 65%

**Card display:**
- Width: 190, height: 260, radius 16
- Background: gradient `colors.gradient.cardSurface` at 145deg
- Border: `colors.purple.border`
- Shadow: `shadows.cardReveal`
- **If using 3D (expo-three):** render a plane with the card texture, allow rotation on drag, apply metallic shader on the surface
- **If using 2D fallback:** use `react-native-reanimated` for tilt-on-drag with `react-native-skia` for the metallic gradient overlay that shifts with tilt angle
- Art area: top 150px of card, overlaid with gradient fade to card background at bottom + metallic color overlay at low opacity
- Title: Instrument Serif 14px, white, 14px padding
- Date: DM Sans 9px, `colors.purple.soft`, uppercase
- Watermark: "thinkprova.com" DM Sans 8px, `colors.text.ghost`, bottom of card

**Below the card:**
- "Your card is ready" — Instrument Serif 16px, white, 24px below card
- "Tap to flip · Pinch to zoom" — DM Sans 12px, `colors.text.muted`, 6px below
- Two buttons side by side, 10px gap, 28px below:
  - "View PDF": flex 1, height 44, radius 12, bg `rgba(255,255,255,0.06)`, border `colors.border.strong`, DM Sans 13px `colors.text.tertiary`
  - "Save Card": flex 1, height 44, radius 12, gradient background, DM Sans 13px semibold white

**Reveal animation:**
- Card starts scaled at 0.8 + opacity 0, translates up 30px
- Animates to scale 1.0, opacity 1, translateY 0 over 600ms with spring easing
- Title text fades in 300ms after card
- Buttons fade in 200ms after title

**Save card behavior:**
- Capture the card view as an image using `react-native-view-shot`
- Add watermark overlay
- Save to camera roll using `expo-media-library`
- Show brief toast "Saved to photos"

---

### 9.8 Cards Tab (`app/(app)/(cards)/index.tsx`)

**Layout:**
- Header: padding 12px 20px 16px
  - "Your cards" — Instrument Serif 22px, white
  - "{n} sessions completed" — DM Sans 11px, `colors.text.muted`, 4px below

**Cards grid:**
- 2 columns, 12px gap, horizontal padding 16px
- Each card thumbnail: height 160, radius 14
- Card background: linear gradient from the session's `cardMetallicColor` at 15% opacity to `colors.bg.primary` at 90%
- Border: `colors.border.light`
- Content aligned bottom, padding 14px:
  - Title: Instrument Serif 13px, white, line-height 1.3
  - Date: DM Sans 10px, `colors.text.muted`, 4px below

**Empty slot (always last):**
- Height 160, radius 14, dashed border `colors.border.light` (use `borderStyle: 'dashed'`)
- Center: 32x32 circle, border `colors.purple.border`, "+" in `rgba(168,130,255,0.3)` 18px
- Tapping starts a new session

**Behavior:**
- Query: `users/{uid}/sessions` where `status == 'complete'` ordered by `completedAt` descending
- Tapping a card → navigate to `(cards)/[sessionId]` which shows the full 3D card + PDF access
- Pull-to-refresh to re-query

**Bottom tab bar:**
- Height: 56px + safe area bottom
- Top border: `colors.border.subtle`
- Three tabs: Session, Cards, Settings
- Active tab: icon + label in `colors.purple.DEFAULT`
- Inactive tab: icon + label in `colors.text.faint`
- Icons: simple geometric shapes (circle for session, rounded square for cards, lines for settings) — use Lucide icons or custom SVG

---

### 9.9 PDF View (`app/(app)/(cards)/[sessionId].tsx`)

**Header:**
- Left: "← Back" in DM Sans 13px, `colors.purple.soft` — navigates back to cards tab
- Right: "↓ Save" in DM Sans 13px, `colors.purple.soft` — shares/saves PDF using `expo-sharing`

**Content (ScrollView):**
- Padding: 20px horizontal, 20px top

1. Title: Instrument Serif 18px, white (the card title, e.g. "The Reluctant Empiricist")
2. Date: DM Sans 11px, `colors.text.faint`, 4px below title, 24px margin bottom
3. Four sections, each:
   - Label: DM Sans 10px, `colors.purple.DEFAULT`, uppercase, `0.1em` letter-spacing, 8px margin bottom
   - Body text: DM Sans 12px, `colors.text.tertiary`, line-height 1.65
   - Divider after each except last: `colors.border.subtle`, 18px margin top, 20px margin bottom
4. Readings callout: 8px margin top
   - Padding 14px, radius 12
   - Background `colors.purple.ghost`
   - Border `rgba(168,130,255,0.1)`
   - Label: "Recommended readings" in DM Sans 10px, `colors.purple.soft`, uppercase
   - Each reading: book title in `colors.text.tertiary`, author after em dash, one-sentence reason below in `colors.text.muted`

**Data source:** Fetch PDF content from Firestore session document or parse the stored PDF. Recommended: store the raw `PDFOutput` JSON in the session document alongside the PDF file reference so the in-app view renders from structured data (faster) while the actual PDF file is available for download/share.

---

### 9.10 Settings Screen (`app/(app)/(settings)/index.tsx`)

**Header:**
- "Settings" — Instrument Serif 22px, white, padding 12px 20px 20px

**Content:**
- Horizontal padding: 20px

**Account section:**
- Three rows: Display name, Email, Two-factor auth
- Each row: flex row, space-between, padding 14px vertical
- Label: DM Sans 13px, `colors.text.tertiary`
- Value: DM Sans 13px, `colors.text.muted` with " ›" suffix
- Bottom border: `colors.border.subtle`

**24px spacer**

**Links section:**
- "Past sessions" — navigates to full session list
- "Privacy policy" — opens in-app browser
- "Terms of service" — opens in-app browser
- Same row styling as account section

**32px spacer**

**Danger zone:**
- "Delete account" — DM Sans 13px, `colors.danger`, no border
- Tapping shows confirmation alert with destructive action

**Bottom tab bar:** Same as cards tab, with Settings tab active

---

## 10. Session Lifecycle State Machine

```
[App Open]
    │
    ▼
[Auth Check] ──── not authenticated ────► [Auth Screen]
    │                                           │
    │ authenticated                        sign in/up
    │                                           │
    ▼                                           ▼
[Check hasCompletedOnboarding]
    │                    │
    │ true               │ false
    ▼                    ▼
[Intent Screen]    [Onboarding Screen]
    │                    │
    │                    │ completes 4 MCQs
    │                    ▼
    │◄───────────────────┘
    │
    │ intent selected
    ▼
[Create Session Doc] ── status: 'active'
    │
    ▼
[Conversation Screen]
    │
    │ each message:
    │   1. Write user message to Firestore
    │   2. Call processMessage
    │   3. Write Prova response to Firestore
    │   4. Check meta.isClosingMessage
    │
    │ if isClosingMessage === true:
    ▼
[Ending Screen] ── call endSession
    │
    │ endSession completes:
    │   1. generatePDF → writes to storage
    │   2. generateCard → returns title + art
    │   3. Update session: status: 'complete'
    │
    ▼
[Card Reveal Screen]
    │
    │ user taps "View PDF"     user taps "Save Card"
    ▼                          ▼
[PDF View]              [Save to camera roll]
    │
    ▼
[Cards Tab] ◄── accessible anytime from bottom nav


INTERRUPTED SESSION:
[Conversation Screen] ── app closes / crashes
    │
    │ messages already saved to Firestore
    │
    ▼
[App Reopens] → [Auth Check] → [Check for active session]
    │
    │ active session found within 24 hours
    ▼
[Resume Conversation] ── reload messages, continue


INCOMPLETE SESSION (>24 hours):
    │
    │ session.lastMessageAt > 24 hours ago
    ▼
[Mark session as 'incomplete'] ── no PDF, no card generated
```

---

## 11. API Call Patterns

### Client → Cloud Function Communication

```typescript
// lib/api.ts

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Onboarding
export const generateOnboarding = httpsCallable<
  { userId: string; isFirstSession: boolean },
  { prompts: OnboardingPrompt[] }
>(functions, 'generateOnboarding');

// Process message (consider using streaming alternative below)
export const processMessage = httpsCallable<
  { userId: string; sessionId: string; userMessage: string },
  { response: string; meta: MessageMeta }
>(functions, 'processMessage');

// End session
export const endSession = httpsCallable<
  { userId: string; sessionId: string },
  { cardTitle: string; cardArtUrl: string; cardMetallicColor: string; pdfUrl: string }
>(functions, 'endSession');
```

### Streaming Alternative for Conversation

For sub-3-second perceived response times, implement streaming:

```typescript
// In processMessage Cloud Function:
// 1. Use Anthropic streaming API
// 2. Write partial response to Firestore:
//    sessions/{sessionId}/streamingResponse = { text: '...', isComplete: false }
// 3. Client listens with onSnapshot:

import { doc, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  doc(db, `users/${uid}/sessions/${sessionId}`),
  (snapshot) => {
    const data = snapshot.data();
    if (data?.streamingResponse) {
      updateDisplayedMessage(data.streamingResponse.text);
      if (data.streamingResponse.isComplete) {
        finalizeMessage(data.streamingResponse);
        unsubscribe();
      }
    }
  }
);
```

---

## 12. Key Dependencies (package.json)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-font": "~13.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-media-library": "~17.0.0",
    "expo-sharing": "~13.0.0",
    "expo-three": "^8.0.0",
    "three": "~0.160.0",
    "react-native": "0.76.x",
    "react-native-reanimated": "~3.16.0",
    "@shopify/react-native-skia": "~1.5.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-view-shot": "~4.0.0",
    "zustand": "^5.0.0",
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/auth": "^21.0.0",
    "@react-native-firebase/firestore": "^21.0.0",
    "@react-native-firebase/storage": "^21.0.0",
    "@react-native-firebase/functions": "^21.0.0",
    "lucide-react-native": "^0.400.0",
    "react-native-svg": "~15.8.0"
  }
}
```

Cloud Functions dependencies:
```json
{
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^6.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "puppeteer": "^23.0.0"
  }
}
```

---

## 13. Environment Variables

```
# .env (client — via expo-constants or app.config.ts)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Cloud Functions environment (.env or Secret Manager)
ANTHROPIC_API_KEY=
MIN_EXCHANGES=12
ART_LIBRARY_BUCKET=prova-art-library
```

---

## 14. Build Order

Recommended implementation sequence for Cursor:

**Phase 1 — Skeleton**
1. Initialize Expo project with TypeScript
2. Set up Expo Router file structure
3. Load fonts (DM Sans + Instrument Serif)
4. Create theme constants file
5. Build `ScreenWrapper` and `TabBar` components
6. Implement navigation flow (auth gate → tabs)

**Phase 2 — Auth**
7. Set up Firebase project and config
8. Implement sign-in screen UI
9. Wire up Firebase Auth (Apple, Google, Email)
10. Build auth state management with Zustand
11. Implement sign-up flow

**Phase 3 — Conversation Core**
12. Build conversation screen UI (message list, input, header)
13. Create `MessageBubble` component (Prova and user variants)
14. Implement typing indicator
15. Deploy `processMessage` Cloud Function with Anthropic integration
16. Wire up message send → Cloud Function → display response
17. Implement progressive Firestore message saving
18. Implement session resumption on app reopen

**Phase 4 — Session Lifecycle**
19. Build intent selection screen
20. Build onboarding screen with MCQ components
21. Deploy `generateOnboarding` Cloud Function
22. Implement session ending detection (read `isClosingMessage` from response meta)
23. Build ending transition screen
24. Deploy `endSession`, `generatePDF`, `generateCard` Cloud Functions

**Phase 5 — Card System**
25. Build card reveal screen with animation
26. Implement 3D card (expo-three) or 2D fallback (reanimated + skia)
27. Build cards tab grid
28. Implement card save to camera roll
29. Build PDF view screen

**Phase 6 — Polish**
30. Settings screen
31. Session history management
32. Delete account flow
33. Error states and offline handling
34. Loading states and skeleton screens
35. Animation polish pass
```
