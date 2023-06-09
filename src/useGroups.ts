import { on } from 'events'
import {useEffect, useState} from 'react'


export type Groups = {
    [key: number]: string[]
}

function useGroups() {
    const [groups, setGroups] = useState<Groups>({})
    const onStorageChange = (changes: object, areaName: string) => {
        console.log(changes)
        console.log(areaName)
    
    }

    useEffect(() => {
        chrome.storage.onChanged.addListener(onStorageChange)
        
        return () => {
            chrome.storage.onChanged.removeListener(onStorageChange)
        
        }
    }, [])
}


export default useGroups
