/**
 * Test Multilingual Data in KV Storage
 */

const API_BASE = 'https://digitalquranaudio.zikirnurani.com';

async function testMultilingualChapter(chapterNumber) {
    console.log(`🔍 Testing Chapter ${chapterNumber} multilingual data...`);
    
    try {
        const response = await fetch(`${API_BASE}/kv/chapter/${chapterNumber}`);
        const data = await response.json();
        
        if (!response.ok) {
            console.log(`❌ Chapter ${chapterNumber}: ${data.error}`);
            return;
        }
        
        // Check first verse for multilingual content
        const firstVerseKey = Object.keys(data.verses)[0];
        const firstVerse = data.verses[firstVerseKey];
        
        console.log(`\\n📖 Chapter ${chapterNumber}, Verse ${firstVerseKey}:`);
        console.log(`   🇸🇦 Arabic: ${firstVerse.words?.arabic?.substring(0, 50)}...`);
        console.log(`   🇺🇸 English (word): ${firstVerse.words?.english?.substring(0, 50)}...`);
        console.log(`   🔤 Transliteration: ${firstVerse.words?.transliteration?.substring(0, 50)}...`);
        
        if (firstVerse.translations) {
            console.log(`\\n🌍 Verse Translations:`);
            console.log(`   🇺🇸 English: ${firstVerse.translations.english?.substring(0, 80)}...`);
            console.log(`   🇲🇾 Malay: ${firstVerse.translations.malay?.substring(0, 80)}...`);
            console.log(`   🇧🇳 Brunei: ${firstVerse.translations.brunei?.substring(0, 80)}...`);
            console.log(`   🇵🇭 Tagalog: ${firstVerse.translations.tagalog?.substring(0, 80)}...`);
            console.log(`   🇨🇳 Chinese: ${firstVerse.translations.chinese?.substring(0, 80)}...`);
        }
        
        console.log(`\\n📊 Chapter Info:`);
        console.log(`   Total Verses: ${data.metadata?.totalVerses}`);
        console.log(`   Languages: ${data.metadata?.languages?.join(', ')}`);
        console.log(`   Source: ${data.metadata?.source}`);
        
    } catch (error) {
        console.error(`❌ Error testing chapter ${chapterNumber}:`, error);
    }
}

async function testAllMultilingual() {
    console.log('🧪 Testing Multilingual KV Data...');
    
    // Test a few chapters
    const testChapters = [1, 2, 3];
    
    for (const chapter of testChapters) {
        await testMultilingualChapter(chapter);
        console.log('\\n' + '='.repeat(60));
    }
    
    console.log('\\n✅ Multilingual testing completed!');
}

testAllMultilingual().catch(console.error);
