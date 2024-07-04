async function main() {
    const notesDiv = document.getElementById("notes");
    let storage = await chrome.storage.sync.get();
    console.log(storage);

    for (const id in storage) {
        const note = storage[id];
        createNote(id, note);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

function createNote(id, note) {
    const div = document.createElement("div");
    div.className = "note";

    const p = document.createElement("p");
    p.id = id + "Note";
    p.textContent = id + ": \n" + note;
    p.style.display = "none";

    const button = document.createElement("button");
    button.innerText = id;
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