(function () {
    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function normalizeCoreText(text) {
        let next = text;

        const labels = [
            'Select a Taluka from the left to view Post Offices',
            'Print Speed Post Label',
            'Employee Performance Leaderboard',
            'Business Performance Trend',
            'Verification Department',
            'Dispatch Department',
            'Delivery Department',
            'Employee Management',
            'Full Edit Department',
            'Edit Employee Details',
            'Employee Profile',
            'District Explorer',
            'Order Breakdown',
            'Top Cities (Orders)',
            'Order Details',
            'Customer Information',
            'Delivery Address',
            'Payment Details',
            'Address Verified',
            'Out For Delivery',
            'In Transit',
            'Track on Website',
            'Taluka / Block',
            'Filter Offices...',
            'Register Department',
            'Register Dept',
            'Save Changes',
            'Save All',
            'Departments',
            'Employees',
            'Analytics',
            'Delivered',
            'Cancelled',
            'Verified',
            'Pending',
            'History',
            'Refresh',
            'Export Report',
            'Export Data',
            'Export',
            'Post Offices',
            'Talukas',
            'Dispatch',
            'Reorder',
            'Fresh Order',
            'Details',
            'Logout',
            'On Hold',
            'Register',
            'RTO'
        ];

        for (const label of labels) {
            const pattern = new RegExp(`[^\\x00-\\x7F]+\\s*${escapeRegExp(label)}`, 'g');
            next = next.replace(pattern, label);
        }

        next = next
            .replace(/Amount\s*\([^\x00-\x7F)]*\)/g, 'Amount (Rs)')
            .replace(/Advance\s*\([^\x00-\x7F)]*\)/g, 'Advance (Rs)')
            .replace(/COD Amount\s*\([^\x00-\x7F)]*\)/g, 'COD Amount (Rs)')
            .replace(/[^\x00-\x7F]+\s*Warning:/g, 'Warning:')
            .replace(/^[^\x00-\x7F]+\s*(?=Filter Offices\.\.\.)/g, '')
            .replace(/^[^\x00-\x7F]+\s*(?=Select a Taluka from the left to view Post Offices)/g, '')
            .replace(/\s{2,}/g, ' ');

        return next.trim();
    }

    function normalizeTextValue(value) {
        if (!value) {
            return value;
        }

        const leading = value.match(/^\s*/)[0];
        const trailing = value.match(/\s*$/)[0];
        const core = value.trim();

        if (!core) {
            return value;
        }

        if (/SCRIPTS \(Lines|EDIT ORDER MODAL|Contains: Order edit form|Functions: openEditOrderModal/.test(core)) {
            return '';
        }

        const next = normalizeCoreText(core);
        return next ? `${leading}${next}${trailing}` : '';
    }

    function cleanTextNodes(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parentTag = node.parentElement ? node.parentElement.tagName : '';
                if (parentTag === 'SCRIPT' || parentTag === 'STYLE') {
                    return NodeFilter.FILTER_REJECT;
                }

                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (/[^\x00-\x7F]/.test(node.nodeValue) || /SCRIPTS \(Lines|EDIT ORDER MODAL|Contains: Order edit form|Functions: openEditOrderModal/.test(node.nodeValue)) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_REJECT;
            }
        });

        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        for (const node of nodes) {
            const cleaned = normalizeTextValue(node.nodeValue);
            if (cleaned !== node.nodeValue) {
                node.nodeValue = cleaned;
            }
        }
    }

    function cleanAttributes(root) {
        root.querySelectorAll('[placeholder],[title],[aria-label]').forEach((element) => {
            ['placeholder', 'title', 'aria-label'].forEach((attributeName) => {
                const value = element.getAttribute(attributeName);
                if (!value) {
                    return;
                }

                const cleaned = normalizeCoreText(value);
                if (cleaned !== value) {
                    element.setAttribute(attributeName, cleaned);
                }
            });
        });
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function setCardIcon(contentId, icon) {
        const content = document.getElementById(contentId);
        const card = content ? content.closest('.glass-card') : null;
        const iconBox = card ? card.querySelector('.w-10.h-10') : null;
        if (iconBox) {
            iconBox.textContent = icon;
        }
    }

    function patchCloseButtons(root) {
        root.querySelectorAll('button').forEach((button) => {
            const text = button.textContent.trim();
            if (!text) {
                return;
            }

            const isLikelyCloseButton =
                button.classList.contains('text-2xl') ||
                button.getAttribute('onclick')?.includes("closeModal('") ||
                button.getAttribute('onclick')?.includes("classList.add('hidden')");

            if (isLikelyCloseButton && /^[^\x00-\x7F]+$/.test(text)) {
                button.textContent = '\u00D7';
            }
        });
    }

    function patchFallbackIcons(root) {
        root.querySelectorAll('.w-10.h-10, .w-14.h-14, .text-lg').forEach((element) => {
            if (element.children.length) {
                return;
            }

            const text = element.textContent.trim();
            if (/^[^\x00-\x7F]+$/.test(text)) {
                element.textContent = '\u25CF';
            }
        });
    }

    function applyIconFixes() {
        const iconMap = [
            ['#adminTabPending .text-lg', '\u23F3'],
            ['#adminTabVerified .text-lg', '\u2714\uFE0F'],
            ['#adminTabDispatched .text-lg', '\uD83D\uDE9A'],
            ['#adminTabOfd .text-lg', '\uD83D\uDE9A'],
            ['#adminTabDelivered .text-lg', '\uD83D\uDCEC'],
            ['#adminTabCancelled .text-lg', '\u274C'],
            ['#adminTabOnhold .text-lg', '\u23F8\uFE0F'],
            ['#adminTabRto .text-lg', '\u21A9\uFE0F'],
            ['#adminTabEmployees .text-lg', '\uD83D\uDC65'],
            ['#adminTabDepartments .text-lg', '\uD83C\uDFE2'],
            ['#adminTabHistory .text-lg', '\uD83D\uDCDC'],
            ['#adminTabInventory .text-lg', '\uD83D\uDCE6'],
            ['#adminTabProgress .text-lg', '\uD83D\uDCCA'],
            ['button[onclick="exportAllOrders()"] .text-lg', '\uD83D\uDCE4'],
            ['button[onclick="showRegisterDeptModal()"] span:first-child', '\u2795'],
            ['button[onclick="logout()"] span:first-child', '\uD83D\uDEAA'],
            ['#stepIndicator1', '\uD83D\uDCE6'],
            ['#stepIndicator2', '\uD83D\uDE9A'],
            ['#stepIndicator3', '\uD83D\uDE9A'],
            ['#stepIndicator4', '\u2714\uFE0F'],
            ['#trackingStatusIcon', '\uD83D\uDCE6']
        ];

        iconMap.forEach(([selector, icon]) => setText(selector, icon));

        const routeSeparator = document.getElementById('trackingOrigin')?.parentElement?.querySelector('.text-slate-300');
        if (routeSeparator) {
            routeSeparator.textContent = '\u2192';
        }

        setCardIcon('trendChart', '\uD83D\uDCC8');
        setCardIcon('statusChart', '\uD83D\uDCCA');
        setCardIcon('employeeLeaderboardContainer', '\uD83C\uDFC6');
        setCardIcon('cityChart', '\uD83D\uDCCD');
    }

    function bootstrap() {
        const adminRoot = document.getElementById('adminPanel');
        if (!adminRoot) {
            return;
        }

        cleanTextNodes(document.body);
        cleanAttributes(document.body);
        patchCloseButtons(document.body);
        patchFallbackIcons(document.body);
        applyIconFixes();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    } else {
        bootstrap();
    }
})();
