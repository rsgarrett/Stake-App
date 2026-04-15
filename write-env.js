// Node.js script to write .env.local file
const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Key
ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('\n✅ .env.local file created/updated successfully!');
  console.log('\n📝 File location:', envPath);
  console.log('\n⚠️  IMPORTANT: You still need to add your Service Role Key:');
  console.log('   1. Go to Supabase Dashboard → Settings → API');
  console.log('   2. Copy the service_role key');
  console.log('   3. Replace "your_service_role_key_here" in .env.local\n');
} catch (error) {
  console.error('\n❌ Error writing .env.local:', error.message);
  console.log('\nPlease create .env.local manually with the content from YOUR_ENV_CONTENT.md\n');
}


