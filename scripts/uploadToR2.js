import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Cloudflare R2 configuration
const R2_CONFIG = {
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	region: 'auto',
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	},
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'digital-dakwah-audio';

const r2Client = new S3Client(R2_CONFIG);

// Upload audio files to R2 with proper structure
export async function uploadAudioToR2(localAudioDir) {
    console.log('Starting upload to Cloudflare R2...');
    
    try {
        // Walk through local audio directory
        const chapters = fs.readdirSync(localAudioDir);
        
        for (const chapter of chapters) {
            const chapterPath = path.join(localAudioDir, chapter);
            if (!fs.statSync(chapterPath).isDirectory()) continue;
            
            console.log(`Processing Chapter ${chapter}...`);
            
            const verses = fs.readdirSync(chapterPath);
            
            for (const verse of verses) {
                const versePath = path.join(chapterPath, verse);
                if (!fs.statSync(versePath).isDirectory()) continue;
                
                const words = fs.readdirSync(versePath);
                
                for (const wordFile of words) {
                    if (!wordFile.endsWith('.mp3')) continue;
                    
                    const localFilePath = path.join(versePath, wordFile);
                    const r2Key = `words/${chapter}/${verse}/${wordFile}`;
                    
                    try {
                        // Check if file already exists
                        await r2Client.send(new HeadObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: r2Key,
                        }));
                        
                        console.log(`⚠️  Skipping existing file: ${r2Key}`);
                        continue;
                        
                    } catch (error) {
                        // File doesn't exist, proceed with upload
                    }
                    
                    // Read file and upload
                    const fileContent = fs.readFileSync(localFilePath);
                    
                    const uploadCommand = new PutObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: r2Key,
                        Body: fileContent,
                        ContentType: 'audio/mpeg',
                        CacheControl: 'public, max-age=31536000', // 1 year cache
                    });
                    
                    await r2Client.send(uploadCommand);
                    console.log(`✅ Uploaded: ${r2Key}`);
                }
            }
        }
        
        console.log('🎉 Upload completed successfully!');
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}

// Run upload if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const audioDir = process.argv[2] || './audio';
    uploadAudioToR2(audioDir).catch(console.error);
}