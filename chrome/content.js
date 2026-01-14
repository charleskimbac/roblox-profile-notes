let userID;
let textbox;
const DARK_THEME_BG_COLOR = "#272930";
const LIGHT_THEME_BG_COLOR = "#f7f7f8";
let inserted = false;

main();
async function main() {
    // using this method so we can avoid tabs permission and intercomms altogether
    await chrome.storage.local.set({
        "loaded": false
    });

    addTextbox();
    userID = getUserID();
    await loadNote();
    saveNoteOnChange();

    await chrome.storage.local.set({
        "loaded": true
    });
}

function addTextbox() {
    // select profile card div
    const targetDiv = document.querySelector(".profile-header-overlay");
    
    if (targetDiv) {
        const div = document.createElement("div");
        div.style.marginTop = "7px"; // center between 2 sections above/below
        div.id = "rpn-notes-container";
        
        // this is to make notes label aligned to top left of div instead of bottom left
        div.style.alignItems = "flex-start";
        
        // this happens if ext updates while tab is already open
        const warning = document.createElement("p");
        warning.id = "warning";
        warning.textContent = "SAVE FAILED! SAVE/COPY YOUR NOTE AND RELOAD THE PAGE!";
        warning.style.display = "none";
        warning.style.color = "red";

        // "notes"
        const notesText = document.createElement("h2")
        notesText.textContent = "Notes";
        
        // textbox
        textbox = document.createElement("textarea");
        if (isOnDarkTheme()) {
            textbox.style.backgroundColor = DARK_THEME_BG_COLOR;
        } else {
            textbox.style.backgroundColor = LIGHT_THEME_BG_COLOR;
        }
        textbox.id = "textbox";
        textbox.placeholder = "Enter note here";
        textbox.style.width = "100%";
        textbox.style.height = "60px";
        textbox.style.marginTop = "2px"; // spacing between label and textbox
        
        div.appendChild(warning);
        div.appendChild(notesText);
        // div.appendChild(document.createElement("br"));
        div.appendChild(textbox);
        
        // insert textbox after the target div
        targetDiv.append(div);
        inserted = true;
    } else {
        throw("RPN: Could not find target div to insert notes textbox.");
    }
}

function getUserID() {
    const currentURL = window.location.href;
    
    const parts = currentURL.split("/");
    
    // assuming userid always after "users" -> roblox.com/users/USERID/profile
    return parts[parts.indexOf("users") + 1];
}

async function loadNote() {
    const result = await chrome.storage.sync.get(userID);
    if (result[userID]) { // if saved note exists
        textbox.value = result[userID];
    }
}

function saveNoteOnChange() {
    // on textbox input change, update note
    textbox.addEventListener('input', () => {
        try {
            const note = textbox.value;
            if (note === "") { // remove note if empty
                chrome.storage.sync.remove(userID);
                return;
            }
            const saveData = {};
            saveData[userID] = note;
            chrome.storage.sync.set(saveData);

        // eslint-disable-next-line no-unused-vars
        } catch (error) { // this happens if ext updates while tab is already open
            showWarningAndDisableTextbox();
        }
    });
}

// to do: mutationobserver so textbox updates if theme is changed after content.js loads
function isOnDarkTheme() {
    const rbxBodyElement = document.querySelector("#rbx-body");
    const classes = rbxBodyElement.getAttribute("class");
    const isOnDark = classes.indexOf("dark-theme") != -1;

    if (isOnDark) {
        return true;
    }
    return false;
}

function showWarningAndDisableTextbox() {
    const warning = document.getElementById("warning");
    warning.style.display = "block";
    alert("SAVE FAILED! SAVE/COPY YOUR NOTE AND RELOAD THE PAGE!");
    const textbox = document.getElementById("textbox");
    textbox.setAttribute("readonly", true);
    textbox.setAttribute("disabled", true);
}