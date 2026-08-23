const supabase = require('./supabaseClient');

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    // Attempting a simple query.
    // Replace 'your_table_name' with an actual table name in your Supabase database.
    const { data, error } = await supabase.from('joueurs').select('*').limit(1);

    if (error) {
      // Note: If the error is 'relation "your_table_name" does not exist', 
      // it means the connection to Supabase worked, but the table was not found.
      console.error('Supabase query error:', error.message);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Data returned:', data);
    }
  } catch (err) {
    console.error('Unexpected error during Supabase test:', err);
  }
}

testConnection();
