#!/usr/bin/env node

/**
 * Test Setup Script for Revolt Motors Voice Assistant
 * Verifies that all components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Revolt Motors Voice Assistant Setup...\n');

// Test 1: Check required files
const requiredFiles = [
    'package.json',
    'server.js',
    '.env.example',
    'public/index.html',
    'public/app.js',
    'public/styles.css',
    'src/services/geminiLiveService.js',
    'src/utils/audioUtils.js'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file}`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n❌ Missing files: ${missingFiles.join(', ')}`);
    process.exit(1);
}

// Test 2: Check package.json
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDependencies = [
        'express',
        'ws',
        'cors',
        'dotenv',
        '@google/genai',
        'express-rate-limit',
        'helmet'
    ];
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    requiredDependencies.forEach(dep => {
        if (dependencies[dep]) {
            console.log(`✅ ${dep}: ${dependencies[dep]}`);
        } else {
            console.log(`❌ Missing dependency: ${dep}`);
            process.exit(1);
        }
    });
    
} catch (error) {
    console.log('❌ Failed to parse package.json');
    process.exit(1);
}

// Test 3: Check environment configuration
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env')) {
    console.log('✅ .env file exists');
    
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('your_google_ai_api_key_here')) {
        console.log('⚠️  Please configure your Google AI API key in .env');
    } else if (envContent.includes('GOOGLE_API_KEY=')) {
        console.log('✅ Google AI API key configured');
    } else {
        console.log('❌ GOOGLE_API_KEY not found in .env');
    }
} else {
    console.log('⚠️  .env file not found - copy from .env.example');
}

// Test 4: Check Node.js version
console.log('\n🟢 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 18) {
    console.log(`✅ Node.js ${nodeVersion} (compatible)`);
} else {
    console.log(`❌ Node.js ${nodeVersion} (requires 18.0.0+)`);
    process.exit(1);
}

// Test 5: Check if dependencies are installed
console.log('\n📚 Checking installed dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules directory exists');
    
    // Check specific important packages
    const importantPackages = ['express', '@google/genai', 'ws'];
    importantPackages.forEach(pkg => {
        if (fs.existsSync(`node_modules/${pkg}`)) {
            console.log(`✅ ${pkg} installed`);
        } else {
            console.log(`❌ ${pkg} not installed`);
        }
    });
} else {
    console.log('❌ node_modules not found - run npm install');
    process.exit(1);
}

// Test 6: Validate main files syntax
console.log('\n🔍 Validating JavaScript files...');
try {
    // Test server.js
    require('./server.js');
    console.log('❌ server.js should not auto-execute during test');
} catch (error) {
    if (error.message.includes('GOOGLE_API_KEY')) {
        console.log('✅ server.js syntax valid (requires API key)');
    } else {
        console.log(`❌ server.js syntax error: ${error.message}`);
    }
}

try {
    require('./src/services/geminiLiveService.js');
    console.log('✅ geminiLiveService.js syntax valid');
} catch (error) {
    console.log(`❌ geminiLiveService.js syntax error: ${error.message}`);
}

try {
    require('./src/utils/audioUtils.js');
    console.log('✅ audioUtils.js syntax valid');
} catch (error) {
    console.log(`❌ audioUtils.js syntax error: ${error.message}`);
}

// Test 7: Check HTML structure
console.log('\n🌐 Checking HTML structure...');
const htmlContent = fs.readFileSync('public/index.html', 'utf8');
const requiredElements = [
    'voiceButton',
    'chatMessages',
    'audioVisualizer',
    'statusDot',
    'loadingOverlay'
];

requiredElements.forEach(id => {
    if (htmlContent.includes(`id="${id}"`)) {
        console.log(`✅ Element #${id} found`);
    } else {
        console.log(`❌ Element #${id} missing`);
    }
});

// Final summary
console.log('\n🎉 Setup verification complete!\n');
console.log('📋 Next steps:');
console.log('1. Configure your Google AI API key in .env file');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('4. Allow microphone access');
console.log('5. Start chatting with Rev!\n');

console.log('🔗 Useful links:');
console.log('- Get API key: https://aistudio.google.com/');
console.log('- Gemini Live docs: https://ai.google.dev/gemini-api/docs/live');
console.log('- Test playground: https://aistudio.google.com/live\n');

console.log('✨ Ready to revolutionize voice chat with Revolt Motors! ✨');