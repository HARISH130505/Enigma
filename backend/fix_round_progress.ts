import { v4 as uuidv4 } from 'uuid';
import supabase from './src/utils/supabase';

async function fixRoundProgress() {
    console.log('Fixing round_progress records...');

    // Get all active sessions
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active');

    if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return;
    }

    console.log(`Found ${sessions?.length || 0} active sessions`);

    for (const session of sessions || []) {
        console.log(`\nProcessing session ${session.id}...`);

        // Check if round_progress records exist
        const { data: existingProgress } = await supabase
            .from('round_progress')
            .select('*')
            .eq('session_id', session.id);

        console.log(`  Existing round_progress records: ${existingProgress?.length || 0}`);

        if (!existingProgress || existingProgress.length === 0) {
            console.log('  Creating round_progress records...');

            // Create round_progress for all 3 rounds
            for (let round = 1; round <= 3; round++) {
                const progressData = {
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

                console.log(`  Inserting round ${round}:`, progressData);
                const { error: insertError } = await supabase
                    .from('round_progress')
                    .insert(progressData);

                if (insertError) {
                    console.error(`  ERROR inserting round ${round}:`, insertError);
                } else {
                    console.log(`  ✓ Round ${round} created successfully`);
                }
            }
        } else {
            console.log('  Round progress records already exist');
            existingProgress.forEach(p => {
                console.log(`    Round ${p.round_number}: E1=${p.evidence_1_complete}, E2=${p.evidence_2_complete}, E3=${p.evidence_3_complete}, E4=${p.evidence_4_complete}, Points=${p.points}`);
            });
        }
    }

    console.log('\nDone!');
}

fixRoundProgress().catch(console.error);
