/**
 * Lightweight production fallback.
 * India Post live scraping has been disabled in this deploy package to avoid
 * pulling the heavy Playwright dependency.
 */
async function trackSpeedPost(awb) {
    return {
        success: false,
        message: `India Post live tracking is disabled in this lightweight build for AWB ${awb}.`
    };
}

module.exports = { trackSpeedPost };
