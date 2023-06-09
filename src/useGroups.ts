import {useEffect, useMemo, useState} from 'react'
import ExtStorage from './Storage'
import { groupNumKey, getGroupInfoKey } from './constants'
import { ExtStatus } from './useExtStatus'

export type Groups = {
    [key: string]: string[]
}

function useGroups(extStatus: ExtStatus, storage: ExtStorage): [number, Groups, string[]] {
    const [groupNum, setGroupNum] = useState(0);
    const [groups, setGroups] = useState<Groups>({})
    const [ungrouped, setUngrouped] = useState<string[]>([])

    const onStorageChange = (changes: {[key: string]: chrome.storage.StorageChange}, areaName: string) => {
        if (groupNumKey in changes) {
            setGroupNum(changes[groupNumKey].newValue)
        }
    }

    const fetchGroups = async () => {
        setUngrouped(Object.keys(extStatus))
        for(let i = 0; i < groupNum; i++) {
            const groupInfoKey = getGroupInfoKey(i);
            const res = await storage.get(groupInfoKey)
            const groupInfo = res[groupInfoKey]
            if (groupInfo) {
                setGroups(groups => ({
                    ...groups,
                    [groupInfoKey]: groupInfo
                }))
                setUngrouped(ungrouped => ungrouped.filter(id => !groupInfo.includes(id)))
            }
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [groupNum, extStatus])

    useEffect(() => {
        storage.get(groupNumKey).then(res => {
            const groupNum = res[groupNumKey];
            setGroupNum(groupNum)
            fetchGroups()
        })
        chrome.storage.onChanged.addListener(onStorageChange)
        return () => {
            chrome.storage.onChanged.removeListener(onStorageChange)
        }
    }, [])

    return [groupNum, groups, ungrouped]
}


export default useGroups
