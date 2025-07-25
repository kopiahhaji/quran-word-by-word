/**
 * Populate All 114 Chapters to KV Storage with Multilingual Support
 * 
 * This script downloads JSDelivr data and uploads all chapters to KV storage
 * with multiple translations: English, Malay, Brunei, Tagalog, Chinese
 */

const API_BASE = 'https://digitalquranaudio.zikirnurani.com';

// Translation IDs from quran.com API
const TRANSLATION_IDS = {
    english: 131,        // Dr. Mustafa Khattab, the Clear Quran
    malay: 39,          // Malay - Basmeih
    brunei: 39,         // Using same Malay for now (can be customized)
    tagalog: 211,       // Filipino - Noor International
    chinese: 56,        // Chinese - Ma Jian
    chinese_simplified: 109  // Alternative Chinese translation
};

// Chapter metadata for validation
const CHAPTER_INFO = {
    1: { name: 'Al-Fatiha', verses: 7 },
    2: { name: 'Al-Baqarah', verses: 286 },
    3: { name: 'Ali Imran', verses: 200 },
    4: { name: 'An-Nisa', verses: 176 },
    5: { name: 'Al-Ma\'idah', verses: 120 },
    6: { name: 'Al-An\'am', verses: 165 },
    7: { name: 'Al-A\'raf', verses: 206 },
    8: { name: 'Al-Anfal', verses: 75 },
    9: { name: 'At-Tawbah', verses: 129 },
    10: { name: 'Yunus', verses: 109 },
    // ... (will load dynamically)
};

async function loadChapterTranslations(chapterNumber) {
    console.log(`🌍 Loading translations for chapter ${chapterNumber}...`);
    
    const translations = {
        english: [],
        malay: [],
        brunei: [],
        tagalog: [],
        chinese: []
    };
    
    try {
        // Load English translation (Dr. Mustafa Khattab)
        const englishResponse = await fetch(`https://api.quran.com/api/v4/quran/translations/${TRANSLATION_IDS.english}?chapter_number=${chapterNumber}`);
        if (englishResponse.ok) {
            const englishData = await englishResponse.json();
            translations.english = englishData.translations || [];
            console.log(`  ✅ English: ${translations.english.length} verses`);
        }
        
        // Load Malay translation
        const malayResponse = await fetch(`https://api.quran.com/api/v4/quran/translations/${TRANSLATION_IDS.malay}?chapter_number=${chapterNumber}`);
        if (malayResponse.ok) {
            const malayData = await malayResponse.json();
            translations.malay = malayData.translations || [];
            translations.brunei = malayData.translations || []; // Using same for Brunei initially
            console.log(`  ✅ Malay: ${translations.malay.length} verses`);
        }
        
        // Load Tagalog translation
        const tagalogResponse = await fetch(`https://api.quran.com/api/v4/quran/translations/${TRANSLATION_IDS.tagalog}?chapter_number=${chapterNumber}`);
        if (tagalogResponse.ok) {
            const tagalogData = await tagalogResponse.json();
            translations.tagalog = tagalogData.translations || [];
            console.log(`  ✅ Tagalog: ${translations.tagalog.length} verses`);
        }
        
        // Load Chinese translation
        const chineseResponse = await fetch(`https://api.quran.com/api/v4/quran/translations/${TRANSLATION_IDS.chinese}?chapter_number=${chapterNumber}`);
        if (chineseResponse.ok) {
            const chineseData = await chineseResponse.json();
            translations.chinese = chineseData.translations || [];
            console.log(`  ✅ Chinese: ${translations.chinese.length} verses`);
        }
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return translations;
        
    } catch (error) {
        console.error(`❌ Error loading translations for chapter ${chapterNumber}:`, error);
        // Return empty translations if API fails
        return translations;
    }
}

async function loadJSDelivrData() {
    console.log('📦 Loading JSDelivr data...');
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@kmaslesa/holy-quran-word-by-word-full-data@1.0.6/data.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`✅ JSDelivr data loaded: ${data.length} pages`);
        return data;
    } catch (error) {
        console.error('❌ Failed to load JSDelivr data:', error);
        throw error;
    }
}

