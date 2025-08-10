const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hgcahrdknmfbwczdaerv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnY2FocmRrbm1mYndjemRhZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDU4OTcsImV4cCI6MjA3MDMyMTg5N30.0L6gqS1rtc8uPg8CICLFLm-qVzBSg8PeQTMAV46NXXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('💡 You need to create the tables first. Run the SQL from migrations/0001_initial_schema.sql in your Supabase dashboard.');
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Current properties count:', data?.length || 0);
    
    // Check if we have any data
    if (data && data.length === 0) {
      console.log('📝 Database is empty. Ready for data!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();
