if (document.readyState !== "complete") { // usernames not yet loaded in interactive
    window.addEventListener("load", main); 
} else {
    main();
}

async function main() {
    let storage = await chrome.storage.sync.get();
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
    const data = [];
    for (const id in storage) {
        const data0 = {};
        data0.userID = id;
        data0.note = storage[id];

        // get username and display name, cant store this in storage initially since it may change
        const link = "https://users.roblox.com/v1/users/" + id;
        const response = await fetch(link);
        const userData = await response.json();
        data0.username = userData.name;
        data0.displayName = userData.displayName;

        data.push(data0);
    }

    data.sort((a, b) => a.displayName.localeCompare(b.displayName));

    data.forEach((data0) => {
        createNote(data0);
    });

    const fileInput = document.getElementById("fileInput");
    fileInput.onchange = () => {
        importNotes(fileInput.files[0]);
    };

    const exportLabel = document.getElementById("exportLabel");
    exportLabel.onclick = () => { 
        exportNotes(storage);
    };
}

async function importNotes(file) {
    const raw = await file.text();
    const json = JSON.parse(raw);

    for (const id in json) {
        const note = json[id];
        createNote(id, note);
    }
}

function exportNotes(storage) {
    const data = JSON.stringify(storage);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "RPNexport.json";
    a.click();
}


async function createNote(data0) {
    const displayName = data0.displayName;
    const username = data0.username;
    const id = data0.userID;
    const note = data0.note;

    const div = document.createElement("fieldset");
    div.className = "note";

    const p = document.createElement("p");
    p.id = id + "Note";
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