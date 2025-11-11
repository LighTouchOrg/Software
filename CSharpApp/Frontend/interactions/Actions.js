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
      // Ne pas utiliser ?. avec les objets COM
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
        console.log("Swipe action executed with params:", params);
      } else {
        console.error("electronAPI.pressKey n'est pas disponible");
      }
    } else {
      console.log("Swipe not executed since presentation mode est désactivé");
    }

    return 0;
  }

  move(params) {
    this.getSettings();

    console.log("[Actions] move() appelé avec params:", params);
    console.log("[Actions] nav_mode:", this.nav_mode, "isOnboarding:", this.isOnboarding);
    console.log("[Actions] electronAPI disponible:", !!window.electronAPI);
    console.log("[Actions] moveMouse existe:", window.electronAPI ? typeof window.electronAPI.moveMouse : 'N/A');

    // FIX: Accepter x=0 et y=0 comme valides (ne pas utiliser !params.x car 0 est falsy)
    if (!params || params.x === undefined || params.x === null || params.y === undefined || params.y === null) {
      console.error("[Actions] Invalid parameters for move action:", params);
      return -1;
    }
    const { x, y } = params;
    if (this.isOnboarding || this.nav_mode == "true") {
      console.log("[Actions] Tentative d'appel moveMouse(", x, ",", y, ")");

      // Ne pas utiliser ?. avec les objets COM - appel direct
      if (window.electronAPI && window.electronAPI.moveMouse) {
        try {
          console.log("[Actions] Appel direct moveMouse...");
          window.electronAPI.moveMouse(x, y);
          console.log("[Actions] ✓ Move action executed with params:", params);
        } catch (e) {
          console.error("[Actions] ✗ Erreur lors de l'appel moveMouse:", e);
        }
      } else {
        console.error("[Actions] ✗ electronAPI.moveMouse n'est pas disponible");
      }
    } else {
      console.log("[Actions] Move not performed since navigation mode est désactivé (nav_mode=" + this.nav_mode + ")");
    }

    return 0;
  }

  click(params) {
    this.getActions();
    this.getSettings();
    if (this.isOnboarding || this.nav_mode == "true") {
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
  }

  click_down(params) {
    this.getActions();
    this.getSettings();
    if (this.isOnboarding || this.nav_mode == "true") {
      if (params && params.x && params.y) {
        const { x, y } = params;
        window.electronAPI?.pressMouse(x, y);
        console.log("Click down action executed with params:", params);
      } else {
        window.electronAPI?.pressMouse();
        console.log("Click down action executed at current mouse position");
      }
    } else {
      console.log(
        "Click down not performed since navigation mode est désactivé"
      );
    }
    return 0;
  }

  click_up(params) {
    this.getActions();
    this.getSettings();
    if (this.isOnboarding || this.nav_mode == "true") {
      if (params && params.x && params.y) {
        const { x, y } = params;
        window.electronAPI?.releaseMouse(x, y);
        console.log("Click up action executed with params:", params);
      } else {
        window.electronAPI?.releaseMouse();
        console.log("Click up action executed at current mouse position");
      }
    } else {
      console.log("Click up not performed since navigation mode est désactivé");
    }
    return 0;
  }
}
