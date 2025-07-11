import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kymwkmipdcydaopfehju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bXdrbWlwZGN5ZGFvcGZlaGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDY2OTIsImV4cCI6MjA2NzAyMjY5Mn0.NFUccXphBXgObDqRK9k5aLYt2aLFmFaXf96i5siFG8A'; // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
