#!/usr/bin/env node
import { exec } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test scenarios to validate
const testCases = [
    // Basic trimming operations
    { input: "trim file3.mp4 between 0:05 and 0:15", expectedDuration: 10, description: "Time range trim" },
    { input: "trim file3.mp4 to first 20 seconds", expectedDuration: 20, description: "Duration trim" },
    { input: "extract 8 seconds starting from 0:10", expectedDuration: 8, description: "Start + duration trim" },
    
    // Filter operations
    { input: "make file3.mp4 black and white", expectedOperation: "grayscale", description: "Black and white filter" },
    { input: "apply grayscale filter to file3.mp4", expectedOperation: "grayscale", description: "Grayscale variant" },
    
    // Speed operations
    { input: "speed up file3.mp4 by 2x", expectedOperation: "speed", description: "Speed up 2x" },
    { input: "make file3.mp4 2 times faster", expectedOperation: "speed", description: "Speed variant wording" },
    { input: "slow down file3.mp4 by half", expectedOperation: "speed", description: "Slow down operation" },
    
    // Format operations
    { input: "convert file3.mp4 to MP4 format", expectedOperation: "format", description: "Format conversion" },
    { input: "change file3.mp4 to AVI", expectedOperation: "format", description: "AVI conversion" },
    
    // Resize operations
    { input: "resize file3.mp4 to 720p", expectedOperation: "resize", description: "720p resize" },
    { input: "scale file3.mp4 to 480x360", expectedOperation: "resize", description: "Custom dimensions" },
    
    // Audio operations
    { input: "extract audio from file3.mp4", expectedOperation: "audio", description: "Audio extraction" },
    
    // Edge cases
    { input: "make file3.mp4 purple", expectedResult: "unsupported", description: "Unsupported operation" },
    { input: "trim file3.mp4 from 0:25 to 0:35", expectedResult: "beyond_duration", description: "Trim beyond video length" },
    { input: "speed up file3.mp4 by 100x", expectedOperation: "speed", description: "Extreme speed" },
    
    // Complex requests
    { input: "make file3.mp4 black and white and speed up by 1.5x", expectedResult: "complex", description: "Multiple operations" },
    { input: "convert file3.mp4 to any other format", expectedResult: "clarification", description: "Ambiguous request" },
];

class ComprehensiveTester {
    constructor() {
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
    }

