class VoiceChat {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.audioWorkletNode = null;
        this.isRecording = false;
        this.isConnected = false;
        this.isMuted = false;
        this.audioChunks = [];
        this.conversationHistory = [];
        
        // DOM elements
        this.voiceButton = document.getElementById('voiceButton');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.chatMessages = document.getElementById('chatMessages');
        this.audioVisualizer = document.getElementById('audioVisualizer');
        this.muteBtn = document.getElementById('muteBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.audioPlayer = document.getElementById('audioPlayer');
        
        this.initializeEventListeners();
        this.connectWebSocket();
    }

    initializeEventListeners() {
        // Voice button events
        this.voiceButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        this.voiceButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        this.voiceButton.addEventListener('mouseleave', (e) => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });

        // Touch events for mobile
        this.voiceButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        this.voiceButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });

        // Control buttons
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.clearBtn.addEventListener('click', () => this.clearConversation());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.startRecording();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.stopRecording();
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRecording) {
                this.stopRecording();
            }
        });
    }

    async connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateStatus('connected', 'Connected');
                this.voiceButton.disabled = false;
                this.hideLoading();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.updateStatus('disconnected', 'Disconnected');
                this.voiceButton.disabled = true;
                
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connectWebSocket();
                    }
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showError('Connection failed. Please check your internet connection.');
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.showError('Failed to connect to the voice assistant.');
        }
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'audio':
                this.playAudioResponse(data.data, data.mimeType);
                this.setVoiceButtonState('speaking', 'AI Speaking...');
                this.showAudioVisualizer(true);
                break;
                
            case 'text':
                this.addMessage('assistant', data.data);
                break;
                
            case 'turn_complete':
                this.setVoiceButtonState('idle', 'Click to Talk');
                this.showAudioVisualizer(false);
                break;
                
            case 'interrupted':
                this.setVoiceButtonState('idle', 'Click to Talk');
                this.showAudioVisualizer(false);
                console.log('AI response was interrupted');
                break;
                
            case 'error':
                this.showError(data.message || 'An error occurred');
                this.setVoiceButtonState('idle', 'Click to Talk');
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    async startRecording() {
        if (!this.isConnected || this.isRecording) return;

        try {
            // Stop any currently playing audio to enable interruption
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            // Initialize Web Audio API for processing
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            const source = this.audioContext.createMediaStreamSource(stream);
            
            // Create a ScriptProcessorNode for real-time audio processing
            const processor = this.audioContext.createScriptProcessor(1024, 1, 1);
            
            processor.onaudioprocess = (event) => {
                if (this.isRecording) {
                    const inputData = event.inputBuffer.getChannelData(0);
                    // Convert to 16-bit PCM
                    const pcmData = this.convertToPCM16(inputData);
                    this.sendAudioData(pcmData);
                }
            };

            source.connect(processor);
            processor.connect(this.audioContext.destination);

            this.mediaStream = stream;
            this.processor = processor;
            this.isRecording = true;
            
            this.setVoiceButtonState('listening', 'Listening...');
            this.showAudioVisualizer(true);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Microphone access denied. Please allow microphone access.');
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.processor) {
            this.processor.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.setVoiceButtonState('processing', 'Processing...');
        this.showAudioVisualizer(false);
    }

    convertToPCM16(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new Int16Array(buffer);
        
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        return buffer;
    }

    sendAudioData(pcmData) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Convert to base64 for transmission
        const base64Data = this.arrayBufferToBase64(pcmData);
        
        this.ws.send(JSON.stringify({
            type: 'audio',
            data: base64Data
        }));
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async playAudioResponse(base64Data, mimeType) {
        try {
            if (this.isMuted) return;

            // Decode base64 to ArrayBuffer
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create audio context for PCM playback
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000 // Gemini outputs at 24kHz
            });

            // Convert PCM bytes to Float32Array
            const pcmData = new Int16Array(bytes.buffer);
            const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
            const channelData = audioBuffer.getChannelData(0);

            // Convert 16-bit PCM to float
            for (let i = 0; i < pcmData.length; i++) {
                channelData[i] = pcmData[i] / 32768.0;
            }

            // Play the audio
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    setVoiceButtonState(state, statusText) {
        this.voiceButton.className = `voice-button ${state}`;
        this.voiceStatus.textContent = statusText;
        
        // Update button accessibility
        this.voiceButton.setAttribute('aria-label', statusText);
    }

    showAudioVisualizer(show) {
        if (show) {
            this.audioVisualizer.classList.add('active');
        } else {
            this.audioVisualizer.classList.remove('active');
        }
    }

    updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="avatar">
                ${sender === 'user' ? 
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' :
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
                }
            </div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Store in conversation history
        this.conversationHistory.push({ sender, content, time });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteBtn.style.opacity = this.isMuted ? '0.5' : '1';
        this.muteBtn.title = this.isMuted ? 'Unmute' : 'Mute';
    }

    clearConversation() {
        // Keep welcome message, remove others
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        this.chatMessages.innerHTML = '';
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
        this.conversationHistory = [];
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        this.errorModal.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hide');
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
        }, 500);
    }
}

// Modal close function
function closeModal() {
    document.getElementById('errorModal').classList.remove('show');
}

// Initialize the voice chat application
document.addEventListener('DOMContentLoaded', () => {
    window.voiceChat = new VoiceChat();
});

// Handle browser compatibility
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.voice-button').disabled = true;
        document.getElementById('voiceStatus').textContent = 'Microphone not supported';
        console.error('getUserMedia not supported');
    });
}

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Commented out for now - can be implemented later
        // navigator.serviceWorker.register('/sw.js');
    });
}