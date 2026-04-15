import * as admin from 'firebase-admin';

admin.initializeApp();

export { generateOnboarding } from './generateOnboarding';
export { processMessage } from './processMessage';
export { endSession } from './endSession';
