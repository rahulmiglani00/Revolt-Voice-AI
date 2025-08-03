const { GoogleGenerativeAI } = require('@google/generative-ai');
const EventEmitter = require('events');

class GeminiLiveService extends EventEmitter {
  constructor() {
    super();
    
    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = null;
    this.connected = false;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001';
    this.systemInstruction = this.getRevoltMotorsInstructions();
    this.messageId = 0;
    
    console.log('✅ GeminiLiveService initialized successfully');
  }

  getRevoltMotorsInstructions() {
    return `You are Rev, the AI assistant for Revolt Motors, India's leading electric motorcycle manufacturer. 

IMPORTANT GUIDELINES:
- You can ONLY discuss topics related to Revolt Motors, electric motorcycles, and sustainable transportation
- If asked about other topics, politely redirect the conversation back to Revolt Motors
- Keep responses conversational, helpful, and enthusiastic about electric mobility
- You represent Revolt Motors' commitment to innovation and sustainability

ABOUT REVOLT MOTORS:
- Founded in 2019 by Rahul Sharma
- India's first AI-enabled electric motorcycle manufacturer
- Known for models like RV400 and RV300
- Pioneer in electric mobility solutions
- Focus on sustainable transportation and innovation
- Headquartered in Gurugram, India

KEY FEATURES TO HIGHLIGHT:
- AI-enabled motorcycles with smart connectivity
- Swappable battery technology
- Mobile app integration
- Sound customization options
- Eco-friendly transportation solutions
- Cost-effective electric mobility

Always be enthusiastic about Revolt Motors and electric mobility. Keep responses under 3 sentences for natural conversation flow.`;
  }

  async connectToGeminiLive() {
    try {
      console.log('🔄 Connecting to Gemini API...');
      
      // Initialize the model
      this.model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: this.systemInstruction
      });
      
      this.connected = true;
      
      console.log('✅ Connected to Gemini API successfully');
      this.emit('connected');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Gemini API:', error);
      this.emit('error', error);
      return false;
    }
  }

  async sendAudioData(audioData) {
    if (!this.connected || !this.model) {
      console.error('❌ Not connected to Gemini API');
      return;
    }

    try {
      console.log('🎤 Processing audio input...');
      
      // For this demo, we'll use a default prompt for audio
      // In a real implementation, you'd transcribe the audio first
      const prompt = "Tell me about Revolt Motors electric motorcycles";
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Generated response:', text);
      
      this.emit('audioResponse', {
        text: text,
        audioData: null // Would contain synthesized audio in full implementation
      });
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      this.emit('error', error);
    }
  }

  async sendTextMessage(message) {
    if (!this.connected || !this.model) {
      console.error('❌ Not connected to Gemini API');
      return;
    }

    try {
      console.log('💬 Processing text message:', message);
      
      const result = await this.model.generateContent(message);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Generated response:', text);
      
      this.emit('textResponse', {
        text: text,
        messageId: ++this.messageId
      });
      
      return text;
      
    } catch (error) {
      console.error('❌ Error processing text message:', error);
      this.emit('error', error);
      throw error;
    }
  }

  interrupt() {
    console.log('⚡ Interrupting current response...');
    this.emit('interrupted');
  }

  disconnect() {
    console.log('🔌 Disconnecting from Gemini API...');
    this.connected = false;
    this.model = null;
    this.emit('disconnected');
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = GeminiLiveService;