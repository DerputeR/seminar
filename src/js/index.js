var input = document.querySelector(".buttons");
var nameField = document.querySelector("#inputName");
// var nextNameId = 0;
var domRemoveButton = input.querySelector("#btnRemove");
domRemoveButton.disabled = true;
var domLeaderText = document.querySelector("#leaderText");

var domList = document.querySelector("#ulNamesList");
var domAllNames = []; // Keep track of every dom name element to allow for easy removal of names. Needs to update everytime a name is added/removed
var domSelectedNameIndices = []; // Pull the indicies of the selected dom elements from the above list


// Event listeners
input.addEventListener("keydown", handleKeyDown);
input.addEventListener("keyup", handleKeyUp);
input.addEventListener("pointerdown", handlePointerDown);
document.addEventListener("pointerup", handlePointerUp);
domList.addEventListener("keydown", handleNameKeyDown);
domList.addEventListener("keyup", handleNameKeyUp);
domList.addEventListener("pointerup", handleNamePointerUp);
nameField.addEventListener("keydown", handleKeyDown);


var sortableNamesList = new Sortable(domList, {
    delay: 100,
    delayOnTouchOnly: true,
    touchStartThreshold: 1,
    animation: 150,
    ghostClass: "ghost",
    onChoose: (e) => {
        // console.log(e.item.innerText + " chosen");
    },
    onStart: (e) => {
        // console.log(e.item.innerText + " is being dragged");
        domList.removeEventListener("pointerup", handleNamePointerUp);
    },
    onEnd: (e) => {
        moveUpdate(e.oldIndex, e.newIndex);
        saveToLocalStorage();
        console.log(e.item.innerText + " reordered from index " + e.oldIndex + " to " + e.newIndex);
        domList.addEventListener("pointerup", handleNamePointerUp);
    }
});

//#region polyfills

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
// This version tries to optimize by only checking for "in" when looking for undefined and
// skipping the definitely fruitless NaN search. Other parts are merely cosmetic conciseness.
// Whether it is actually faster remains to be seen.
if (!Array.prototype.indexOf)
  Array.prototype.indexOf = (function(Object, max, min) {
    "use strict"
    return function indexOf(member, fromIndex) {
      if (this === null || this === undefined)
        throw TypeError("Array.prototype.indexOf called on null or undefined")

      var that = Object(this), Len = that.length >>> 0, i = min(fromIndex | 0, Len)
      if (i < 0) i = max(0, Len + i)
      else if (i >= Len) return -1

      if (member === void 0) {        // undefined
        for (; i !== Len; ++i) if (that[i] === void 0 && i in that) return i
      } else if (member !== member) { // NaN
        return -1 // Since NaN !== NaN, it will never be found. Fast-path it.
      } else                          // all else
        for (; i !== Len; ++i) if (that[i] === member) return i

      return -1 // if the value was not found, then return -1
    }
  })(Object, Math.max, Math.min)

//#endregion


//#region Helper functions

function removeTrailingWhiteSpace(str) {
    var reg = /^\s+|\s+$/g;
    return (str.replace(reg, ""));
}

function hasClass(element, className) {
    className = removeTrailingWhiteSpace(className);
    return (" " + element.className + " ").indexOf(" " + className + " ") > -1;
}

function findClassIndex(element, className) {
    className = removeTrailingWhiteSpace(className);
    var index = (" " + element.className + " ").indexOf(" " + className + " ");
    return index > 0 ? index - 1 : index;
}

function addClass(element, className) {
    className = removeTrailingWhiteSpace(className);
    if (!hasClass(element, className)) {
        if (element.className.length === 0) {
            element.className += className;
        }
        else element.className += " " + className;
    }
}

function removeClass(element, className) {
    className = removeTrailingWhiteSpace(className);
    var i = findClassIndex(element, className);
    if (i > -1) {
        var newClassName = element.className + " ";
        newClassName = newClassName.substring(0, i) + newClassName.substring(i + className.length + 1);
        newClassName = removeTrailingWhiteSpace(newClassName);
        element.className = newClassName;
    }
}

// https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
function moveArrayElement (arr, from, to) {
    arr.splice(to, 0, arr.splice(from, 1)[0]);
}

