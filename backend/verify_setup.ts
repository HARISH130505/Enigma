
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Fallback to anon key if service key is missing, just for reading check
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('🔍 Verifying Supabase connection...');
    console.log('   URL:', supabaseUrl);
    console.log('   Key Type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon (Public)');

    try {
        // Check if teams table exists and has the team
        const { data: teams, error } = await supabase
            .from('teams')
            .select('*')
            .eq('team_name', 'alpha');

        if (error) {
            console.error('❌ Database Query Failed:', error.message);
            if (error.code === '42P01') {
                console.log('💡 DIAGNOSIS: The "teams" table does not exist.');
                console.log('   ACTION REQUIRED: You need to run the SQL migration in Supabase.');
            } else if (error.code === 'PGRST301') {
                console.log('💡 DIAGNOSIS: RLS is likely blocking access.');
            }
            return;
        }

        console.log('✅ Connected to Supabase.');

        if (teams && teams.length > 0) {
            console.log('✅ Team "alpha" found.');
            console.log('   Ready for Login.');
        } else {
            console.error('❌ Team "alpha" NOT found.');
            console.log('💡 DIAGNOSIS: Tables exist but seed data is missing.');
            console.log('   ACTION REQUIRED: Run the INSERT statement for the alpha team.');
        }

        // Check if we can write (requires Service Key or correct RLS)
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('⚠️ WARNING: using Anon Key. Backend might fail to write to database (Save Progress) if RLS policies prevent it.');
            console.log('   If login fails with "Failed to create game session", this is why.');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

verify();
