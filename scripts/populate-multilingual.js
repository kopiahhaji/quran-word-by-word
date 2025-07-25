/**
 * Enhanced Population Script with Multiple Translations
 * Includes English, Malay, and Brunei translations
 */

const API_BASE = 'https://digitalquranaudio.zikirnurani.com';

// External translation sources
const TRANSLATION_SOURCES = {
    malay: {
        name: 'Malay Translation',
        apiUrl: 'https://api.alquran.cloud/v1/quran/ms.basmeih', // Popular Malay translation
        language: 'ms'
    },
    brunei: {
        name: 'Brunei Translation',
        apiUrl: 'https://api.alquran.cloud/v1/quran/ms.basmeih', // Using same for now, can be customized
        language: 'ms-bn'
    }
};

async function loadExternalTranslations() {
    console.log('🌐 Loading external translations...');
    const translations = {};
    
    try {
        // Load Malay translation
        console.log('📖 Loading Malay translation...');
        const malayResponse = await fetch(TRANSLATION_SOURCES.malay.apiUrl);
        const malayData = await malayResponse.json();
        
        if (malayData.data && malayData.data.surahs) {
            translations.malay = {};
            
            for (const surah of malayData.data.surahs) {
                const chapterNumber = surah.number;
                translations.malay[chapterNumber] = {};
                
                for (const ayah of surah.ayahs) {
                    const verseKey = `${chapterNumber}:${ayah.numberInSurah}`;
                    translations.malay[chapterNumber][verseKey] = ayah.text;
                }
            }
            console.log('✅ Malay translations loaded');
        }
        
        // For Brunei, we'll use a customized version of Malay for now
        // In a real implementation, you would load actual Brunei translations
        translations.brunei = { ...translations.malay };
        console.log('✅ Brunei translations loaded (using Malay base)');
        
    } catch (error) {
        console.error('❌ Error loading external translations:', error);
        // Continue without external translations
    }
    
    return translations;
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

function transformChapterDataWithTranslations(jsdelivrData, chapterNumber, externalTranslations) {
    console.log(`🔄 Transforming data for chapter ${chapterNumber} with multiple translations...`);
    
    const chapterData = {
        chapter: chapterNumber,
        verses: {},
        metadata: {
            totalVerses: 0,
            processedAt: new Date().toISOString(),
            source: 'jsdelivr-auto-population-multilingual',
            translations: ['english', 'malay', 'brunei'],
            chapterName: `Chapter ${chapterNumber}`
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
                
                // Extract Arabic text
                const arabicWords = words.map(w => 
                    w.text || w.arabic || w.code_v1 || w.qpc_uthmani_hafs || ''
                ).filter(t => t);
                
                // Extract English translations (word by word)
                const englishWords = words.map(w => 
                    w.translation?.text || w.translation || w.english || w.en?.translation || ''
                ).filter(t => t);
                
                // Extract transliterations
                const transliterationWords = words.map(w => 
                    w.transliteration?.text || w.transliteration || w.phonetic || w.en?.transliteration || ''
                ).filter(t => t);
                
                if (arabicWords.length > 0) {
                    const verseData = {
                        words: {
                            arabic: arabicWords.join('|'),
                            english: englishWords.join('|'),
                            transliteration: transliterationWords.join('|')
                        },
                        translations: {},
                        meta: {
                            page: pageData.page || 1,
                            verseKey: verseKey,
                            wordCount: words.length
                        }
                    };
                    
                    // Add external translations (verse level)
                    if (externalTranslations.malay && externalTranslations.malay[chapterNumber]) {
                        verseData.translations.malay = externalTranslations.malay[chapterNumber][verseKey] || '';
                    }
                    
                    if (externalTranslations.brunei && externalTranslations.brunei[chapterNumber]) {
                        verseData.translations.brunei = externalTranslations.brunei[chapterNumber][verseKey] || '';
                    }
                    
                    chapterData.verses[verseKey] = verseData;
                }
            }
        }
    }
    
    chapterData.metadata.totalVerses = Object.keys(chapterData.verses).length;
    
    if (chapterData.metadata.totalVerses === 0) {
        throw new Error(`No verses found for chapter ${chapterNumber}`);
    }
    
    console.log(`📖 Chapter ${chapterNumber}: ${chapterData.metadata.totalVerses} verses with multilingual data`);
    return chapterData;
}

async function uploadChapterToKV(chapterData) {
    const chapterNumber = chapterData.chapter;
    console.log(`⬆️  Uploading chapter ${chapterNumber} with translations to KV...`);
    
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
            console.log(`✅ Chapter ${chapterNumber} uploaded successfully (${result.verseCount} verses, multilingual)`);
            return true;
        } else {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Failed to upload chapter ${chapterNumber}:`, error);
        return false;
    }
}

async function populateChaptersWithTranslations(startChapter = 1, endChapter = 114) {
    console.log(`🚀 Starting population of chapters ${startChapter}-${endChapter} with Malay and Brunei translations...`);
    
    const startTime = Date.now();
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    try {
        // Load data sources
        const [jsdelivrData, externalTranslations] = await Promise.all([
            loadJSDelivrData(),
            loadExternalTranslations()
        ]);
        
        // Process chapters in smaller batches to avoid API limits
        const BATCH_SIZE = 3;
        
        for (let i = startChapter; i <= endChapter; i += BATCH_SIZE) {
            const batch = [];
            
            // Prepare batch
            for (let j = i; j < Math.min(i + BATCH_SIZE, endChapter + 1); j++) {
                batch.push(j);
            }
            
            console.log(`\\n📦 Processing batch: chapters ${batch.join(', ')}`);
            
            // Process batch sequentially to be gentle on external APIs
            for (const chapterNumber of batch) {
                try {
                    const chapterData = transformChapterDataWithTranslations(
                        jsdelivrData, 
                        chapterNumber, 
                        externalTranslations
                    );
                    const success = await uploadChapterToKV(chapterData);
                    
                    if (success) {
                        results.success++;
                        console.log(`  ✅ Chapter ${chapterNumber}`);
                    } else {
                        results.failed++;
                        results.errors.push(`Chapter ${chapterNumber}: Upload failed`);
                        console.log(`  ❌ Chapter ${chapterNumber}: Upload failed`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Chapter ${chapterNumber}: ${error.message}`);
                    console.log(`  ❌ Chapter ${chapterNumber}: ${error.message}`);
                }
                
                // Small delay between chapters
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Delay between batches
            if (i + BATCH_SIZE <= endChapter) {
                console.log('⏳ Waiting 3 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
    } catch (error) {
        console.error('💥 Fatal error during population:', error);
        return;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\\n🎉 Multilingual population completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${results.success}/${endChapter - startChapter + 1} chapters`);
    console.log(`   ❌ Failed: ${results.failed}/${endChapter - startChapter + 1} chapters`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    
    if (results.errors.length > 0) {
        console.log('\\n❌ Errors:');
        results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (results.success > 0) {
        console.log('\\n🔍 Test multilingual chapters:');
        console.log(`   curl "${API_BASE}/kv/chapter/1"`);
        console.log(`   curl "${API_BASE}/kv/chapter/2"`);
        console.log('\\n📊 Check status:');
        console.log(`   curl "${API_BASE}/kv/status"`);
    }
}

// For testing - start with just a few chapters
console.log('🌐 Starting with first 3 chapters to test multilingual translations...');
populateChaptersWithTranslations(1, 3).catch(console.error);
