import { dataSchema, DATA_VERSION } from "../core/schemas";
import type { Data } from "../core/types";

export abstract class StorageService {
  abstract load(): Promise<unknown>;
  abstract save(snapshot: unknown): Promise<void>;

  async loadValidated(): Promise<Data | null> {
    try {
      const raw = await this.load();
      const parsed = dataSchema.parse(raw);
      if (parsed.version !== DATA_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async saveValidated(snapshot: Data): Promise<void> {
    const parsed = dataSchema.parse(snapshot);
    await this.save({ ...parsed, version: DATA_VERSION });
  }
}

export class LocalStorageService extends StorageService {
  private key = "barber-shop-data";

  async load(): Promise<unknown> {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  }

  async save(snapshot: unknown): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(snapshot));
  }
}
