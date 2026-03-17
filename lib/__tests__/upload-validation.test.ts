import { describe, it, expect } from 'vitest';
import {
  validateFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  validateMagicBytes,
} from '../upload-validation';

function createMockFile(options: { name: string; type: string; size: number }): File {
  const buffer = new ArrayBuffer(options.size);
  return new File([buffer], options.name, { type: options.type });
}

describe('validateFile', () => {
  it('accepts valid PNG image', () => {
    const file = createMockFile({ name: 'test.png', type: 'image/png', size: 1024 });
    const result = validateFile(file, { maxSize: MAX_IMAGE_SIZE, allowedTypes: ALLOWED_IMAGE_TYPES });
    expect(result.valid).toBe(true);
  });

  it('rejects unsupported image type', () => {
    const file = createMockFile({ name: 'test.bmp', type: 'image/bmp', size: 1024 });
    const result = validateFile(file, { maxSize: MAX_IMAGE_SIZE, allowedTypes: ALLOWED_IMAGE_TYPES });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  it('rejects oversized image', () => {
    const file = createMockFile({ name: 'huge.png', type: 'image/png', size: MAX_IMAGE_SIZE + 1 });
    const result = validateFile(file, { maxSize: MAX_IMAGE_SIZE, allowedTypes: ALLOWED_IMAGE_TYPES });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('accepts valid MP4 video', () => {
    const file = createMockFile({ name: 'vid.mp4', type: 'video/mp4', size: 50 * 1024 * 1024 });
    const result = validateFile(file, { maxSize: MAX_VIDEO_SIZE, allowedTypes: ALLOWED_VIDEO_TYPES });
    expect(result.valid).toBe(true);
  });

  it('rejects oversized video', () => {
    const file = createMockFile({ name: 'huge.mp4', type: 'video/mp4', size: MAX_VIDEO_SIZE + 1 });
    const result = validateFile(file, { maxSize: MAX_VIDEO_SIZE, allowedTypes: ALLOWED_VIDEO_TYPES });
    expect(result.valid).toBe(false);
  });
});

describe('validateMagicBytes', () => {
  it('validates PNG magic bytes', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(pngHeader, 'image/png')).toBe(true);
  });

  it('validates JPEG magic bytes', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff]);
    expect(validateMagicBytes(jpegHeader, 'image/jpeg')).toBe(true);
  });

  it('rejects mismatched magic bytes', () => {
    const randomBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(validateMagicBytes(randomBytes, 'image/png')).toBe(false);
  });

  it('returns true for unknown types (no magic bytes to check)', () => {
    const bytes = new Uint8Array([0x00, 0x01]);
    expect(validateMagicBytes(bytes, 'application/octet-stream')).toBe(true);
  });

  it('validates MP4 magic bytes', () => {
    // MP4 files have 'ftyp' at offset 4
    const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    expect(validateMagicBytes(mp4Header, 'video/mp4')).toBe(true);
  });
});