function transformChapterData(jsdelivrData, chapterNumber, translations) {
    console.log(`🔄 Transforming multilingual data for chapter ${chapterNumber}...`);
    
    const chapterData = {
        chapter: chapterNumber,
        verses: {},
        metadata: {
            totalVerses: 0,
            processedAt: new Date().toISOString(),
            source: 'jsdelivr-multilingual-population',
            chapterName: CHAPTER_INFO[chapterNumber]?.name || `Chapter ${chapterNumber}`,
            languages: ['arabic', 'english', 'malay', 'brunei', 'tagalog', 'chinese', 'transliteration']
        }
    };
    
    // Process JSDelivr data to extract verses for this chapter
    for (const pageData of jsdelivrData) {
        if (!pageData.ayahs) continue;
        
        for (const ayah of pageData.ayahs) {
            if (!ayah.words) continue;
            
            // Group words by verse for this chapter
            const verseWords = {};
            
            for (const word of ayah.words) {
                if (!word.parentAyahVerseKey) continue;
                
                const [chapter, verse] = word.parentAyahVerseKey.split(':');
                if (parseInt(chapter) !== chapterNumber) continue;
                
                const verseKey = word.parentAyahVerseKey;
                if (!verseWords[verseKey]) {
                    verseWords[verseKey] = [];
                }
                verseWords[verseKey].push(word);
            }
            
            // Transform each verse
            for (const [verseKey, words] of Object.entries(verseWords)) {
                if (chapterData.verses[verseKey]) continue; // Skip if already processed
                
                // Sort words by position
                words.sort((a, b) => (a.position || 0) - (b.position || 0));
                
                // Extract Arabic text and English word-by-word translations
                const arabicWords = words.map(w => 
                    w.text || w.arabic || w.code_v1 || w.qpc_uthmani_hafs || ''
                ).filter(t => t);
                
                const englishWords = words.map(w => 
                    w.translation?.text || w.translation || w.english || w.en?.translation || ''
                ).filter(t => t);
                
                const transliterationWords = words.map(w => 
                    w.transliteration?.text || w.transliteration || w.phonetic || w.en?.transliteration || ''
                ).filter(t => t);
                
                // Get verse number for translation lookup
                const verseNumber = parseInt(verseKey.split(':')[1]);
                
                // Get translations from API data
                const englishTranslation = translations.english[verseNumber - 1]?.text || '';
                const malayTranslation = translations.malay[verseNumber - 1]?.text || '';
                const bruneiTranslation = translations.brunei[verseNumber - 1]?.text || malayTranslation; // Fallback to Malay
                const tagalogTranslation = translations.tagalog[verseNumber - 1]?.text || '';
                const chineseTranslation = translations.chinese[verseNumber - 1]?.text || '';
                
                if (arabicWords.length > 0) {
                    chapterData.verses[verseKey] = {
                        words: {
                            arabic: arabicWords.join('|'),
                            english: englishWords.join('|'), // Word-by-word English
                            transliteration: transliterationWords.join('|')
                        },
                        translations: {
                            english: englishTranslation,
                            malay: malayTranslation,
                            brunei: bruneiTranslation,
                            tagalog: tagalogTranslation,
                            chinese: chineseTranslation
                        },
                        meta: {
                            page: pageData.page || 1,
                            verseKey: verseKey,
                            wordCount: words.length
                        }
                    };
                }
            }
        }
    }
    
    chapterData.metadata.totalVerses = Object.keys(chapterData.verses).length;
    
    if (chapterData.metadata.totalVerses === 0) {
        throw new Error(`No verses found for chapter ${chapterNumber}`);
    }
    
    console.log(`📖 Chapter ${chapterNumber}: ${chapterData.metadata.totalVerses} verses transformed`);
    return chapterData;
}

async function uploadChapterToKV(chapterData) {
    const chapterNumber = chapterData.chapter;
    console.log(`⬆️  Uploading chapter ${chapterNumber} to KV...`);
    
    try {
        const response = await fetch(`${API_BASE}/kv/chapter/${chapterNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chapterData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log(`✅ Chapter ${chapterNumber} uploaded successfully (${result.verseCount} verses)`);
            return true;
        } else {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Failed to upload chapter ${chapterNumber}:`, error);
        return false;
    }
}

async function populateAllChapters() {
    console.log('🚀 Starting population of all 114 chapters...');
    
    const startTime = Date.now();
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    try {
        // Load JSDelivr data once
        const jsdelivrData = await loadJSDelivrData();
        
        // Process chapters in batches to avoid overwhelming the API
        const BATCH_SIZE = 5;
        
        for (let i = 1; i <= 114; i += BATCH_SIZE) {
            const batch = [];
            
            // Prepare batch
            for (let j = i; j < Math.min(i + BATCH_SIZE, 115); j++) {
                batch.push(j);
            }
            
            console.log(`\\n📦 Processing batch: chapters ${batch.join(', ')}`);
            
            // Process batch in parallel  
            const batchPromises = batch.map(async (chapterNumber) => {
                try {
                    // Load chapter translations from quran.com API
                    const translations = await loadChapterTranslations(chapterNumber);
                    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting between chapters
                    
                    const chapterData = transformChapterData(jsdelivrData, chapterNumber, translations);
                    const success = await uploadChapterToKV(chapterData);
                    
                    if (success) {
                        results.success++;
                        return { chapter: chapterNumber, status: 'success' };
                    } else {
                        results.failed++;
                        results.errors.push(`Chapter ${chapterNumber}: Upload failed`);
                        return { chapter: chapterNumber, status: 'failed' };
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Chapter ${chapterNumber}: ${error.message}`);
                    return { chapter: chapterNumber, status: 'error', error: error.message };
                }
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Log batch results
            for (const result of batchResults) {
                if (result.status === 'success') {
                    console.log(`  ✅ Chapter ${result.chapter}`);
                } else {
                    console.log(`  ❌ Chapter ${result.chapter}: ${result.error || 'Failed'}`);
                }
            }
            
            // Small delay between batches
            if (i + BATCH_SIZE <= 114) {
                console.log('⏳ Waiting 2 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
    } catch (error) {
        console.error('💥 Fatal error during population:', error);
        return;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\\n🎉 Population completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${results.success}/114 chapters`);
    console.log(`   ❌ Failed: ${results.failed}/114 chapters`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    
    if (results.errors.length > 0) {
        console.log('\\n❌ Errors:');
        results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (results.success > 0) {
        console.log('\\n🔍 Test random chapters:');
        console.log(`   curl "${API_BASE}/kv/chapter/1"`);
        console.log(`   curl "${API_BASE}/kv/chapter/2"`);
        console.log(`   curl "${API_BASE}/kv/chapter/114"`);
        console.log(`\\n📊 Check status:`);
        console.log(`   curl "${API_BASE}/kv/status"`);
    }
}

// Run the population
populateAllChapters().catch(console.error);
