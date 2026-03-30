const { chromium } = require('playwright');

/**
 * Scrapes speedposttrack.io for tracking information
 * @param {string} awb - Tracking number
 * @returns {Promise<{success: boolean, status?: string, location?: string, lastUpdate?: string, allScans?: Array, message?: string}>}
 */
async function trackSpeedPost(awb) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        console.log(`🔍 Tracking India Post: ${awb}`);
        await page.goto('https://speedposttrack.io/', { waitUntil: 'domcontentloaded', timeout: 20000 });

        // Fill AWB
        const inputSelector = 'input[placeholder*="Tracking Number"], input[placeholder*="EK"], input[type="text"]';
        await page.waitForSelector(inputSelector);
        await page.fill(inputSelector, awb);

        // Click Track
        await page.click('button:has-text("Track Now"), button.btn-primary');

        console.log('⏳ Waiting for results...');
        await page.waitForTimeout(10000); // Wait for the timeline to appear

        const content = await page.content();
        if (content.includes('No record found')) {
            await browser.close();
            return { success: false, message: 'No record found. Please check AWB number.' };
        }

        // Extract tracking data
        const trackingData = await page.evaluate(() => {
            // Broad Text Pattern Search (Class Agnostic) - Best for new Timeline UI
            const keywords = ['Item Dispatched', 'Item Bagged', 'Item Received', 'Item Booked', 'Item Delivered', 'Out for Delivery', 'Item Returned', 'Item Discharged', 'Item On Way'];
            const allElements = Array.from(document.querySelectorAll('div, span, p, h4, b'));

            const statusElements = allElements.filter(el => {
                const text = el.innerText?.trim() || '';
                return keywords.some(k => text.includes(k)) && el.children.length === 0;
            });

            if (statusElements.length > 0) {
                const scans = statusElements.map(el => {
                    let activity = el.innerText.trim();
                    let location = 'N/A', date = 'N/A';

                    let contextText = '';
                    let current = el;
                    for (let i = 0; i < 3; i++) {
                        if (current.parentElement) {
                            contextText += '\n' + current.parentElement.innerText;
                            current = current.parentElement;
                        }
                    }

                    const lines = contextText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                    const detailsLine = lines.find(l => l.includes('•') || l.includes('·'));

                    if (detailsLine) {
                        const parts = detailsLine.split(/[•·]/);
                        location = parts[0]?.trim() || 'N/A';
                        date = parts[1]?.trim() || 'N/A';
                    } else {
                        const dateLine = lines.find(l => l.includes('202') && l.includes(' at '));
                        if (dateLine) {
                            date = dateLine;
                            const idx = lines.indexOf(dateLine);
                            if (idx > 0 && !keywords.some(k => lines[idx - 1].includes(k))) {
                                location = lines[idx - 1];
                            }
                        }
                    }
                    return { activity, location, date };
                });

                const uniqueScans = [];
                const seen = new Set();
                for (const s of scans) {
                    const key = `${s.activity}|${s.date}`.toLowerCase();
                    if (!seen.has(key)) {
                        uniqueScans.push(s);
                        seen.add(key);
                    }
                }

                if (uniqueScans.length > 0) {
                    return {
                        scans: uniqueScans,
                        currentStatus: uniqueScans[0].activity,
                        location: uniqueScans[0].location,
                        lastUpdate: uniqueScans[0].date
                    };
                }
            }

            // Priority 2: Traditional Table Fallback
            const tables = Array.from(document.querySelectorAll('table'));
            let mainTable = null;
            for (const t of tables) {
                const text = t.innerText.toLowerCase();
                if (text.includes('date') && (text.includes('activity') || text.includes('status'))) {
                    mainTable = t;
                    break;
                }
            }

            if (mainTable) {
                const rows = Array.from(mainTable.querySelectorAll('tr')).slice(1);
                const tableScans = rows.map(row => {
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 3) {
                        return {
                            date: cols[0].innerText.trim(),
                            location: cols[1].innerText.trim(),
                            activity: cols[2].innerText.trim()
                        };
                    }
                    return null;
                }).filter(s => s && s.activity);

                if (tableScans.length > 0) {
                    return {
                        scans: tableScans,
                        currentStatus: tableScans[0].activity,
                        location: tableScans[0].location,
                        lastUpdate: tableScans[0].date
                    };
                }
            }

            return null;
        });

        await browser.close();

        if (trackingData && trackingData.scans) {
            return {
                success: true,
                status: trackingData.currentStatus,
                location: trackingData.location,
                lastUpdate: trackingData.lastUpdate,
                allScans: trackingData.scans
            };
        } else {
            return { success: false, message: 'No tracking data found on page. The site might have changed its layout.' };
        }

    } catch (error) {
        if (browser) await browser.close();
        console.error('❌ SpeedPost Scraper Error:', error.message);
        return { success: false, message: 'Scraping failed: ' + error.message };
    }
}

module.exports = { trackSpeedPost };
