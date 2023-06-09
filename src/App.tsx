import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';
import { getExtInfoKey, STORAGE_PREFIX, getGroupInfoKey, groupNumKey, advancedKey } from "./constants";
import PauseController from "./PauseController";
import ExtStorage from "./Storage";
import useExtStatus from "./useExtStatus";


const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App = () => {
  const storage = useRef<ExtStorage>(new ExtStorage('sync'));
  const pauseController = useRef<PauseController>(new PauseController(storage.current))

  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const [groupNum, setGroupNum] = useState(0);
  const [alertSeverity, setAlertSeverity] = useState<AlertColor>("info");
  const [alertMsg, setAlertMsg] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [grouping, setGrouping] = useState(false);
  const extStatus = useExtStatus();
  const [selected, setSelected] = useState<string[]>([]);
  const [ungrouped, setUngrouped] = useState<string[]>([]);

  const togglePause = () => {
    const extIDs = Object.keys(extStatus);
    if (paused) {
      pauseController.current.unpause(...extIDs);
    } else {
      pauseController.current.pause(...extIDs);
    }
    storage.current.set({ [STORAGE_PREFIX]: !paused });
    setPaused(!paused);
  };

  const toggleSingleExt = (extID: string, extEnabled: boolean) => {
    const storageKey = getExtInfoKey(extID);
    storage.current.set({ [storageKey]: !extEnabled });
    chrome.management.setEnabled(extID, !extEnabled);
  }

  const toggleGrouping = () => {
    if (grouping) {
      if (selected.length !== 0) {
        const groupID = groupNum;
        const uniqueSelected = selected.reduce((a: string[], b: string) => {
          if (a.indexOf(b) < 0) a.push(b);
          return a;
        }, []);
        chrome.storage.sync.set({ [getGroupInfoKey(groupID)]: uniqueSelected })
        chrome.storage.sync.set({ [groupNumKey]: groupNum + 1 })
        setGroupNum(groupNum + 1);
      }
      setAlertSeverity("info");
      setAlertMsg("Grouping confirmed");
      setOpen(true);
      setSelected([]);
    } else {
      setAlertSeverity("info");
      setAlertMsg("Select extensions to group");
      setOpen(true);
    }
    setGrouping(!grouping);
  }

  useEffect(() => {
    chrome.storage.sync.get([STORAGE_PREFIX], (res) => {
      if (res[STORAGE_PREFIX]) {
        setPaused(true);
      }
    });
    chrome.storage.sync.get([groupNumKey], (res) => {
      if (res[groupNumKey]) {
        setGroupNum(res[groupNumKey]);
      }
    })
    chrome.storage.sync.get([advancedKey], (res) => {
      if (res[advancedKey]) {
        setAdvanced(true);
      }
    });
  }, []);


  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const advancedOnClick = (extID: string, extEnabled: boolean) => {
    if (!grouping) {
      toggleSingleExt(extID, extEnabled)
      console.log(`toggled ${extID}`)
      return;
    }
    if (selected.includes(extID)) {
      setSelected(
        selected.filter(a =>
          a !== extID
        )
      );
      console.log(`deselected ${extID}`)
    } else {
      console.log(`selected ${extID}`)
      setSelected([...selected, extID])
    }
  }

  const renderGroups = () => {
    let groups: JSX.Element[] = [];
    for (let i = 0; i < groupNum; i++) {
      const groupInfoKey = getGroupInfoKey(i)
      chrome.storage.sync.get([groupInfoKey], (res) => {
        if (res[groupInfoKey]) {
          groups.push(
            <div key={`group-${i}`} style={{
              borderColor: 'red'
            }}>
              {res[groupInfoKey].map((extID: string) => {
                setUngrouped(
                  ungrouped.filter(a =>
                    a !== extID
                  )
                );
                const extEnabled = extStatus[extID].enabled;
                const extShortName = extStatus[extID].shortName;
                return (
                  <div className={selected.includes(extID) ? "container container-selected" : "container"} key={extID} onClick={() => advancedOnClick(extID, extEnabled)}>
                    <div
                      className={
                        extEnabled ? "green-indicator-small" : "red-indicator-small"
                      }
                    />{" "}
                    <span className="ext-name">{extShortName}</span>
                  </div>
                )
              })}
            </div>)
        }
      })

    }
    return groups;
  }

  const renderUngrouped = () => {
    let ungroupedExt: JSX.Element[] = [];
    ungrouped.forEach((extID) => {
      const extEnabled = extStatus[extID].enabled;
      const extShortName = extStatus[extID].shortName;
      ungroupedExt.push(
        <div className={selected.includes(extID) ? "container container-selected" : "container"} key={extID} onClick={() => advancedOnClick(extID, extEnabled)}>
          <div
            className={
              extEnabled ? "green-indicator-small" : "red-indicator-small"
            }
          />{" "}
          <span className="ext-name">{extShortName}</span>
        </div>
      )
    })
    return ungroupedExt;
  }

  const toggleAdvanced = () => {
    setGrouping(false);
    setSelected([]);
    setAdvanced(!advanced);
    chrome.storage.sync.set({ [advancedKey]: !advanced })
  }

  return (
    <div className="App">

      <Button variant="contained" onClick={togglePause} className='toggle-button'>
        {paused ? "Resume" : (advanced ? "Pause All" : "Pause")}
      </Button>
      <Button variant="contained" onClick={toggleAdvanced} className='toggle-button'>
        {advanced ? "Advanced Version" : "Simple Version"}
      </Button>
      {advanced && <Button variant="contained" onClick={toggleGrouping} className='toggle-button'>
        {grouping ? "Confirm" : "Group extensions"}
      </Button>}
      <div className="ext-info">

        {advanced &&
          renderGroups()
        }
        {advanced &&
          renderUngrouped()
        }

        {!advanced && Object.keys(extStatus).map((extID) => {
          const extEnabled = extStatus[extID].enabled;
          const extShortName = extStatus[extID].shortName;
          return (
            <div className="container" key={extID} onClick={() => toggleSingleExt(extID, extEnabled)}>
              <div
                className={
                  extEnabled ? "green-indicator-small" : "red-indicator-small"
                }
              />{" "}
              <span className="ext-name">{extShortName}</span>
            </div>
          )
        })}
      </div>

      <Snackbar open={open} autoHideDuration={1000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default App;
