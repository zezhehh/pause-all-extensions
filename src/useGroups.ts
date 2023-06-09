import { useEffect, useState } from "react";
import ExtStorage from "./Storage";
import { groupNumKey, getGroupInfoKey } from "./constants";
import { ExtStatus } from "./useExtStatus";
import _ from "lodash";

export type Groups = {
  [key: string]: string[];
};

export type GroupStatus = {
  [key: string]: boolean;
};

function useGroups(
  extStatus: ExtStatus,
  storage: ExtStorage
): [number, Groups, GroupStatus, string[]] {
  const [groupNum, setGroupNum] = useState(0);
  const [groups, setGroups] = useState<Groups>({});
  const [groupStatus, setGroupStatus] = useState<GroupStatus>({});
  const [ungrouped, setUngrouped] = useState<string[]>([]);

  const onStorageChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (groupNumKey in changes) {
      setGroupNum(changes[groupNumKey].newValue);
    }
  };

  const fetchGroups = async () => {
    let tmpUngrouped = Object.keys(extStatus);
    let tmpGroups: Groups = {};
    let tmpGroupStatus: GroupStatus = {};

    for (let i = 0; i < groupNum; i++) {
      const groupInfoKey = getGroupInfoKey(i);
      const res = await storage.get(groupInfoKey);
      const groupInfo = res[groupInfoKey];
      if (groupInfo === undefined) {
        continue;
      }
      tmpGroups[groupInfoKey] = groupInfo.exts;
      tmpGroupStatus[groupInfoKey] = groupInfo.paused;
      tmpUngrouped = tmpUngrouped.filter((id) => !groupInfo.exts.includes(id));
    }
    if (!_.isEqual(groups, tmpGroups)) {
      setGroups(tmpGroups);
    }
    if (!_.isEqual(ungrouped, tmpUngrouped)) {
      setUngrouped(tmpUngrouped);
    }
    if (!_.isEqual(groupStatus, tmpGroupStatus)) {
      setGroupStatus(tmpGroupStatus);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [groupNum, extStatus]);

  useEffect(() => {
    storage.get(groupNumKey).then((res) => {
      const groupNum = res[groupNumKey];
      if (groupNum === undefined) {
        storage.set({ [groupNumKey]: 0 });
        return;
      }
      setGroupNum(groupNum);
      fetchGroups();
    });
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(onStorageChange);
    };
  }, []);

  return [groupNum, groups, groupStatus, ungrouped];
}

export default useGroups;
