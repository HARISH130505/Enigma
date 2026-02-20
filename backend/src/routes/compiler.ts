import { Router, Response } from 'express';
import { exec } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Temp directory for Java compilation
const TEMP_DIR = join(process.cwd(), 'temp_compiler');
if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
}

const MAX_OUTPUT_LENGTH = 5000;
const TIMEOUT_MS = 10000; // 10 seconds

function sanitizeOutput(output: string): string {
    if (output.length > MAX_OUTPUT_LENGTH) {
        return output.substring(0, MAX_OUTPUT_LENGTH) + '\n... [OUTPUT TRUNCATED]';
    }
    return output;
}

router.post('/run', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { language, code } = req.body;

        if (!language || !code) {
            return res.status(400).json({ error: 'Language and code are required.' });
        }

        if (!['javascript', 'python', 'java'].includes(language.toLowerCase())) {
            return res.status(400).json({ error: 'Supported languages: javascript, python, java' });
        }

        const lang = language.toLowerCase();
        let command: string;
        const cleanupFiles: string[] = [];

        if (lang === 'javascript') {
            // Run JavaScript via Node.js
            const escapedCode = code.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            command = `node -e "${escapedCode}"`;
        } else if (lang === 'python') {
            // Run Python
            const tempFile = join(TEMP_DIR, `${uuidv4()}.py`);
            writeFileSync(tempFile, code, 'utf8');
            cleanupFiles.push(tempFile);
            command = `python "${tempFile}"`;
        } else {
            // Java — compile and run
            // Extract class name from code (look for "public class X")
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : 'Main';
            const tempFile = join(TEMP_DIR, `${className}.java`);
            writeFileSync(tempFile, code, 'utf8');
            cleanupFiles.push(tempFile);
            cleanupFiles.push(join(TEMP_DIR, `${className}.class`));
            command = `cd "${TEMP_DIR}" && javac "${className}.java" && java -cp "${TEMP_DIR}" ${className}`;
        }

        // Execute with timeout
        exec(command, { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            // Cleanup temp files
            for (const f of cleanupFiles) {
                try { unlinkSync(f); } catch { /* ignore */ }
            }

            if (error && error.killed) {
                return res.json({
                    success: false,
                    output: '',
                    error: 'EXECUTION TIMEOUT: Code took too long to execute (>10 seconds).',
                });
            }

            const output = sanitizeOutput(stdout || '');
            const errorOutput = sanitizeOutput(stderr || '');

            // If there's a compilation/runtime error
            if (error && !stdout) {
                return res.json({
                    success: false,
                    output: '',
                    error: errorOutput || error.message,
                });
            }

            res.json({
                success: true,
                output,
                error: errorOutput || null,
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Compiler execution failed.' });
    }
});

export default router;
