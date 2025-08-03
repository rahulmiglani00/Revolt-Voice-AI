# Rev - Revolt Motors Voice Assistant

A real-time conversational voice interface built with the Gemini Live API, replicating the functionality of the Revolt Motors chatbot with server-to-server architecture.

## 🚀 Features

- **Real-time Voice Chat**: Low-latency bidirectional audio communication
- **Interruption Support**: Users can interrupt the AI mid-response naturally
- **Revolt Motors Focused**: AI assistant specializing in Revolt Motors products and services
- **Modern UI**: Clean, responsive interface with real-time visual feedback
- **Server-to-Server Architecture**: Secure backend processing with WebSocket communication
- **Cross-Platform**: Works on desktop and mobile browsers

## 🛠 Tech Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JavaScript, Web Audio API, WebSocket
- **AI**: Google Gemini Live API
- **Audio**: Real-time PCM audio processing (16kHz input, 24kHz output)
- **Security**: Rate limiting, CORS, Helmet.js

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Google AI API key from [aistudio.google.com](https://aistudio.google.com/)
- Modern web browser with microphone support
- HTTPS (required for microphone access in production)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd revolt-motors-voice-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   GOOGLE_API_KEY=your_google_ai_api_key_here
   PORT=3000
   NODE_ENV=development
   GEMINI_MODEL=gemini-2.0-flash-live-001
   ```

4. **Get Google AI API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Add it to your `.env` file

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

1. **Open the application** in your web browser
2. **Allow microphone access** when prompted
3. **Press and hold** the red microphone button to speak
4. **Release** to send your voice message to the AI
5. **Interrupt** the AI by pressing the microphone button while it's speaking

### Keyboard Shortcuts
- **Spacebar**: Hold to record, release to send

### Voice Commands
The AI assistant specializes in Revolt Motors topics:
- Ask about electric motorcycles (RV400, RV300)
- Learn about features and technology
- Get information about pricing and availability
- Inquire about test rides and showrooms

## 🏗 Architecture

### Server-to-Server Flow
```
Client Browser ↔ WebSocket ↔ Node.js Server ↔ Gemini Live API
```

1. **Client** captures microphone audio and sends via WebSocket
2. **Server** forwards audio to Gemini Live API
3. **Gemini** processes and returns audio response
4. **Server** forwards response back to client
5. **Client** plays audio response

### Key Components

- **`server.js`**: Main Express server with WebSocket handling
- **`src/services/geminiLiveService.js`**: Gemini Live API integration
- **`public/app.js`**: Frontend voice chat application
- **`src/utils/audioUtils.js`**: Audio processing utilities

## 🔧 Configuration

### Model Selection

For **production** (final submission):
```env
GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog
```

For **development** (higher rate limits):
```env
GEMINI_MODEL=gemini-2.0-flash-live-001
# or
GEMINI_MODEL=gemini-live-2.5-flash-preview
```

### Rate Limiting
```env
MAX_REQUESTS_PER_MINUTE=60
MAX_CONNECTIONS_PER_IP=5
```

## 🎨 UI Components

- **Voice Button**: Main interaction element with visual states
- **Audio Visualizer**: Real-time audio level display
- **Status Indicator**: Connection status display
- **Chat Messages**: Conversation history (optional)
- **Controls**: Mute, clear conversation

## 🔊 Audio Processing

### Input Audio Format
- **Format**: 16-bit PCM
- **Sample Rate**: 16 kHz
- **Channels**: Mono
- **Encoding**: Base64 for WebSocket transmission

### Output Audio Format
- **Format**: 16-bit PCM
- **Sample Rate**: 24 kHz
- **Channels**: Mono
- **Playback**: Web Audio API

## 🛡 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable origins
- **Input Validation**: Secure message handling
- **Connection Limits**: Per-IP connection limits

## 🐛 Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure HTTPS in production
   - Check browser permissions
   - Try refreshing the page

2. **Connection Failed**
   - Verify API key is correct
   - Check network connectivity
   - Ensure WebSocket support

3. **Audio Not Playing**
   - Check browser audio permissions
   - Verify speakers/headphones
   - Try different browser

4. **High Latency**
   - Check network connection
   - Consider using development model
   - Verify server location

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Mobile**: Responsive design with touch support

## 🔗 API Endpoints

- **GET `/`**: Main application
- **GET `/api/health`**: Health check
- **GET `/api/config`**: Configuration info
- **WebSocket `/ws`**: Real-time communication

## 📦 Dependencies

### Production
- `express`: Web framework
- `ws`: WebSocket server
- `@google/genai`: Gemini AI integration
- `cors`: CORS middleware
- `helmet`: Security headers
- `express-rate-limit`: Rate limiting

### Development
- `nodemon`: Development server

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set environment variables
2. Use HTTPS (required for microphone)
3. Configure rate limits
4. Monitor API usage

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the [Gemini Live API documentation](https://ai.google.dev/gemini-api/docs/live)
- Open an issue in the repository

---

## 🎥 Demo Video

A demo video showcasing the application's features, including natural conversation and interruption capabilities, is available at: [Demo Video Link]

**Video demonstrates:**
- ✅ Natural conversation with the AI
- ✅ Clear interruption of AI mid-response
- ✅ Overall responsiveness and low latency
- ✅ Revolt Motors focused responses

---

Built with ❤️ using Gemini Live API and modern web technologies.
