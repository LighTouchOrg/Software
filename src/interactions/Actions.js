class Actions {
    constructor() {
        this.actions = [];

    }

    getSettings() {
        this.pres_mode = localStorage.getItem('PresentationMode') || 'true';
        this.nav_mode = localStorage.getItem('NavigationMode') || 'false';
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
        if (this.getSettings.pres_mode == 'true') {
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
        } else {
            console.log("Swipe Action as not been executed since the presentation mode is disable (See Settings Mode)"); // Commentary for debug only, delete for user test
        }

        return 0;
    };

    move(params) {
        if (!params || !params.x || !params.y) {
            console.error("Invalid parameters for move action:", params);
            return -1;
        }
        const { x, y } = params;
        if (this.getActions.nav_mode == 'true') {
            window.electronAPI?.moveMouse(x, y);
            console.log("Move action executed with params:", params);
        } else {
            console.log("Move not performed since the naviguation mode is disable (See Settings Mode");
        }

        return 0;
    };

    click(params) {
        // Click at the coordinates provided in params
        if (this.getActions.nav_mode == 'true') {
            if (params && params.x && params.y) {
                const { x, y } = params;
                window.electronAPI?.pressMouse(x, y);
                window.electronAPI?.releaseMouse(x, y);
                console.log("Click action executed with params:", params);
            } else {
                // Click at the current mouse position
                window.electronAPI?.pressMouse();
                window.electronAPI?.releaseMouse();
                console.log("Click action executed at current mouse position");
            }
        } else {
            console.log("Click not performed since the naviguation mode is disable (See Settings Mode");
        }
        return 0;
    };

}
