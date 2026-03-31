(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;
    const renderers = panel.shared.renderers;

    async function loadEmpProgress() {
        if (!currentUser) {
            return;
        }

        const statsHost = document.getElementById('empProgressStats');
        if (statsHost) {
            statsHost.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Loading stats...</div>';
        }

        try {
            const startDate = document.getElementById('empProgressStartDate')?.value || '';
            const endDate = document.getElementById('empProgressEndDate')?.value || '';
            const data = await ordersApi.fetchEmployeeProfile({
                limit: 0,
                startDate,
                endDate
            });

            if (data.success && data.stats) {
                renderers.renderProgressCards(data.stats);
                if (document.getElementById('empProgressChart')) {
                    document.getElementById('empProgressChart').innerHTML = '';
                }
                if (document.getElementById('empProgressTable')) {
                    document.getElementById('empProgressTable').innerHTML = '';
                }
                return;
            }

            if (statsHost) {
                statsHost.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load statistics</div>';
            }
        } catch (error) {
            console.error('Progress load error:', error);
            if (statsHost) {
                statsHost.innerHTML = '<div class="col-span-full text-center text-red-500">Connection error</div>';
            }
        }
    }

    panel.tabs.progress = {
        id: 'progress',
        load: loadEmpProgress,
        rootId: 'empProgressTab'
    };

    window.loadEmpProgress = loadEmpProgress;
})();
