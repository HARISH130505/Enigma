import supabase from './src/utils/supabase';

async function checkSchema() {
    console.log('Checking database schema...\n');

    // Try to query round_progress
    console.log('1. Checking round_progress table:');
    const { data: progress, error: progressError } = await supabase
        .from('round_progress')
        .select('*')
        .limit(1);

    if (progressError) {
        console.error('   ERROR:', progressError);
        console.log('   ❌ round_progress table might not exist or is not accessible');
    } else {
        console.log('   ✓ round_progress table exists');
        console.log('   Sample data:', progress);
    }

    // Try to query game_sessions
    console.log('\n2. Checking game_sessions table:');
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .limit(1);

    if (sessionsError) {
        console.error('   ERROR:', sessionsError);
    } else {
        console.log('   ✓ game_sessions table exists');
        console.log('   Sample data:', sessions);
    }

    // Try to query teams
    console.log('\n3. Checking teams table:');
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .limit(1);

    if (teamsError) {
        console.error('   ERROR:', teamsError);
    } else {
        console.log('   ✓ teams table exists');
        console.log('   Sample data:', teams);
    }

    console.log('\n4. Checking active sessions:');
    const { data: activeSessions, error: activeError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active');

    if (activeError) {
        console.error('   ERROR:', activeError);
    } else {
        console.log(`   Found ${activeSessions?.length || 0} active sessions`);
        activeSessions?.forEach(s => {
            console.log(`   - Session ${s.id} (Team: ${s.team_id}, Round: ${s.current_round})`);
        });
    }
}

checkSchema().catch(console.error);
