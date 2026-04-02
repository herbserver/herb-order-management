(function () {
    if (window.__herbPageLoaderBootstrapped) {
        return;
    }
    window.__herbPageLoaderBootstrapped = true;

    var MIN_DISPLAY_MS = 1000;
    var FAILSAFE_HIDE_MS = 15000;
    var FADE_OUT_MS = 220;

    var overlay = null;
    var failsafeTimer = null;
    var hideTimer = null;
    var shownAt = 0;
    var hasLoadCompleted = false;
    var loadingFinished = false;

    function injectStyles() {
        if (document.getElementById("herb-page-loader-style")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "herb-page-loader-style";
        style.textContent = [
            "html.herb-page-loading, html.herb-page-loading body { overflow: hidden; }",
            "html.herb-page-loading body { visibility: hidden; }",
            "html.herb-page-loading #herb-page-loader-overlay { visibility: visible; }",
            "#herb-page-loader-overlay {",
            "  position: fixed;",
            "  inset: 0;",
            "  z-index: 2147483000;",
            "  display: flex;",
            "  align-items: center;",
            "  justify-content: center;",
            "  background: radial-gradient(circle at 20% 20%, #ecfdf5 0%, #f8fafc 45%, #e2e8f0 100%);",
            "  opacity: 0;",
            "  visibility: hidden;",
            "  pointer-events: none;",
            "  transition: opacity 220ms ease, visibility 220ms ease;",
            "}",
            "#herb-page-loader-overlay.is-visible {",
            "  opacity: 1;",
            "  visibility: visible;",
            "  pointer-events: all;",
            "}",
            ".herb-page-loader-card {",
            "  min-width: 300px;",
            "  padding: 18px 20px;",
            "  border-radius: 22px;",
            "  border: 1px solid #d1fae5;",
            "  background: rgba(255, 255, 255, 0.9);",
            "  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);",
            "  display: flex;",
            "  align-items: center;",
            "  gap: 14px;",
            "  font-family: Poppins, Segoe UI, sans-serif;",
            "}",
            ".herb-page-loader-badge {",
            "  position: relative;",
            "  width: 72px;",
            "  height: 72px;",
            "  flex: 0 0 72px;",
            "  display: grid;",
            "  place-items: center;",
            "}",
            ".herb-page-loader-glow {",
            "  position: absolute;",
            "  inset: -12px;",
            "  border-radius: 26px;",
            "  background: radial-gradient(circle, rgba(16, 185, 129, 0.26), rgba(16, 185, 129, 0) 70%);",
            "  animation: herbPageLoaderBreathe 1200ms ease-in-out infinite;",
            "}",
            ".herb-page-loader-orbit {",
            "  position: absolute;",
            "  inset: -4px;",
            "  border-radius: 20px;",
            "  border: 2px solid rgba(16, 185, 129, 0.28);",
            "  border-top-color: #10b981;",
            "  border-right-color: #34d399;",
            "  animation: herbPageLoaderSpin 1000ms linear infinite;",
            "}",
            ".herb-page-loader-core {",
            "  width: 52px;",
            "  height: 52px;",
            "  border-radius: 14px;",
            "  display: grid;",
            "  place-items: center;",
            "  background: linear-gradient(135deg, #047857 0%, #10b981 100%);",
            "  color: #ecfeff;",
            "  font-size: 14px;",
            "  font-weight: 700;",
            "  letter-spacing: 0.08em;",
            "  box-shadow: 0 10px 22px rgba(6, 95, 70, 0.35);",
            "  animation: herbPageLoaderPulse 1200ms ease-in-out infinite;",
            "}",
            ".herb-page-loader-text {",
            "  display: flex;",
            "  flex-direction: column;",
            "  line-height: 1.2;",
            "  gap: 5px;",
            "}",
            ".herb-page-loader-title {",
            "  font-size: 16px;",
            "  font-weight: 700;",
            "  color: #064e3b;",
            "}",
            ".herb-page-loader-subtitle {",
            "  font-size: 12px;",
            "  font-weight: 500;",
            "  color: #0f766e;",
            "  opacity: 0.92;",
            "}",
            ".herb-page-loader-dots::after {",
            "  content: '...';",
            "  display: inline-block;",
            "  width: 18px;",
            "  text-align: left;",
            "  animation: herbPageLoaderDots 1000ms steps(4, end) infinite;",
            "}",
            "@keyframes herbPageLoaderSpin {",
            "  to { transform: rotate(360deg); }",
            "}",
            "@keyframes herbPageLoaderPulse {",
            "  0%, 100% { transform: scale(1); }",
            "  50% { transform: scale(0.94); }",
            "}",
            "@keyframes herbPageLoaderBreathe {",
            "  0%, 100% { transform: scale(0.92); opacity: 0.5; }",
            "  50% { transform: scale(1.05); opacity: 0.9; }",
            "}",
            "@keyframes herbPageLoaderDots {",
            "  0% { clip-path: inset(0 100% 0 0); }",
            "  100% { clip-path: inset(0 0 0 0); }",
            "}"
        ].join("\n");

        (document.head || document.documentElement).appendChild(style);
    }

    function ensureOverlay() {
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.id = "herb-page-loader-overlay";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = [
            '<div class="herb-page-loader-card">',
            '  <div class="herb-page-loader-badge" aria-hidden="true">',
            '    <span class="herb-page-loader-glow"></span>',
            '    <span class="herb-page-loader-orbit"></span>',
            '    <span class="herb-page-loader-core">HON</span>',
            "  </div>",
            '  <div class="herb-page-loader-text">',
            '    <span class="herb-page-loader-title">Herb On Naturals</span>',
            '    <span class="herb-page-loader-subtitle">Preparing page<span class="herb-page-loader-dots"></span></span>',
            "  </div>",
            "</div>"
        ].join("\n");

        var mountTarget = document.body || document.documentElement;
        if (mountTarget && !overlay.isConnected) {
            mountTarget.appendChild(overlay);
        }

        return overlay;
    }

    function clearTimers() {
        if (failsafeTimer) {
            clearTimeout(failsafeTimer);
            failsafeTimer = null;
        }
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }

    function showLoader() {
        if (loadingFinished) {
            return;
        }

        var node = ensureOverlay();
        shownAt = Date.now();
        document.documentElement.classList.add("herb-page-loading");

        (window.requestAnimationFrame || window.setTimeout)(function () {
            if (node) {
                node.classList.add("is-visible");
            }
        }, 16);
    }

    function forceHideLoader() {
        if (loadingFinished) {
            return;
        }
        loadingFinished = true;
        clearTimers();

        document.documentElement.classList.remove("herb-page-loading");

        if (!overlay) {
            return;
        }

        overlay.classList.remove("is-visible");
        window.setTimeout(function () {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            overlay = null;
        }, FADE_OUT_MS);
    }

    function hideLoader() {
        if (loadingFinished) {
            return;
        }

        if (!hasLoadCompleted) {
            return;
        }

        var elapsed = Date.now() - shownAt;
        var remaining = MIN_DISPLAY_MS - elapsed;

        if (remaining > 0) {
            if (hideTimer) {
                clearTimeout(hideTimer);
            }
            hideTimer = window.setTimeout(hideLoader, remaining);
            return;
        }

        forceHideLoader();
    }

    function startLoaderLifecycle() {
        injectStyles();
        showLoader();
        failsafeTimer = window.setTimeout(forceHideLoader, FAILSAFE_HIDE_MS);

        if (document.readyState === "complete") {
            hasLoadCompleted = true;
            hideLoader();
        }
    }

    startLoaderLifecycle();

    window.addEventListener("load", function () {
        hasLoadCompleted = true;
        hideLoader();
    }, { once: true });
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            hasLoadCompleted = true;
            hideLoader();
        }
    });

    window.HerbPageLoader = {
        show: showLoader,
        hide: hideLoader
    };
})();
