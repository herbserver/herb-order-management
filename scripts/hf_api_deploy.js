const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.HF_TOKEN;
const REPO = 'spaces/herbon123/Ordermanagement';
const BASE_URL = 'https://huggingface.co/api/' + REPO + '/upload/main/';

async function uploadFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath);
    const url = BASE_URL + relativePath.replace(/\\/g, '/');

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/octet-stream'
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Uploaded: ' + relativePath);
                    resolve();
                } else {
                    console.error('❌ Failed: ' + relativePath + ' (' + res.statusCode + ') ' + data);
                    reject(data);
                }
            });
        });

        req.on('error', reject);
        req.write(content);
        req.end();
    });
}

async function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                await walk(fullPath, fileList);
            }
        } else {
            const relPath = path.relative(process.cwd(), fullPath);
            if (!relPath.includes('.env') && !relPath.includes('pincodes.json') && !relPath.endsWith('.log')) {
                fileList.push({ fullPath, relPath });
            }
        }
    }
    return fileList;
}

async function deploy() {
    console.log('🚀 Starting API-based deployment...');
    const files = await walk(process.cwd());
    console.log(`📦 Found ${files.length} files to upload.`);

    // Upload in series to avoid rate limits
    for (const file of files) {
        try {
            await uploadFile(file.fullPath, file.relPath);
        } catch (e) {
            console.error('Abort due to error');
            break;
        }
    }
    console.log('🏁 Deployment complete!');
}

deploy();
