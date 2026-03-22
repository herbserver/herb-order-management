import { commit } from "@huggingface/hub";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.HF_TOKEN;

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

async function deploy() {
    console.log('🚀 Starting Hugging Face Hub deployment...');
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
            operation: "addOrUpdate",
            path: relativePath,
            content: new Blob([content])
        });
    }

    try {
        console.log(`📦 Committing ${operations.length} files to spaces/herbon123/Ordermanagement...`);
        const res = await commit({
            repo: { type: "space", name: "herbon123/Ordermanagement" },
            credentials: { accessToken: TOKEN },
            operations: operations,
            title: "Supercharged: Add backend pagination & lean optimization"
        });
        console.log('🏁 Deployment complete! The Space is now building.', res.commit.id);
    } catch (e) {
        console.error('❌ Abort due to error:', e.message);
    }
}

deploy();
