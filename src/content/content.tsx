// Immediate execution test - this should always run
console.log('[Content] Script file executed!');

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from '../components/ChatWidget';

console.log('[Content] Imports completed');
console.log('[Content] React:', React);
console.log('[Content] React.createElement:', typeof React.createElement);
console.log('[Content] createRoot:', typeof createRoot);
console.log('[Content] ChatWidget:', typeof ChatWidget);

let root: any = null;
let isInitialized = false;

// Immediately set up message listener
console.log('[Content] Setting up message listener...');

// Function to clean up widget
function cleanupWidget() {
  console.log('[Content] cleanupWidget called');
  
  // First, try to unmount React root if it exists
  if (root) {
    try {
      console.log('[Content] Unmounting React root...');
      root.unmount();
      console.log('[Content] React root unmounted successfully');
    } catch (error) {
      console.log('[Content] Could not unmount root (may already be unmounted):', error);
    }
    root = null;
  }
  
  // Then remove the DOM element
  const existingRoot = document.getElementById('aum-automation-chat-root');
  if (existingRoot) {
    console.log('[Content] Removing DOM element...');
    try {
      existingRoot.remove();
      console.log('[Content] DOM element removed');
    } catch (error) {
      console.error('[Content] Error removing DOM element:', error);
    }
  }
  
  // Reset state
  isInitialized = false;
  root = null;
}

// Function to check if we should reinitialize
function shouldInitialize() {
  const should = !isInitialized && !document.getElementById('aum-automation-chat-root');
  console.log('[Content] Should initialize?', should, { isInitialized, hasRoot: !!document.getElementById('aum-automation-chat-root') });
  return should;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] Message received:', request);
  
  if (request.action === 'ping') {
    console.log('[Content] Responding to ping');
    sendResponse({ ok: true });
    return true;
  }
  
  if (request.action === 'injectChat') {
    console.log('[Content] injectChat action received');
    
    // Clean up any existing widget first
    cleanupWidget();
    
    if (shouldInitialize()) {
      try {
        console.log('[Content] Initializing chat widget...');
        // Only create new widget if it doesn't exist
        const chatRoot = document.createElement('div');
        chatRoot.id = 'aum-automation-chat-root';
        
        // Minimal container - let the ChatWidget handle all positioning
        // Don't set any styles that could interfere

        console.log('[Content] Adding chat root to body...');
        document.body.appendChild(chatRoot);
        console.log('[Content] Chat root added to DOM');
        
        console.log('[Content] Creating React root...');
        root = createRoot(chatRoot);
        console.log('[Content] Rendering ChatWidget...');
        
        // Debug: Check what we're rendering
        console.log('[Content] ChatWidget component:', ChatWidget);
        console.log('[Content] Root element before render:', chatRoot);
        
        root.render(<ChatWidget />);
        isInitialized = true;
        
        // Debug: Check what was rendered
        setTimeout(() => {
          console.log('[Content] Root element after render:', chatRoot);
          console.log('[Content] Root innerHTML:', chatRoot.innerHTML);
          console.log('[Content] Root children:', chatRoot.children);
          console.log('[Content] Body contains root?', document.body.contains(chatRoot));
        }, 100);
        
        console.log('[Content] Chat widget initialized successfully');
      } catch (error) {
        console.error('[Content] Error initializing widget:', error);
        cleanupWidget();
        sendResponse({ success: false, error: error.message });
        return true;
      }
    } else {
      console.log('[Content] Widget already initialized or root exists, skipping...');
    }
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'cleanup') {
    console.log('[Content] cleanup action received');
    cleanupWidget();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "play_audio") {
    // Check if there's already an audio playing
    const existingAudio = document.querySelector('[data-tts-audio="true"]') as HTMLAudioElement;
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.remove();
    }

    const audio = new Audio(`data:audio/mpeg;base64,${request.audioContent}`);
    audio.setAttribute('data-tts-audio', 'true');
    
    audio.onended = () => {
      audio.remove();
      sendResponse({ success: true });
    };

    audio.onerror = () => {
      audio.remove();
      sendResponse({ success: false, error: 'Audio playback failed' });
    };

    audio.play().catch((error) => {
      audio.remove();
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }

  return false;
});

// Cleanup on unload - removed due to permissions policy violation
// window.addEventListener('unload', cleanupWidget);

// Listen for tab visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, cleanup any ongoing processes
    const event = new CustomEvent('pause-processes');
    window.dispatchEvent(event);
  }
});

// Listen for cleanup event from widget
window.addEventListener('cleanup-widget', () => {
  console.log('[Content] Cleanup event received from widget');
  cleanupWidget();
});

// Log that the script has finished loading
console.log('[Content] Script fully loaded and ready!');