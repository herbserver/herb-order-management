(function () {
    var LINKS = [
        { path: '/login', label: 'Login' },
        { path: '/admin', label: 'Admin' },
        { path: '/employee', label: 'Employee' },
        { path: '/verification', label: 'Verify' },
        { path: '/dispatch', label: 'Dispatch' },
        { path: '/delivery', label: 'Delivery' }
    ];

    function normalizePath(pathname) {
        var normalized = String(pathname || '/').replace(/\/+$/, '');
        if (!normalized || normalized === '/') {
            return '/login';
        }
        return normalized;
    }

    function injectStyles() {
        if (document.getElementById('global-page-links-style')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'global-page-links-style';
        style.textContent = [
            '#globalPageLinks{position:fixed;right:16px;bottom:16px;z-index:90;font-family:Poppins,sans-serif;}',
            '#globalPageLinks .page-links-shell{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}',
            '#globalPageLinks .page-links-card{width:240px;max-width:calc(100vw - 32px);padding:14px;border:1px solid rgba(148,163,184,.25);border-radius:20px;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);box-shadow:0 18px 45px rgba(15,23,42,.18);}',
            '#globalPageLinks .page-links-card[hidden]{display:none;}',
            '#globalPageLinks .page-links-title{display:block;margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#64748b;}',
            '#globalPageLinks .page-links-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}',
            '#globalPageLinks .page-links-link{display:flex;align-items:center;justify-content:center;min-height:40px;padding:0 12px;border-radius:12px;border:1px solid #dbeafe;background:#f8fafc;color:#334155;text-decoration:none;font-size:13px;font-weight:700;transition:all .18s ease;}',
            '#globalPageLinks .page-links-link:hover{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8;transform:translateY(-1px);}',
            '#globalPageLinks .page-links-link.is-active{border-color:#0f766e;background:linear-gradient(135deg,#0f766e,#2563eb);color:#fff;box-shadow:0 10px 24px rgba(37,99,235,.24);}',
            '#globalPageLinks .page-links-toggle{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;font-size:13px;font-weight:800;letter-spacing:.04em;cursor:pointer;box-shadow:0 16px 36px rgba(15,23,42,.28);}',
            '#globalPageLinks .page-links-toggle:hover{transform:translateY(-1px);box-shadow:0 18px 40px rgba(15,23,42,.34);}',
            '#globalPageLinks .page-links-toggle:focus-visible{outline:3px solid rgba(59,130,246,.35);outline-offset:2px;}',
            '#globalPageLinks .page-links-toggle-text{white-space:nowrap;}',
            '@media (max-width:640px){#globalPageLinks{right:12px;bottom:12px;}#globalPageLinks .page-links-card{width:min(280px,calc(100vw - 24px));padding:12px;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function createLinksMarkup(activePath) {
        return LINKS.map(function (link) {
            var isActive = activePath === link.path;
            var activeClass = isActive ? ' is-active' : '';
            return '<a class="page-links-link' + activeClass + '" href="' + link.path + '">' + link.label + '</a>';
        }).join('');
    }

    function buildNavigator() {
        if (document.getElementById('globalPageLinks')) {
            return;
        }

        injectStyles();

        var activePath = normalizePath(window.location.pathname);
        var wrapper = document.createElement('div');
        wrapper.id = 'globalPageLinks';
        wrapper.innerHTML =
            '<div class="page-links-shell">' +
                '<div class="page-links-card" id="pageLinksCard" hidden>' +
                    '<span class="page-links-title">Panel Structure</span>' +
                    '<div class="page-links-grid">' + createLinksMarkup(activePath) + '</div>' +
                '</div>' +
                '<button type="button" class="page-links-toggle" id="pageLinksToggle" aria-expanded="false" aria-controls="pageLinksCard">' +
                    '<span>+</span>' +
                    '<span class="page-links-toggle-text">Open Pages</span>' +
                '</button>' +
            '</div>';

        document.body.appendChild(wrapper);

        var card = document.getElementById('pageLinksCard');
        var toggle = document.getElementById('pageLinksToggle');

        function setOpen(isOpen) {
            card.hidden = !isOpen;
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        toggle.addEventListener('click', function () {
            setOpen(card.hidden);
        });

        document.addEventListener('click', function (event) {
            if (!wrapper.contains(event.target)) {
                setOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildNavigator);
    } else {
        buildNavigator();
    }
})();
