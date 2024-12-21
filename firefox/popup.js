if (document.readyState !== "complete") { // usernames not yet loaded in interactive
    window.addEventListener("load", main); 
} else {
    main();
}

let storage = {};
let isFirefox = false;

async function main() {
    storage = await getStorage();
    //console.log(storage);

    const userIDs = [];
    for (const userID in storage) {
        userIDs.push(userID);
    }

    createNotes(userIDs);

    try { // getBrowserInfo() is only available in FF
        const isFirefoxInfo = await browser.runtime.getBrowserInfo();
        isFirefox = isFirefoxInfo.name === "Firefox";
    } catch (e) {
        isFirefox = false;
    }
    
    const importLabel = document.getElementById("importLabel");

    // FF: file input doesnt work in popup
    if (isFirefox) {
        importLabel.onclick = openImportFirefox;
    } else { // chromium
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt";
        document.body.appendChild(fileInput);

        importLabel.onclick = () => {
            fileInput.click();
        };
        importLabel.htmlFor = "fileInput";

        fileInput.onchange = async () => {
            const raw = await fileInput.files[0].text();
            importNotes(raw);
        };
    }

    const exportLabel = document.getElementById("exportLabel");
    exportLabel.onclick = () => {
        exportNotes(storage);
    };
}

// chrome.storage promises dont work in mv2 (for ff compatibility)
async function getStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => { // get all storage
            resolve(result);
        });
    });
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
        document.getElementById("notes").appendChild(p);
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

// input file selector doesnt work in FF popup, use textbox instead
function openImportFirefox() {
    const body = document.body;

    const exportLabel = document.getElementById("exportLabel");
    exportLabel.style.display = "none";

    const importLabel = document.getElementById("importLabel");
    importLabel.style.display = "none";

    const submit = document.createElement("button");
    submit.innerText = "Submit";
    submit.onclick = () => {
        importNotes(input.value);
    };
    body.insertBefore(submit, importLabel);

    const input = document.createElement("input");
    input.id = "importInput";
    input.type = "text";
    input.placeholder = "Enter export file data here";
    input.style = "margin-right: 4px;";
    body.insertBefore(input, submit);

    const importTip = document.createElement("p");
    importTip.innerText = "To import: open the export file,\ncopy everything (ctrl a, ctrl c),\npaste the data below, and submit.";
    body.insertBefore(importTip, input);

    const error = document.createElement("p");
    error.id = "importError";
    error.style = "color: red; visibility: hidden;";
    error.textContent = "Invalid data format!";
    body.insertBefore(error, input);
}


// get username and display name; cant store this in storage initially since it may change
function getUserDataPromise(userID) {
    const link = "https://users.roblox.com/v1/users/" + userID;
    return fetch(link)
        .then((response) => response.json());
}

async function importNotes(raw) {
    let importedData;
    try {
        importedData = JSON.parse(raw);
    } catch (error) {
        // alert() messes up the popup in FF...
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
        const month = date.toLocaleString("default", { month: "short" });
        const day = date.getDate();
        const year = date.getFullYear();
        const importDateHeader = "Imported on " + month + " " + day + ", " + year + ":";
        const importData = importDateHeader + "\n" + importedNote;

        chrome.storage.sync.get([userID], (result) => {
            const existingNote = result[userID];
            const saveData = {};
            if (existingNote) { // if saved note alr exists
                saveData[userID] = existingNote + "\n\n" + importData;
                chrome.storage.sync.set(saveData);
            } else {
                saveData[userID] = importData;
                chrome.storage.sync.set(saveData);
            }
        });
    }

    // reload all profile tabs to show new data
    let tabs;
    if (isFirefox) { // for some reason ff doesnt work with chrome.tabs
        tabs = await browser.tabs.query({});
    } else {
        tabs = await chrome.tabs.query({});
    }
    console.log(tabs);
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
    a.download = "RPNexport.txt"; // txt so easily openable for ff import
    a.click();
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
    aProfileLink.target = "_blank"; // chrome needs this

    notesDiv.appendChild(div);
    div.appendChild(button);
    div.appendChild(pNote);
    pNote.appendChild(document.createElement("br"));
    pNote.appendChild(aProfileLink);
}