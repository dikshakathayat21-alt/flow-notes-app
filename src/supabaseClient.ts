import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lpiqpflqgtcgvrzyinow.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaXFwZmxxZ3RjZ3Zyenlpbm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM2NjIsImV4cCI6MjA4ODI2OTY2Mn0.j4rYRIJwJHTSgkRRL9oBpf24jNgd7odAszJrz5UG34I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);