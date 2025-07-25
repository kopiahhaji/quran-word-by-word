/**
 * KV Population Script
 * 
 * Run this to populate your Cloudflare KV with all 114 chapters
 * This is a one-time setup that dramatically improves performance
 */

import { populateAllChaptersInKV } from '../src/utils/kvAdapter.js';

async function main() {
	console.log('🚀 Starting KV population process...');
	console.log('📊 This will download JSDelivr data once and store all 114 chapters in KV');
	console.log('⏱️ This may take a few minutes but only needs to be done once');
	
	try {
		const results = await populateAllChaptersInKV();
		
		console.log('\n' + '='.repeat(60));
		console.log('📈 KV POPULATION RESULTS');
		console.log('='.repeat(60));
		console.log(`✅ Successfully populated: ${results.success} chapters`);
		console.log(`❌ Failed to populate: ${results.failed} chapters`);
		console.log('='.repeat(60));
		
		if (results.failed > 0) {
			console.log('\n📋 Failed chapters:');
			for (const [chapter, status] of Object.entries(results.chapters)) {
				if (status !== 'success') {
					console.log(`   Chapter ${chapter}: ${status}`);
				}
			}
		}
		
		if (results.success > 0) {
			console.log('\n🎉 KV population completed successfully!');
			console.log('📱 Your app will now load much faster using KV storage');
			console.log('🔄 Future requests will be served instantly from edge locations');
		}
		
	} catch (error) {
		console.error('\n❌ KV population failed:', error);
		console.log('\n🔧 Troubleshooting:');
		console.log('   1. Make sure your Cloudflare Worker is deployed');
		console.log('   2. Check that KV namespace is properly bound');
		console.log('   3. Verify your worker endpoint is accessible');
		console.log('   4. Ensure you have write permissions to KV');
	}
}

// Run the script
main().catch(console.error);
