export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function validateFile(
  file: File,
  options: { maxSize: number; allowedTypes: string[] }
): { valid: boolean; error?: string } {
  if (!options.allowedTypes.includes(file.type)) {
    const allowed = options.allowedTypes.map(t => t.split('/')[1]).join(', ');
    return { valid: false, error: `Invalid file type. Allowed: ${allowed}` };
  }

  if (file.size > options.maxSize) {
    const maxMB = Math.round(options.maxSize / (1024 * 1024));
    return { valid: false, error: `File too large. Maximum size: ${maxMB}MB` };
  }

  return { valid: true };
}

const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

const MAGIC_BYTES_OFFSET: Record<string, { offset: number; bytes: number[] }> = {
  'video/mp4': { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // 'ftyp'
  'video/webm': { offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML header
};

export function validateMagicBytes(header: Uint8Array, mimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[mimeType];
  if (expectedBytes) {
    if (header.length < expectedBytes.length) return false;
    return expectedBytes.every((byte, i) => header[i] === byte);
  }

  const offsetCheck = MAGIC_BYTES_OFFSET[mimeType];
  if (offsetCheck) {
    const { offset, bytes } = offsetCheck;
    if (header.length < offset + bytes.length) return false;
    return bytes.every((byte, i) => header[offset + i] === byte);
  }

  // No magic bytes to check for this type
  return true;
}
