let userID = "";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

function main() {
    // check if script has already run (for ff, if extension is reenabled)
    if (document.getElementById("textbox")) {
        location.reload();
    }

    // reload page if data was imported, from popup.js
    chrome.runtime.onMessage.addListener((message) => {
        if (message === "reload") {
            location.reload();
        }
    });

    addTextbox();
    userID = getUserID();
    loadNote();
    saveNoteOnChange();
}

function getUserID() {
    // Get the current URL
    const currentURL = window.location.href;
    
    const parts = currentURL.split("/");
    
    // assuming userid always after "users" -> roblox.com/users/USERID/profile
    return parts[parts.indexOf("users") + 1];
}

function loadNote() {
    chrome.storage.sync.get(userID, (result) => {
        if (result[userID]) { // if saved note exists
            textbox.value = result[userID];
        }
    });
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
        } catch (error) { // this happens if ext updates while tab is already open
            const warning = document.getElementById("warning");
            warning.style.display = "block";
            alert("SAVE FAILED! SAVE/COPY YOUR NOTE AND RELOAD THE PAGE!");
            const textbox = document.getElementById("textbox");
            textbox.setAttribute("readonly", true);
            textbox.setAttribute("disabled", true);
        }
    });
}

function addTextbox() {
    // select profile card div
    const targetDiv = document.getElementById("profile-header-container");
    
    if (targetDiv && targetDiv.classList.contains("section") && targetDiv.classList.contains("profile-header")) {
        const div = document.createElement("div");
        div.style.marginBottom = "12px"; // center between 2 sections above/below
        
        // this is to make notes label aligned to top left of div instead of bottom left
        div.style.alignItems = "flex-start";
        
        // this happens if ext updates while tab is already open
        const warning = document.createElement("p");
        warning.id = "warning";
        warning.textContent = "SAVE FAILED! SAVE/COPY YOUR NOTE AND RELOAD THE PAGE!";
        warning.style.display = "none";
        warning.style.color = "red";

        // create "notes" label
        const label = document.createElement("label")
        label.textContent = "Notes: ";
        label.style.fontWeight = "bold";
        label.style.marginRight = "8px";
        
        // new textbox element
        textbox = document.createElement("textarea");
        textbox.id = "textbox";
        textbox.placeholder = "Enter note here";
        textbox.style.backgroundColor = "#e0e0e0";
        textbox.style.width = "100%";
        textbox.style.height = "60px";
        
        div.appendChild(warning);
        div.appendChild(label);
        div.appendChild(document.createElement("br"));
        div.appendChild(textbox);
        
        // insert the textbox after the target div
        targetDiv.parentNode.insertBefore(div, targetDiv.nextSibling);

        return;
    }
}