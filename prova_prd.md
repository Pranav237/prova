# Prova — Product Requirements Document
### Version 1.0

---

## 1. Overview

**Product name:** Prova
**Platform:** Mobile (iOS first)
**Version scope:** V1 — core conversation experience, PDF output, card system, account management
**Monetization:** None in V1

Prova is a structured introspection tool that helps people examine how they think through sustained AI-driven conversation. Each session ends with a private PDF report and a collectible card. Over time, the card collection becomes a timeline of the user's evolving self-understanding.

---

## 2. Goals

- Deliver a complete, end-to-end introspection session experience
- Produce a PDF output that feels genuinely personal and earned
- Create a card and collection system with natural retention
- Establish a technically stable foundation to build V2 on

---

## 3. User Stories

| As a... | I want to... | So that... |
|---|---|---|
| New user | Understand what Prova does before committing to a session | I feel safe opening up |
| New user | Be eased into the conversation format | It doesn't feel like a blank text box |
| Returning user | Start a session with a specific thing in mind | I can go deeper on something I've been thinking about |
| Returning user | Have Prova remember past sessions | I don't have to re-explain myself |
| User | Have Prova end the session at the right moment | The output feels earned, not arbitrary |
| User | Receive a PDF that feels like it actually knows me | I get real value from each session |
| User | See my card collection over time | I can track how I've changed |
| User | Download my card | I can share it if I want to |
| User | Know my sessions are secure | I feel comfortable sharing honest thoughts |

---

## 4. Features

### 4.1 Authentication

**Requirements:**
- Sign in with Apple
- Sign in with Google
- Email and password registration
- Two-factor authentication (2FA) available for all auth methods
- Standard password reset flow

**Notes:**
- Account is required to use Prova — no guest mode
- Account enables session history, card collection, and past session context

---

### 4.2 Onboarding

**Requirements:**
- Triggered on first app open after account creation
- Consists of 3–4 dynamically generated MCQ-style prompts
- Prompts are generated fresh by the model — not pulled from a static bank
- Each prompt presents a small opinion or scenario, the user selects a response, and Prova offers a brief follow-up observation that hints at what the session will explore
- Final MCQ establishes session intent: open (let Prova lead) or directed (user has something specific in mind)
- Default recommended intent for first-time users: open

**Prompt format:**
- Short opinion prompt (1–2 sentences)
- 2–3 response options
- Brief Prova reaction after selection (1 sentence, warm and curious in tone)

**Out of scope for V1:**
- Onboarding personalization based on previous session data

---

### 4.3 Session Intent Selection

**Requirements:**
- At the start of each session (after first), user is presented with intent options:
  - **Open** — Prova leads, finds what's worth examining
  - **Directed** — user has a specific belief, decision, or pattern to examine
  - **Revisiting** — user wants to go deeper on a previous session (user selects which session)
- Intent selection should feel like a natural conversation opener, not a form
- For open intent, Prova begins with a dynamically generated prompt similar to onboarding
- For directed intent, user types a brief framing of what they want to explore
- For revisiting intent, user selects a past card/session and Prova loads that session's PDF as context

---

### 4.4 The Conversation

**Requirements:**
- Full back-and-forth text conversation between user and Prova
- Prova actively reasons in each exchange — no response banks or templates
- Prova's conversational behavior:
  - Asks about what the user *did*, not just what they *think*
  - Uses follow-up questions to probe beneath surface responses
  - Introduces gentle friction when the user is vague or circular
  - Maintains warm, curious, non-adversarial tone throughout
  - Never gives advice or tells the user what to think
  - Does not reference past sessions unless directly relevant and useful
  - Uses past sessions silently to calibrate depth and approach
- Conversation is single-threaded (no branching)
- No file or media uploads in V1

**Powered by:** Anthropic API (Claude), with a system prompt encoding Prova's conversational behavior, tone, and output structure

---

### 4.5 Session Ending

**Requirements:**
- Prova determines when to end the session based on conversation quality signals:
  - **Wind-down:** user responses getting shorter, less specific, more passive
  - **Diminishing returns:** conversation going in circles, no new ground being covered
  - **Natural completion:** something genuinely landed, clear synthesis point reached
