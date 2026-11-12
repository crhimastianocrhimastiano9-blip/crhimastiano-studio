/**
 * CRHIMASTIANO STUDIO — Audio Storage Service (IndexedDB)
 * Persists recorded AudioBuffers as WAV Blobs / ArrayBuffers in IndexedDB
 * so all takes, recordings and imported files persist across page refresh.
 */

const DB_NAME = 'crhimastiano_studio_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_clips';

class AudioStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          return reject(new Error('IndexedDB non supporté'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'clipId' });
          }
        };

        request.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
          reject((event.target as IDBOpenDBRequest).error);
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Save an AudioBuffer to IndexedDB
   */
  public async saveClipAudio(clipId: string, audioBuffer: AudioBuffer): Promise<void> {
    try {
      const db = await this.getDB();
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;

      // Extract channel float data
      const channels: Float32Array[] = [];
      for (let c = 0; c < numChannels; c++) {
        channels.push(new Float32Array(audioBuffer.getChannelData(c)));
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record = {
          clipId,
          numChannels,
          sampleRate,
          length,
          channels,
          updatedAt: Date.now(),
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Impossible de sauvegarder le clip dans IndexedDB:', err);
    }
  }

  /**
   * Load an AudioBuffer from IndexedDB
   */
  public async loadClipAudio(clipId: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    try {
      const db = await this.getDB();

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(clipId);

        req.onsuccess = () => {
          const res = req.result;
          if (!res) return resolve(null);

          try {
            const buffer = ctx.createBuffer(res.numChannels, res.length, res.sampleRate);
            for (let c = 0; c < res.numChannels; c++) {
              const channelData = buffer.getChannelData(c);
              channelData.set(res.channels[c]);
            }
            resolve(buffer);
          } catch (e) {
            console.error('Erreur reconstruction AudioBuffer:', e);
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Delete a clip audio from IndexedDB
   */
  public async deleteClipAudio(clipId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(clipId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (err) {
      // silent
    }
  }

  /**
   * Get quota and storage estimate from browser (IndexedDB + Cache)
   */
  public async getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number; percentUsed: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usage = est.usage || 0;
        const quota = est.quota || 1;
        return {
          usageMB: Math.round((usage / (1024 * 1024)) * 10) / 10,
          quotaMB: Math.round((quota / (1024 * 1024)) * 10) / 10,
          percentUsed: Math.min(100, Math.round((usage / quota) * 1000) / 10),
        };
      } catch (e) {
        // Fallback
      }
    }
    return { usageMB: 0, quotaMB: 0, percentUsed: 0 };
  }
}

export const audioStorage = new AudioStorageService();
