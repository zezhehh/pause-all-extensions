import { getExtInfoKey } from "./constants";
import ExtStorage from "./Storage";

class PauseController {
  storage: ExtStorage;
  myID: string;

  constructor(storage: ExtStorage) {
    this.storage = storage;
    this.myID = chrome.runtime.id;
  }

  async pause(...extIDs: string[]) {
    let items: { [key: string]: any } = {};
    for (let i = 0; i < extIDs.length; i++) {
      const extID = extIDs[i];
      if (extID === this.myID) {
        continue;
      }
      const appendedExtID = getExtInfoKey(extID);
      const extInfo = await chrome.management.get(extID);
      items = { ...items, [appendedExtID]: extInfo.enabled };
      chrome.management.setEnabled(extID, false);
    }
    this.storage.set(items);
  }

  unpause(...extIDs: string[]) {
    extIDs.forEach((extID) => {
      if (extID === this.myID) {
        return;
      }
      const storageKey = getExtInfoKey(extID);
      this.storage.get(storageKey).then((res) => {
        console.log(`unpause ${extID} ${res[storageKey]}`)
        chrome.management.setEnabled(extID, res[storageKey]);
      });
    });
  }
}

export default PauseController;
