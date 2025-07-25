/**
 * Explore Available Translation Sources
 */

async function exploreTranslations() {
    console.log('🔍 Exploring available translation sources...');
    
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@kmaslesa/holy-quran-word-by-word-full-data@1.0.6/data.json');
        const data = await response.json();
        
        console.log(`✅ Data loaded: ${data.length} pages`);
        
        // Explore first few words to see structure
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const page = data[i];
            if (page.ayahs && page.ayahs[0] && page.ayahs[0].words && page.ayahs[0].words[0]) {
                const word = page.ayahs[0].words[0];
                console.log(`\\n📄 Page ${i + 1} - Sample word structure:`);
                console.log(JSON.stringify(word, null, 2));
                break;
            }
        }
        
        // Look for translation-related fields
        const translationFields = new Set();
        let sampleCount = 0;
        
        for (const page of data.slice(0, 10)) {
            if (!page.ayahs) continue;
            
            for (const ayah of page.ayahs) {
                if (!ayah.words) continue;
                
                for (const word of ayah.words) {
                    Object.keys(word).forEach(key => {
                        if (key.toLowerCase().includes('translation') || 
                            key.toLowerCase().includes('malay') || 
                            key.toLowerCase().includes('brunei') ||
                            key.toLowerCase().includes('ms') ||
                            key.toLowerCase().includes('bahasa')) {
                            translationFields.add(key);
                        }
                    });
                    
                    sampleCount++;
                    if (sampleCount > 100) break;
                }
                if (sampleCount > 100) break;
            }
            if (sampleCount > 100) break;
        }
        
        console.log('\\n🌐 Found translation-related fields:');
        Array.from(translationFields).forEach(field => {
            console.log(`   - ${field}`);
        });
        
        if (translationFields.size === 0) {
            console.log('❌ No specific translation fields found. Checking nested objects...');
            
            // Check for nested translation objects
            for (const page of data.slice(0, 5)) {
                if (!page.ayahs) continue;
                
                for (const ayah of page.ayahs) {
                    if (!ayah.words) continue;
                    
                    for (const word of ayah.words.slice(0, 3)) {
                        console.log('\\n🔍 Sample word keys:', Object.keys(word));
                        
                        // Check if translation is an object with multiple languages
                        if (word.translation && typeof word.translation === 'object') {
                            console.log('📝 Translation object keys:', Object.keys(word.translation));
                        }
                        break;
                    }
                    break;
                }
                break;
            }
        }
        
    } catch (error) {
        console.error('❌ Error exploring translations:', error);
    }
}

exploreTranslations();
