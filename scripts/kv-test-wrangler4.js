/**
 * KV Test and Population Script for Wrangler 4
 * 
 * Uses the latest Wrangler 4 commands to test and populate KV storage
 */

import fs from 'fs';

// Test script to populate a single chapter using Wrangler 4 KV commands
console.log('🚀 KV Test Script for Wrangler 4');

// Sample chapter data for testing
const testChapterData = {
  chapter: 1,
  verses: {
    "1:1": {
      words: {
        arabic: "بِسْمِ|اللَّهِ|الرَّحْمَٰنِ|الرَّحِيمِ",
        translation: "In the name|of Allah|the Most Gracious|the Most Merciful",
        transliteration: "Bismi|Allahi|ar-Rahmani|ar-Raheem"
      },
      meta: {
        page: 1,
        verseKey: "1:1",
        wordCount: 4
      }
    },
    "1:2": {
      words: {
        arabic: "الْحَمْدُ|لِلَّهِ|رَبِّ|الْعَالَمِينَ",
        translation: "All praise|belongs to Allah|Lord|of the worlds",
        transliteration: "Al-hamdu|lillahi|rabbi|al-alameen"
      },
      meta: {
        page: 1,
        verseKey: "1:2",
        wordCount: 4
      }
    }
  },
  metadata: {
    totalVerses: 7,
    processedAt: new Date().toISOString()
  }
};

console.log('📝 Test data prepared for Al-Fatiha (Chapter 1)');
console.log('💾 Use the following commands to test KV storage:');
console.log('');

// Commands for Wrangler 4 with correct namespace IDs
console.log('# 🔍 Updated KV Namespaces:');
console.log('# - quran-data-prod: ad6b351d06e140179e5c6ea8c4e81239');
console.log('# - quran-data-prod_preview: c7d00e61f094403fb99e7a889bce967c');
console.log('# - quran-api-cache-prod: fcd154895c8348c19f950d106e58637a');
console.log('');

console.log('# 1. Check existing keys in new QURAN_DATA namespace:');
console.log('npx wrangler kv key list --namespace-id ad6b351d06e140179e5c6ea8c4e81239');
console.log('');

console.log('# 2. Put test data into new QURAN_DATA namespace:');
console.log('npx wrangler kv key put "chapter:1" --path test-chapter-1.json --namespace-id ad6b351d06e140179e5c6ea8c4e81239');
console.log('');

console.log('# 3. Get data from new QURAN_DATA namespace:');
console.log('npx wrangler kv key get "chapter:1" --namespace-id ad6b351d06e140179e5c6ea8c4e81239');
console.log('');

console.log('# 4. Check existing keys in cache namespace:');
console.log('npx wrangler kv key list --namespace-id fcd154895c8348c19f950d106e58637a');
console.log('');

console.log('# 5. Test via worker endpoint (after deployment):');
console.log('curl "https://digitalquranaudio.zikirnurani.com/kv/chapter/1"');
console.log('');

console.log('# 6. Check worker health:');
console.log('curl "https://digitalquranaudio.zikirnurani.com/health"');

// Write test data to file
fs.writeFileSync('test-chapter-1.json', JSON.stringify(testChapterData, null, 2));
console.log('');
console.log('✅ Test data written to test-chapter-1.json');
console.log('🔄 You can now use the commands above to test KV functionality');
