import { useEffect, useState } from "react";

export type ExtStatus = {
  [key: string]: {
    enabled: boolean;
    shortName: string;
  };
};

function useExtStatus() {
  const [extStatus, setExtStatus] = useState<ExtStatus>({});
  const enableExt = (info: chrome.management.ExtensionInfo) => {
    const extID = info.id;
    setExtStatus((extStatus) => {
      return {
        ...extStatus,
        [extID]: { ...extStatus[extID], enabled: true },
      };
    });
  };
  const disableExt = (info: chrome.management.ExtensionInfo) => {
    const extID = info.id;
    setExtStatus((extStatus) => {
      return {
        ...extStatus,
        [extID]: { ...extStatus[extID], enabled: false },
      };
    });
  };
  const installExt = (info: chrome.management.ExtensionInfo) => {
    setExtStatus({
      ...extStatus,
      [info.id]: { ...extStatus[info.id], enabled: info.enabled },
    });
  };
  const uninstallExt = (extID: string) => {
    let status = { ...extStatus };
    delete status[extID];
    setExtStatus(status);
  };

  useEffect(() => {
    chrome.management
      .getAll()
      .then((res: chrome.management.ExtensionInfo[]) => {
        const status: ExtStatus = {};
        res.forEach((ext) => {
          status[ext.id] = {
            enabled: ext.enabled,
            shortName: ext.shortName,
          };
        });
        setExtStatus(status);
      });
    chrome.management.onEnabled.addListener(enableExt);
    chrome.management.onDisabled.addListener(disableExt);
    chrome.management.onInstalled.addListener(installExt);
    chrome.management.onUninstalled.addListener(uninstallExt);
    return () => {
      chrome.management.onEnabled.removeListener(enableExt);
      chrome.management.onDisabled.removeListener(disableExt);
      chrome.management.onInstalled.removeListener(installExt);
      chrome.management.onUninstalled.removeListener(uninstallExt);
    };
  }, []);
  return extStatus;
}

export default useExtStatus;
