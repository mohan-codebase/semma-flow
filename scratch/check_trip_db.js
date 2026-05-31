const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value.trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: trips, error: tErr } = await supabase.from('trip_trips').select('*').limit(1);
  if (tErr) {
    console.error('trip_trips error:', tErr);
  } else {
    console.log('trip_trips sample:', trips);
  }

  const { data: expenses, error: exErr } = await supabase.from('trip_expenses').select('*').limit(1);
  if (exErr) {
    console.error('trip_expenses error:', exErr);
  } else {
    console.log('trip_expenses sample:', expenses);
  }
}

check();
