import { syncModeKey } from "./constants";

// Define a custom string type
type ExtStorageMode = "local" | "sync";

class ExtStorage {
  mode: ExtStorageMode = 'sync';
  storage: chrome.storage.StorageArea = chrome.storage.sync;

  constructor() {
    chrome.storage.sync.get([syncModeKey], (result) => {
        if (result[syncModeKey] === "local") {
        this.mode = "local";
        this.storage = chrome.storage.local;
      } else {
        this.mode = "sync";
        this.storage = chrome.storage.sync;
      }
    })
  }


  async get(...keys: string[]) {
    const result = await this.storage.get(keys);
    return result;
  }

  async set(items: { [key: string]: any }) {
    await this.storage.set(items);
  }

  async clear() {
    await this.storage.clear();
  }

  async remove(...keys: string[]) {
    await this.storage.remove(keys);
  }
}

export default ExtStorage;
