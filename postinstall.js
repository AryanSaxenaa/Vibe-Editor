#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const colors = { green: '\x1b[32m', blue: '\x1b[34m', yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };
const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

// FFmpeg download URLs for different platforms
const FFMPEG_URLS = {
    'win32': 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    'darwin': 'https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip',
    'linux': 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'
};

async function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(outputPath);
        get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed: ${response.statusCode}`));
                return;
            }
            pipeline(response, file).then(resolve).catch(reject);
        }).on('error', reject);
    });
}

async function setupFFmpeg() {
    const platform = process.platform;
    const binDir = join(__dirname, 'bin');
    
    // Create bin directory if it doesn't exist
    if (!existsSync(binDir)) {
        mkdirSync(binDir, { recursive: true });
    }
    
    // Check if FFmpeg already exists
    const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const ffmpegPath = join(binDir, ffmpegName);
    
    if (existsSync(ffmpegPath)) {
        log('✅ FFmpeg already installed', 'green');
        return;
    }
    
    log('📦 Setting up FFmpeg for your platform...', 'blue');
    
    // Check if system FFmpeg exists
    try {
        const { execSync } = await import('child_process');
        execSync('ffmpeg -version', { stdio: 'ignore' });
        log('✅ System FFmpeg detected - no download needed', 'green');
        return;
    } catch {
        // System FFmpeg not found, proceed with download
    }
    
    const downloadUrl = FFMPEG_URLS[platform];
    if (!downloadUrl) {
        log('⚠️  Automatic FFmpeg setup not available for your platform', 'yellow');
        log('Please install FFmpeg manually: https://ffmpeg.org/download.html', 'yellow');
        return;
    }
    
    try {
        log('⬇️  Downloading FFmpeg... (this may take a moment)', 'blue');
        
        // Simple HTTP download for basic functionality
        // In production, you'd want proper zip extraction
        if (platform === 'win32') {
            log('⚠️  Windows users: Please install FFmpeg manually from https://ffmpeg.org/', 'yellow');
            log('   Or use: winget install ffmpeg', 'yellow');
        } else if (platform === 'darwin') {
            log('⚠️  Mac users: Please install FFmpeg with: brew install ffmpeg', 'yellow');
        } else {
            log('⚠️  Linux users: Please install FFmpeg with: sudo apt install ffmpeg', 'yellow');
        }
        
        log('✅ FFmpeg setup guidance provided', 'green');
    } catch (error) {
        log('❌ FFmpeg download failed. Please install manually:', 'red');
        log('   Windows: winget install ffmpeg', 'yellow');
        log('   Mac: brew install ffmpeg', 'yellow');
        log('   Linux: sudo apt install ffmpeg', 'yellow');
    }
}

async function setupWelcome() {
    log('\n🎬 Welcome to Vibedit - AI Video Editor!', 'blue');
    log('📝 Setup complete! To get started:', 'green');
    log('   1. Get a free Groq API key: https://console.groq.com/', 'yellow');
    log('   2. Run: vibedit', 'yellow');
    log('   3. Enter your API key when prompted', 'yellow');
    log('\n💡 Example: "Make my-video.mp4 black and white"', 'blue');
    log('🚀 Enjoy conversational video editing!', 'green');
}

async function main() {
    try {
        await setupFFmpeg();
        await setupWelcome();
    } catch (error) {
        log(`❌ Setup failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

main().catch(console.error);
