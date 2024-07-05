if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

async function main() {
    const importButton = document.getElementById("importButton");
    const exportButton = document.getElementById("exportButton");

    let storage = await chrome.storage.sync.get();
    console.log(storage);

    for (const id in storage) {
        const note = storage[id];
        createNote(id, note);
    }
}

function importNotes() {
    
}

function createNote(id, note) {
    const div = document.createElement("fieldset");
    div.className = "note";

    const p = document.createElement("p");
    p.id = id + "Note";
    p.textContent = note;
    p.style.display = "none";

    const button = document.createElement("button");
    button.innerText = "LO3 \n pp232213321123e2";
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