- Minimum session depth enforced before ending is permitted (TBD: approximately 10–15 meaningful exchanges)
- Prova signals the ending explicitly before generating output (e.g. "I think we've found something real here — let me put this together for you")
- User cannot manually end a session before the minimum depth is reached; they can pause or exit (session is saved as incomplete)
- Incomplete sessions do not generate a PDF or card

---

### 4.6 PDF Generation

**Requirements:**
- Generated server-side at session end
- Stored privately in the user's account
- Structured in four named layers:

  **1. What you said**
  Faithful summary of the user's positions, statements, and expressed views from the session.

  **2. How you reasoned**
  The patterns, moves, and structures in how the user got to their positions. Written as observation, not judgment.

  **3. Where you got stuck**
  Moments of hesitation, contradiction, circular reasoning, or avoidance. Named specifically, not generically.

  **4. What you might not be seeing**
  Blind spots Prova observed. The most honest and most valuable layer. Written with care — not as critique but as genuine offer.

- PDF also includes: recommended readings and topics relevant to what emerged in the session
- Language throughout must feel particular to this person and this session — never generic or templated
- PDF is formatted cleanly and readably — not a wall of text
- PDF filename includes session date

**Out of scope for V1:**
- User ability to edit or annotate the PDF
- PDF sharing directly from the app

---

### 4.7 The Card

**Requirements:**
- One card generated per completed session
- Card elements:
  - **Title:** generated by the model based on the full session (e.g. "The Reluctant Empiricist") — original, specific, not a philosopher name
  - **Art:** selected by AI from a curated library of ~100 open source images (nature, space, abstract) matched to the title
  - **Metallic color treatment:** applied over the art, color determined by the image
- Card is displayed in 3D and is rotatable in-app
- Card reveal is animated — builds anticipation before the user sees it
- Card is downloadable as a static 2D image
- Downloaded image includes a subtle thinkprova.com watermark
- Card is private by default; download is how the user chooses to share it

**Art library for V1:**
- ~100 curated open source images
- Sources: public domain repositories (e.g. Unsplash, Rijksmuseum open access, NASA public domain)
- Curated for aesthetic quality and tonal range
- AI matches title to image based on mood, theme, and visual character

---

### 4.8 Cards Tab

**Requirements:**
- Accessible from the main navigation
- Displays all past completed session cards in reverse chronological order
- Each card entry shows: card title, session date, card art thumbnail
- Tapping a card opens the full 3D card view
- From the full card view, user can access the attached PDF
- Empty state (no sessions yet) is designed to feel inviting, not empty — communicates what the collection will become
- No limit on number of cards stored in V1

---

### 4.9 Account & Settings

**Requirements:**
- View and edit profile (display name, email)
- Manage 2FA settings
- View all past sessions and PDFs
- Delete a session (removes card and PDF)
- Delete account (removes all data)
- Privacy policy and terms of service accessible from settings

---

## 5. Non-Functional Requirements

**Privacy:**
- Session content is private to the user — not used for model training
- No session content shared with third parties
- All data encrypted at rest and in transit
- Clear, plain-language privacy policy

**Performance:**
- PDF generation should complete within 30 seconds of session end
- Card generation should complete within 15 seconds of PDF generation
- Conversation response time under 3 seconds per exchange

**Reliability:**
- Session state saved progressively — user does not lose a session if the app closes mid-conversation
- Incomplete sessions resumable within 24 hours

---

## 6. Out of Scope for V1

- Android app
- Web app
- Monetization / subscription
- Social features (sharing between users, public profiles)
- Group or multi-user sessions
- Voice input
- Notifications or push messaging
- Handmade artist card library (V2)
- In-app PDF annotation
- Session search or tagging
- Export of full session history

---

## 7. Open Questions

- What is the exact minimum exchange count before a session can end?
- What happens to an incomplete session after 24 hours — auto-deleted or archived?
- Does the card title generate before or after the PDF, or simultaneously?
- What is the fallback if no art in the library is a good match for a title?
- Should the user be able to regenerate a card title they dislike?

---

## 8. Success Metrics for V1

- Users complete at least one full session (reach PDF + card)
- Users return for a second session within 30 days
- Users open the cards tab on return visits
- PDF rated as feeling personal and specific (qualitative feedback)
- Session completion rate (sessions started vs. sessions that produce a PDF)
