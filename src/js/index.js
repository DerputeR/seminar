var input = document.querySelector(".buttons");
var nameField = document.querySelector("#inputName");
var nextNameId = 0;
var domRemoveButton = input.querySelector("#btnRemove");

var domList = document.querySelector("#ulNamesList");
var sortableNamesList = new Sortable(domList, {
    delay: 100,
    delayOnTouchOnly: true,
    touchStartThreshold: 1,
    animation: 150,
    ghostClass: "ghost",
    onEnd: (e) => {
        console.log(e.item + "reordered from index " + e.oldIndex + " to " + e.newIndex);
    }
});

// Event listeners
input.addEventListener("keydown", handleKeyDown);
input.addEventListener("keyup", handleKeyUp);
input.addEventListener("pointerdown", handlePointerDown);
document.addEventListener("pointerup", handlePointerUp);
domList.addEventListener("keydown", handleNameKeyDown);
domList.addEventListener("keyup", handleNameKeyUp);
domList.addEventListener("pointerup", handleNamePointerUp);

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
            // Do something
            break;
        case "btnChoose":
            // Do something
            break;
        default:
            console.log("A button was pressed, but I haven't implemented it yet!")
    }
    saveToLocalStorage();
}

//#endregion


//#region Button functions

function btnAdd() {
    var name = removeTrailingWhiteSpace(nameField.value);
    if (name.length > 0) {
        addNamesToLists([name], [saveData.namesTotal, saveData.namesLeft]);
        domList.appendChild(newNameNode(name));
        console.log(name + " added");
    }
    nameField.value = "";
}

function btnRemoveAll() {
    var namesCopy = saveData.namesTotal.concat();
    removeNameNodes(namesCopy);
    removeNamesFromLists(namesCopy, [saveData.namesUsed, saveData.namesLeft, saveData.namesTotal, selectedDomNames]);
    console.log("removed all names")
}

function btnRemove() {
    var namesCopy = selectedDomNames.concat();
    removeNameNodes(namesCopy);
    removeNamesFromLists(namesCopy, [saveData.namesUsed, saveData.namesLeft, saveData.namesTotal, selectedDomNames]);
    console.log("removed " + namesCopy);
}

//#endregion


//#region Save data functions

// Get save-data. If it doesn't exist, create it:
var saveData = localStorage.getItem("names");
if (saveData === null) {
    console.log("No save data found! Creating new...")
    newSaveData();
}
else {
    saveData = JSON.parse(saveData);
    verifySaveData();
}
saveToLocalStorage();
createInitialNodes();

// TODO: Restructure to use a name object, map, or array to store a String (name) and a boolean (isUsed)
function newSaveData() {
    saveData = {
        namesTotal: [],
        namesUsed: [],
        namesLeft: [],
        nameLeader: ""
    };
}

function verifySaveData() {
    if (saveData.namesTotal === undefined) {
        saveData.namesTotal = [];
        saveData.namesUsed = [];
        saveData.namesLeft = [];
    }
    if (saveData.namesUsed === undefined) {
        saveData.namesUsed = [];
    }
    if (saveData.namesLeft === undefined) {
        saveData.namesLeft = saveData.namesTotal;
    }
    if (saveData.nameLeader === undefined) {
        saveData.nameLeader = "";
    }
}

function saveToLocalStorage() {
    localStorage.setItem("names", JSON.stringify(saveData));
}

function createInitialNodes() {
    var foundLeader = false;
    for (var i = 0; i < saveData.namesTotal.length; i++) {
        var element = newNameNode(saveData.namesTotal[i]);
        if (!foundLeader) {
            if (saveData.namesTotal[i] == saveData.nameLeader) {
                foundLeader = true;
                addClass(element, "leader");
            }
        }
        domList.appendChild(element);
    }
}

//#endregion


//#region Old name methods

function addName(name) {
    name = removeTrailingWhiteSpace(name);
    saveData.namesTotal.push(name);
    saveData.namesLeft.push(name);
}

