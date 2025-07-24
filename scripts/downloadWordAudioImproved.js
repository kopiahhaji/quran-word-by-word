import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Known working word-by-word audio sources
const AUDIO_SOURCES = {
	everyayah: {
		name: 'EveryAyah.com - Alif Laam',
		baseUrl: 'https://www.everyayah.com/data/words/AlifLaam/',
		format: (chapter, verse, word) => `${chapter.toString().padStart(3, '0')}${verse.toString().padStart(3, '0')}${word.toString().padStart(3, '0')}.mp3`
	},
	quranwbw_backup: {
		name: 'QuranWBW Alternative',
		baseUrl: 'https://audio.quranwbw.com/words/',
		format: (chapter, verse, word) => `${chapter}/${verse}/${word}.mp3`
	}
};

// Verse counts for each chapter (first 10 chapters for testing)
const VERSE_COUNTS = {
	1: 7,    // Al-Fatiha
	2: 286,  // Al-Baqarah  
	3: 200,  // Ali 'Imran
	4: 176,  // An-Nisa
	5: 120,  // Al-Ma'idah
	6: 165,  // Al-An'am
	7: 206,  // Al-A'raf
	8: 75,   // Al-Anfal
	9: 129,  // At-Tawbah
	10: 109  // Yunus
};

// Word counts per verse (sample data - you'd need complete data)
const SAMPLE_WORD_COUNTS = {
	'1:1': 4, '1:2': 2, '1:3': 2, '1:4': 3, '1:5': 4, '1:6': 4, '1:7': 5,
	'2:1': 3, '2:2': 5, '2:3': 6, // Add more as needed
};

export async function downloadWordAudioFiles(outputDir = './word-audio', maxChapters = 1) {
	console.log('🎵 Starting word-by-word audio download...');
	console.log(`📁 Output directory: ${outputDir}`);
	console.log(`📖 Downloading ${maxChapters} chapter(s) for testing`);
	
	// Create output directory
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	let downloadCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	try {
		// Download first few chapters for testing
		for (let chapter = 1; chapter <= Math.min(maxChapters, 3); chapter++) {
			const chapterDir = path.join(outputDir, chapter.toString().padStart(3, '0'));
			
			console.log(`📖 Processing Chapter ${chapter}...`);
			
			const verseCount = VERSE_COUNTS[chapter] || 10;
			
			for (let verse = 1; verse <= Math.min(verseCount, 3); verse++) { // Limit verses for testing
				const verseDir = path.join(chapterDir, verse.toString().padStart(3, '0'));
				
				// Create directories
				if (!fs.existsSync(verseDir)) {
					fs.mkdirSync(verseDir, { recursive: true });
				}
				
				// Get word count (use sample data or estimate)
				const verseKey = `${chapter}:${verse}`;
				const wordCount = SAMPLE_WORD_COUNTS[verseKey] || estimateWordCount(chapter, verse);
				
				console.log(`  📝 Verse ${verse} - ${wordCount} words`);
				
				for (let word = 1; word <= wordCount; word++) {
					const wordFile = `${word.toString().padStart(3, '0')}.mp3`;
					const wordPath = path.join(verseDir, wordFile);
					
					// Skip if file already exists
					if (fs.existsSync(wordPath)) {
						console.log(`⚠️  Skipping existing: ${chapter}:${verse}:${word}`);
						skipCount++;
						continue;
					}
					
					// Try different audio sources
					let downloaded = false;
					
					for (const [sourceKey, source] of Object.entries(AUDIO_SOURCES)) {
						if (downloaded) break;
						
						const audioUrl = source.baseUrl + source.format(chapter, verse, word);
						
						try {
							await downloadFile(audioUrl, wordPath);
							console.log(`✅ Downloaded: ${chapter}:${verse}:${word} (${source.name})`);
							downloadCount++;
							downloaded = true;
							
							// Small delay to be respectful
							await new Promise(resolve => setTimeout(resolve, 200));
							
						} catch (error) {
							console.log(`❌ Failed ${sourceKey}: ${chapter}:${verse}:${word}`);
							// Try next source
						}
					}
					
					if (!downloaded) {
						console.error(`❌ All sources failed: ${chapter}:${verse}:${word}`);
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
		
		if (downloadCount > 0) {
			console.log('');
			console.log('📁 Directory structure created:');
			console.log(`${outputDir}/`);
			console.log('├── 001/        (Chapter 1)');
			console.log('│   ├── 001/    (Verse 1)');
			console.log('│   │   ├── 001.mp3');
			console.log('│   │   ├── 002.mp3');
			console.log('│   │   └── ...');
			console.log('│   └── ...');
			console.log('└── ...');
			console.log('');
			console.log('🚀 Ready to upload to R2:');
			console.log(`npm run upload-audio ${outputDir}`);
		}
		
	} catch (error) {
		console.error('❌ Download failed:', error);
		throw error;
	}
}

// Helper function to download a file with better error handling
function downloadFile(url, filepath) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(filepath);
		
		const request = https.get(url, (response) => {
			// Check for redirect
			if (response.statusCode === 301 || response.statusCode === 302) {
				file.close();
				fs.unlink(filepath, () => {});
				return downloadFile(response.headers.location, filepath)
					.then(resolve)
					.catch(reject);
			}
			
			if (response.statusCode !== 200) {
				file.close();
				fs.unlink(filepath, () => {});
				reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
				return;
			}
			
			response.pipe(file);
			
			file.on('finish', () => {
				file.close();
				resolve();
			});
			
		}).on('error', (error) => {
			file.close();
			fs.unlink(filepath, () => {});
			reject(new Error(`Network error: ${error.message}`));
		});
		
		// Set timeout
		request.setTimeout(10000, () => {
			request.destroy();
			file.close();
			fs.unlink(filepath, () => {});
			reject(new Error('Download timeout'));
		});
	});
}

// Estimate word count for a verse (fallback)
function estimateWordCount(chapter, verse) {
	if (chapter === 1) {
		// Al-Fatiha word counts
		const fatihaWords = [4, 2, 2, 3, 4, 4, 5];
		return fatihaWords[verse - 1] || 4;
	}
	
	// General estimate
	return Math.floor(Math.random() * 8) + 3; // 3-10 words
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const outputDir = process.argv[2] || './word-audio';
	const maxChapters = parseInt(process.argv[3]) || 1;
	
	console.log(`Starting download to: ${path.resolve(outputDir)}`);
	console.log(`Max chapters: ${maxChapters}`);
	
	downloadWordAudioFiles(outputDir, maxChapters).catch(console.error);
}