//#endregion


//#region Compatible replacement for :active pseudoelement

function handleKeyDown(e) {
    if ((e.keyCode == 32 || e.keyCode == 13) && e.target.nodeName === "INPUT" && e.target.type === "button") {
        // Prevent event spam; Minor optimization
        // input.removeEventListener("keydown", handleKeyDown);

        // Extend bugfix 2021-01-17 to keypressed buttons
        // buttonsPressedByPointer.push(e.target);

        addClass(e.target, "pressed");
    }
    else if ((e.keyCode == 13) && e.target.nodeName === "INPUT" && e.target.type === "text") {
        btnAdd();
    }
}

function handleKeyUp(e) {
    if ((e.keyCode == 32 || e.keyCode == 13) && e.target.nodeName === "INPUT" && e.target.type === "button") {
        // Add back the removed listener (opimization)
        // input.addEventListener("keydown", handleKeyDown);

        // Only fire if the button is currently in "pressed" state
        if (hasClass(e.target, "pressed")) {
            removeClass(e.target, "pressed");
            
            // Now fire the button's method
            fireButtonFunction(e.target.id);
            console.log(e.target.id + " fired");
        }
    }
}

// ? Maybe test using this "fix" with buttons activated by keys?
var buttonsPressedByPointer = [];

function handlePointerDown(e) {
    if (e.button === 0 && e.target.nodeName === "INPUT" && e.target.type === "button") {
        addClass(e.target, "pressed");
        buttonsPressedByPointer.push(e.target);
    }
}

// //  Bug: pressing the button, moving off the button, and letting go of the button does not deactivate the button
// Fixed 2021-01-17

function handlePointerUp(e) {
    if (e.button === 0) {
        if (e.target.nodeName === "INPUT" && e.target.type === "button") {
            // Only fire if the button is currently in "pressed" state
            if (hasClass(e.target, "pressed")) {
                removeClass(e.target, "pressed");

                // Now fire the button's method
                fireButtonFunction(e.target.id);
                console.log(e.target.id + " fired");
            }
        }

        // If we let go of left-click anywhere on the page, deactivate the pressed button(s) without firing their functions
        for (var buttonIndex = 0; buttonIndex < buttonsPressedByPointer.length; buttonIndex++) {
            removeClass(buttonsPressedByPointer[buttonIndex], "pressed");
        }

        buttonsPressedByPointer = [];
    }
}

function fireButtonFunction(buttonId) {
    switch (buttonId) {
        case "btnAdd":
            btnAdd();
            break;
        case "btnRemove":
            btnRemove();
            break;
        case "btnRemoveAll":
            btnRemoveAll();
            break;
        case "btnReset":
            btnReset();
            break;
        case "btnChoose":
            btnChoose();
            break;
        default:
            console.log("A button was pressed, but I haven't implemented it yet!")
    }
}

//#endregion


//#region Button functions
function btnAdd() {
    var name = removeTrailingWhiteSpace(nameField.value);
    if (name.length > 0) {
        var nameEntry = createNameEntry(name, false);
        saveData.names.push(nameEntry);
        domList.appendChild(newNameNode(nameEntry));
        console.log(name + " added");
        updateDomAllNames();
        saveToLocalStorage();
    }
    nameField.value = "";
}

function btnRemoveAll() {
    var allIndices = [];
    var len = domAllNames.length;
    var i = 0;
    for (i; i < len; i++) {
        allIndices.push(i);
    }
    if (allIndices.length > 0) {
        removeNamesByIndex(allIndices);
        console.log("removed all names");
    }
    
    // Hardwipe localStorage
    newSaveData();
    saveToLocalStorage();
}

function btnRemove() {
    if (domSelectedNameIndices.length > 0) {
        removeNamesByIndex(domSelectedNameIndices);
        console.log("removed selected");
        saveToLocalStorage();
    }
}

