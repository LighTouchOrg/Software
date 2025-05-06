const { mouse, straightTo, Point, keyboard, Key } = require("@nut-tree-fork/nut-js");

class Actions {
    constructor() {
        this.actions = [];
    }

    addAction(action) {
        this.actions.push(action);
    }

    getActions() {
        return this.actions;
    }

    // Lightouch methods

    swipe(params) {
        console.log("Swipe right action executed with params:", params);

        return 0;
    };

}

module.exports = Actions;
