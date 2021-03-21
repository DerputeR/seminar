//#region Load from Local Storage

let saveData = localStorage.getItem("names");

// Create save data, if none found
if (saveData === null) {
    console.log("no save data found!");
    
    saveData = {
        namesList: [],
        namesLeft: [],
        namesUsed: [],
        nameSelected: undefined
    };

    SaveToLocalStorage("names", saveData);
    
}
else {
    saveData = JSON.parse(saveData);
    console.log("save data loaded");
}

/**
 * Save object/data to localStorage.
 * @param {String} key 
 * @param {*} data Converted to a JSON string by the function
 */
function SaveToLocalStorage (key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

//#endregion

// Load a copy of the data
let namesList = [].concat(saveData.namesList);
let namesLeft = [].concat(saveData.namesLeft);
let namesUsed = [].concat(saveData.namesUsed);
let nameSelected = saveData.nameSelected === undefined ? undefined : toString(saveData.namesList);


/**
 * Hacky solution until I refactor the code to
 * reference the object's data fields directly
 */
function UpdateSaveData() {
    saveData.namesList = namesList;
    saveData.namesLeft = namesLeft;
    saveData.namesUsed = namesUsed;
    saveData.nameSelected = nameSelected;
}


/**
 * Remove front and end whitespace and replace recurring whitespace with underscore
 * @param {number} mode - (0) Allow spaces (1) Replace spaces with underscores
 * @param  {...any} names - Names (can be in array or comma-separated list) to be added/removed
 */
function FixNames(mode, ...names)
{
    if (Array.isArray(names[0]))
    {
        names=names[0];
    }

    let fixedNames = [];

    if (mode == 1)
    {
        for (let name of names)
        {
            name=name.trim();
            name=name.replace(/\s+/g, "_");
            fixedNames.push(name);
        }
    }
    else
    {
        for (let name of names)
        {
            name=name.trim();
            name=name.replace(/\s+/g, " ");
            fixedNames.push(name);
        }
    }
    return fixedNames;    
}

function AddName(...names)
{
    let namesAdded = [];
    if (Array.isArray(names[0]))
    {
        names=names[0];
    }
    names=FixNames(0, names);
    for (let name of names)
    {
        if (namesList.indexOf(name) === -1)
        {
            if (name.length !== 0)
            {
                namesList.push(name);    
                namesLeft.push(name);
                console.log (`Added ${name} to the list`);
                namesAdded.push(name);
            }
            else
            {
                console.log ("You aren't adding anything");
            }
        }
        else
        {
            // Trigger a before/after pseudo element warning the user the name already is in the list
            console.log("Name already in list");
        }
    }
    return namesAdded;
}

function RemoveNameByIndex(...indicies)
{
    let namesRemoved = [];
    if (Array.isArray(indicies[0]))
    {
        indicies=indicies[0];
    }
    for (let index of indicies)
    {
        let nameToRemove = namesList[index];
        let i1 = namesLeft.indexOf(nameToRemove);
        let i2 = namesUsed.indexOf(nameToRemove);
        if (i1 != -1)
        {
            namesLeft.splice(i1, 1);
        }
        if (i2 != -1)
        {
            namesUsed.splice(i2, 1);
        }
        if (nameSelected == nameToRemove)
        {
            nameSelected = undefined;
        }
        namesList.splice(index, 1);
        namesRemoved.push(nameToRemove);
    }
    return namesRemoved;
}

function RemoveNameByName(...names)
{
    let namesRemoved = [];
    if (Array.isArray(names[0]))
    {
        names=names[0];
    }
    for (let name of names)
    {
        let i0 = namesList.indexOf(name);
        let i1 = namesLeft.indexOf(name);
        let i2 = namesUsed.indexOf(name);
        if (nameSelected == name)
        {
            nameSelected = undefined;
        }
        if (i0 != -1)
        {
            namesList.splice(i0, 1);
            namesRemoved.push(name);
        }
        if (i1 != -1)
        {
            namesLeft.splice(i1, 1);
        }
        if (i2 != -1)
        {
            namesUsed.splice(i2, 1);
        }
    }
    return namesRemoved;
}

function RemoveAllNames()
{
    namesList = [];
    namesLeft = [];
    namesUsed = [];
    nameSelected = undefined;
}

function ResetNamesLeft()
{
    namesLeft = namesList.slice();
    namesUsed = [];
    nameSelected = undefined;
}

function ChooseName()
{
    let len = namesLeft.length;
    if (len > 0)
    {
        let index = Math.floor(Math.random() * namesLeft.length);
        nameSelected = namesLeft[index];
        namesUsed.push(nameSelected);
        namesLeft.splice(index, 1);
    }
    else
    {
        nameSelected = undefined;
        console.log("No names left to choose!");
    }
}

/**
 * Update leader text
 */
function UpdateLeader() {
    if (nameSelected)
    {
        UpdateNamesList(2, nameSelected);
    }
    leaderText.textContent = "Leader: " + (nameSelected == undefined ? "No one" : nameSelected);
}


/**
 * For Updating the DOM
 * @param {number} mode - Remove(-1), Reload(0), Add(1), Toggle State (2) 
 * @param {string} names - Names (can be in array or comma-separated list) to be added/removed
 */
function UpdateNamesList(mode, ...names)
{
    if (Array.isArray(names[0]))
    {
        names=names[0];
    }
    switch(mode)
    {
        // Remove delta
        case -1:
            for (let name of names)
            {
                let idName = FixNames(1, name);
                let liToRemove = document.querySelector(`#li${idName}`);
                liToRemove.remove();
            }
            break;
            
        // Hard reload: Remove all elements from DOM and read from namesList
        case 0:
            while (ulNamesList.firstChild)
            {
                ulNamesList.removeChild(ulNamesList.firstChild);
            }
            for (let name of namesList)
            {
                let idName = FixNames(1, name);
                let liToAdd = document.createElement("li");
                liToAdd.id = `li${idName}`;
                liToAdd.innerText = name;
                ulNamesList.appendChild(liToAdd);
            }
            UpdateLeader();
            break;

        // Add delta
        case 1:
            for (let name of names)
            {
                let idName = FixNames(1, name);
                let liToAdd = document.createElement("li");
                liToAdd.id = `li${idName}`;
                liToAdd.innerText = name;
                ulNamesList.appendChild(liToAdd);
            }
            break;

        // Toggle crossed out state
        case 2:
            for (let name of names)
            {
                let idName = FixNames(1, name);
                let liToChange = document.querySelector(`#li${idName}`);
                liToChange.className = (liToChange.className.length > 0 ? "" : "done");
            }
    }
}


// Callback for pressing the add button or hitting enter while in the name input field
function CallbackAddName () {
    let nameToAdd = inputName.value;
    UpdateNamesList(1, AddName(nameToAdd));
    inputName.value = "";
    UpdateSaveData();
    SaveToLocalStorage("names", saveData);
}

// Buttons and stuff
const btnAdd = document.querySelector("#btnAdd");
const btnRemove = document.querySelector("#btnRemove");
const btnRemoveAll = document.querySelector("#btnRemoveAll");
const inputName = document.querySelector("#inputName");
const btnReset = document.querySelector("#btnReset");
const btnChoose = document.querySelector("#btnChoose"); 
const leaderText = document.querySelector("#leaderText");

// ULs
const ulNamesList = document.querySelector("#ulNamesList");
const ulNamesLeft = document.querySelector("#ulNamesLeft");
const ulNamesUsed = document.querySelector("#ulNamesUsed");


// Add button event listener
btnAdd.addEventListener("click", (e) => {
    CallbackAddName();
});

// Pressing enter while in the text field triggers add button
inputName.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
        CallbackAddName();
    }
});

// TODO: Add multi-name selection and deletion

// Choose new leader button event listener
btnChoose.addEventListener("click", function(e)
{
    ChooseName();
    
    UpdateLeader();

    UpdateSaveData();
    SaveToLocalStorage("names", saveData);
});

// Remove all names from list button event listener
btnRemoveAll.addEventListener("click", function(e)
{
    RemoveAllNames();
    UpdateNamesList(0);
    leaderText.textContent = "Leader: None";
    UpdateSaveData();
    SaveToLocalStorage("names", saveData);
});

// Reset selection record button event listener
btnReset.addEventListener("click", function(e)
{
    ResetNamesLeft();
    UpdateNamesList(0);
    leaderText.textContent = "Leader: None";
    UpdateSaveData();
    SaveToLocalStorage("names", saveData);
});


// Hacky page-load update
UpdateNamesList(0);