function removeName(name) {
    name = removeTrailingWhiteSpace(name);
    var a = saveData.namesTotal.indexOf(name);
    if (a > -1) {
        saveData.namesTotal.splice(i, 1);

        var b = saveData.namesUsed.indexOf(name);
        var c = saveData.namesLeft.indexOf(name);

        if (b > -1) {
            saveData.namesUsed.splice(i, 1);
        }
        if (c > -1) {
            saveData.namesLeft.splice(i, 1);
        }

        if (saveData.nameLeader === name) {
            saveData.nameLeader = "";
        }
    }
}

function moveName(name, indexTo) {
    name = removeTrailingWhiteSpace(name);
    var indexFrom = saveData.namesTotal.indexOf(name);
    if (indexFrom > -1) {
        moveArrayElement(saveData.namesTotal, indexFrom, indexTo);
    }
}

//#endregion


//#region Generic name methods

/**
 * Add an array of names to multiple lists
 * @param {Array} names Array of names
 * @param {Array} lists Array of arrays
 */
function addNamesToLists(names, lists) {
    for (var nameIndex = 0; nameIndex < names.length; nameIndex++) {
        var name = removeTrailingWhiteSpace(names[nameIndex]);
        for (var listIndex = 0; listIndex < lists.length; listIndex++) {
            lists[listIndex].push(name);
        }
    }
}

/**
 * Remove an array of names from multiple lists
 * @param {Array} names Array of names
 * @param {Array} lists Array of arrays
 */
function removeNamesFromLists(names, lists) {
    for (var nameIndex = 0; nameIndex < names.length; nameIndex++) {
        var name = removeTrailingWhiteSpace(names[nameIndex]);
        for (var listIndex = 0; listIndex < lists.length; listIndex++) {
            var indexOfNameInList = lists[listIndex].indexOf(name);
            if (indexOfNameInList > -1) {
                lists[listIndex].splice(indexOfNameInList, 1);
            }
        }
    }
}

/**
 * Move a name within a list
 * @param {string} name Name to move
 * @param {Array} list List to move name in
 * @param {number} indexTo Index to move name to
 */
function moveNameInList(name, list, indexTo) {
    name = removeTrailingWhiteSpace(name);
    var indexFrom = list.indexOf(name);
    if (indexFrom > -1) {
        moveArrayElement(list, indexFrom, indexTo);
    }
}

//#endregion


//#region DOM Update functions

// Name item template; React would probably be a better choice for this
function newNameNode(name) {
    name = removeTrailingWhiteSpace(name);
    var li = document.createElement("LI");
    li.innerHTML = name;
    li.className = "name";
    li.setAttribute("tabindex" , "0");
    li.setAttribute("data-name", name);
    // li.id = "name-" + name; // id is unused
    nextNameId++;
    return li;
}

/**
 * Remove name nodes from the DOM
 * @param {Array} nameNodes Array of names
 */
function removeNameNodes(names) {
    for (var nameIndex = 0; nameIndex < names.length; nameIndex++) {
        var name = removeTrailingWhiteSpace(names[nameIndex]);
        var e = domList.querySelector("[data-name='" + name + "']");
        if (e != null) domList.removeChild(e);
        selectedDomNames = [];
    }
    domRemoveButton.disabled = true;
}

//#endregion


//#region DOM Name List Selection & Interaction

var selectedDomNames = [];
// var selectedNodeIDs = [];

function toggleNameSelection(e) {
    if (hasClass(e.target, "selected")) {
        removeClass(e.target, "selected");

        var i = selectedDomNames.indexOf(e.target.getAttribute("data-name"));
        if (i > -1) {
            selectedDomNames.splice(i, 1);
        }
    }
    else {
        addClass(e.target, "selected");
        selectedDomNames.push(e.target.getAttribute("data-name"));
        // console.log(e.target.childNodes);
    }
    if (selectedDomNames.length > 0) {
        domRemoveButton.disabled = false;
    }
    else {
        domRemoveButton.disabled = true;
    }
}

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