// Debug script to test environment variable loading
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SANITY_PROJECT_ID:', process.env.SANITY_PROJECT_ID);
console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('SANITY_DATASET:', process.env.SANITY_DATASET);
console.log('NEXT_PUBLIC_SANITY_DATASET:', process.env.NEXT_PUBLIC_SANITY_DATASET);
console.log('SANITY_API_VERSION:', process.env.SANITY_API_VERSION);
console.log('NEXT_PUBLIC_SITE_NAME:', process.env.NEXT_PUBLIC_SITE_NAME);

