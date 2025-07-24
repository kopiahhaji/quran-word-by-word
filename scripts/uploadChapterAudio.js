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

// Upload chapter audio files to R2
export async function uploadChapterAudioToR2(localAudioDir) {
	console.log('🎵 Starting chapter audio upload to Cloudflare R2...');
	console.log(`📁 Source directory: ${localAudioDir}`);
	console.log(`🪣 Target bucket: ${BUCKET_NAME}`);
	
	if (!fs.existsSync(localAudioDir)) {
		console.error(`❌ Source directory does not exist: ${localAudioDir}`);
		return;
	}

	try {
		let uploadCount = 0;
		let skipCount = 0;
		let errorCount = 0;

		// Get all MP3 files in the directory
		const audioFiles = fs.readdirSync(localAudioDir).filter(file => 
			file.endsWith('.mp3') && /^\d{3}\.mp3$/.test(file)
		);

		console.log(`🎵 Found ${audioFiles.length} chapter audio files to upload`);
		
		for (const audioFile of audioFiles) {
			const localFilePath = path.join(localAudioDir, audioFile);
			const chapterNumber = audioFile.replace('.mp3', '');
			const r2Key = `chapters/${chapterNumber}.mp3`;
			
			try {
				// Check if file already exists
				await r2Client.send(new HeadObjectCommand({
					Bucket: BUCKET_NAME,
					Key: r2Key,
				}));
				
				console.log(`⚠️  Skipping existing file: ${r2Key}`);
				skipCount++;
				continue;
				
			} catch (error) {
				// File doesn't exist, proceed with upload
			}
			
			try {
				// Read file and upload
				const fileContent = fs.readFileSync(localFilePath);
				const fileStats = fs.statSync(localFilePath);
				
				const uploadCommand = new PutObjectCommand({
					Bucket: BUCKET_NAME,
					Key: r2Key,
					Body: fileContent,
					ContentType: 'audio/mpeg',
					CacheControl: 'public, max-age=31536000', // 1 year cache
					ContentLength: fileStats.size,
				});
				
				await r2Client.send(uploadCommand);
				console.log(`✅ Uploaded: ${r2Key} (${(fileStats.size / 1024 / 1024).toFixed(1)}MB)`);
				uploadCount++;
				
			} catch (uploadError) {
				console.error(`❌ Failed to upload ${r2Key}:`, uploadError.message);
				errorCount++;
			}
		}
		
		console.log('');
		console.log('🎉 Chapter audio upload completed!');
		console.log(`✅ Uploaded: ${uploadCount} files`);
		console.log(`⚠️  Skipped: ${skipCount} files`);
		console.log(`❌ Errors: ${errorCount} files`);
		
		if (uploadCount > 0) {
			console.log('');
			console.log('🌐 Your chapter audio files are now available at:');
			console.log(`https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/chapters/001.mp3`);
			console.log(`https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/chapters/002.mp3`);
			console.log('etc...');
		}
		
	} catch (error) {
		console.error('❌ Upload failed:', error);
		throw error;
	}
}

// Run upload if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const audioDir = process.argv[2] || 'O:\\Quranproject-mishary\\audio';
	console.log(`Starting chapter audio upload from: ${path.resolve(audioDir)}`);
	uploadChapterAudioToR2(path.resolve(audioDir)).catch(console.error);
}
