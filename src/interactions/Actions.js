class Actions {
    constructor() {
        this.actions = [];
        this.isOnboarding = window.location.pathname.includes('onboarding');
    }

    getSettings() {
        this.pres_mode = localStorage.getItem('PresentationMode') || 'true';
        this.nav_mode = localStorage.getItem('NavigationMode') || 'false';
        this.left_key = localStorage.getItem('Swipe_Right_Key') || 'ArrowRight';
        this.right_key = localStorage.getItem('Swipe_Left_Key') || 'ArrowLeft';
    }

    addAction(action) {
        this.actions.push(action);
    }

    getActions() {
        return this.actions;
    }

    // Lightouch methods

    swipe(params) {
        this.getSettings();
        if (!params || !params.direction) {
            console.error("Invalid parameters for swipe action:", params);
            return -1;
        }

        const direction = params.direction.toLowerCase();
        if (this.isOnboarding || this.pres_mode == 'true') {
            switch (direction) {
                case "left":
                    window.electronAPI?.pressKey(this.left_key);
                    break;
                case "right":
                    window.electronAPI?.pressKey(this.right_key);
                    break;
                default:
                    console.error("Invalid swipe direction:", direction);
                    return -1;
            }
            console.log("Swipe action executed with params:", params);
        } else {
            console.log("Swipe not executed since presentation mode est désactivé");
        }

        return 0;
    };

    move(params) {
        this.getSettings();

        if (!params || !params.x || !params.y) {
            console.error("Invalid parameters for move action:", params);
            return -1;
        }
        const { x, y } = params;
        if (this.isOnboarding || this.nav_mode == 'true') {
            window.electronAPI?.moveMouse(x, y);
            console.log("Move action executed with params:", params);
        } else {
            console.log("Move not performed since navigation mode est désactivé");
        }

        return 0;
    };

    click(params) {
        this.getActions();
        this.getSettings();
        if (this.isOnboarding || this.nav_mode == 'true') {
            if (params && params.x && params.y) {
                const { x, y } = params;
                window.electronAPI?.pressMouse(x, y);
                window.electronAPI?.releaseMouse(x, y);
                console.log("Click action executed with params:", params);
            } else {
                window.electronAPI?.pressMouse();
                window.electronAPI?.releaseMouse();
                console.log("Click action executed at current mouse position");
            }
        } else {
            console.log("Click not performed since navigation mode est désactivé");
        }
        return 0;
    };

}
