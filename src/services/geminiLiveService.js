const { GoogleGenAI } = require('@google/genai');
const EventEmitter = require('events');

class GeminiLiveService extends EventEmitter {
  constructor() {
    super();
    this.genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);
    this.session = null;
    this.connected = false;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001';
    this.systemInstruction = this.getRevoltMotorsInstructions();
    this.responseQueue = [];
    this.isReceiving = false;
  }

  getRevoltMotorsInstructions() {
    return `You are Rev, the AI assistant for Revolt Motors, India's leading electric motorcycle manufacturer. 

IMPORTANT GUIDELINES:
- You can ONLY discuss topics related to Revolt Motors, electric motorcycles, and sustainable transportation
- If users ask about anything unrelated (other brands, personal questions, general topics), politely redirect them back to Revolt Motors
- Always be enthusiastic about electric mobility and Revolt's mission
- Keep responses concise but informative
- Speak in a friendly, professional tone

ABOUT REVOLT MOTORS:
- Founded in 2019 by Rahul Sharma
- India's first AI-enabled electric motorcycle company
- Flagship models: RV400 and RV300
- Features: AI integration, swappable batteries, mobile app connectivity
- Focus on sustainable urban mobility
- Manufacturing facility in Manesar, Haryana
- Available across major Indian cities
- Subscription-based and purchase options available

KEY FEATURES TO HIGHLIGHT:
- AI-enabled motorcycles with smart features
- Swappable battery technology
- Mobile app for bike management
- Multiple riding modes (City, Eco, Sport, Normal)
- Sound customization options
- GPS tracking and anti-theft features
- Fast charging capabilities
- Zero emissions

If someone asks about competitors, pricing of other brands, or unrelated topics, respond with something like: "I'm here to help you learn about Revolt Motors and our revolutionary electric motorcycles. What would you like to know about our RV400 or RV300 models?"

Always end conversations by encouraging them to visit a Revolt showroom or test ride a motorcycle.`;
  }

  async connect() {
    try {
      const config = {
        responseModalities: ["AUDIO"],
        systemInstruction: this.systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede" // Using a friendly voice
              }
            }
          }
        }
      };

      // Connect to Gemini Live API
      this.session = await this.genAI.live.connect({
        model: this.modelName,
        config: config
      });

      this.connected = true;
      console.log('✅ Connected to Gemini Live API');

      // Start receiving responses
      this.startReceiving();

      this.emit('connected');
    } catch (error) {
      console.error('❌ Failed to connect to Gemini Live API:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async startReceiving() {
    if (this.isReceiving || !this.session) return;
    
    this.isReceiving = true;
    
    try {
      for await (const response of this.session.receive()) {
        this.handleGeminiResponse(response);
      }
    } catch (error) {
      console.error('Error receiving from Gemini:', error);
      this.emit('error', error);
    } finally {
      this.isReceiving = false;
    }
  }

  handleGeminiResponse(response) {
    try {
      // Handle different types of responses
      if (response.data) {
        // Audio response
        this.emit('response', {
          type: 'audio',
          data: response.data,
          mimeType: 'audio/pcm;rate=24000'
        });
      }

      if (response.text) {
        // Text response (for debugging/transcription)
        this.emit('response', {
          type: 'text',
          data: response.text
        });
      }

      if (response.serverContent && response.serverContent.turnComplete) {
        // Turn completed
        this.emit('response', {
          type: 'turn_complete'
        });
      }

      if (response.serverContent && response.serverContent.interrupted) {
        // Response was interrupted
        this.emit('response', {
          type: 'interrupted'
        });
      }

    } catch (error) {
      console.error('Error handling Gemini response:', error);
      this.emit('error', error);
    }
  }

  async sendAudio(audioData) {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Gemini Live API');
    }

    try {
      // Convert base64 audio to buffer if needed
      let audioBuffer;
      if (typeof audioData === 'string') {
        audioBuffer = Buffer.from(audioData, 'base64');
      } else {
        audioBuffer = audioData;
      }

      await this.session.sendRealtimeInput({
        audio: {
          data: audioBuffer.toString('base64'),
          mimeType: "audio/pcm;rate=16000"
        }
      });

    } catch (error) {
      console.error('Error sending audio to Gemini:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async sendText(text) {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Gemini Live API');
    }

    try {
      await this.session.send(text);
    } catch (error) {
      console.error('Error sending text to Gemini:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async updateConfig(config) {
    // Handle any dynamic configuration updates
    if (config.systemInstruction) {
      this.systemInstruction = config.systemInstruction;
    }
    
    // Note: Most Live API configs can't be changed mid-session
    // This would require reconnecting for most changes
  }

  disconnect() {
    if (this.session) {
      try {
        this.session.close();
        this.connected = false;
        this.isReceiving = false;
        console.log('🔌 Disconnected from Gemini Live API');
        this.emit('disconnected');
      } catch (error) {
        console.error('Error disconnecting from Gemini:', error);
      }
    }
  }

  isConnected() {
    return this.connected && this.session;
  }
}

module.exports = GeminiLiveService;