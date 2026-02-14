import { v4 as uuidv4 } from 'uuid';
import supabase from './src/utils/supabase';

async function insertRoundProgress() {
    console.log('Manually inserting round_progress records...\n');

    // Get the most recent active session
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
        console.error('No active session found:', sessionsError);
        return;
    }

    const session = sessions[0];
    console.log(`Found active session: ${session.id}`);
    console.log(`Team ID: ${session.team_id}`);
    console.log(`Current Round: ${session.current_round}\n`);

    // Check existing round_progress
    const { data: existing } = await supabase
        .from('round_progress')
        .select('*')
        .eq('session_id', session.id);

    console.log(`Existing round_progress records: ${existing?.length || 0}\n`);

    if (existing && existing.length > 0) {
        console.log('Records already exist:');
        existing.forEach(r => console.log(`  Round ${r.round_number}: ${JSON.stringify(r)}`));
        console.log('\nDeleting existing records to start fresh...');

        const { error: deleteError } = await supabase
            .from('round_progress')
            .delete()
            .eq('session_id', session.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return;
        }
        console.log('✓ Deleted\n');
    }

    // Insert fresh records
    console.log('Inserting new round_progress records...\n');

    for (let round = 1; round <= 3; round++) {
        const record = {
            id: uuidv4(),
            session_id: session.id,
            round_number: round,
            evidence_1_complete: false,
            evidence_2_complete: false,
            evidence_3_complete: false,
            evidence_4_complete: false,
            escape_code_unlocked: false,
            points: round === 1 ? 25 : 0
        };

        console.log(`Round ${round}:`, record);

        const { data, error } = await supabase
            .from('round_progress')
            .insert(record)
            .select();

        if (error) {
            console.error(`  ❌ ERROR:`, error);
            console.error(`  Error code: ${error.code}`);
            console.error(`  Error message: ${error.message}`);
            console.error(`  Error details:`, error.details);
            console.error(`  Error hint:`, error.hint);
        } else {
            console.log(`  ✓ Inserted successfully`);
            console.log(`  Returned data:`, data);
        }
        console.log('');
    }

    // Verify
    console.log('Verifying...');
    const { data: verify } = await supabase
        .from('round_progress')
        .select('*')
        .eq('session_id', session.id)
        .order('round_number');

    console.log(`\nFinal count: ${verify?.length || 0} records`);
    verify?.forEach(r => {
        console.log(`  Round ${r.round_number}: E1=${r.evidence_1_complete}, E2=${r.evidence_2_complete}, E3=${r.evidence_3_complete}, E4=${r.evidence_4_complete}, Points=${r.points}`);
    });
}

insertRoundProgress().catch(console.error);
