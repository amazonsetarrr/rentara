import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgcahrdknmfbwczdaerv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnY2FocmRrbm1mYndjemRhZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDU4OTcsImV4cCI6MjA3MDMyMTg5N30.0L6gqS1rtc8uPg8CICLFLm-qVzBSg8PeQTMAV46NXXs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