function btnChoose() {
    clearLeaderIndex();
    var usableIndices = [];
    var a = 0;
    var len = domAllNames.length;
    for (a; a < len; a++) {
        if (domAllNames[a].getAttribute("data-used") == "false") {
            usableIndices.push(a);
        }
    }
    if (usableIndices.length > 0) {
        var i = Math.floor(Math.random() * usableIndices.length);
        var index = usableIndices[i];
        saveData.nameLeaderIndex = index;
        saveData.names[index][1] = true;
        domAllNames[index].setAttribute("data-used", true);
        updateStyling(index);
        domLeaderText.innerText = "Leader: " + saveData.names[index][0];
    }
    else {
        domLeaderText.innerText = "All have been chosen!";
    }
    saveToLocalStorage();
}

function btnReset() {
    saveData.nameLeaderIndex = -1;
    var a = 0;
    var len = domAllNames.length;
    for (a; a < len; a++) {
        domAllNames[a].setAttribute("data-used", false);
        saveData.names[a][1] = false;
        updateStyling(a);
    }
    domLeaderText.innerText = "Leader: None";
    saveToLocalStorage();
}
//#endregion


//#region Save data functions
// Get save-data. If it doesn't exist, create it:
var saveData = localStorage.getItem("names");
if (saveData === null) {
    console.log("No save data found! Creating new...");
    newSaveData();
}
else {
    saveData = JSON.parse(saveData);
    verifySaveData();
}
saveToLocalStorage();
createInitialNodes();
console.log(saveData.nameLeaderIndex);
updateDomAllNames();
console.log(saveData.nameLeaderIndex);

// TODO: Restructure to use a name object, map, or array to store a String (name) and a boolean (isUsed)
function newSaveData() {
    saveData = {
        names: [],
        nameLeaderIndex: -1
    };
}

function verifySaveData() {
    if (saveData == null) {
        newSaveData();
    }
    if (saveData.names === undefined || saveData.names === null) {
        saveData.names = [];
        saveData.nameLeaderIndex = -1;
    }
    if (saveData.nameLeaderIndex === undefined || saveData.nameLeaderIndex === null) {
        saveData.nameLeaderIndex = -1;
    }
}

function saveToLocalStorage() {
    localStorage.setItem("names", JSON.stringify(saveData));
}

function createInitialNodes() {
    var foundLeader = false;
    var len = saveData.names.length;
    var i = 0;
    for (i; i < len; i++) {
        var element = newNameNode(saveData.names[i]);
        if (!foundLeader) {
            if (i == saveData.nameLeaderIndex) {
                foundLeader = true;
                addClass(element, "leader");
                domLeaderText.innerText = "Leader: " + saveData.names[i][0];
            }
        }
        if (saveData.names[i][1] === true) {
            element.setAttribute("data-used", true);
        }
        domList.appendChild(element);
    }
}
//#endregion


//#region Name methods (2020-03-30 name data model)


//#region Creation and deletion
/**
 * Creates a new name entry in the form of an array
 * @param {*} name String containing the name. Leading and trailing whitespace will be removed
 * @param {*} used Boolean to determine if the name was picked in the past
 * @returns 
 */
function createNameEntry(name, used) {
    name = removeTrailingWhiteSpace(name);
    return [name, used];
}

/**
 * Creates a new name node
 * @param {string} name 
 * @returns A Node element with the new name and ID
 */
function newNameNode(nameEntry) {
    nameEntry[0] = removeTrailingWhiteSpace(nameEntry[0]);
    var li = document.createElement("LI");
    li.innerText = nameEntry[0];
    li.className = "name";
    li.setAttribute("tabindex" , "0");
    li.setAttribute("data-name", nameEntry[0]);
    li.setAttribute("data-used", nameEntry[1]);
    // li.id = "name-" + name; // id is unused
    // nextNameId++; // currently unused
    return li;
}

/**
 * Remove name nodes by index. Also updates saveData.
 * @param {Array} indices Array of integer indices to be removed.
 * @returns 
 */
function removeNamesByIndex(indices) {
    var elementsRemoved = 0;
    var smallestIndex = indices[0];
    for (var i = 0; i < indices.length; i++) {
        var nameIndex = indices[i];
        if (nameIndex < smallestIndex) {
            smallestIndex = nameIndex;
            saveData.names.splice(nameIndex, 1);
        }
        else {
            saveData.names.splice(nameIndex - elementsRemoved, 1);
        }
        domAllNames[nameIndex].remove();
        elementsRemoved++;
    }
    // domRemoveButton.disabled = true;
    updateDomAllNames(); // make sure the record is up-to-date
}
//#endregion

