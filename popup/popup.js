let storage = {};

main();
async function main() {
    // settings button logic in the html

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