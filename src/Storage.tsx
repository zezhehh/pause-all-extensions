// Define a custom string type
type ExtStorageMode = 'local' | 'sync';

class ExtStorage {
    mode: ExtStorageMode;
    storage: chrome.storage.StorageArea;

    constructor(mode: ExtStorageMode) {
        this.mode = mode;

        if (mode === 'local') {
            this.storage = chrome.storage.local;
        } else {
            this.storage = chrome.storage.sync;
        }
    }

    async get(...keys: string[]) {
        const result = await this.storage.get(keys);
        return result;
    }

    async set(items: {[key: string]: any}) {
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
