/**
 * UI Messages Module
 * Handles displaying success/error/info messages to users
 */

/**
 * Display a message to the user
 * @param {string} msg - Message text
 * @param {string} type - Message type: 'success', 'error', or 'info'
 * @param {string} elementId - ID of the element to show message in
 */
function showMessage(msg, type, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Fixed Top positioning for common message containers
    if (elementId === 'adminMessage' || elementId === 'loginMessage' || elementId === 'registerMessage' || elementId === 'resetMessage') {
        el.className = `fixed top-10 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] p-5 rounded-2xl text-sm shadow-2xl transition-all duration-300 transform font-bold flex items-center gap-3 border-l-8 ${type === 'success' ? 'bg-white text-emerald-700 border-emerald-500' :
            type === 'error' ? 'bg-white text-red-700 border-red-500' :
                'bg-white text-blue-700 border-blue-500'
            }`;
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%, 0)';
        el.innerHTML = `<span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <div>${msg}</div>`;
    } else {
        // Fallback for contextual messages
        el.className = `mb-4 p-3 rounded-xl text-sm ${type === 'success' ? 'bg-green-100 text-green-700' :
            type === 'error' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
            }`;
        el.textContent = msg;
    }

    el.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
}

/**
 * Close a modal by ID
 * @param {string} id - Modal element ID
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyTracking(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied: ' + text))
            .catch(err => console.error('Copy failed', err));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Copied: ' + text);
        } catch (err) {
            prompt("Copy manually:", text);
        }
        document.body.removeChild(textArea);
    }
}
