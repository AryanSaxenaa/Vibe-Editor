# Vibedit - Conversational AI Video Editor

[![Published NPM Package](https://img.shields.io/badge/Published-NPM%20Package-success?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/vibedit)

> AI-powered video editing through natural language conversation

**Vibedit** is a command-line tool that transforms video editing into a natural conversation. Describe what you want to do with your video in plain English, and let AI handle the complex FFmpeg commands behind the scenes.

**🎉 Successfully Published**: Available as an NPM package for global installation and use.

[![npm version](https://badge.fury.io/js/vibedit.svg)](https://www.npmjs.com/package/vibedit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-blue.svg)](https://nodejs.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Required-red.svg)](https://ffmpeg.org/)

## Links

- 📦 **NPM Package Page**: [npmjs.com/package/vibedit](https://www.npmjs.com/package/vibedit)
- ⬇️ **Direct Download**: [vibedit-1.0.0.tgz](https://registry.npmjs.org/vibedit/-/vibedit-1.0.0.tgz)
- 🐙 **GitHub Repository**: [github.com/AryanSaxenaa/Vibe-Editor](https://github.com/AryanSaxenaa/Vibe-Editor)
- 🐛 **Issues & Support**: [GitHub Issues](https://github.com/AryanSaxenaa/Vibe-Editor/issues)

## Features

### Conversational Interface
- **Natural Language Processing** - Describe video editing tasks in plain English
- **Smart Context Detection** - Automatically finds video files mentioned in your requests  
- **Intelligent Clarification** - Only asks follow-up questions when necessary
- **Continuous Workflow** - Handle multiple videos and operations in one session

### AI-Powered Processing  
- **Groq AI Integration** - Fast natural language understanding and command generation
- **FFmpeg Backend** - Access to professional video processing capabilities
- **Automatic File Management** - Smart output naming and conflict resolution
- **Error Recovery** - Graceful handling of processing errors with retry options

### Supported Operations

- **Format Conversion** - Convert between MP4, AVI, MOV, WebM, and more
- **Video Effects** - Apply filters like black & white, speed adjustments
- **Clip Extraction** - Extract specific time ranges or durations  
- **Audio Extraction** - Extract audio tracks to MP3 or other formats
- **Video Resizing** - Change resolution and aspect ratios
- **Compression** - Optimize file sizes for different platforms

## Quick Start

### Installation

```bash
npm install -g vibedit
```

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **FFmpeg** - Required for video processing (installation guidance provided during setup)
- **Groq API Key** - [Get free key](https://console.groq.com/)

### Setup & Usage

```bash
vibedit
```

**Automatic Setup Assistance:**
- On installation, the postinstall script checks for FFmpeg and provides platform-specific installation instructions
- On first run, you'll be prompted to enter your Groq API key
- The tool guides you through the complete setup process

**FFmpeg Installation (if needed):**
- **Windows**: `winget install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/)
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

## Examples

### Basic Operations

```bash
# Convert video format
What would you like to do with your video?
> Convert my-video.avi to MP4 format

# Apply effects  
What would you like to do with your video?
> Make vacation.mov black and white and speed up by 2x

# Extract clips
What would you like to do with your video?
> Extract 30 seconds starting at 1:15 from presentation.mp4

# Extract audio
What would you like to do with your video?
> Extract audio from concert.mp4
```

### Interactive Session Example

```bash
$ vibedit

Vibedit 1.0.0 - AI-Powered Video Editor
Just tell me what you want to do - I'll figure it out!

What would you like to do with your video?
> Make my vacation video black and white and speed up by 2x

[SUCCESS] Found vacation.mp4 (45.2MB)
[THINKING] Understanding your request...
[PROCESSING] Processing your video...
..................
[SUCCESS] Video processed successfully!
[COMPLETE] Done! Saved as: vacation_edited.mp4

What would you like to do with your video?
> quit

[DONE] Thanks for using Vibedit! Happy editing!
```

## API Reference

### Supported Commands

**Format Conversion**
- "Convert [file] to MP4/AVI/WebM format"
- "Change [file] to any video format"

**Video Effects** 
- "Make [file] black and white"
- "Speed up [file] by [factor]x"
- "Slow down [file] by [factor]x"

**Clip Extraction**
- "Extract [duration] starting at [time] from [file]"
- "Trim [file] from [start] to [end]"
- "Extract the first/last [duration] from [file]"

**Audio Operations**
- "Extract audio from [file]"
- "Remove audio from [file]"

**Resizing**
- "Resize [file] to [width]x[height]"
- "Scale [file] to [resolution]"

### Time Format Support
- Seconds: `30`, `90` 
- MM:SS: `1:30`, `2:45`
- HH:MM:SS: `1:15:30`, `0:02:15`

## Configuration

### Automatic Setup (Post-Install)
When you install vibedit, the postinstall script automatically:
- **Checks for FFmpeg** - Detects if FFmpeg is already installed on your system
- **Provides Installation Guidance** - Shows platform-specific commands to install FFmpeg if needed
- **Setup Instructions** - Displays next steps to get started with Vibedit

### API Key Setup
On first run, Vibedit will prompt you to enter your Groq API key:

1. Visit [console.groq.com](https://console.groq.com/)
2. Create a free account
3. Generate an API key
4. Paste it when prompted

The key is securely stored in `~/.vibedit-config.json`.

### Reset Configuration
```bash
vibedit
# Then type: "reset api key"
```

## Troubleshooting

### Common Issues

**FFmpeg not found**
```bash
# Install FFmpeg first:
# Windows: Download from https://ffmpeg.org/
# macOS: brew install ffmpeg  
# Linux: sudo apt install ffmpeg
```

**API Key Issues**
```bash
# Get a new key from https://console.groq.com/
# Use "reset api key" command in vibedit
```

**File Not Found**
- Use full file paths
- Ensure the file exists and isn't in use
- Check file permissions

## Contributing

### Development
```bash
git clone https://github.com/AryanSaxenaa/Vibe-Editor.git
cd Vibe-Editor
npm install
node vibedit.js
```

### Issues and Feature Requests
Please report issues and request features at: https://github.com/AryanSaxenaa/Vibe-Editor/issues

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Groq** - For providing fast AI language processing
- **FFmpeg** - For powerful video processing capabilities
- **Node.js Community** - For excellent tooling and ecosystem