import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Download word-by-word audio from QuranWBW API
export async function downloadWordByWordAudio(outputDir = './downloaded-audio') {
	console.log('🎵 Starting word-by-word audio download...');
	console.log(`📁 Output directory: ${outputDir}`);
	
	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	let downloadCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	try {
		// Download for first 3 chapters as example (you can modify this)
		for (let chapter = 1; chapter <= 3; chapter++) {
			const chapterDir = path.join(outputDir, chapter.toString().padStart(3, '0'));
			
			console.log(`📖 Processing Chapter ${chapter}...`);
			
			// Get chapter info (you'll need to adjust verse counts)
			const verseCount = getVerseCount(chapter);
			
			for (let verse = 1; verse <= verseCount; verse++) {
				const verseDir = path.join(chapterDir, verse.toString().padStart(3, '0'));
				
				// Create directories
				if (!fs.existsSync(verseDir)) {
					fs.mkdirSync(verseDir, { recursive: true });
				}
				
				// Download word audio files (estimate word count)
				const wordCount = await getWordCount(chapter, verse);
				
				for (let word = 1; word <= wordCount; word++) {
					const wordFile = `${word.toString().padStart(3, '0')}.mp3`;
					const wordPath = path.join(verseDir, wordFile);
					
					// Skip if file already exists
					if (fs.existsSync(wordPath)) {
						skipCount++;
						continue;
					}
					
					// Construct audio URL (using correct QuranWBW pattern)
					const audioUrl = `https://www.everyayah.com/data/words/AlifLaam/${chapter.toString().padStart(3, '0')}${verse.toString().padStart(3, '0')}${word.toString().padStart(3, '0')}.mp3`;
					
					try {
						await downloadFile(audioUrl, wordPath);
						console.log(`✅ Downloaded: ${chapter}:${verse}:${word}`);
						downloadCount++;
						
						// Small delay to be respectful to the server
						await new Promise(resolve => setTimeout(resolve, 100));
						
					} catch (error) {
						console.error(`❌ Failed: ${chapter}:${verse}:${word} - ${error.message}`);
						errorCount++;
					}
				}
			}
		}
		
		console.log('');
		console.log('🎉 Download completed!');
		console.log(`✅ Downloaded: ${downloadCount} files`);
		console.log(`⚠️  Skipped: ${skipCount} files`);
		console.log(`❌ Errors: ${errorCount} files`);
		
	} catch (error) {
		console.error('❌ Download failed:', error);
		throw error;
	}
}

// Helper function to download a file
function downloadFile(url, filepath) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(filepath);
		
		https.get(url, (response) => {
			if (response.statusCode !== 200) {
				reject(new Error(`HTTP ${response.statusCode}`));
				return;
			}
			
			response.pipe(file);
			
			file.on('finish', () => {
				file.close();
				resolve();
			});
			
			file.on('error', (error) => {
				fs.unlink(filepath, () => {}); // Delete partial file
				reject(error);
			});
		}).on('error', reject);
	});
}

// Helper function to get verse count per chapter
function getVerseCount(chapter) {
	const verseCounts = {
		1: 7,    // Al-Fatiha
		2: 286,  // Al-Baqarah
		3: 200,  // Ali 'Imran
		// Add more as needed
	};
	return verseCounts[chapter] || 10; // Default estimate
}

// Helper function to estimate word count (you'd need actual word count data)
async function getWordCount(chapter, verse) {
	// This is a rough estimate - you'd want actual word count data
	// For now, estimate 5-15 words per verse
	return Math.floor(Math.random() * 10) + 5;
}

// Run download if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const outputDir = process.argv[2] || './downloaded-audio';
	console.log(`Starting download to: ${path.resolve(outputDir)}`);
	downloadWordByWordAudio(outputDir).catch(console.error);
}
