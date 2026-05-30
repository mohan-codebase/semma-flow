const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env manually
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
  // Let's get the active session / users or entries
  const { data: habits, error: hErr } = await supabase.from('habits').select('*');
  console.log('Habits count:', habits ? habits.length : 0);
  if (hErr) console.error('Habits Error:', hErr);

  const { data: entries, error: eErr } = await supabase.from('habit_entries').select('*');
  console.log('Entries count:', entries ? entries.length : 0);
  if (eErr) console.error('Entries Error:', eErr);

  if (habits && habits.length > 0) {
    console.log('Habits list:', habits.map(h => ({ id: h.id, name: h.name, is_bad_habit: h.is_bad_habit, is_archived: h.is_archived })));
  }
  if (entries && entries.length > 0) {
    console.log('Entries list:', entries.map(e => ({ habit_id: e.habit_id, entry_date: e.entry_date, is_completed: e.is_completed })));
  }
}

check();
