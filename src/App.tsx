import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import Button from "@mui/material/Button";
import ButtonGroup from '@mui/material/ButtonGroup';
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import CheckIcon from '@mui/icons-material/Check';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';
import { getExtInfoKey, STORAGE_PREFIX, getGroupInfoKey, groupNumKey, advancedKey } from "./constants";
import PauseController from "./PauseController";
import ExtStorage from "./Storage";
import useExtStatus from "./useExtStatus";
import useGroups from "./useGroups";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App = () => {
  const extStatus = useExtStatus();
  const storage = useRef<ExtStorage>(new ExtStorage('sync'));
  const pauseController = useRef<PauseController>(new PauseController(storage.current))
  const [groupNum, groups, groupStatus, ungrouped] = useGroups(extStatus, storage.current);

  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<AlertColor>("info");
  const [alertMsg, setAlertMsg] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [grouping, setGrouping] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

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
        const groupInfoKey = getGroupInfoKey(groupID);
        storage.current.set({ [groupInfoKey]: { exts: uniqueSelected, paused: false } })
        storage.current.set({ [groupNumKey]: groupNum + 1 })
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
    storage.current.get(STORAGE_PREFIX).then((res) => {
      if (res[STORAGE_PREFIX]) {
        setPaused(true);
      }
    });
    storage.current.get(advancedKey).then((res) => {
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
      return;
    }
    if (selected.includes(extID)) {
      setSelected(
        selected.filter(a =>
          a !== extID
        )
      );
    } else {
      setSelected([...selected, extID])
    }
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
    storage.current.set({ [advancedKey]: !advanced })
  }

  const renderExt = (extID: string, extEnabled: boolean, extShortName: string) => (
    <div className={selected.includes(extID) ? "container container-selected" : "container"} key={extID} onClick={() => advancedOnClick(extID, extEnabled)}>
      <div
        className={
          extEnabled ? "green-indicator-small" : "red-indicator-small"
        }
      />{" "}
      <span className="ext-name">{extShortName}</span>
    </div>
  )

  const groupBar = (groupID: string) => {
    const extPaused = groupStatus[groupID]
    return (
      <ButtonGroup size="small" fullWidth>
        <Button onClick={() => {
          if (extPaused) {
            pauseController.current.unpause(...groups[groupID])
            storage.current.set({ [groupID]: { exts: groups[groupID], paused: false } })
          }
          else {
            pauseController.current.pause(...groups[groupID])
            storage.current.set({ [groupID]: { exts: groups[groupID], paused: true } })
          }
        }} style={{ width: '85%' }}>{extPaused ? 'Resume Group' : 'Pause Group'}</Button>
        <Button onClick={() => {
          storage.current.remove(groupID);
          storage.current.set({ [groupNumKey]: groupNum - 1 })
          storage.current.set({ [groupNumKey]: groupNum + 1 })
        }} style={{ borderRadius: 0, width: '15%' }}><DeleteIcon /></Button>
      </ButtonGroup>

    )
  }

  return (
    <div className="App">
      <div className='toggle-button'>
        <Button variant="contained" onClick={togglePause} fullWidth style={{marginBottom: 5}}>
          {paused ? "Resume" : (advanced ? "Pause All" : "Pause")}
        </Button>
        {advanced ?
          <ButtonGroup size="small" fullWidth>
            <Button onClick={toggleAdvanced} style={{ width: '85%' }}>
              Switch to Simple
            </Button>
            <Button onClick={toggleGrouping} style={{ borderRadius: 0, width: '15%' }}>
              {grouping ? <CheckIcon /> : <LibraryAddIcon />}
            </Button>
          </ButtonGroup>
          :
          <Button variant="outlined" size="small" fullWidth onClick={toggleAdvanced}>
            Switch to Advanced
          </Button>
        }
      </div>

      <div className="ext-info">
        {advanced &&
          Object.keys(groups).map((groupID: string) => {
            const group = groups[groupID];
            return <div key={groupID} className='grouped'>
              {groupBar(groupID)}
              {group.map((extID: string) => {
                const extEnabled = extStatus[extID].enabled;
                const extShortName = extStatus[extID].shortName;
                return renderExt(extID, extEnabled, extShortName)
              })
              }
            </div>
          })
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
