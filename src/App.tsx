import React, { useEffect, useState } from "react";
import "./App.css";
import Button from "@mui/material/Button";

interface ExtensionInfo {
  id: string;
  enabled: boolean;
  description: string;
  shortName: string;
}

const App = () => {
  const [paused, setPaused] = useState(false);
  const [extStatus, setExtStatus] = useState<ExtensionInfo[]>([]);
  const [myID, setMyID] = useState<string>("");
  const togglePause = () => {
    console.log(extStatus);
    if (paused) {
      extStatus.forEach((ext) => {
        const extId = ext.id;
        if (extId === myID) {
          return;
        }
        chrome.storage.sync.get([extId], (res) => {
          chrome.management.setEnabled(extId, res[extId]);
        });
      });
    } else {
      extStatus.forEach((ext) => {
        const extId = ext.id;
        if (extId === myID) {
          return;
        }
        chrome.storage.sync.set({ [extId]: ext.enabled });
        chrome.management.setEnabled(extId, false);
      });
    }
    chrome.storage.local.set({ pauseExts: !paused });
    setPaused(!paused);
  };

  useEffect(() => {
    setMyID(chrome.runtime.id);
    chrome.storage.local.get(["pauseExts"], (res) => {
      if (res.pauseExts) {
        setPaused(true);
      }
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      chrome.management.getAll().then((res: ExtensionInfo[]) => {
        setExtStatus(res);
      });
    }, 500)
  }, [paused]);

  return (
    <div className="App">
        <Button variant="contained" onClick={togglePause} className='toggle-button'>
          {paused ? "Resume" : "Pause"}
        </Button>
        <div className="ext-info">
      {extStatus.map((ext) => (
        <div className="container" key={ext.id}>
          <div
            className={
              ext.enabled ? "green-indicator-small" : "red-indicator-small"
            }
          />{" "}
          <span className="ext-name">{ext.shortName}</span>
        </div>
      ))}
      </div>
    </div>
  );
};

export default App;
