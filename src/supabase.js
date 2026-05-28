import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wpdciwlmkcujworsywbl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZGNpd2xta2N1andvcnN5d2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTk2MjUsImV4cCI6MjA5NDc5NTYyNX0.oMzZ92MA37WDnIDpVtVcOBOzXobAxxlMjq_0gE0fHE8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
