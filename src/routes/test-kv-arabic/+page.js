import { redirect } from '@sveltejs/kit';

export async function load({ params }) {
	// Test page for KV Arabic text functionality
	return {
		chapter: 1, // Al-Fatiha for testing
		title: 'KV Arabic Text Test',
		description: 'Testing enhanced Arabic text retrieval from Cloudflare KV storage'
	};
}
