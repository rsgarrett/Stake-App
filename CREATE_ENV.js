// Script to generate encryption key and create .env.local
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');

// Create .env.local content
const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=${encryptionKey}
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// Write to .env.local
const envPath = path.join(__dirname, '..', '.env.local');
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n✅ .env.local file created successfully!');
console.log('\n📝 Generated Encryption Key:', encryptionKey);
console.log('\n⚠️  IMPORTANT: You still need to add your SUPABASE_SERVICE_ROLE_KEY');
console.log('   Get it from: Supabase Dashboard → Settings → API → service_role key');
console.log('   Then edit .env.local and replace "your_service_role_key_here"\n');


