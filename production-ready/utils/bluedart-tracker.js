/**
 * Lightweight production fallback.
 * BlueDart live scraping has been disabled in this deploy package to avoid
 * pulling the heavy Playwright dependency.
 */
async function trackBlueDart(awb) {
    return {
        success: false,
        message: `BlueDart live tracking is disabled in this lightweight build for AWB ${awb}.`
    };
}

module.exports = { trackBlueDart };
