import CryptoJS from "crypto-js";

// Get encryption key from environment variable
const getEncryptionKey = (): string => {
  // In the browser, we'll get this from a secure endpoint
  // For now, we'll use a fallback but this should be fetched securely
  return import.meta.env.VITE_ENCRYPTION_KEY || "fallback-key-change-in-production";
};

export interface EncryptedData {
  encryptedMessage: string;
  encryptedCategory: string;
  encryptedPhotoUrl?: string;
  encryptedVideoUrl?: string;
  encryptedVideoMetadata?: string;
  iv: string;
  timestamp: string;
}

/**
 * Encrypt sensitive report data using AES-256 encryption
 */
export function encryptReportData(data: {
  message: string;
  category: string;
  photo_url?: string;
  video_url?: string;
  video_metadata?: any;
}): EncryptedData {
  const iv = CryptoJS.lib.WordArray.random(16);
  const timestamp = new Date().toISOString();

  const encryptionKey = getEncryptionKey();

  const encryptedMessage = CryptoJS.AES.encrypt(data.message, encryptionKey, {
    iv,
  }).toString();
  const encryptedCategory = CryptoJS.AES.encrypt(
    data.category,
    encryptionKey,
    { iv },
  ).toString();
  const encryptedPhotoUrl = data.photo_url
    ? CryptoJS.AES.encrypt(data.photo_url, encryptionKey, { iv }).toString()
    : undefined;
  const encryptedVideoUrl = data.video_url
    ? CryptoJS.AES.encrypt(data.video_url, encryptionKey, { iv }).toString()
    : undefined;
  const encryptedVideoMetadata = data.video_metadata
    ? CryptoJS.AES.encrypt(
        JSON.stringify(data.video_metadata),
        encryptionKey,
        { iv },
      ).toString()
    : undefined;

  return {
    encryptedMessage,
    encryptedCategory,
    encryptedPhotoUrl,
    encryptedVideoUrl,
    encryptedVideoMetadata,
    iv: iv.toString(),
    timestamp,
  };
}

/**
 * Decrypt report data for admin viewing
 */
export function decryptReportData(encryptedData: EncryptedData): {
  message: string;
  category: string;
  photo_url?: string;
  video_url?: string;
  video_metadata?: any;
} {
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  const encryptionKey = getEncryptionKey();

  const decryptedMessage = CryptoJS.AES.decrypt(
    encryptedData.encryptedMessage,
    encryptionKey,
    { iv },
  ).toString(CryptoJS.enc.Utf8);

  const decryptedCategory = CryptoJS.AES.decrypt(
    encryptedData.encryptedCategory,
    encryptionKey,
    { iv },
  ).toString(CryptoJS.enc.Utf8);

  const decryptedPhotoUrl = encryptedData.encryptedPhotoUrl
    ? CryptoJS.AES.decrypt(encryptedData.encryptedPhotoUrl, encryptionKey, {
        iv,
      }).toString(CryptoJS.enc.Utf8)
    : undefined;

  const decryptedVideoUrl = encryptedData.encryptedVideoUrl
    ? CryptoJS.AES.decrypt(encryptedData.encryptedVideoUrl, encryptionKey, {
        iv,
      }).toString(CryptoJS.enc.Utf8)
    : undefined;

  const decryptedVideoMetadata = encryptedData.encryptedVideoMetadata
    ? JSON.parse(
        CryptoJS.AES.decrypt(
          encryptedData.encryptedVideoMetadata,
          encryptionKey,
          {
            iv,
          },
        ).toString(CryptoJS.enc.Utf8),
      )
    : undefined;

  return {
    message: decryptedMessage,
    category: decryptedCategory,
    photo_url: decryptedPhotoUrl,
    video_url: decryptedVideoUrl,
    video_metadata: decryptedVideoMetadata,
  };
}

/**
 * Hash admin credentials for secure storage (deprecated - use server-side auth)
 * @deprecated Use server-side authentication with bcrypt instead
 */
export function hashAdminCredentials(
  username: string,
  password: string,
): string {
  const encryptionKey = getEncryptionKey();
  return CryptoJS.SHA256(username + password + encryptionKey).toString();
}

/**
 * Verify admin credentials (deprecated - use server-side auth)
 * @deprecated Use server-side authentication with bcrypt instead
 */
export function verifyAdminCredentials(
  username: string,
  password: string,
  storedHash: string,
): boolean {
  const computedHash = hashAdminCredentials(username, password);
  return computedHash === storedHash;
}
