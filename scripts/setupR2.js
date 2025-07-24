import { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const R2_CONFIG = {
	region: 'auto',
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	},
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'digital-dakwah-audio';

async function setupR2Bucket() {
	const client = new S3Client(R2_CONFIG);

	try {
		console.log('🚀 Setting up R2 bucket for Digital Dakwah audio...');
		console.log(`📁 Bucket name: ${BUCKET_NAME}`);
		console.log(`🌐 Account ID: ${process.env.R2_ACCOUNT_ID}`);

		// 1. Create bucket
		try {
			await client.send(new CreateBucketCommand({
				Bucket: BUCKET_NAME,
			}));
			console.log('✅ Bucket created successfully');
		} catch (error) {
			if (error.name === 'BucketAlreadyOwnedByYou' || error.message.includes('already exists')) {
				console.log('✅ Bucket already exists');
			} else {
				console.error('❌ Bucket creation error:', error.message);
				throw error;
			}
		}

		// 2. Configure CORS for web access
		const corsConfiguration = {
			CORSRules: [
				{
					AllowedHeaders: ['*'],
					AllowedMethods: ['GET', 'HEAD'],
					AllowedOrigins: [
						'https://quran.zikirnurani.com',
						'https://*.pages.dev',
						'http://localhost:*',
						'http://127.0.0.1:*'
					],
					ExposeHeaders: ['ETag'],
					MaxAgeSeconds: 3600,
				},
			],
		};

		try {
			await client.send(new PutBucketCorsCommand({
				Bucket: BUCKET_NAME,
				CORSConfiguration: corsConfiguration,
			}));
			console.log('✅ CORS configuration applied');
		} catch (error) {
			console.warn('⚠️  CORS configuration failed (might not be supported):', error.message);
		}

		// 3. Enable public read access
		try {
			await client.send(new PutPublicAccessBlockCommand({
				Bucket: BUCKET_NAME,
				PublicAccessBlockConfiguration: {
					BlockPublicAcls: false,
					IgnorePublicAcls: false,
					BlockPublicPolicy: false,
					RestrictPublicBuckets: false,
				},
			}));
			console.log('✅ Public access configured');
		} catch (error) {
			console.warn('⚠️  Public access configuration failed:', error.message);
		}

		console.log('🎉 R2 bucket setup completed!');
		console.log(`📁 Bucket name: ${BUCKET_NAME}`);
		console.log(`🌐 R2 Endpoint: https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
		console.log(`🌐 Public URL: https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${BUCKET_NAME}`);
		console.log('');
		console.log('🔧 Next steps:');
		console.log('1. Set up custom domain: audio.zikirnurani.com');
		console.log('2. Upload audio files using the upload script');
		console.log('3. Test audio playback on your website');

	} catch (error) {
		console.error('❌ R2 setup failed:', error);
		console.error('Error details:', {
			name: error.name,
			message: error.message,
			code: error.Code || error.code
		});
		process.exit(1);
	}
}

// Run setup
setupR2Bucket();
