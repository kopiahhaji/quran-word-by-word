/**
 * KV Population Script - Populate KV with real Quran data
 * 
 * This script loads JSDelivr data and uploads it to KV storage via worker
 */

// Test with one chapter first
const API_BASE = 'https://digitalquranaudio.zikirnurani.com';

async function populateChapterInKV(chapterNumber) {
    console.log(`🔄 Populating chapter ${chapterNumber} in KV...`);
    
    try {
        // Load JSDelivr data (you can also use your existing JSDelivr adapter)
        const response = await fetch('https://cdn.jsdelivr.net/npm/@kmaslesa/holy-quran-word-by-word-full-data@1.0.6/data.json');
        const jsdelivrData = await response.json();
        
        console.log(`✅ JSDelivr data loaded: ${jsdelivrData.length} pages`);
        
        // Transform data for the specific chapter (simplified version)
        const chapterData = {
            chapter: chapterNumber,
            verses: {},
            metadata: {
                totalVerses: 0,
                processedAt: new Date().toISOString(),
                source: 'jsdelivr-manual'
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
                    
                    // Extract text with fallbacks
                    const arabicWords = words.map(w => w.text || w.arabic || w.code_v1 || '').filter(t => t);
                    const translationWords = words.map(w => w.translation?.text || w.translation || w.english || '').filter(t => t);
                    const transliterationWords = words.map(w => w.transliteration?.text || w.transliteration || w.phonetic || '').filter(t => t);
                    
                    if (arabicWords.length > 0) {
                        chapterData.verses[verseKey] = {
                            words: {
                                arabic: arabicWords.join('|'),
                                translation: translationWords.join('|'),
                                transliteration: transliterationWords.join('|')
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
        
        console.log(`📖 Chapter ${chapterNumber}: ${chapterData.metadata.totalVerses} verses prepared`);
        
        // Upload to KV via worker
        const putResponse = await fetch(`${API_BASE}/kv/chapter/${chapterNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chapterData)
        });
        
        const putResult = await putResponse.json();
        
        if (putResponse.ok) {
            console.log(`✅ Chapter ${chapterNumber} uploaded to KV successfully`);
            console.log(`   - ${putResult.verseCount} verses stored`);
            return true;
        } else {
            throw new Error(putResult.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error(`❌ Failed to populate chapter ${chapterNumber}:`, error);
        return false;
    }
}

// Test with Chapter 1 (Al-Fatiha)
populateChapterInKV(1).then(success => {
    if (success) {
        console.log('🎉 Chapter 1 population completed successfully!');
        console.log('🔍 Test it: curl "https://digitalquranaudio.zikirnurani.com/kv/chapter/1"');
    } else {
        console.log('❌ Chapter 1 population failed');
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined') {
    module.exports = { populateChapterInKV };
}
