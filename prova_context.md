# Prova — Project Context Document

## What Prova Is

Prova is a structured introspection tool. It helps people articulate how they think through sustained, AI-driven conversation. The output is a document that makes visible the reasoning patterns, blind spots, and internalized norms that usually go unexamined.

Prova is not therapy. It is not a personality quiz. It is not a journaling app. It is the conversation you would have with a brilliant, patient, intellectually serious friend who asks the right follow-up questions and doesn't let you off the hook when you give a vague answer.

The core value proposition is **perspective change** — not just self-knowledge, but the kind of shift in how you see yourself that only comes from genuine intellectual friction. This is grounded in Oishi & Westgate's concept of psychological richness: the experiences that change how we see things are the ones that actually matter.

---

## Theoretical Grounding

### Kelly — Norm Internalization & Avowal
People hold beliefs in two distinct ways. Internalized beliefs were absorbed automatically and feel self-evidently true. Avowed beliefs were consciously adopted. The most interesting — and hardest to examine — beliefs are internalized ones, because the person holding them often can't explain why they hold them. Prova's job is to surface this gap. The key conversational move: ask about what someone *did*, not why they did it. Behavioral description gets closer to internalized belief than direct opinion.

### Dover — The Conversational Self
Good conversation is not turn-taking self-disclosure (the "revelation picture"). It is a practice in which both parties hold their self-understanding open to revision. Dover calls this "taking one another seriously" — which requires input-seeking, abdication of interpretive sovereignty, and reciprocity. For Prova, this means the AI's role is not to extract and organize the user's views. It is to introduce genuine friction that shifts how the user sees themselves. Prova should never feel like a mirror. It should feel like a thoughtful interlocutor.

### Ismael — Humans Are All Specificity
Human behavior cannot be captured in general laws because deliberation draws on an unlimited store of personal history, belief, and value. This means Prova must never reduce a person to a type. No fixed taxonomy. No categorical labels that flatten the specificity of what someone actually said. The PDF output should feel particular to this person on this day, not like a horoscope or Myers-Briggs result.

### Oishi & Westgate — Psychological Richness
A good life has three dimensions: happiness, meaning, and psychological richness. Richness is characterized by variety, novelty, and especially **perspective change**. Prova's output — the moment when someone sees their own reasoning from the outside — is a psychologically rich experience. This is the frame for what Prova produces: not a diagnosis, not a score, but a perspective shift.

---

## Product Design

### Onboarding
- User creates an account (Apple, Google, or email/password with 2FA)
- First session is preceded by a short onboarding sequence of dynamically generated MCQ-style prompts
- These are NOT static questions from a bank — the model generates them fresh each time
- They serve two purposes: warm the user up to the kind of thinking Prova does, and establish loose session intent
- The MCQs should feel like the beginning of a conversation, not a form
- Example format: a small opinion prompt with a response that hints at what Prova will explore underneath it
- For first-time users, a "let Prova lead" default intent is recommended

### Session Intent
Intent can be:
- **Open** — user doesn't have something specific, Prova finds what's worth examining
- **Directed** — user comes in with a specific belief, decision, or pattern they want to examine
- **Revisiting** — user wants to go deeper on something from a previous session

Intent changes session to session and evolves as the user accumulates sessions and self-knowledge.

### The Conversation
- Prova leads the conversation
- Sustained back-and-forth with follow-ups, pushback, and genuine probing
- Tone: warm, curious, supportive — not adversarial, not a grill session
- Prova asks about what the user *did*, not just what they *think*
- Prova does not pick responses from a bank — it reasons actively in each exchange
- Past sessions are always available to Prova as context, used with discretion
- Prova references past sessions when genuinely useful (e.g. user expresses a pattern, Prova can name it), not as a default opener
- Prova also uses past sessions to calibrate its approach silently — adjusting depth, tone, and focus

### Session Ending
- Prova decides when to end the session, not the user and not a timer
- Prova reads conversation quality signals: response length, specificity, engagement, whether the conversation is opening up or going in circles
- Three ending conditions: wind-down (user energy dropping), diminishing returns (circular conversation), natural completion (something genuinely landed)
- There is a soft floor — sessions need enough depth for the output to feel earned
- Prova signals the ending intentionally before generating output — it doesn't cut off abruptly

### The PDF Output
Four layers, generated at the end of each session:

1. **What you said** — a faithful summary of the user's positions and statements
2. **How you reasoned** — the patterns, moves, and structures in how they got there
3. **Where you got stuck** — moments of hesitation, contradiction, or circular reasoning
4. **What you might not be seeing** — the honest feedback layer; blind spots Prova observed

The PDF also includes:
- Recommended readings and topics relevant to what came up in the session
- Everything written in language that feels particular to this person and this conversation, never generic

The PDF is private by default and stored in the user's account.

### The Card
- Each session produces a card alongside the PDF
- The card has: a generated title (e.g. "The Reluctant Empiricist"), a piece of art matched to the title, and a metallic color treatment
- The card is 3D and rotatable in the app
- Downloadable as a static image with a subtle thinkprova.com watermark
- No philosopher matching — the title is original and generated based on the full session
- Art is sourced from a curated library of ~100 open source images (nature, space, abstract) for v1
- AI matches the art to the title
- A handmade artist library is a v2 goal

### The Cards Tab
- All past cards live here in chronological order
- Each card displays its title and date
- Tapping a card opens its attached PDF
- The collection becomes a timeline of who the user has been across sessions
- The empty space in the collection is a natural retention mechanic — no notifications needed

---

## Technical Decisions

- **Model:** Anthropic API (Claude). The system prompt is where Prova's intelligence lives.
- **Auth:** Apple Sign-In, Google Sign-In, email/password — all with 2FA
- **Monetization:** None for v1
- **Art:** ~100 curated open source images for v1; AI matches title to image
- **PDF generation:** Server-side at session end
- **Card rendering:** 3D in-app (Three.js or equivalent), flattened for download

---

## What Prova Is Not

- Not therapy
- Not a personality quiz
- Not a journaling app
- Not a chatbot
- Not a self-help tool with advice
- Not a mirror that just reflects what you said back at you
- Not a product that claims to fix or change anyone

Prova uncovers. It does not fix.
