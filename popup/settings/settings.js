// import
const importButton = document.getElementById("importButton");

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".txt";
document.body.append(fileInput);

importButton.onclick = () => {
    fileInput.click();
};

fileInput.onchange = async () => {
    const raw = await fileInput.files[0].text();
    importNotes(raw);
};

// export
const exportButton = document.getElementById("exportButton");
exportButton.onclick = async () => {
    const storage = await chrome.storage.sync.get(null);
    exportNotes(storage);
};

async function importNotes(raw) {
    let importedData;
    try {
        importedData = JSON.parse(raw);

    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        const errorText = document.getElementById("importError");
        errorText.style.visibility = "visible";
        return;
    }

    const userIDs = [];
    for (const userID in importedData) {
        userIDs.push(userID);

        // save to storage
        const importedNote = importedData[userID];
        // add date before imported note
        const date = new Date();
        const importDateHeader = "Imported on " + date.toLocaleDateString(); 
        const importData = importDateHeader + "\n" + importedNote;

        const result = await chrome.storage.sync.get([userID]);
        const existingNote = result[userID];
        const saveData = {};
        if (existingNote) { // if saved note alr exists
            saveData[userID] = existingNote + "\n\n" + importData;
        } else {
            saveData[userID] = importData;
        }
        chrome.storage.sync.set(saveData);
    }

    // reload all profile tabs to show new data
    let tabs = await chrome.tabs.query({});

    const profileTabIDs = [];
    tabs.forEach((tab) => {
        if (tab.url) { // tab.url only exists for roblox profile pages since we only have perms for that link
            profileTabIDs.push(tab.id);
        }
    });
    profileTabIDs.forEach((tabID) => {
        chrome.tabs.reload(tabID);
    });
    location.reload(); // reload popup
}

function exportNotes(storage) {
    const data = JSON.stringify(storage);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "RPNexport.txt";
    a.click();
}