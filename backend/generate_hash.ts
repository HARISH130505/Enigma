
import bcrypt from 'bcryptjs';

const password = 'mission2026';
const saltRounds = 10;

async function generate() {
    console.log('Generating hash for password:', password);
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('\n--- SQL COMMAND ---');
    console.log(`INSERT INTO teams (team_name, access_code) VALUES ('alpha', '${hash}');`);
    console.log('-------------------\n');
    console.log('Copy the SQL command above and run it in Supabase SQL Editor.');
}

generate();
