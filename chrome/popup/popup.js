let storage = {};

main();
async function main() {
    // show alert
    let loaded = false;
    const result = await chrome.storage.local.get("loaded");
    loaded = result.loaded;

    if (!loaded) {
        const alertBox = document.querySelector("#alert");
        alertBox.style.display = "block";
    }

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

    // load notes
    storage = await chrome.storage.sync.get(null);

    const userIDs = [];
    for (const userID in storage) {
        userIDs.push(userID);
    }

    createNotes(userIDs);
}

// where userIDs is an array of userIDs
async function createNotes(userIDs) {
    // get userdata from roblox api
    const userDataPromises = userIDs.map((userID) => getUserDataPromise(userID));
    const fetchedUserData = await Promise.all(userDataPromises); // "parallel" fetches

    // no user data, show "no notes"
    if (fetchedUserData.length === 0) {
        const p = document.createElement("p");
        p.innerText = "No notes saved.";
        document.getElementById("notes").append(p);
        return;
    }

    const parsedUserData = fetchedUserData.map((userData) => {
        return {
            "userID": userData.id,
            "displayName": userData.displayName,
            "username": userData.name,
            "note": storage[userData.id]
        };
    });
    console.log(parsedUserData);

    // sort
    parsedUserData.sort((a, b) => {
        const name1 = a.displayName.toLowerCase();
        const name2 = b.displayName.toLowerCase();
        if (name1 < name2) {
            return -1;
        }
        if (name1 > name2) {
            return 1;
        }
        return 0;
    });

    parsedUserData.forEach((data0) => {
        createSingleNote(data0);
    });
}

// get username and display name; cant store this in storage initially since it may change
async function getUserDataPromise(userID) {
    const link = "https://users.roblox.com/v1/users/" + userID;
    const response = await fetch(link);
    return await response.json();
}

function createSingleNote(data0) {
    const displayName = data0.displayName;
    const username = data0.username;
    const userID = data0.userID;
    const note = data0.note;

    const profileLink = "https://www.roblox.com/users/" + userID + "/profile";

    const div = document.createElement("fieldset");
    div.className = "note";
    const notesDiv = document.getElementById("notes");

    const pNote = document.createElement("p");
    pNote.textContent = note;
    pNote.style.display = "none";

    const button = document.createElement("button");
    button.innerText = displayName + "\n@" + username;
    button.onclick = () => {
        if (pNote.style.display === "none") {
            pNote.style.display = "block";
        } else {
            pNote.style.display = "none";
        }
    };

    const aProfileLink = document.createElement("a");
    aProfileLink.href = profileLink;
    aProfileLink.textContent = "Profile link";
    aProfileLink.style = "font-size: smaller";
    aProfileLink.target = "_blank";

    notesDiv.append(div);
    div.append(button);
    div.append(pNote);
    pNote.append(document.createElement("br"));
    pNote.append(aProfileLink);
}

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