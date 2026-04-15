import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export const getPDFUrl = async (userId: string, sessionId: string) => {
  const pdfRef = ref(storage, `users/${userId}/pdfs/${sessionId}.pdf`);
  return getDownloadURL(pdfRef);
};

export const getArtUrl = async (artRef: string) => {
  const artStorageRef = ref(storage, artRef);
  return getDownloadURL(artStorageRef);
};

export const getCardExportUrl = async (userId: string, sessionId: string) => {
  const cardRef = ref(storage, `users/${userId}/exports/${sessionId}_card.png`);
  return getDownloadURL(cardRef);
};
