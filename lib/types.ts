import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  hasCompletedOnboarding: boolean;
  sessionCount: number;
}

export type SessionIntent = 'open' | 'directed' | 'revisiting';
export type SessionStatus = 'active' | 'incomplete' | 'complete';

export interface OnboardingAnswer {
  question: string;
  answer: string;
  reaction: string;
}

export interface Session {
  id: string;
  userId: string;
  intent: SessionIntent;
  status: SessionStatus;
  revisitingSessionId?: string;
  directedPrompt?: string;
  onboardingAnswers?: OnboardingAnswer[];
  exchangeCount: number;
  startedAt: Timestamp;
  lastMessageAt: Timestamp;
  completedAt?: Timestamp;
  cardTitle?: string;
  cardArtRef?: string;
  cardMetallicColor?: string;
  pdfRef?: string;
  pdfOutput?: PDFOutput;
}

export type MessageRole = 'prova' | 'user';

export type SessionQuality = 'building' | 'peaking' | 'winding_down' | 'complete';

export interface MessageMeta {
  isClosingMessage: boolean;
  sessionQuality: SessionQuality;
  exchangeNumber: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: Timestamp;
  meta?: MessageMeta;
}

export interface PDFOutput {
  whatYouSaid: string;
  howYouReasoned: string;
  whereYouGotStuck: string;
  whatYouMightNotBeSeeing: string;
  recommendedReadings: Array<{
    title: string;
    author: string;
    reason: string;
  }>;
}

export interface Card {
  sessionId: string;
  title: string;
  artRef: string;
  artUrl?: string;
  metallicColor: string;
  createdAt: Timestamp;
}

export interface OnboardingPrompt {
  question: string;
  options: string[];
  provaReactions: Record<number, string>;
}

export interface ArtAsset {
  id: string;
  storageRef: string;
  tags: string[];
  dominantColor: string;
  mood: string;
  source: string;
  license: string;
}