    log(message, color = 'white') {
        const colors = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async testSingleCase(testCase, index) {
        this.log(`\n[${index + 1}/${testCases.length}] Testing: "${testCase.description}"`, 'cyan');
        this.log(`Input: "${testCase.input}"`, 'blue');

        try {
            // Run the test command
            const command = `echo "${testCase.input}" | node vibedit.js`;
            const { stdout, stderr } = await execAsync(command, { 
                cwd: process.cwd(),
                timeout: 30000 // 30 second timeout
            });

            // Parse the output
            const success = stdout.includes('Video processed successfully!');
            const error = stdout.includes('Processing failed') || stderr.includes('Error');
            const outputFile = this.extractOutputFilename(stdout);

            let testPassed = false;
            let actualResult = '';

            if (testCase.expectedDuration) {
                // Test duration-based operations
                if (success && outputFile && existsSync(outputFile)) {
                    const duration = await this.getVideoDuration(outputFile);
                    const tolerance = 0.5; // Allow 0.5 second tolerance
                    testPassed = Math.abs(duration - testCase.expectedDuration) <= tolerance;
                    actualResult = `Duration: ${duration}s (expected: ${testCase.expectedDuration}s)`;
                    
                    // Clean up test file
                    try { unlinkSync(outputFile); } catch {}
                } else {
                    actualResult = 'Failed to create output file';
                }
            } else if (testCase.expectedOperation) {
                // Test operation-based cases
                testPassed = success && !error;
                actualResult = success ? 'Operation completed successfully' : 'Operation failed';
                
                // Clean up if file was created
                if (outputFile && existsSync(outputFile)) {
                    try { unlinkSync(outputFile); } catch {}
                }
            } else if (testCase.expectedResult === 'unsupported') {
                // Test unsupported operations
                testPassed = stdout.includes('not available') || stdout.includes('alternatives') || stdout.includes('not possible');
                actualResult = testPassed ? 'Correctly identified as unsupported' : 'Incorrectly processed unsupported operation';
            } else if (testCase.expectedResult === 'beyond_duration') {
                // Test operations beyond video duration
                testPassed = error || stdout.includes('failed') || !success;
                actualResult = testPassed ? 'Correctly handled out-of-bounds request' : 'Should have failed for out-of-bounds';
            } else if (testCase.expectedResult === 'clarification') {
                // Test ambiguous requests
                testPassed = stdout.includes('questions') || stdout.includes('clarification') || stdout.includes('What format');
                actualResult = testPassed ? 'Correctly asked for clarification' : 'Should have asked for clarification';
            } else {
                // Default: just check if it doesn't crash
                testPassed = !stderr.includes('Error') && !stdout.includes('Fatal error');
                actualResult = testPassed ? 'No crashes detected' : 'System crashed or errored';
            }

            // Record results
            if (testPassed) {
                this.passedTests++;
                this.log(`✅ PASS: ${actualResult}`, 'green');
            } else {
                this.failedTests++;
                this.log(`❌ FAIL: ${actualResult}`, 'red');
            }

            this.testResults.push({
                testCase,
                passed: testPassed,
                actualResult,
                stdout: stdout.substring(0, 200) + (stdout.length > 200 ? '...' : '')
            });

        } catch (error) {
            this.failedTests++;
            this.log(`❌ FAIL: ${error.message}`, 'red');
            this.testResults.push({
                testCase,
                passed: false,
                actualResult: `Exception: ${error.message}`,
                stdout: ''
            });
        }
    }

    extractOutputFilename(stdout) {
        const match = stdout.match(/Saved as: ([^\n\r\s]+)/);
        return match ? match[1].trim() : null;
    }

    async getVideoDuration(filename) {
        try {
            const { stdout } = await execAsync(`ffprobe -i "${filename}" -show_entries format=duration -v quiet -of csv="p=0"`);
            return parseFloat(stdout.trim());
        } catch {
            return 0;
        }
    }

    async runAllTests() {
        this.log('🧪 Starting Comprehensive Video Editor Testing', 'magenta');
        this.log('=' .repeat(50), 'cyan');

        // Check prerequisites
        if (!existsSync('file3.mp4')) {
            this.log('❌ Error: file3.mp4 not found. Please ensure test video exists.', 'red');
            return;
        }

        // Run all test cases
        for (let i = 0; i < testCases.length; i++) {
            await this.testSingleCase(testCases[i], i);
            
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Print summary
        this.printSummary();
    }

    printSummary() {
        this.log('\n' + '=' .repeat(50), 'cyan');
        this.log('📊 TEST SUMMARY', 'magenta');
        this.log('=' .repeat(50), 'cyan');
        
        this.log(`✅ Passed: ${this.passedTests}`, 'green');
        this.log(`❌ Failed: ${this.failedTests}`, 'red');
        this.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`, 'cyan');

        if (this.failedTests > 0) {
            this.log('\n🔍 FAILED TESTS DETAILS:', 'yellow');
            this.testResults
                .filter(result => !result.passed)
                .forEach((result, index) => {
                    this.log(`\n${index + 1}. ${result.testCase.description}`, 'red');
                    this.log(`   Input: "${result.testCase.input}"`, 'white');
                    this.log(`   Result: ${result.actualResult}`, 'white');
                });
        }

        this.log('\n🎯 RECOMMENDATIONS:', 'yellow');
        if (this.failedTests === 0) {
            this.log('✨ All tests passed! The video editor is robust and ready for production.', 'green');
        } else if (this.failedTests <= 3) {
            this.log('⚠️  Minor issues detected. Consider reviewing failed edge cases.', 'yellow');
        } else {
            this.log('🔧 Multiple issues found. Recommend addressing failed tests before deployment.', 'red');
        }
    }
}

// Run the tests
const tester = new ComprehensiveTester();
tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
