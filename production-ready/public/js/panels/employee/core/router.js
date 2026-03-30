(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    const tabMap = {
        order: {
            rootId: 'empOrderTab',
            buttonId: 'empSidebarOrder',
            onEnter() {
                panel.shared.orderForm?.initOrderForm?.();
            }
        },
        tracking: {
            rootId: 'empTrackingTab',
            buttonId: 'empSidebarTracking',
            onEnter() {
                window.loadMyOrders?.(1);
            }
        },
        history: {
            rootId: 'empHistoryTab',
            buttonId: 'empSidebarHistory',
            onEnter() {
                window.loadMyHistory?.(1);
            }
        },
        progress: {
            rootId: 'empProgressTab',
            buttonId: 'empSidebarProgress',
            onEnter() {
                window.loadEmpProgress?.();
            }
        },
        ofd: {
            rootId: 'empOfdTab',
            buttonId: 'empSidebarOfd',
            onEnter() {
                window.loadMyOfdOrders?.();
            }
        },
        cancelled: {
            rootId: 'empCancelledTab',
            buttonId: 'empSidebarCancelled',
            onEnter() {
                window.loadMyCancelledOrders?.();
            }
        }
    };

    function normalizeTabName(tabName) {
        const normalized = String(tabName || '').trim().toLowerCase();
        return tabMap[normalized] ? normalized : 'order';
    }

    function getTabFromLocation() {
        const hashTab = String(window.location.hash || '').replace(/^#/, '');
        return normalizeTabName(hashTab);
    }

    function syncHash(tabName, replaceHash) {
        const nextHash = `#${normalizeTabName(tabName)}`;
        if (window.location.hash === nextHash) {
            return;
        }

        if (replaceHash && window.history?.replaceState) {
            const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
            window.history.replaceState(null, '', nextUrl);
            return;
        }

        window.location.hash = nextHash;
    }

    function bindHashListener() {
        if (panel.routerHashListenerBound) {
            return;
        }

        window.addEventListener('hashchange', () => {
            const nextTab = getTabFromLocation();
            if (nextTab !== panel.activeTab) {
                switchEmpTab(nextTab, { syncHash: false });
            }
        });

        panel.routerHashListenerBound = true;
    }

    function switchEmpTab(tabName, options) {
        const targetTab = normalizeTabName(tabName);
        const settings = options || {};
        panel.activeTab = targetTab;

        Object.values(tabMap).forEach((tab) => {
            document.getElementById(tab.rootId)?.classList.add('hidden');
            document.getElementById(tab.buttonId)?.classList.remove('sidebar-active');
        });

        const current = tabMap[targetTab];
        document.getElementById(current.rootId)?.classList.remove('hidden');
        document.getElementById(current.buttonId)?.classList.add('sidebar-active');
        current.onEnter?.();

        if (settings.syncHash !== false) {
            syncHash(targetTab, Boolean(settings.replaceHash));
        }

        if (window.innerWidth < 1024) {
            panel.core.layout?.setSidebarOpen(false);
        }
    }

    panel.core.router = {
        defaultTab: 'order',
        bindHashListener,
        getTabFromLocation,
        setActiveTab(tab) {
            panel.activeTab = tab;
            return panel.activeTab;
        },
        syncHash,
        switchEmpTab,
        tabs: Object.keys(tabMap)
    };

    window.switchEmpTab = switchEmpTab;
})();
