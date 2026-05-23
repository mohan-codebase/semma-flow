const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rntdkuffcqfsehafhfdf.supabase.co',
  'sb_publishable_Zlc0IWi-9e_eQWJUtc27Ng_ZHlhtGWV'
);

async function test() {
  // 1. Create a mock user
  const email = `test_${Date.now()}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
  });
  
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  console.log('User created:', authData.user.id);
  
  // 2. Create a category
  const { data: cat, error: catErr } = await supabase.from('categories').insert({
    user_id: authData.user.id,
    name: 'Test Category',
  }).select().single();
  
  if (catErr) {
    console.error('Category Error:', catErr);
    return;
  }
  
  // 3. Create a habit
  const { data: habit, error: habErr } = await supabase.from('habits').insert({
    user_id: authData.user.id,
    category_id: cat.id,
    name: 'Test Habit',
  }).select().single();
  
  if (habErr) {
    console.error('Habit Error:', habErr);
    return;
  }
  
  console.log('Habit created:', habit.id);
  
  // 4. Try to upsert habit entry (simulating the API)
  const now = new Date().toISOString();
  const { data: entry, error: entErr } = await supabase
    .from('habit_entries')
    .upsert(
      {
        habit_id: habit.id,
        user_id: authData.user.id,
        entry_date: '2026-05-14',
        is_completed: true,
        value: null,
        notes: null,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: 'habit_id,entry_date' }
    )
    .select()
    .single();
    
  if (entErr) {
    console.error('Upsert Error:', entErr);
    return;
  }
  
  console.log('Entry created successfully:', entry.id);
}

test();
