(function () {
    if (window.__herbPwaBootstrapped) return;
    window.__herbPwaBootstrapped = true;

    var INSTALL_BUTTON_ID = "herb-pwa-install-btn";
    var IOS_HINT_ID = "herb-pwa-ios-hint";
    var dismissedIosHintKey = "herb_pwa_ios_hint_dismissed";
    var deferredPrompt = null;

    function isStandalone() {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }

    function isIOS() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
    }

    function ensureStyle() {
        if (document.getElementById("herb-pwa-style")) return;
        var style = document.createElement("style");
        style.id = "herb-pwa-style";
        style.textContent = [
            "#" + INSTALL_BUTTON_ID + " {",
            "  position: fixed;",
            "  right: 14px;",
            "  bottom: 14px;",
            "  z-index: 2147483001;",
            "  border: 0;",
            "  border-radius: 999px;",
            "  padding: 10px 16px;",
            "  background: linear-gradient(135deg, #0f766e, #10b981);",
            "  color: #ffffff;",
            "  font: 700 13px/1.2 Poppins, Segoe UI, sans-serif;",
            "  box-shadow: 0 10px 24px rgba(15, 118, 110, 0.35);",
            "  cursor: pointer;",
            "  display: none;",
            "}",
            "#" + INSTALL_BUTTON_ID + ".is-visible { display: inline-flex; align-items: center; gap: 6px; }",
            "#" + IOS_HINT_ID + " {",
            "  position: fixed;",
            "  left: 12px;",
            "  right: 12px;",
            "  bottom: 12px;",
            "  z-index: 2147483001;",
            "  border-radius: 12px;",
            "  background: #0f172a;",
            "  color: #f8fafc;",
            "  padding: 10px 12px;",
            "  font: 600 12px/1.4 Poppins, Segoe UI, sans-serif;",
            "  display: none;",
            "}",
            "#" + IOS_HINT_ID + ".is-visible { display: block; }",
            "#" + IOS_HINT_ID + " button {",
            "  margin-left: 8px;",
            "  border: 0;",
            "  border-radius: 8px;",
            "  background: #334155;",
            "  color: #f8fafc;",
            "  padding: 4px 8px;",
            "  font: 700 11px/1 Poppins, Segoe UI, sans-serif;",
            "}"
        ].join("\n");
        (document.head || document.documentElement).appendChild(style);
    }

    function ensureInstallButton() {
        var button = document.getElementById(INSTALL_BUTTON_ID);
        if (button) return button;

        button = document.createElement("button");
        button.id = INSTALL_BUTTON_ID;
        button.type = "button";
        button.textContent = "Install App";
        button.addEventListener("click", function () {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            deferredPrompt.userChoice.finally(function () {
                deferredPrompt = null;
                button.classList.remove("is-visible");
            });
        });
        document.body.appendChild(button);
        return button;
    }

    function maybeShowIosHint() {
        if (!isIOS() || isStandalone()) return;
        if (window.localStorage.getItem(dismissedIosHintKey) === "1") return;

        var hint = document.getElementById(IOS_HINT_ID);
        if (!hint) {
            hint = document.createElement("div");
            hint.id = IOS_HINT_ID;
            hint.innerHTML = "Install this app from Safari menu: Share -> Add to Home Screen. <button type=\"button\">Got it</button>";
            hint.querySelector("button").addEventListener("click", function () {
                window.localStorage.setItem(dismissedIosHintKey, "1");
                hint.classList.remove("is-visible");
            });
            document.body.appendChild(hint);
        }
        hint.classList.add("is-visible");
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        if (!window.isSecureContext) return;

        window.addEventListener("load", function () {
            navigator.serviceWorker.register("/sw.js").catch(function (error) {
                console.warn("[PWA] Service worker registration failed:", error);
            });
        });
    }

    function bootstrapInstallPrompt() {
        if (isStandalone()) return;

        ensureStyle();
        var installButton = ensureInstallButton();

        window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault();
            deferredPrompt = event;
            installButton.classList.add("is-visible");
        });

        window.addEventListener("appinstalled", function () {
            deferredPrompt = null;
            installButton.classList.remove("is-visible");
        });

        maybeShowIosHint();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            function () {
                registerServiceWorker();
                bootstrapInstallPrompt();
            },
            { once: true }
        );
    } else {
        registerServiceWorker();
        bootstrapInstallPrompt();
    }
})();
