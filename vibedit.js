#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { exec } from 'child_process';
import { homedir } from 'os';
import { join, basename, extname } from 'path';
import Groq from 'groq-sdk';

const VERSION = '1.0.0';
const colors = { reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m' };
const symbols = { success: '✅', error: '❌', processing: '⚙️', film: '🎬', magic: '✨', rocket: '🚀', thinking: '🤔' };

class Vibedit {
    constructor() { 
        this.groq = null;
    }
    log(message, color = 'white') { console.log(`${colors[color]}${message}${colors.reset}`); }
    success(message) { console.log(`${colors.green}${symbols.success} ${message}${colors.reset}`); }
    error(message) { console.log(`${colors.red}${symbols.error} ${message}${colors.reset}`); }
    processing(message) { console.log(`${colors.blue}${symbols.processing} ${message}${colors.reset}`); }
    thinking(message) { console.log(`${colors.magenta}${symbols.thinking} ${message}${colors.reset}`); }
    async ask(question) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => {
            rl.question(`${colors.cyan}${question}${colors.reset}\n> `, (answer) => { 
                rl.close(); 
                resolve(answer.trim()); 
            });
        });
    }

    async getVideoFile(input) {
        const files = input.match(/\S+\.(mp4|avi|mov|mkv|webm|flv|m4v|MP4|AVI|MOV)/gi) || [];
        if (files.length > 0 && existsSync(files[0])) return files[0];
        const inputFile = await this.ask('What video file should I work with?');
        if (!existsSync(inputFile)) throw new Error(`Video file not found: ${inputFile}`);
        const stats = statSync(inputFile);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        this.success(`Found ${basename(inputFile)} (${sizeMB}MB)`);
        return inputFile;
    }

    generateOutputName(inputFile, operation) {
        const base = basename(inputFile, extname(inputFile));
        const ext = this.suggestExtension(operation);
        let output = `${base}_edited${ext}`;
        let counter = 1;
        while (existsSync(output)) output = `${base}_edited_${counter++}${ext}`;
        return output;
    }

    suggestExtension(operation) {
        const op = operation.toLowerCase();
        if (op.includes('mp3') || op.includes('audio')) return '.mp3';
        if (op.includes('avi')) return '.avi';
        if (op.includes('mkv')) return '.mkv';
        if (op.includes('webm')) return '.webm';
        if (op.includes('mov')) return '.mov';
        if (op.includes('wav')) return '.wav';
        if (op.includes('gif')) return '.gif';
        return '.mp4';
    }

    async ensureApiKey() {
        if (!this.groq) {
            const CONFIG_PATH = join(homedir(), '.vibedit-config.json');
            let apiKey = '';
            
            // Try to load existing API key
            if (existsSync(CONFIG_PATH)) {
                try { 
                    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
                    apiKey = config.groqApiKey || '';
                } catch {
                    // Legacy format fallback - check old location
                    const oldPath = join(homedir(), '.vibedit');
                    if (existsSync(oldPath) && statSync(oldPath).isFile()) {
                        try { apiKey = readFileSync(oldPath, 'utf8').trim().split('=')[1] || ''; } catch {}
                    }
                }
            }
            
            // If no key found, guide user through setup
            if (!apiKey) {
                this.log('\n🔑 API Key Setup Required', 'yellow');
                this.log('Vibedit uses Groq AI for natural language understanding.', 'white');
                this.log('1. Get a FREE API key: https://console.groq.com/', 'cyan');
                this.log('2. Create account → API Keys → Create API Key', 'white');
                this.log('3. Copy the key and paste it below\n', 'white');
                
                apiKey = await this.ask('🔑 Paste your Groq API key here:');
                if (!apiKey || apiKey.length < 10) {
                    throw new Error('Invalid API key. Please get one from https://console.groq.com/');
                }
                
                // Save the key in JSON format for better management
                const config = {
                    groqApiKey: apiKey.trim(),
                    setupDate: new Date().toISOString(),
                    version: '1.0.0'
                };
                writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
                this.success('✅ API key saved! You\'re all set!');
            }
            
            this.groq = new Groq({ apiKey });
        }
    }

    async intelligentParsing(userInput, videoFile, videoInfo) {
        this.thinking('Understanding your request...');
        
        const prompt = `You are Vibedit, an AI video editor that uses FFmpeg commands. 

VIDEO INFO:
- File: ${videoFile}
- Duration: ${Math.round(videoInfo.duration)}s
- Resolution: ${videoInfo.width}x${videoInfo.height}
- Format: ${videoInfo.format}
- Audio streams: ${videoInfo.audio_streams}

USER REQUEST: "${userInput}"

AVAILABLE FFMPEG OPERATIONS (video is ${Math.round(videoInfo.duration)}s long):
1. Black/White: -vf "eq=saturation=0"
2. Speed up: -filter_complex "[0:v]setpts=PTS/FACTOR[v];[0:a]atempo=FACTOR[a]" -map "[v]" -map "[a]"
3. Slow down: -filter_complex "[0:v]setpts=FACTOR*PTS[v];[0:a]atempo=1/FACTOR[a]" -map "[v]" -map "[a]"
4. Extract audio: -vn -c:a libmp3lame -b:a 192k (output: .mp3)
5. Resize: -vf "scale=WIDTH:HEIGHT"
6. Trim by time range: -ss 00:00:10 -to 00:00:20 (MUST be within 0 to ${Math.round(videoInfo.duration)}s)
7. Trim by duration: -t 15 (first 15s) or -ss 00:00:10 -t 00:00:15 (15s from 10s)
8. Format convert: -c:v libx264 -c:a aac (MP4) or -c:v libvpx-vp9 -c:a libopus (WebM)

IMPOSSIBLE: purple/colored filters, object removal, AI effects, face detection - REJECT these with error message
Time format: HH:MM:SS like 00:00:10 for 10 seconds

EXAMPLES: "trim 0:05 to 0:15" → "-ss 00:00:05 -to 00:00:15", "extract audio" → "-vn -c:a libmp3lame -b:a 192k" (ext: .mp3)

RESPONSE FORMAT (JSON only):
If you understand the request:
{"understood": true, "operation": "description", "ffmpeg": "command_without_input_output", "output_ext": ".mp4", "questions": []}

If you need clarification (ambiguous requests like "any format"):
{"understood": false, "questions": ["What format would you like? (MP4, AVI, WebM)", "What duration?"]}

If not possible with FFmpeg (colors, AI effects, impossible operations):
{"understood": false, "error": "This operation is not available with FFmpeg", "alternatives": ["Try: black and white filter", "Try: speed up by 2x"]}

Respond with JSON only:`;

        const completion = await this.groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 500
        });
        
        try {
            return JSON.parse(completion.choices[0]?.message?.content?.trim() || '{}');
        } catch (e) {
            return {
                understood: false,
                error: "I didn't understand that request",
                alternatives: ["Try: 'make it black and white'", "Try: 'speed up by 2x'", "Try: 'extract audio'"]
            };
        }
    }

    async handleFollowUpQuestions(questions, originalInput, videoFile, videoInfo) {
        let responses = [];
        
        for (const question of questions) {
            const answer = await this.ask(question);
            responses.push(answer);
        }
        
        const prompt = `Original request: "${originalInput}"
Additional info provided: ${responses.join(', ')}

VIDEO INFO: ${videoFile}, ${Math.round(videoInfo.duration)}s, ${videoInfo.width}x${videoInfo.height}

Generate the final FFmpeg operation in JSON format:
{"understood": true, "operation": "description", "ffmpeg": "command_without_input_output", "output_ext": ".mp4"}`;
        
        this.thinking('Processing your answers...');
        const completion = await this.groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 300
        });
        
        try {
            return JSON.parse(completion.choices[0]?.message?.content?.trim() || '{}');
        } catch (e) {
            throw new Error('Could not process your request. Please try again.');
        }
    }



    async analyzeVideo(filePath) {
        return new Promise((resolve, reject) => {
            const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
            exec(cmd, (error, stdout) => {
                if (error) reject(new Error('FFmpeg not found. Install from https://ffmpeg.org/'));
                try {
                    const data = JSON.parse(stdout);
                    const video = data.streams.find(s => s.codec_type === 'video');
                    const audio = data.streams.filter(s => s.codec_type === 'audio');
                    resolve({
                        duration: parseFloat(data.format.duration) || 0,
                        width: video?.width || 0,
                        height: video?.height || 0,
                        codec: video?.codec_name || 'unknown',
                        fps: eval(video?.r_frame_rate) || 0,
                        audio_streams: audio.length
                    });
                } catch (e) { reject(new Error('Invalid video file')); }
            });
        });
    }

    buildFullCommand(input, ffmpegCommand, output) {
        return `ffmpeg -i "${input}" ${ffmpegCommand} -y "${output}"`;
    }

    async resetApiKey() {
        const CONFIG_PATH = join(homedir(), '.vibedit-config.json');
        if (existsSync(CONFIG_PATH)) {
            unlinkSync(CONFIG_PATH);
        }
        this.groq = null;
        this.success('✅ API key reset! You\'ll be prompted for a new one.');
    }

    async executeCommand(command) {
        this.processing('Processing your video...');
        return new Promise((resolve, reject) => {
            const process = exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`\n${colors.red}FFmpeg Error: ${stderr || error.message}${colors.reset}`);
                    reject(new Error('Processing failed. Check your request and try again.'));
                } else { 
                    this.success('Video processed successfully!'); 
                    resolve(); 
                }
            });
            const dots = setInterval(() => process.stdout.write('.'), 1000);
            process.on('close', () => { clearInterval(dots); console.log(); });
        });
    }

    async run() {
        try {
            console.log(`${colors.bright}${colors.cyan}${symbols.film} Vibedit ${VERSION}${colors.reset} - AI-Powered Video Editor`);
            console.log(`${colors.dim}Just tell me what you want to do - I'll figure it out! ${colors.reset}\n`);
            
            await this.ensureApiKey();
            
            while (true) {
                const input = await this.ask('What would you like to do with your video?');
                if (!input || ['quit', 'exit', 'bye', 'done', 'stop'].some(w => input.toLowerCase().includes(w))) {
                    console.log(`${colors.cyan}${symbols.magic} Thanks for using Vibedit! Happy editing! ${colors.reset}`);
                    break;
                }
                
                if (input.toLowerCase().includes('help')) {
                    this.showExamples(); 
                    continue;
                }
                
                // Check for API key reset command
                if (input.toLowerCase().includes('reset api key') || input.toLowerCase().includes('change api key')) {
                    await this.resetApiKey();
                    continue;
                }
                
                const videoFile = await this.getVideoFile(input);
                const videoInfo = await this.analyzeVideo(videoFile);
                
                let result = await this.intelligentParsing(input, videoFile, videoInfo);
                
                // Handle follow-up questions or unsupported operations
                if (!result.understood) {
                    if (result.questions) result = await this.handleFollowUpQuestions(result.questions, input, videoFile, videoInfo);
                    if (!result.understood) {
                        if (result.error) this.error(result.error);
                        if (result.alternatives) {
                            this.log('\n💡 Try these instead:', 'yellow');
                            result.alternatives.forEach(alt => this.log(`   ${alt}`, 'white'));
                        }
                        continue;
                    }
                }
                
                // Execute the command
                const outputFile = this.generateOutputName(videoFile, result.operation, result.output_ext);
                const fullCommand = this.buildFullCommand(videoFile, result.ffmpeg, outputFile);
                
                this.processing(`${result.operation}`);
                await this.executeCommand(fullCommand);
                this.success(`${symbols.rocket} Done! Saved as: ${outputFile}`);
                console.log();
            }
        } catch (error) {
            this.error(error.message);
            const retry = await this.ask('Want to try something else? (yes/no)');
            if (retry.toLowerCase().startsWith('y')) await this.run();
        }
    }

    showExamples() {
        this.log('\n🎯 Just describe what you want naturally:', 'cyan');
        this.log('   "Make my vacation video black and white"', 'white');
        this.log('   "Convert file3.mp4 to any other video format"', 'white');
        this.log('   "Speed up by 2.5x and extract audio"', 'white');
        this.log('   "Resize to Instagram size and compress"', 'white');
        this.log('   "Extract the best 30 seconds from minute 2"', 'white');
        this.log('\n🔧 Special commands:', 'yellow');
        this.log('   "reset api key" - Change your Groq API key', 'white');
        this.log('\n✨ I understand natural language - no need to memorize commands!', 'magenta');
    }
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`${colors.bright}${colors.cyan}Vibedit ${VERSION}${colors.reset} - AI-Powered Video Editor`);
    console.log(`${colors.dim}Usage: vibedit${colors.reset}\n`);
    console.log(`${colors.yellow}Examples:${colors.reset}`);
    console.log(`  "Convert my video to MP4 format"`);
    console.log(`  "Speed up vacation.mov by 3x"`);
    console.log(`  "Extract 45 seconds starting from 2:30"`);
    console.log(`\n${colors.cyan}💫 Powered by AI - understands natural language!${colors.reset}`);
    process.exit(0);
}

const app = new Vibedit();
app.run().catch((error) => {
    console.error(`${colors.red}${symbols.error} Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
});
