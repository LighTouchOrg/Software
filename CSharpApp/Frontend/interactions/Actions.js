class Actions {
  constructor() {
    this.actions = [];
    this.isOnboarding = window.location.pathname.includes("onboarding");
  }

  getSettings() {
    this.pres_mode = localStorage.getItem("PresentationMode") || "true";
    this.nav_mode = localStorage.getItem("NavigationMode") || "false";
    this.left_key = localStorage.getItem("Swipe_Right_Key") || "ArrowRight";
    this.right_key = localStorage.getItem("Swipe_Left_Key") || "ArrowLeft";
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
    if (this.isOnboarding || this.pres_mode == "true") {
      if (window.electronAPI && window.electronAPI.pressKey) {
        switch (direction) {
          case "left":
            window.electronAPI.pressKey(this.left_key);
            break;
          case "right":
            window.electronAPI.pressKey(this.right_key);
            break;
          default:
            console.error("Invalid swipe direction:", direction);
            return -1;
        }
      } else {
        console.error("electronAPI.pressKey not available");
      }
    }

    return 0;
  }

  move(params) {
    this.getSettings();

    if (!params || params.x === undefined || params.x === null || params.y === undefined || params.y === null) {
      console.error("[Actions] Invalid move params:", params);
      return -1;
    }

    const x = parseInt(params.x);
    const y = parseInt(params.y);

    if (this.isOnboarding || this.nav_mode == "true") {
      if (window.electronAPI && window.electronAPI.moveMouse) {
        try {
          window.electronAPI.moveMouse(x, y);
        } catch (e) {
          console.error("[Actions] ✗ moveMouse error:", e);
        }
      } else {
        console.error("[Actions] ✗ electronAPI.moveMouse not available");
      }
    }

    return 0;
  }

  click(params) {
    this.getActions();
    this.getSettings();

    if (this.isOnboarding || this.nav_mode == "true") {
      if (window.electronAPI && window.electronAPI.pressMouse && window.electronAPI.releaseMouse) {
        if (params && params.x !== undefined && params.y !== undefined) {
          const x = parseInt(params.x);
          const y = parseInt(params.y);
          window.electronAPI.pressMouse(x, y);
          window.electronAPI.releaseMouse(x, y);
        } else {
          window.electronAPI.pressMouse();
          window.electronAPI.releaseMouse();
        }
      } else {
        console.error("[Actions] ✗ pressMouse/releaseMouse not available");
      }
    }
    return 0;
  }

  click_down(params) {
    this.getActions();
    this.getSettings();

    if (this.isOnboarding || this.nav_mode == "true") {
      if (window.electronAPI && window.electronAPI.pressMouse) {
        if (params && params.x !== undefined && params.y !== undefined) {
          const x = parseInt(params.x);
          const y = parseInt(params.y);
          window.electronAPI.pressMouse(x, y);
        } else {
          window.electronAPI.pressMouse();
        }
      } else {
        console.error("[Actions] ✗ pressMouse not available");
      }
    }
    return 0;
  }

  click_up(params) {
    this.getActions();
    this.getSettings();

    if (this.isOnboarding || this.nav_mode == "true") {
      if (window.electronAPI && window.electronAPI.releaseMouse) {
        if (params && params.x !== undefined && params.y !== undefined) {
          const x = parseInt(params.x);
          const y = parseInt(params.y);
          window.electronAPI.releaseMouse(x, y);
        } else {
          window.electronAPI.releaseMouse();
        }
      } else {
        console.error("[Actions] ✗ releaseMouse not available");
      }
    }
    return 0;
  }
}
