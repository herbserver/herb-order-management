const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.join(__dirname, 'public', 'index.html');
const jsPath = path.join(__dirname, 'temp_scripts.js');

try {
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Simple extraction of scripts
    // This assumes one main script block at the end, or concatenates all of them
    const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);

    if (!scriptMatches) {
        console.error('No script tags found!');
        process.exit(1);
    }

    let fullJs = '';
    scriptMatches.forEach((scriptTag, index) => {
        // Remove <script> and </script> tags
        let jsContent = scriptTag.replace(/<script>/, '').replace(/<\/script>/, '');
        fullJs += `\n// Script Block ${index + 1}\n${jsContent}\n`;
    });

    fs.writeFileSync(jsPath, fullJs);
    console.log(`Extracted JS to ${jsPath}. Checking syntax...`);

    try {
        execSync(`node -c "${jsPath}"`, { stdio: 'inherit' });
        console.log('✅ Syntax Check PASSED');
    } catch (error) {
        console.error('❌ Syntax Check FAILED');
        // The error output from node -c is usually printed to stderr, which execSync inherits
    }

} catch (error) {
    console.error('Error:', error.message);
}
