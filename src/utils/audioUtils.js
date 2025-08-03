/**
 * Audio Utilities for Voice Chat Application
 * Optimized for low-latency real-time audio processing
 */

class AudioUtils {
    /**
     * Convert Float32Array audio data to 16-bit PCM
     * @param {Float32Array} float32Array - Input audio data
     * @returns {ArrayBuffer} - 16-bit PCM data
     */
    static convertToPCM16(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new Int16Array(buffer);
        
        for (let i = 0; i < float32Array.length; i++) {
            // Clamp the float value to [-1, 1] range
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            // Convert to 16-bit signed integer
            view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        return buffer;
    }

    /**
     * Convert ArrayBuffer to Base64 string for transmission
     * @param {ArrayBuffer} buffer - Input buffer
     * @returns {string} - Base64 encoded string
     */
    static arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 8192;
        
        // Process in chunks for better performance with large buffers
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        
        return btoa(binary);
    }

    /**
     * Convert Base64 string back to ArrayBuffer
     * @param {string} base64 - Base64 encoded string
     * @returns {ArrayBuffer} - Decoded buffer
     */
    static base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    /**
     * Create an optimized AudioContext for the given sample rate
     * @param {number} sampleRate - Target sample rate
     * @returns {AudioContext} - Configured audio context
     */
    static createOptimizedAudioContext(sampleRate = 16000) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        // Use optimized settings for real-time processing
        const context = new AudioContext({
            sampleRate: sampleRate,
            latencyHint: 'interactive', // Optimize for low latency
        });
        
        return context;
    }

    /**
     * Apply noise gate to audio data to reduce background noise
     * @param {Float32Array} audioData - Input audio data
     * @param {number} threshold - Noise gate threshold (0-1)
     * @returns {Float32Array} - Filtered audio data
     */
    static applyNoiseGate(audioData, threshold = 0.01) {
        const output = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            const absValue = Math.abs(audioData[i]);
            output[i] = absValue > threshold ? audioData[i] : 0;
        }
        
        return output;
    }

    /**
     * Detect voice activity in audio data
     * @param {Float32Array} audioData - Input audio data
     * @param {number} threshold - Voice activity threshold
     * @returns {boolean} - True if voice activity detected
     */
    static detectVoiceActivity(audioData, threshold = 0.02) {
        let sum = 0;
        let count = 0;
        
        // Calculate RMS (Root Mean Square) energy
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
            count++;
        }
        
        const rms = Math.sqrt(sum / count);
        return rms > threshold;
    }

    /**
     * Resample audio data to target sample rate
     * @param {Float32Array} inputData - Input audio data
     * @param {number} inputRate - Input sample rate
     * @param {number} outputRate - Target sample rate
     * @returns {Float32Array} - Resampled audio data
     */
    static resampleAudio(inputData, inputRate, outputRate) {
        if (inputRate === outputRate) {
            return inputData;
        }
        
        const ratio = inputRate / outputRate;
        const outputLength = Math.round(inputData.length / ratio);
        const outputData = new Float32Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const index = i * ratio;
            const lowIndex = Math.floor(index);
            const highIndex = Math.ceil(index);
            const fraction = index - lowIndex;
            
            if (highIndex >= inputData.length) {
                outputData[i] = inputData[lowIndex];
            } else {
                // Linear interpolation
                outputData[i] = inputData[lowIndex] * (1 - fraction) + 
                               inputData[highIndex] * fraction;
            }
        }
        
        return outputData;
    }

    /**
     * Create an audio buffer for playback
     * @param {AudioContext} audioContext - Audio context
     * @param {ArrayBuffer} pcmData - PCM audio data
     * @param {number} sampleRate - Sample rate
     * @returns {AudioBuffer} - Audio buffer ready for playback
     */
    static createAudioBuffer(audioContext, pcmData, sampleRate = 24000) {
        const pcmArray = new Int16Array(pcmData);
        const audioBuffer = audioContext.createBuffer(1, pcmArray.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert 16-bit PCM to float [-1, 1]
        for (let i = 0; i < pcmArray.length; i++) {
            channelData[i] = pcmArray[i] / 32768.0;
        }
        
        return audioBuffer;
    }

    /**
     * Get optimal chunk size for real-time processing
     * @param {number} sampleRate - Sample rate
     * @param {number} targetLatency - Target latency in milliseconds
     * @returns {number} - Optimal chunk size
     */
    static getOptimalChunkSize(sampleRate = 16000, targetLatency = 50) {
        // Calculate chunk size based on target latency
        const samplesPerMs = sampleRate / 1000;
        const chunkSize = Math.round(samplesPerMs * targetLatency);
        
        // Ensure chunk size is a power of 2 for better performance
        return Math.pow(2, Math.round(Math.log2(chunkSize)));
    }

    /**
     * Check browser audio capabilities
     * @returns {Object} - Browser audio support information
     */
    static checkAudioCapabilities() {
        const capabilities = {
            webAudioAPI: !!(window.AudioContext || window.webkitAudioContext),
            mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            mediaRecorder: !!window.MediaRecorder,
            webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
            audioWorklet: false
        };

        // Check for AudioWorklet support (more advanced audio processing)
        if (capabilities.webAudioAPI) {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            capabilities.audioWorklet = !!context.audioWorklet;
            context.close();
        }

        return capabilities;
    }

    /**
     * Optimize audio constraints for low latency
     * @param {Object} baseConstraints - Base audio constraints
     * @returns {Object} - Optimized constraints
     */
    static getOptimizedAudioConstraints(baseConstraints = {}) {
        return {
            audio: {
                sampleRate: 16000,           // Optimal for speech
                channelCount: 1,             // Mono audio
                echoCancellation: true,      // Remove echo
                noiseSuppression: true,      // Reduce background noise
                autoGainControl: true,       // Automatic volume adjustment
                latency: 0.01,              // 10ms latency hint
                ...baseConstraints.audio
            }
        };
    }
}

module.exports = AudioUtils;