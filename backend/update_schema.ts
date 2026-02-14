import supabase from './src/utils/supabase';

async function updateSchema() {
    console.log('Updating schema...');
    console.log('Checking for points column recursively...');
    try {
        const { data, error } = await supabase.from('round_progress').select('*').limit(1);
        if (error) {
            console.error('Error selecting from round_progress:', error.message);
        } else if (data && data.length > 0) {
            const hasPoints = 'points' in data[0];
            console.log('Round progress has points column:', hasPoints);
            if (!hasPoints) {
                console.log('ACTION REQUIRED: Run "ALTER TABLE round_progress ADD COLUMN points INTEGER DEFAULT 0;" in Supabase dashboard.');
                console.log('Run "ALTER TABLE game_sessions ADD COLUMN total_points INTEGER DEFAULT 0;" in Supabase dashboard.');
            }
        } else {
            console.log('No data in round_progress to check columns.');
            // Try a select with a non-existent column to see if it errors
            const { error: columnError } = await supabase.from('round_progress').select('points').limit(1);
            if (columnError && columnError.message.includes('column "points" does not exist')) {
                console.log('ACTION REQUIRED: Run "ALTER TABLE round_progress ADD COLUMN points INTEGER DEFAULT 0;" in Supabase dashboard.');
            } else if (!columnError) {
                console.log('Points column exists.');
            } else {
                console.error('Unexpected error check:', columnError.message);
            }
        }
    } catch (e: any) {
        console.error('Caught exception:', e.message);
    }
}

updateSchema().catch(console.error);
