import type { Readable } from 'node:stream';

export interface StorageSaveOptions {
  userId: string;
  fileId: string;
  extension: string;
  buffer: Buffer;
}

export interface StorageProvider {
  saveFile(options: StorageSaveOptions): Promise<string>;
  deleteFile(relativePath: string): Promise<void>;
  getFileStream(relativePath: string): Readable;
  getFileBuffer(relativePath: string): Promise<Buffer>;
  exists(relativePath: string): Promise<boolean>;
}
