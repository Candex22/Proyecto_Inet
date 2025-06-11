const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cjbuooeejxisjdxgqgok.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnVvb2Vlanhpc2pkeGdxZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NzUyOTcsImV4cCI6MjA2NTI1MTI5N30.P2KPoqAFfxUQ4XB5x1LhCLNeS3fIJMHES_fi5ouQ5QQ'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase