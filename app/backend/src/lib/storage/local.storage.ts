import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import type { StorageProvider, StorageSaveOptions } from './storage.interface.js';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir = 'storage') {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    this.ensureDirs();
  }

  private ensureDirs(): void {
    const uploadsDir = path.join(this.baseDir, 'uploads');
    const tempDir = path.join(this.baseDir, 'temp');
    const previewsDir = path.join(this.baseDir, 'previews');

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    if (!fs.existsSync(previewsDir)) fs.mkdirSync(previewsDir, { recursive: true });
  }

  /**
   * Asserts that a resolved target path is strictly contained within the storage base directory.
   */
  private assertInsideStorageRoot(fullPath: string): void {
    const normalizedTarget = path.normalize(fullPath);
    const normalizedBase = path.normalize(this.baseDir);

    if (!normalizedTarget.startsWith(normalizedBase)) {
      throw new Error('Security Violation: File path traversal outside storage root is prohibited');
    }
  }

  async saveFile({ userId, fileId, extension, buffer }: StorageSaveOptions): Promise<string> {
    const userDir = path.join(this.baseDir, 'uploads', userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const cleanExt = extension.startsWith('.') ? extension.slice(1) : extension;
    const filename = `${fileId}.${cleanExt}`;
    const fullPath = path.join(userDir, filename);

    this.assertInsideStorageRoot(fullPath);

    await fs.promises.writeFile(fullPath, buffer);

    return path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.resolve(process.cwd(), relativePath);
    this.assertInsideStorageRoot(fullPath);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFileStream(relativePath: string): Readable {
    const fullPath = path.resolve(process.cwd(), relativePath);
    this.assertInsideStorageRoot(fullPath);

    return fs.createReadStream(fullPath);
  }

  async getFileBuffer(relativePath: string): Promise<Buffer> {
    const fullPath = path.resolve(process.cwd(), relativePath);
    this.assertInsideStorageRoot(fullPath);

    return fs.promises.readFile(fullPath);
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.resolve(process.cwd(), relativePath);
    this.assertInsideStorageRoot(fullPath);

    return fs.existsSync(fullPath);
  }
}

export const storageProvider = new LocalStorageProvider();
