/*
for now, to view all your notes:
get the 'Storage Area Viewer' extension (https://chromewebstore.google.com/detail/storage-area-viewer/fcbndbpibgeafoogbmbcljcmgakaniae)
go to 'chrome-extension://ID/manifest.json' where ID is the extension ID found in 'chrome://extensions/' -> find/click RPN's extension details
ctrl+shift+i or inspect the page
click the "Storage Area Viewer" tab
change "storage area" to "sync"
*/


let textbox;
let userID;

function updateUserID() {
    // Get the current URL
    const currentURL = window.location.href;
    
    const parts = currentURL.split("/");
    
    // assuming userid always after "users" -> roblox.com/users/USERID/profile
    userID = parts[parts.indexOf("users") + 1];
}

function loadNote() {
    browser.storage.sync.get([userID], (result) => {
        if (result[userID]) {
            textbox.value = result[userID];
        }
    });
}

function saveNoteOnChange() {
    textbox.addEventListener('input', () => {
        const note = textbox.value;
        const saveData = {};
        saveData[userID] = note;
        browser.storage.sync.set(saveData);
    });
}

function addTextbox() {
    // Select the target div using the id
    const targetDiv = document.getElementById("profile-header-container");
    
    if (targetDiv && targetDiv.classList.contains("section") && targetDiv.classList.contains("profile-header")) {
        const div = document.createElement("div"); // holds label and txtbox
        div.style.marginBottom = "12px"; // center between 2 sections above/below
        // this is to make notes label aligned to top left of div instead of bottom left
        div.style.display = "flex";
        div.style.alignItems = "flex-start";
        
        // create "notes" label
        const label = document.createElement("label")
        label.textContent = "Notes: ";
        label.style.fontWeight = "bold";
        label.style.marginRight = "8px"; // add margin to separate label and textbox
        
        // new textbox element
        textbox = document.createElement("textarea");
        textbox.placeholder = "Enter note here";
        textbox.style.backgroundColor = "#e0e0e0";
        textbox.style.width = "100%"
        
        div.appendChild(label);
        div.appendChild(textbox);
        
        // insert the textbox after the target div
        targetDiv.parentNode.insertBefore(div, targetDiv.nextSibling);

        return;
    }
} 

function main() {
    addTextbox()
    updateUserID()
    loadNote()
    saveNoteOnChange()
}


if (document.readyState === "loading") {
    // loading not finished yet
    document.addEventListener("DOMContentLoaded", main);
  } else { // DOMContentLoaded already fired
    main();
  }