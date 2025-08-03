const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const GeminiLiveService = require('./src/services/geminiLiveService');

const app = express();
const server = http.createServer(app);

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// WebSocket server for client connections
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  clientTracking: true
});

// Track active connections per IP
const connectionsByIP = new Map();

wss.on('connection', async (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  
  // Connection limiting per IP
  const currentConnections = connectionsByIP.get(clientIP) || 0;
  const maxConnections = parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 5;
  
  if (currentConnections >= maxConnections) {
    ws.close(1008, 'Too many connections from this IP');
    return;
  }
  
  connectionsByIP.set(clientIP, currentConnections + 1);
  
  console.log(`New WebSocket connection from ${clientIP}`);
  
  let geminiService = null;
  
  try {
    // Initialize Gemini Live API service
    geminiService = new GeminiLiveService();
    await geminiService.connectToGeminiLive();
    
    // Set up message forwarding between client and Gemini
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'audio':
            if (geminiService) {
              await geminiService.sendAudioData(data.data);
            }
            break;
          case 'text':
            if (geminiService) {
              await geminiService.sendTextMessage(data.data);
            }
            break;
          case 'interrupt':
            if (geminiService) {
              geminiService.interrupt();
            }
            break;
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing client message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });
    
    // Forward Gemini responses to client
    if (geminiService) {
      geminiService.on('audioResponse', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'audioResponse',
            ...data
          }));
        }
      });
      
      geminiService.on('textResponse', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'textResponse',
            ...data
          }));
        }
      });
      
      geminiService.on('error', (error) => {
        console.error('Gemini service error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'AI service error'
          }));
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
    ws.close(1011, 'Service initialization failed');
  }
  
  ws.on('close', () => {
    console.log(`WebSocket connection closed for ${clientIP}`);
    
    // Clean up connection count
    const currentConnections = connectionsByIP.get(clientIP) || 1;
    if (currentConnections <= 1) {
      connectionsByIP.delete(clientIP);
    } else {
      connectionsByIP.set(clientIP, currentConnections - 1);
    }
    
    // Clean up Gemini service
    if (geminiService) {
      geminiService.disconnect();
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connections: wss.clients.size
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    model: process.env.GEMINI_MODEL,
    maxConnections: process.env.MAX_CONNECTIONS_PER_IP,
    rateLimit: process.env.MAX_REQUESTS_PER_MINUTE
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Revolt Motors Voice Chat server running on port ${PORT}`);
  console.log(`💬 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});