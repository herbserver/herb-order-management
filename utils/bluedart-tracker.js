const { chromium } = require('playwright');

/**
 * Scrapes speedposttrack.io/bluedart-tracking for BlueDart tracking information
 * @param {string} awb - BlueDart AWB/Tracking number
 * @returns {Promise<{success: boolean, status?: string, location?: string, lastUpdate?: string, allScans?: Array, message?: string}>}
 */
async function trackBlueDart(awb) {
    let browser;
    try {
        // HEADFUL MODE: Opens actual browser to bypass bot detection 100%
        browser = await chromium.launch({
            headless: false, // Changed to false
            args: [
                '--disable-blink-features=AutomationControlled',
                '--start-maximized', // Open full screen
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        });

        const context = await browser.newContext({
            viewport: null, // Let browser decide size
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();

        // 60s global timeout 
        page.setDefaultTimeout(60000);

        console.log(`🔍 Tracking BlueDart: ${awb}`);
        try {
            await page.goto('https://speedposttrack.io/bluedart-tracking', { waitUntil: 'domcontentloaded' });
        } catch (e) {
            console.log('⚠️ Page load timeout/error, trying to continue...');
        }

        // Fill AWB
        const inputSelector = 'input[placeholder*="Tracking"], input[placeholder*="AWB"], input[type="text"]';
        try {
            await page.waitForSelector(inputSelector, { timeout: 10000 });
            await page.fill(inputSelector, awb);

            // Click Track - AND WAIT FOR NAVIGATION
            console.log('🖱️ Clicking Track...');
            // We expect the URL to change or a navigation event
            await Promise.all([
                page.click('button:has-text("Track Now"), button.btn-primary, button[type="submit"]'),
                page.waitForLoadState('networkidle').catch(() => { }) // Wait for network to settle
            ]);

            console.log('⏳ Waiting for results...');

            // Wait logic:
            // 1. Wait for "Loading" to potentially appear (short timeout)
            // 2. Wait for "Loading" to DISAPPEAR
            // 3. Check for Keywords

            try {
                // Wait for loading text (optional, it might be instant)
                await page.waitForFunction(() => document.body.innerText.includes('Loading'), { timeout: 3000 }).catch(() => { });

                // Now wait for it to be GONE (Max 20s)
                await page.waitForFunction(() => !document.body.innerText.includes('Loading'), { timeout: 20000 });

                // Now wait for positive keywords
                await page.waitForFunction(() => {
                    const text = document.body.innerText.toLowerCase();
                    return text.includes('delivered') || text.includes('transit') ||
                        text.includes('arrived') || text.includes('timeline') ||
                        text.includes('status') || text.includes('refused');
                }, { timeout: 10000 });

            } catch (e) {
                console.log('⚠️ Wait timeout, proceeding to scrape...');
            }

        } catch (e) {
            console.log(`❌ input/click error: ${e.message}`);
        }

        const content = await page.content();

        // DEBUG: Print what page we are on
        const pageTitle = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500).replace(/\n/g, ' '));
        console.log(`Debug Page Title: ${pageTitle}`);
        console.log(`Debug Body Start: ${bodyText}`);

        // Check for various error messages
        const hasError = content.includes('No record found') ||
            content.includes('Invalid tracking') ||
            content.includes('not found');

        // Check for success indicators - look for timeline or status
        const hasTimeline = content.includes('Timeline') ||
            content.includes('Shipment') ||
            content.includes('Delivered') ||
            content.includes('Out For Delivery');

        if (hasError && !hasTimeline) {
            await browser.close();
            return { success: false, message: 'No record found. Please check AWB number.' };
        }

        // Extract tracking data using Pure Text Parsing (Most Robust)
        const trackingData = await page.evaluate(() => {
            const rawText = document.body.innerText;
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

            // Expanded keywords list
            const keywords = [
                'deliv', 'out for', 'ofd', 'arrived', 'transit',
                'dispatch', 'booked', 'manifest', 'received',
                'refused', 'incomplete', 'network', 'impact', 'refusal', 'verified',
                'attempted', 'returned', 'rto', 'undelivered', 'issue',
                'connected', 'pickup', 'cancel', 'failed'
            ];

            const scans = [];
            const dateYearRegex = /\d{4}/;
            const dateMonthRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;

            lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();

                // Ignore FAQ / Garbage
                if (lowerLine.includes('what does') || lowerLine.includes('?')) return;

                // Check for Date
                const hasDate = dateYearRegex.test(line) && (dateMonthRegex.test(line) || line.includes(':'));

                if (hasDate) {
                    // Potential Event!
                    let combinedLine = line;
                    let hasKeyword = keywords.some(k => lowerLine.includes(k));

                    // If current line has date but NO keyword, check previous line
                    if (!hasKeyword && index > 0) {
                        const prevLine = lines[index - 1];
                        const lowerPrev = prevLine.toLowerCase();
                        // Check if previous line has keyword and is NOT a FAQ
                        if (keywords.some(k => lowerPrev.includes(k)) && !lowerPrev.includes('?')) {
                            combinedLine = prevLine + ' ' + line;
                            hasKeyword = true;
                        }
                    }

                    if (hasKeyword) {
                        // Process the (potentially combined) line

                        // Extract Date
                        const dateMatch = combinedLine.match(/(\d{1,2}[\s\-\/]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\/]*\d{4}(?:\s+at\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
                        let date = dateMatch ? dateMatch[0] : 'N/A';

                        // Fallback simple date
                        if (date === 'N/A') {
                            const simpleDate = combinedLine.match(/\d{1,2}\s+[D-M][a-z]+\s+\d{4}/);
                            if (simpleDate) date = simpleDate[0];
                        }

                        // Extract Location
                        let location = 'N/A';
                        if (combinedLine.includes('•') || combinedLine.includes('·')) {
                            const parts = combinedLine.split(/[•·]/);
                            if (parts.length >= 3) {
                                // Activity • Location • Date
                                location = parts[1].trim();
                            } else if (parts.length === 2) {
                                // Look for the part that is neither Activity nor Date-ish
                                const p1 = parts[0];
                                const p2 = parts[1];
                                // If p1 has the keyword, p2 is likely location+date
                                const p1Key = keywords.some(k => p1.toLowerCase().includes(k));
                                if (p1Key) {
                                    // Remove date from p2 to get location
                                    location = p2.replace(date, '').trim();
                                } else {
                                    location = p1.replace(date, '').trim();
                                }
                            }
                        } else {
                            // Regex deduction
                            const atMatch = combinedLine.match(/(?:at|from)\s+([A-Za-z\s]+)(?:\s+\d)/);
                            if (atMatch) location = atMatch[1].trim();
                        }

                        // Activity Cleanup
                        let activity = combinedLine;

                        // If we combined lines, the activity is likely the first part (prevLine)
                        // But let's use standard cleanup
                        if (combinedLine.includes('•') || combinedLine.includes('·')) {
                            activity = combinedLine.split(/[•·]/)[0].trim();
                        }

                        // Remove date logic
                        if (date !== 'N/A') activity = activity.replace(date, '').trim();

                        // Remove leading numbers "10 Consignee..."
                        activity = activity.replace(/^[\d]+\s+/, '').trim();

                        // Remove Location from activity if duplicated
                        if (location !== 'N/A' && location.length > 3) {
                            activity = activity.replace(location, '').trim();
                            activity = activity.replace(/\s+(at|from|in)$/i, '').trim();
                        }

                        // Final safety: if activity became empty (e.g. line was just "at Location"), skip
                        if (activity.length > 3) {
                            scans.push({ activity, location, date });
                        }
                    }
                }
            });

            if (scans.length > 0) {
                // ... same return ...
                let status = scans[0].activity;
                // Don't use badge, it often says 'COMING SOON' erroneously
                // const badge = document.querySelector('[class*="badge"]')?.innerText;
                // if (badge) status = badge;

                return {
                    success: true,
                    scans: scans,
                    currentStatus: status,
                    location: scans[0].location,
                    lastUpdate: scans[0].date
                };
            }

            // AGGRESSIVE FALLBACK: If Strict parsing failed, try looser rules
            // Maybe date regex was too strict or split was weird
            const fallbackScans = [];
            lines.forEach((line, index) => {
                // Must have Year
                if (!line.includes('2025') && !line.includes('2026')) return;

                // If it has year, assume it allows us to check for Keywords in context
                const lower = line.toLowerCase();
                const context = (lines[index - 1] || '') + ' ' + line + ' ' + (lines[index + 1] || '');
                const lowerContext = context.toLowerCase();

                // Check keywords in broad context
                const matchedKey = keywords.find(k => lowerContext.includes(k));
                if (matchedKey && !lowerContext.includes('what does')) {
                    // We found a Year and a Keyword nearby!
                    // Try to extract clean Activity
                    let activity = (lines[index - 1] || line);
                    // If prev line has the keyword, prefer it
                    if (lines[index - 1] && lines[index - 1].toLowerCase().includes(matchedKey)) {
                        activity = lines[index - 1];
                    }

                    // Clean clean
                    activity = activity.replace(/^[\d]+\s+/, '').trim();

                    fallbackScans.push({
                        activity: activity,
                        location: 'N/A (Fallback)', // Hard to guess location in fallback
                        date: line // The line with the year is the date
                    });
                }
            });

            if (fallbackScans.length > 0) {
                return {
                    success: true,
                    scans: fallbackScans,
                    currentStatus: fallbackScans[0].activity,
                    location: fallbackScans[0].location,
                    lastUpdate: fallbackScans[0].date,
                    note: 'Aggressive Fallback Used'
                };
            }

            // GLOBAL REGEX FALLBACK (The "Nuclear" Option)
            // If line parsing failed, ignore structure and look for "Keyword ... Date" pattern
            // Regex: (Keyword)(Any chars < 150)(Date)
            const joinedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            // Matches: Keyword + (stuff) + Date (DD Month YYYY)
            const globalRegex = new RegExp(`(${joinedKeywords})([\\s\\S]{1,150}?)(\\d{1,2}[\\s\\-\\/]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s\\-\\/]*\\d{4})`, 'gi');

            let globalMatch;
            const globalScans = [];
            while ((globalMatch = globalRegex.exec(rawText)) !== null) {
                // match[1] = Keyword (e.g. Refused)
                // match[2] = Gap (e.g. " To Accept\n• Hissar • ")
                // match[3] = Date (e.g. 13 January 2026)

                let activity = globalMatch[1] + globalMatch[2];
                let date = globalMatch[3];
                let location = 'N/A';

                // Cleanup Activity (remove bullets, newlines)
                activity = activity.replace(/[\n\r]+/g, ' ').replace(/[•·]/g, ' ').trim();

                // Try to extract location from the Gap
                // If Gap has "Hissar", that's location
                // Logic: Activity = Keyword + " " + rest of gap minus location?
                // Simpler: Just use the whole matched string minus date as activity, then clean it.

                // Better: Activity = match[1] (Keyword) + context
                // Let's rely on standard cleaning

                // We just want to capture the event TO PROVE IT EXISTS
                globalScans.push({
                    activity: activity.substring(0, 50).trim() + '...', // Truncate to avoid huge mess
                    location: 'Extracted via Regex',
                    date: date
                });
            }

            if (globalScans.length > 0) {
                return {
                    success: true,
                    scans: globalScans,
                    currentStatus: globalScans[0].activity,
                    location: 'Scraped',
                    lastUpdate: globalScans[0].date,
                    note: 'Global Regex Used'
                };
            }

            // FAILURE: Return lines for debugging
            return {
                success: false,
                message: 'No tracking data found based on text lines or regex',
                debugLines: lines.slice(0, 50)
            };
        });

        await browser.close();

        if (trackingData && (trackingData.success || trackingData.scans)) {
            const finalData = {
                success: true,
                status: trackingData.currentStatus || 'In Transit',
                location: trackingData.location || 'N/A',
                lastUpdate: trackingData.lastUpdate || 'N/A',
                allScans: trackingData.scans || trackingData.allScans || []
            };
            console.log(`✅ Scraper Success! Found ${finalData.allScans.length} scans.`);
            console.log(`   Latest: ${finalData.status} @ ${finalData.location}`);
            return finalData;
        } else {
            // Log debug info
            console.log('DEBUG FAILED LINES:', JSON.stringify(trackingData.debugLines, null, 2));
            return { success: false, message: 'No tracking data found on page.' };
        }

    } catch (error) {
        if (browser) await browser.close();
        console.error('❌ BlueDart Scraper Error:', error.message);
        return { success: false, message: 'Scraping failed: ' + error.message };
    }
}

module.exports = { trackBlueDart };
