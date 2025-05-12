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
        if (!params || !params.direction) {
            console.error("Invalid parameters for swipe action:", params);
            return -1;
        }
        const direction = params.direction.toLowerCase();
        switch (direction) {
            case "left":
                window.electronAPI?.pressKey("ArrowLeft");
                break;
            case "right":
                window.electronAPI?.pressKey("ArrowRight");
                break;
            default:
                console.error("Invalid swipe direction:", direction);
                return -1;
        }
        console.log("Swipe right action executed with params:", params);

        return 0;
    };

    move(params) {
        if (!params || !params.x || !params.y) {
            console.error("Invalid parameters for move action:", params);
            return -1;
        }
        const { x, y } = params;
        window.electronAPI?.moveMouse(x, y);
        console.log("Move action executed with params:", params);

        return 0;
    }

}
