import type { VectorProvider } from './vector.interface.js';
import { MemoryVectorProvider } from './memory.provider.js';
import { PineconeVectorProvider } from './pinecone.provider.js';

export class VectorProviderFactory {
  private static instance: VectorProvider;

  static getProvider(): VectorProvider {
    if (!this.instance) {
      const providerType = (process.env.VECTOR_PROVIDER || 'memory').toLowerCase();

      if (providerType === 'pinecone') {
        this.instance = new PineconeVectorProvider();
      } else {
        this.instance = new MemoryVectorProvider();
      }
    }
    return this.instance;
  }
}

export const vectorProvider = VectorProviderFactory.getProvider();
