define(["collections/listen/property-changes"], function(PropertyChanges){
// var PropertyChanges = require("collections/listen/property-changes");

// for whatever reason, HTMLInputElement is not the same as the global of the
// same name, at least in Chrome

function changeChecked(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "checked", event.target.checked);
}

function changeValue(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "value", event.target.value);
}

function changeSelectedIndex(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "selectedIndex", event.target.selectedIndex);
}

function makeObservable(key) {
    if (key === "checked") {
        this.addEventListener("change", changeChecked);
    } else if (key === "value") {
        this.addEventListener("change", changeValue);
        // if (this.type === "text" || this.nodeName === "TEXTAREA") {
        //     this.addEventListener("keyup", changeValue);
        // }
    } else if (key === "selectedIndex") {
        this.addEventListener("change", changeSelectedIndex);
    }
}

function makeUnobservable(key) {
    if (key === "checked") {
        this.removeEventListener("change", changeChecked);
    } else if (key === "value") {
        this.removeEventListener("change", changeValue);
        if (this.type === "text" || this.nodeName === "TEXTAREA") {
            this.removeEventListener("keyup", changeValue);
        }
    } else if (key === "selectedIndex") {
        this.removeEventListener("change", changeSelectedIndex);
    }
}

var HTMLInputElement = Object.getPrototypeOf(document.createElement("input"));
HTMLInputElement.makePropertyObservable = makeObservable;
HTMLInputElement.makePropertyUnobservable = makeUnobservable;

var HTMLTextAreaElement = Object.getPrototypeOf(document.createElement("textarea"));
HTMLTextAreaElement.makePropertyObservable = makeObservable;
HTMLTextAreaElement.makePropertyUnobservable = makeUnobservable;

var HTMLSelectElement = Object.getPrototypeOf(document.createElement("select"));
HTMLSelectElement.makePropertyObservable = makeObservable;
HTMLSelectElement.makePropertyUnobservable = makeUnobservable;

// TODO make window.history state observable

});