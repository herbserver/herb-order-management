const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.HF_TOKEN;
const REPO = 'spaces/herbon123/Ordermanagement';
const BASE_URL = `https://huggingface.co/api/${REPO}/commit/main`;

async function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '_debug_archive') {
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

async function chunkAndCommit(operations) {
    // Commit files in chunks of 50 to avoid payload size limit issues
    const chunkSize = 50;
    for (let i = 0; i < operations.length; i += chunkSize) {
        const chunk = operations.slice(i, i + chunkSize);
        console.log(`📦 Committing chunk ${Math.ceil(i/chunkSize) + 1}/${Math.ceil(operations.length/chunkSize)} (${chunk.length} files)...`);
        
        try {
            const response = await axios.post(BASE_URL, {
                operations: chunk,
                commit_message: `Deploy optimizations (Part ${Math.ceil(i/chunkSize) + 1})`
            }, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Chunk successful!');
        } catch (error) {
            console.error('❌ Chunk failed:', JSON.stringify(error.response?.data || error.message));
            throw error;
        }
    }
}

async function deploy() {
    console.log('🚀 Starting API-based deployment...');
    if (!TOKEN) {
        console.error('❌ HF_TOKEN is missing in .env');
        return;
    }

    const files = await walk(process.cwd());
    const operations = [];

    for (const file of files) {
        const content = fs.readFileSync(file.fullPath);
        const relativePath = file.relPath.replace(/\\/g, '/');
        
        operations.push({
            key: relativePath,
            value: content.toString('base64'),
            encoding: 'base64'
        });
    }

    try {
        await chunkAndCommit(operations);
        console.log('🏁 Deployment complete!');
    } catch (e) {
        console.error('Abort due to error');
    }
}

deploy();
