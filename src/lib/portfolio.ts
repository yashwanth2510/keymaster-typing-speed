/**
 * Encrypted Portfolio Link Module
 * Handles encrypted storage and runtime decryption for creator attribution:
 * Yashwanth Tadikonda (https://yashwanth2510.github.io/yashwanth_tadikonda_portfolio/)
 */

// Multi-stage cipher payload: XOR-transformed hex stream encoded in Base64
const ENCRYPTED_PAYLOAD =
  'MjMzZjNmM2IzODcxNjQ2NDMyMmEzODIzM2MyYTI1M2YyMzc5N2U3YTdiNjUyYzIyM2YyMzNlMjk2NTIyMjQ2NDMyMmEzODIzM2MyYTI1M2YyMzE0M2YyYTJmMjIyMDI0MjUyZjJhMTQzYjI0MzkzZjJkMjQyNzIyMjQ2NA==';
const CIPHER_KEY = 0x4b; // 'K' for KeyMaster

/**
 * Safely decrypts the portfolio URL at runtime.
 */
export function getDecryptedPortfolioUrl(): string {
  try {
    // Stage 1: Base64 decode to retrieve hex stream
    const hexStream = typeof window !== 'undefined' && window.atob
      ? window.atob(ENCRYPTED_PAYLOAD)
      : Buffer.from(ENCRYPTED_PAYLOAD, 'base64').toString('utf-8');

    // Stage 2: Invert XOR byte cipher with CIPHER_KEY
    let decrypted = '';
    for (let i = 0; i < hexStream.length; i += 2) {
      const byteVal = parseInt(hexStream.substring(i, i + 2), 16);
      decrypted += String.fromCharCode(byteVal ^ CIPHER_KEY);
    }

    return decrypted;
  } catch (error) {
    // Safe fallback to prevent application breakage
    return 'https://yashwanth2510.github.io/yashwanth_tadikonda_portfolio/';
  }
}

/**
 * Direct navigation handler that decrypts the destination on invocation
 */
export function openCreatorPortfolio(event?: { stopPropagation?: () => void }): void {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  const targetUrl = getDecryptedPortfolioUrl();
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
