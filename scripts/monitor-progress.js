/**
 * Monitor KV Population Progress
 */

const API_BASE = 'https://digitalquranaudio.zikirnurani.com';

async function checkChapterStatus(chapterNumber) {
    try {
        const response = await fetch(`${API_BASE}/kv/chapter/${chapterNumber}`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function monitorProgress() {
    console.log('📊 Checking KV population progress...');
    
    const results = {
        available: 0,
        missing: 0,
        chapters: []
    };
    
    // Check sample chapters across the range
    const sampleChapters = [1, 2, 3, 4, 5, 10, 18, 20, 30, 50, 67, 100, 114];
    
    for (const chapter of sampleChapters) {
        const available = await checkChapterStatus(chapter);
        results.chapters.push({
            chapter,
            available,
            status: available ? '✅' : '❌'
        });
        
        if (available) {
            results.available++;
        } else {
            results.missing++;
        }
    }
    
    console.log(`\\n📈 Progress Summary:`);
    console.log(`   Available: ${results.available}/${sampleChapters.length} sample chapters`);
    console.log(`   Missing: ${results.missing}/${sampleChapters.length} sample chapters`);
    
    console.log(`\\n📋 Chapter Status:`);
    results.chapters.forEach(({ chapter, status, available }) => {
        console.log(`   Chapter ${chapter.toString().padStart(3)}: ${status} ${available ? 'Available' : 'Missing'}`);
    });
    
    // Estimate total progress
    const progressPercent = ((results.available / sampleChapters.length) * 100).toFixed(1);
    console.log(`\\n🎯 Estimated Progress: ${progressPercent}%`);
    
    if (results.available === sampleChapters.length) {
        console.log('\\n🎉 All sample chapters are available! Population likely completed.');
        console.log('\\n🔍 Test commands:');
        console.log(`   curl "${API_BASE}/kv/chapter/1" | head -5`);
        console.log(`   curl "${API_BASE}/kv/chapter/114" | head -5`);
        console.log(`   curl "${API_BASE}/kv/status"`);
    } else {
        console.log('\\n⏳ Population still in progress...');
    }
}

monitorProgress().catch(console.error);
