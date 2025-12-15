const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let issues = [];

    // Check for broken template literals with newlines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for ${...} followed by newline (potential issue)
        if (line.match(/\$\{[^}]*$/) && i < lines.length - 1) {
            // Check if next few lines complete the template literal
            let nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
            if (nextLines.match(/\$\{[^}]*\n[^}]*\}/)) {
                issues.push({
                    line: i + 1,
                    type: 'Broken Template Literal',
                    snippet: lines.slice(i, Math.min(i + 3, lines.length)).join('\n').substring(0, 100)
                });
            }
        }

        // Check for fetch calls with broken URLs
        if (line.includes('fetch(') && line.includes('${')) {
            if (line.match(/fetch\(`\$\{[^`]*$/) || line.match(/\$\{[^}]*\n/)) {
                issues.push({
                    line: i + 1,
                    type: 'Potentially Broken Fetch URL',
                    snippet: line.substring(0, 100)
                });
            }
        }
    }

    if (issues.length > 0) {
        console.log('Found potential issues:');
        console.log(JSON.stringify(issues, null, 2));
    } else {
        console.log('No obvious template literal issues found');
    }

} catch (e) {
    console.error('Error:', e.message);
}
