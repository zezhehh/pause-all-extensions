function onSave() {
    // get selected option in the select DOM with id 'sync-mode'
    var syncMode = document.getElementById('sync-mode').value;
    // save the selected option to chrome storage
    chrome.storage.sync.set({'syncMode': syncMode})
    document.getElementById('status').innerHTML = syncMode;
}

chrome.storage.sync.get('syncMode', function(result) {
    syncMode = result.syncMode;
    if (syncMode === undefined) {
        syncMode = 'sync';
        chrome.storage.sync.set({'syncMode': syncMode})
    }
    document.getElementById('status').innerHTML = syncMode;
})

document.getElementById("save").addEventListener("click", onSave);
