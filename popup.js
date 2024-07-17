if (document.readyState !== "complete") { // usernames not yet loaded in interactive
    window.addEventListener("load", main); 
} else {
    main();
}

let storage = {};

async function main() {
    storage = await getStorage();
    console.log(storage);

    /* 
    data = [
        {   "userID": userIDHere,
            "note": "noteHere",
            "username": "usernameHere",
            "displayName": "displayNameHere"
        }, etc.
    ]
    */
    const userIDs = [];
    for (const userID in storage) {
        userIDs.push(userID);
    }

    createNotes(userIDs);

    const importLabel = document.getElementById("importLabel");
    let isFirefox = false;
    try { // getBrowserInfo() is only available in FF
        const isFirefoxInfo = await browser.runtime.getBrowserInfo();
        isFirefox = isFirefoxInfo.name === "Firefox";
    } catch (error) {
        isFirefox = false;
    }
    if (!isFirefox) {
        importLabel.htmlFor = "fileInput";
    }


    //add onActions to elements
    const fileInput = document.getElementById("fileInput");



    // PUT THIS INTO IMPORT FUNC !!! REM THE PARAMTER REQ!! MAYBE NEW GLOBALS!! YAY !!

    // hide file input (and use textbox instead) for ff since popup closes if file selector is opened
    
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

        fileInput.onchange = () => {
            importNotes(fileInput.files[0]);
        };
    }







    const exportLabel = document.getElementById("exportLabel");
    exportLabel.onclick = () => {
        exportNotes(storage);
    };


}

// chrome.storage doesnt work in mv2 (for ff compatibility)
async function getStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => { // get all storage
            resolve(result);
        });
    });
}

// where userIDs is an array of userIDs
async function createNotes(userIDs) {
    const userDataPromises = userIDs.map((userID) => getUserDataPromise(userID));
    const fetchedUserData = await Promise.all(userDataPromises); // "parallel" fetches

    const data = fetchedUserData.map((userData) => {
        return {
            "userID": userData.id,
            "displayName": userData.displayName,
            "username": userData.name,
            "note": storage[userData.id]
        };
    });

    // sort
    data.sort((a, b) => {
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

    data.forEach((data0) => {
        createSingleNote(data0);
    });
}

// input file selector doesnt work in FF popup, use textbox instead
function openImportFirefox() {
    const exportLabel = document.getElementById("exportLabel");
    exportLabel.style.display = "none";

    const importLabel = document.getElementById("importLabel");
    importLabel.style.display = "none";

    const body = document.body;
    const importTip = document.createElement("p");
    importTip.innerText = "To import: open the export .txt file,\npaste the data here, and submit.";
    body.insertBefore(importTip, importLabel);

    body.insertBefore(document.createElement("br"), importLabel);

    const input = document.createElement("input");
    input.id = "importInput";
    body.insertBefore(input, importLabel);
    input.type = "text";
    input.placeholder = "Enter export file data here";
    input.style = "margin-right: 4px;";

    const submit = document.createElement("button");
    submit.innerText = "Submit";
    body.insertBefore(submit, importLabel.nextSibling);
}


// get username and display name; cant store this in storage initially since it may change
function getUserDataPromise(userID) {
    const link = "https://users.roblox.com/v1/users/" + userID;
    return fetch(link)
        .then((response) => response.json());
}

async function importNotes(file) {
    const raw = await file.text();

    let importedData;
    try {
        importedData = JSON.parse(raw);
    } catch (error) {
        alert("Invalid file format!");
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
        const importDateHeader = "Imported on " + month + " " + day + ", " + year;
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

    // reload tabs to show new data and so old data cant overwrite
    chrome.tabs.sendMessage(undefined, "reload");
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


async function createSingleNote(data0) {
    const displayName = data0.displayName;
    const username = data0.username;
    const userID = data0.userID;
    const note = data0.note;

    const div = document.createElement("fieldset");
    div.className = "note";

    const p = document.createElement("p");
    p.userID = userID + "Note";
    p.textContent = note;
    p.style.display = "none";

    const button = document.createElement("button");
    button.innerText = displayName + "\n@" + username;
    button.onclick = () => {
        if (p.style.display === "none") {
            p.style.display = "block";
        } else {
            p.style.display = "none";
        }
    }

    div.appendChild(button);
    div.appendChild(p);
    
    const notesDiv = document.getElementById("notes");
    notesDiv.appendChild(div);
}