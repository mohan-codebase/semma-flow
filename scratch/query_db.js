const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Querying Supabase...");
  const { data: trips, error: tripsErr } = await supabase
    .from('trip_trips')
    .select('*');
  
  if (tripsErr) {
    console.error("Trips Error:", tripsErr);
    return;
  }
  
  console.log("\n--- TRIPS ---");
  console.log(trips);
  
  if (trips && trips.length > 0) {
    const tripId = trips[0].id;
    
    const { data: expenses, error: expErr } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId);
      
    if (expErr) {
      console.error("Expenses Error:", expErr);
    } else {
      console.log(`\n--- EXPENSES for Trip ${tripId} ---`);
      console.log(expenses);
    }
    
    const { data: settlements, error: setErr } = await supabase
      .from('trip_settlements')
      .select('*')
      .eq('trip_id', tripId);
      
    if (setErr) {
      console.error("Settlements Error:", setErr);
    } else {
      console.log(`\n--- SETTLEMENTS for Trip ${tripId} ---`);
      console.log(settlements);
    }
  }
}

main();
