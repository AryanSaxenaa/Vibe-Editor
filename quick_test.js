#!/usr/bin/env node
// Quick validation test for key fixes
import { exec } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

const quickTests = [
    { input: "trim file3.mp4 between 0:05 and 0:15", expect: "success", description: "Time range trim" },
    { input: "extract audio from file3.mp4", expect: "success", description: "Audio extraction" },
    { input: "trim file3.mp4 to first 20 seconds", expect: "success", description: "Duration trim" },
];

async function runQuickTest() {
    console.log('🔧 Quick Fix Validation');
    console.log('='.repeat(30));

    for (const test of quickTests) {
        console.log(`\nTesting: ${test.description}`);
        console.log(`Input: "${test.input}"`);
        
        try {
            const { stdout } = await execAsync(`echo "${test.input}" | node vibedit.js`, { 
                cwd: process.cwd(),
                timeout: 20000
            });

            const success = stdout.includes('Video processed successfully!');
            const outputFile = stdout.match(/Saved as: ([^\n\r]+)/)?.[1]?.trim();

            if (success && outputFile && existsSync(outputFile)) {
                console.log(`✅ PASS: Created ${outputFile}`);
                
                // Check if it's an audio file and validate
                if (outputFile.includes('.mp3')) {
                    console.log(`   → Audio file created successfully`);
                } else {
                    // Check video duration for video files
                    try {
                        const { stdout: durationOutput } = await execAsync(`ffprobe -i "${outputFile}" -show_entries format=duration -v quiet -of csv="p=0"`);
                        const duration = parseFloat(durationOutput.trim());
                        console.log(`   → Duration: ${duration}s`);
                    } catch {}
                }
                
                // Clean up
                try { unlinkSync(outputFile); } catch {}
            } else {
                console.log(`❌ FAIL: No output file created`);
            }
        } catch (error) {
            console.log(`❌ FAIL: ${error.message}`);
        }
    }
}

runQuickTest();
