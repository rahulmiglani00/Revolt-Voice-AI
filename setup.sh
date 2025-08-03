#!/bin/bash

echo "🚀 Setting up Revolt Motors Voice Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "🔑 IMPORTANT: Please edit .env file and add your Google AI API key:"
    echo "   1. Visit https://aistudio.google.com/"
    echo "   2. Create a new API key"
    echo "   3. Replace 'your_google_ai_api_key_here' in .env with your actual key"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if .env has been configured
if grep -q "your_google_ai_api_key_here" .env; then
    echo "⚠️  Please configure your Google AI API key in .env before running the application"
else
    echo "✅ Environment configured"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo ""
echo "The application will be available at http://localhost:3000"
echo ""
echo "📋 Next steps:"
echo "  1. Configure your Google AI API key in .env"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Open http://localhost:3000 in your browser"
echo "  4. Allow microphone access when prompted"
echo "  5. Start talking to Rev about Revolt Motors!"