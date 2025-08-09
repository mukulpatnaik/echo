// Minimal MV3 background service worker for injecting content script and CSS
let activeTabId: number | null = null;
let isInjecting = false;
let overlayVisible: { [tabId: number]: boolean } = {};

console.log('[Background] Extension loaded');

async function ensureContentScriptLoaded(tabId: number) {
  console.log(`[Background] Ensuring content script is loaded for tab ${tabId}`);
  
  try {
    // First try to ping the content script
    console.log('[Background] Attempting to ping content script...');
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    console.log('[Background] Content script already loaded - ping successful');
    return true; // Content script is already loaded
  } catch (error) {
    console.log('[Background] Content script not loaded, will inject it now', error);
    
    // Content script not loaded, inject it
    try {
      // Get tab info to check if we can inject
      const tab = await chrome.tabs.get(tabId);
      console.log('[Background] Tab info:', { url: tab.url, status: tab.status });
      
      // Check if the URL is injectable
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
        console.error('[Background] Cannot inject into chrome:// or edge:// pages');
        return false;
      }
      
      // Inject the content script
      console.log('[Background] Injecting content script...');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      console.log('[Background] Content script injected successfully');
      
      // Skip CSS injection - it's conflicting with React inline styles
      // console.log('[Background] Injecting CSS files...');
      // await chrome.scripting.insertCSS({
      //   target: { tabId: tabId },
      //   files: ['content.css', 'ChatWidget.css', 'popup.css']
      // });
      // console.log('[Background] CSS files injected successfully');
      
      // Wait a bit for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[Background] Initialization wait complete');
      
      // Verify the content script is now responsive
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        console.log('[Background] Content script is now responsive');
        return true;
      } catch (error) {
        console.error('[Background] Content script still not responsive after injection:', error);
        return false;
      }
    } catch (err) {
      console.error('[Background] Failed to inject content script:', err);
      return false;
    }
  }
}

async function toggleOverlay(tabId: number) {
  console.log(`[Background] toggleOverlay called for tab ${tabId}`);
  
  if (isInjecting) {
    console.log('[Background] Already injecting, skipping...');
    return;
  }
  
  try {
    isInjecting = true;
    
    // Ensure content script is loaded
    const loaded = await ensureContentScriptLoaded(tabId);
    if (!loaded) {
      console.error('[Background] Could not load content script');
      return;
    }
    
    // Toggle the overlay
    const isCurrentlyVisible = overlayVisible[tabId] || false;
    console.log(`[Background] Current overlay state for tab ${tabId}: ${isCurrentlyVisible}`);
    
    if (isCurrentlyVisible) {
      console.log('[Background] Sending cleanup message...');
      await chrome.tabs.sendMessage(tabId, { action: 'cleanup' });
      overlayVisible[tabId] = false;
      console.log('[Background] Overlay hidden');
    } else {
      console.log('[Background] Sending injectChat message...');
      await chrome.tabs.sendMessage(tabId, { action: 'injectChat' });
      overlayVisible[tabId] = true;
      console.log('[Background] Overlay shown');
    }
  } catch (err) {
    console.error('[Background] Error toggling overlay:', err);
  } finally {
    isInjecting = false;
    console.log('[Background] toggleOverlay complete');
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Background] Extension icon clicked', { tabId: tab.id, url: tab.url });
  if (tab.id) {
    await toggleOverlay(tab.id);
  } else {
    console.error('[Background] No tab ID available');
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (activeTabId && activeTabId !== activeInfo.tabId) {
    try { 
      await chrome.tabs.sendMessage(activeTabId, { action: 'cleanup' }); 
      overlayVisible[activeTabId] = false;
    } catch (_) {}
  }
  activeTabId = activeInfo.tabId;
  // Don't auto-inject on tab activation anymore
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // Reset overlay state on page reload
    overlayVisible[tabId] = false;
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete overlayVisible[tabId];
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'ping') {
    sendResponse({ ok: true });
    return true;
  }
  
  // Handle cleanup request from content script
  if (request && request.action === 'cleanup' && sender.tab?.id) {
    console.log('[Background] Received cleanup request from tab', sender.tab.id);
    chrome.tabs.sendMessage(sender.tab.id, { action: 'cleanup' }, () => {
      overlayVisible[sender.tab.id!] = false;
      console.log('[Background] Cleanup completed for tab', sender.tab.id);
    });
    sendResponse({ ok: true });
    return true;
  }
  
  return false;
});