//#region Node interaction callbacks
function handleNameKeyDown(e) {
    if ((e.keyCode == 32 || e.keyCode == 13) && e.target.nodeName === "LI") {
        // Stop the use of space/enter from scrolling the name list
        e.preventDefault();
    }
}

function handleNameKeyUp(e) {
    if ((e.keyCode == 32 || e.keyCode == 13) && e.target.nodeName === "LI") {
        toggleNameSelection(e);
    }
}

function handleNamePointerUp(e) {
    if (e.button === 0 && e.target.nodeName === "LI") {
        toggleNameSelection(e);
    }
}
//#endregion

//#region Updates
// Retrieves all name entries in the DOM and updates their indicies
function updateDomAllNames() {
    // If this isn't the first time the DOM is being updated, then find the leader node and update its index after the index data is updated for the entire list
    var firstLoad = !(domAllNames.length > 0);
    var leaderNode;
    if (!firstLoad) {
        leaderNode = domAllNames[saveData.nameLeaderIndex];
    }    

    domAllNames = domList.querySelectorAll("li.name");
    for (var i = 0; i < domAllNames.length; i++) {
        domAllNames[i].setAttribute("data-index", i);
    }

    if (!firstLoad) {
        if (leaderNode != null) {
            saveData.nameLeaderIndex = leaderNode.getAttribute("data-index"); // Update the index of the leader
        }
        else saveData.nameLeaderIndex = -1;
    } // else don't change the index - it's already correct

    domSelectedNameIndices = [];
    domRemoveButton.disabled = true;

    updateDomSelectedNames();
}

function clearLeaderIndex() {
    var leaderNode = domAllNames[saveData.nameLeaderIndex];
    if (leaderNode != null) {
        removeClass(domAllNames[saveData.nameLeaderIndex], "leader");
    }
    saveData.nameLeaderIndex = -1;
}

function updateStyling(index) {
    if (saveData.nameLeaderIndex === index) {
        addClass(domAllNames[index], "leader");
    }
    else if (saveData.names[index][1] === true) {
        domAllNames[index].setAttribute("data-used", true);
        removeClass(domAllNames[index], "leader");
    }
    else {
        domAllNames[index].setAttribute("data-used", false);
        removeClass(domAllNames[index], "leader");
    }
}

function moveNameInSaveData(indexFrom, indexTo) {
    var len = saveData.names.length;
    if (indexFrom >= 0 && indexFrom < len  && indexTo >= 0 && indexTo < len) {
        moveArrayElement(saveData.names, indexFrom, indexTo);
    }
}

function moveUpdate(indexFrom, indexTo) {
    moveNameInSaveData(indexFrom, indexTo);
    updateDomAllNames();
}

function toggleNameSelection(e) {
    var index = e.target.getAttribute("data-index");
    if (hasClass(e.target, "selected")) {
        removeClass(e.target, "selected");

        var i = domSelectedNameIndices.indexOf(index);
        if (i > -1) {
            domSelectedNameIndices.splice(i, 1);
        }
    }
    else {
        addClass(e.target, "selected");
        domSelectedNameIndices.push(index);
    }
    if (domSelectedNameIndices.length > 0) {
        domRemoveButton.disabled = false;
    }
    else {
        domRemoveButton.disabled = true;
    }
}

function updateDomSelectedNames() {
    var len = domAllNames.length;
    var i = 0;
    for (i; i < len; i++) {
        var index = domAllNames[i].getAttribute("data-index");
        if (hasClass(domAllNames[i], "selected")) {
            domSelectedNameIndices.push(index);
        }
        if (domSelectedNameIndices.length > 0) {
            domRemoveButton.disabled = false;
        }
        else {
            domRemoveButton.disabled = true;
        }
    }
}
//#endregion


//#endregion

//#region Import/Export
// From https://www.codevoila.com/post/30/export-json-data-to-downloadable-file-using-javascript

function exportToJsonFile(jsonData) {
    var dataStr = JSON.stringify(jsonData);
    var dataURI = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    var defaultName = 'nameslist.json';

    
}


//#endregion