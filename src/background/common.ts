//src/background/common.ts
import { log, handleError } from '../utils/logger';
// Debugger commands
async function executeCommand(tabId: number, method: string, params: object = {}): Promise<any> {
    try {
      return await new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({tabId}, method, params, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      handleError(error as Error, `executing ${method}`);
    }
  }
  
  // Utility functions
  const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
  
  async function attachDebugger(tabId: number): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.debugger.attach({ tabId }, "1.3", () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
      console.log("Debugger attached successfully");
    } catch (error) {
      handleError(error as Error, "attaching debugger");
    }
  }
  
  async function detachDebugger(tabId: number): Promise<void> {
    try {
      await new Promise<void>((resolve) => {
        chrome.debugger.detach({ tabId }, () => {
          if (chrome.runtime.lastError) {
            console.log(`Warning when detaching debugger: ${chrome.runtime.lastError.message}`);
          }
          resolve();
        });
      });
      console.log("Debugger detached");
    } catch (error) {
      console.log(`Error detaching debugger: ${(error as Error).message}`);
    }
  }
  async function askForConfirmation(tabId: number, message: string): Promise<boolean> {
    log(`Asking for confirmation with custom popup: "${message}"`);
  
    const result = await executeCommand(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const chatRoot = document.getElementById('aum-automation-chat-root');
          if (!chatRoot) throw new Error('Chat root not found');
          
          const existingPopup = document.getElementById('custom-confirm-popup');
          if (existingPopup) {
            chatRoot.removeChild(existingPopup);
          }
          
          const popup = document.createElement('div');
          popup.id = 'custom-confirm-popup';
          popup.style.position = 'absolute';
          popup.style.top = '50%';
          popup.style.left = '50%';
          popup.style.transform = 'translate(-50%, -50%)';
          popup.style.display = 'flex';
          popup.style.width = '480px';
          popup.style.flexDirection = 'column';
          popup.style.alignItems = 'flex-start';
          popup.style.padding = '24px';
          popup.style.flexShrink = '0';
          popup.style.borderRadius = '32px';
          popup.style.background = 'rgba(64, 64, 64, 0.65)';
          popup.style.border = '1px rgba(255, 255, 255, 0.09)';
          popup.style.boxShadow = '0px 1px 2px 0px var(--Colors-Effects-Shadows-shadow-xs, rgba(16, 24, 40, 0.05))';
          popup.style.backdropFilter = 'blur(20px)';
          popup.style.zIndex = '10000';
          popup.style.pointerEvents = 'auto';

          const titleContainer = document.createElement('div');
          titleContainer.style.display = 'flex';
          titleContainer.style.alignItems = 'center';
          titleContainer.style.gap = '8px';

          const icon = document.createElement('img');
          icon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMTIgMS44NzVDOS45OTc0NyAxLjg3NSA4LjAzOTkgMi40Njg4MiA2LjM3NDg2IDMuNTgxMzdDNC43MDk4MSA0LjY5MzkyIDMuNDEyMDYgNi4yNzUyMyAyLjY0NTcyIDguMTI1MzNDMS44NzkzOSA5Ljk3NTQzIDEuNjc4ODggMTIuMDExMiAyLjA2OTU1IDEzLjk3NTNDMi40NjAyMyAxNS45MzkzIDMuNDI0NTQgMTcuNzQzNSA0Ljg0MDU1IDE5LjE1OTVDNi4yNTY1NiAyMC41NzU1IDguMDYwNjYgMjEuNTM5OCAxMC4wMjQ3IDIxLjkzMDVDMTEuOTg4OCAyMi4zMjExIDE0LjAyNDYgMjIuMTIwNiAxNS44NzQ3IDIxLjM1NDNDMTcuNzI0OCAyMC41ODc5IDE5LjMwNjEgMTkuMjkwMiAyMC40MTg2IDE3LjYyNTFDMjEuNTMxMiAxNS45NjAxIDIyLjEyNSAxNC4wMDI1IDIyLjEyNSAxMkMyMi4xMjIgOS4zMTU2IDIxLjA1NDMgNi43NDE5OSAxOS4xNTYyIDQuODQzODNDMTcuMjU4IDIuOTQ1NjcgMTQuNjg0NCAxLjg3Nzk4IDEyIDEuODc1Wk0xMiAxOS44NzVDMTAuNDQyNSAxOS44NzUgOC45MTk5MyAxOS40MTMxIDcuNjI0ODkgMTguNTQ3OEM2LjMyOTg1IDE3LjY4MjUgNS4zMjA0OSAxNi40NTI2IDQuNzI0NDUgMTUuMDEzNkM0LjEyODQxIDEzLjU3NDcgMy45NzI0NiAxMS45OTEzIDQuMjc2MzIgMTAuNDYzN0M0LjU4MDE4IDguOTM2MDYgNS4zMzAyIDcuNTMyODcgNi40MzE1NCA2LjQzMTUzQzcuNTMyODggNS4zMzAyIDguOTM2MDcgNC41ODAxNyAxMC40NjM3IDQuMjc2MzJDMTEuOTkxMyAzLjk3MjQ2IDEzLjU3NDcgNC4xMjg0MSAxNS4wMTM2IDQuNzI0NDVDMTYuNDUyNiA1LjMyMDQ5IDE3LjY4MjUgNi4zMjk4NSAxOC41NDc4IDcuNjI0ODhDMTkuNDEzMSA4LjkxOTkyIDE5Ljg3NSAxMC40NDI1IDE5Ljg3NSAxMkMxOS44NzI4IDE0LjA4NzkgMTkuMDQyNCAxNi4wODk2IDE3LjU2NiAxNy41NjZDMTYuMDg5NiAxOS4wNDI0IDE0LjA4NzkgMTkuODcyOCAxMiAxOS44NzVaTTEwLjg3NSAxMi4zNzVWNy41QzEwLjg3NSA3LjIwMTYzIDEwLjk5MzUgNi45MTU0OCAxMS4yMDQ1IDYuNzA0NUMxMS40MTU1IDYuNDkzNTMgMTEuNzAxNiA2LjM3NSAxMiA2LjM3NUMxMi4yOTg0IDYuMzc1IDEyLjU4NDUgNi40OTM1MyAxMi43OTU1IDYuNzA0NUMxMy4wMDY1IDYuOTE1NDggMTMuMTI1IDcuMjAxNjMgMTMuMTI1IDcuNVYxMi4zNzVDMTMuMTI1IDEyLjY3MzQgMTMuMDA2NSAxMi45NTk1IDEyLjc5NTUgMTMuMTcwNUMxMi41ODQ1IDEzLjM4MTUgMTIuMjk4NCAxMy41IDEyIDEzLjVDMTEuNzAxNiAxMy41IDExLjQxNTUgMTMuMzgxNSAxMS4yMDQ1IDEzLjE3MDVDMTAuOTkzNSAxMi45NTk1IDEwLjg3NSAxMi42NzM0IDEwLjg3NSAxMi4zNzVaTTEzLjUgMTYuMTI1QzEzLjUgMTYuNDIxNyAxMy40MTIgMTYuNzExNyAxMy4yNDcyIDE2Ljk1ODRDMTMuMDgyNCAxNy4yMDUgMTIuODQ4MSAxNy4zOTczIDEyLjU3NCAxNy41MTA4QzEyLjI5OTkgMTcuNjI0NCAxMS45OTgzIDE3LjY1NDEgMTEuNzA3NCAxNy41OTYyQzExLjQxNjQgMTcuNTM4MyAxMS4xNDkxIDE3LjM5NTQgMTAuOTM5MyAxNy4xODU3QzEwLjcyOTYgMTYuOTc1OSAxMC41ODY3IDE2LjcwODYgMTAuNTI4OCAxNi40MTc2QzEwLjQ3MDkgMTYuMTI2NyAxMC41MDA3IDE1LjgyNTEgMTAuNjE0MiAxNS41NTFDMTAuNzI3NyAxNS4yNzY5IDEwLjkyIDE1LjA0MjYgMTEuMTY2NiAxNC44Nzc4QzExLjQxMzMgMTQuNzEzIDExLjcwMzMgMTQuNjI1IDEyIDE0LjYyNUMxMi4zOTc4IDE0LjYyNSAxMi43Nzk0IDE0Ljc4MyAxMy4wNjA3IDE1LjA2NDNDMTMuMzQyIDE1LjM0NTYgMTMuNSAxNS43MjcyIDEzLjUgMTYuMTI1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
          icon.style.width = '24px';
          icon.style.height = '24px';
          titleContainer.appendChild(icon);

          const messageTitle = document.createElement('p');
          messageTitle.textContent = 'Confirm action';
          messageTitle.style.color = '#FFF';
          messageTitle.style.fontSize = '20px';
          messageTitle.style.fontStyle = 'normal';
          messageTitle.style.fontWeight = '600';
          messageTitle.style.lineHeight = '1.4';
          messageTitle.style.margin = '0';
          titleContainer.appendChild(messageTitle);

          popup.appendChild(titleContainer);
  
          const messageElem = document.createElement('p');
          messageElem.textContent = ${JSON.stringify(message)};
          messageElem.style.color = 'rgba(255, 255, 255, 0.90)';
          messageElem.style.fontSize = '16px';
          messageElem.style.fontStyle = 'normal';
          messageElem.style.fontWeight = '400';
          messageElem.style.lineHeight = '1';
          messageElem.style.marginTop = '10px';
          popup.appendChild(messageElem);

          const buttonContainer = document.createElement('div');
          buttonContainer.style.display = 'flex';
          buttonContainer.style.height = '48px';
          buttonContainer.style.justifyContent = 'center';
          buttonContainer.style.gap = '24px';
          buttonContainer.style.flexShrink = '0';
          buttonContainer.style.alignSelf = 'stretch';
          buttonContainer.style.marginTop = '24px';

          const noButton = document.createElement('button');
          noButton.textContent = 'Update';
          noButton.style.display = 'flex';
          noButton.style.height = '48px';
          noButton.style.padding = '16px 32px';
          noButton.style.justifyContent = 'center';
          noButton.style.alignItems = 'center';
          noButton.style.flex = '1 0 0';
          noButton.style.borderRadius = '18px';
          noButton.style.border = '1.5px solid var(--stroke-25-button, rgba(255, 255, 255, 0.40))';
          noButton.style.background = 'rgba(255, 255, 255, 0.10)';
          noButton.style.boxShadow = '0px 0px 30px 0px rgba(0, 0, 0, 0.20), 0px 0px 12px 0px rgba(255, 255, 255, 0.03)';
          noButton.style.backdropFilter = 'blur(100px)';
          noButton.style.color = '#FFF';
          noButton.style.textAlign = 'center';
          noButton.style.fontSize = '18px';
          noButton.style.fontStyle = 'normal';
          noButton.style.fontWeight = '600';
          noButton.style.lineHeight = '20px';
          noButton.style.cursor = 'pointer';
          buttonContainer.appendChild(noButton);
  
          const yesButton = document.createElement('button');
          yesButton.textContent = 'OK';
          yesButton.style.display = 'flex';
          yesButton.style.height = '48px';
          yesButton.style.padding = '16px 32px';
          yesButton.style.justifyContent = 'center';
          yesButton.style.alignItems = 'center';
          yesButton.style.flex = '1 0 0';
          yesButton.style.borderRadius = '18px';
          yesButton.style.border = '1.5px solid var(--stroke-25-button, rgba(255, 255, 255, 0.40))';
          yesButton.style.background = 'var(--neutral-neutral-130, rgba(255, 255, 255, 0.30))';
          yesButton.style.boxShadow = '0px 0px 30px 0px rgba(0, 0, 0, 0.20), 0px 0px 12px 0px rgba(255, 255, 255, 0.03)';
          yesButton.style.backdropFilter = 'blur(100px)';
          yesButton.style.color = '#FFF';
          yesButton.style.textAlign = 'center';
          yesButton.style.fontSize = '18px';
          yesButton.style.fontStyle = 'normal';
          yesButton.style.fontWeight = '600';
          yesButton.style.lineHeight = '20px';
          yesButton.style.cursor = 'pointer';
          buttonContainer.appendChild(yesButton);

          popup.appendChild(buttonContainer);
  
          chatRoot.appendChild(popup);
  
          return new Promise((resolve) => {
            yesButton.addEventListener('click', () => {
              chatRoot.removeChild(popup);
              resolve(true);
            });
            noButton.addEventListener('click', () => {
              chatRoot.removeChild(popup);
              resolve(false);
            });
          });
        })();
      `,
      awaitPromise: true
    });
  
    return result.result.value as boolean;
  }

  async function askForUpdate(tabId: number): Promise<string> {
    const result = await executeCommand(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const chatRoot = document.getElementById('aum-automation-chat-root');
          if (!chatRoot) throw new Error('Chat root not found');

          const existingPopup = document.getElementById('update-popup-overlay');
          if (existingPopup) {
            chatRoot.removeChild(existingPopup);
          }

          // Create the overlay
          const overlay = document.createElement('div');
          overlay.className = 'update-popup-overlay';
          overlay.style.position = 'absolute';
          overlay.style.top = '50%';
          overlay.style.left = '50%';
          overlay.style.transform = 'translate(-50%, -50%)';
          overlay.style.display = 'inline-flex';
          overlay.style.width = 'fit-content';
          overlay.style.height = 'fit-content';
          overlay.style.flexDirection = 'column';
          overlay.style.alignItems = 'flex-start';
          overlay.style.padding = '24px';
          overlay.style.flexShrink = '0';
          overlay.style.borderRadius = '32px 32px 48px 48px';
          overlay.style.background = 'rgba(64, 64, 64, 0.65)';
          overlay.style.border = '1px rgba(255, 255, 255, 0.09)';
          overlay.style.boxShadow = '0px 1px 2px 0px var(--Colors-Effects-Shadows-shadow-xs, rgba(16, 24, 40, 0.05))';
          overlay.style.backdropFilter = 'blur(20px)';
          overlay.style.zIndex = '10000';
          overlay.style.pointerEvents = 'auto';

          //create close button container
          const closeContainer = document.createElement('div');
          closeContainer.style.position = 'absolute';
          closeContainer.style.top = '0px';
          closeContainer.style.right = '0px';
          closeContainer.style.width = '54px';
          closeContainer.style.height = '54px';
          closeContainer.style.display = 'flex';
          closeContainer.style.justifyContent = 'center';
          closeContainer.style.alignItems = 'center';
          closeContainer.style.borderRadius = '0px 32px';
          closeContainer.style.background = 'rgba(255, 255, 255, 0.30)';
          closeContainer.style.boxShadow = '0px 0px 12px 0px rgba(255, 255, 255, 0.03) inset, 0px 8px 30px 0px rgba(0, 0, 0, 0.41)';
          closeContainer.style.backdropFilter = 'blur(100px)';
          closeContainer.style.cursor = 'pointer';
          closeContainer.style.zIndex = '10001';

          // Create close button
          const closeButton = document.createElement('img');
          closeButton.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMTUuNjE2MSAwLjM2Nzg3N0MxNS4xMjU2IC0wLjEyMjYyNiAxNC4zMTUyIC0wLjEyMjYyNiAxMy44MDM0IDAuMzY3ODc3TDguMDAyNjcgNi4xNjg2MUwyLjE4MDYxIDAuMzY3ODc3QzEuNjkwMSAtMC4xMjI2MjYgMC44Nzk3MDcgLTAuMTIyNjI2IDAuMzY3ODc3IDAuMzY3ODc3Qy0wLjEyMjYyNiAwLjg1ODM4IC0wLjEyMjYyNiAxLjY2ODc4IDAuMzY3ODc3IDIuMTgwNjFMNi4xODk5NCA3Ljk4MTM0TDAuMzg5MjA0IDEzLjgwMzRDLTAuMTAxMyAxNC4yOTM5IC0wLjEwMTMgMTUuMTA0MyAwLjM4OTIwNCAxNS42MTYxQzAuNjQ1MTE4IDE1Ljg3MiAwLjk2NTAxMiAxNiAxLjI4NDkxIDE2QzEuNjA0OCAxNiAxLjk0NjAyIDE1Ljg3MiAyLjE4MDYxIDE1LjYxNjFMOC4wMDI2NyA5Ljc5NDA3TDEzLjgyNDcgMTUuNjE2MUMxNC4wODA2IDE1Ljg3MiAxNC40MDA1IDE2IDE0LjcyMDQgMTZDMTUuMDQwMyAxNiAxNS4zODE1IDE1Ljg3MiAxNS42MTYxIDE1LjYxNjFDMTYuMTA2NiAxNS4xMjU2IDE2LjEwNjYgMTQuMzE1MiAxNS42MTYxIDEzLjgwMzRMOS44MTU0IDcuOTgxMzRMMTUuNjM3NSAyLjE1OTI4QzE2LjEyOCAxLjY2ODc4IDE2LjEyOCAwLjg1ODM4IDE1LjYxNjEgMC4zNjc4NzdaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPC9zdmc+';
          closeButton.style.width = '16px';
          closeButton.style.height = '16px';

          closeContainer.addEventListener('click', () => {
              chatRoot.removeChild(overlay);
              resolve('');
          });

          closeContainer.appendChild(closeButton);

          overlay.appendChild(closeContainer);

          const titleContainer = document.createElement('div');
          titleContainer.style.display = 'flex';
          titleContainer.style.alignItems = 'center';
          titleContainer.style.gap = '8px';

          const icon = document.createElement('img');
          icon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMTIgMS44NzVDOS45OTc0NyAxLjg3NSA4LjAzOTkgMi40Njg4MiA2LjM3NDg2IDMuNTgxMzdDNC43MDk4MSA0LjY5MzkyIDMuNDEyMDYgNi4yNzUyMyAyLjY0NTcyIDguMTI1MzNDMS44NzkzOSA5Ljk3NTQzIDEuNjc4ODggMTIuMDExMiAyLjA2OTU1IDEzLjk3NTNDMi40NjAyMyAxNS45MzkzIDMuNDI0NTQgMTcuNzQzNSA0Ljg0MDU1IDE5LjE1OTVDNi4yNTY1NiAyMC41NzU1IDguMDYwNjYgMjEuNTM5OCAxMC4wMjQ3IDIxLjkzMDVDMTEuOTg4OCAyMi4zMjExIDE0LjAyNDYgMjIuMTIwNiAxNS44NzQ3IDIxLjM1NDNDMTcuNzI0OCAyMC41ODc5IDE5LjMwNjEgMTkuMjkwMiAyMC40MTg2IDE3LjYyNTFDMjEuNTMxMiAxNS45NjAxIDIyLjEyNSAxNC4wMDI1IDIyLjEyNSAxMkMyMi4xMjIgOS4zMTU2IDIxLjA1NDMgNi43NDE5OSAxOS4xNTYyIDQuODQzODNDMTcuMjU4IDIuOTQ1NjcgMTQuNjg0NCAxLjg3Nzk4IDEyIDEuODc1Wk0xMiAxOS44NzVDMTAuNDQyNSAxOS44NzUgOC45MTk5MyAxOS40MTMxIDcuNjI0ODkgMTguNTQ3OEM2LjMyOTg1IDE3LjY4MjUgNS4zMjA0OSAxNi40NTI2IDQuNzI0NDUgMTUuMDEzNkM0LjEyODQxIDEzLjU3NDcgMy45NzI0NiAxMS45OTEzIDQuMjc2MzIgMTAuNDYzN0M0LjU4MDE4IDguOTM2MDYgNS4zMzAyIDcuNTMyODcgNi40MzE1NCA2LjQzMTUzQzcuNTMyODggNS4zMzAyIDguOTM2MDcgNC41ODAxNyAxMC40NjM3IDQuMjc2MzJDMTEuOTkxMyAzLjk3MjQ2IDEzLjU3NDcgNC4xMjg0MSAxNS4wMTM2IDQuNzI0NDVDMTYuNDUyNiA1LjMyMDQ5IDE3LjY4MjUgNi4zMjk4NSAxOC41NDc4IDcuNjI0ODhDMTkuNDEzMSA4LjkxOTkyIDE5Ljg3NSAxMC40NDI1IDE5Ljg3NSAxMkMxOS44NzI4IDE0LjA4NzkgMTkuMDQyNCAxNi4wODk2IDE3LjU2NiAxNy41NjZDMTYuMDg5NiAxOS4wNDI0IDE0LjA4NzkgMTkuODcyOCAxMiAxOS44NzVaTTEwLjg3NSAxMi4zNzVWNy41QzEwLjg3NSA3LjIwMTYzIDEwLjk5MzUgNi45MTU0OCAxMS4yMDQ1IDYuNzA0NUMxMS40MTU1IDYuNDkzNTMgMTEuNzAxNiA2LjM3NSAxMiA2LjM3NUMxMi4yOTg0IDYuMzc1IDEyLjU4NDUgNi40OTM1MyAxMi43OTU1IDYuNzA0NUMxMy4wMDY1IDYuOTE1NDggMTMuMTI1IDcuMjAxNjMgMTMuMTI1IDcuNVYxMi4zNzVDMTMuMTI1IDEyLjY3MzQgMTMuMDA2NSAxMi45NTk1IDEyLjc5NTUgMTMuMTcwNUMxMi41ODQ1IDEzLjM4MTUgMTIuMjk4NCAxMy41IDEyIDEzLjVDMTEuNzAxNiAxMy41IDExLjQxNTUgMTMuMzgxNSAxMS4yMDQ1IDEzLjE3MDVDMTAuOTkzNSAxMi45NTk1IDEwLjg3NSAxMi42NzM0IDEwLjg3NSAxMi4zNzVaTTEzLjUgMTYuMTI1QzEzLjUgMTYuNDIxNyAxMy40MTIgMTYuNzExNyAxMy4yNDcyIDE2Ljk1ODRDMTMuMDgyNCAxNy4yMDUgMTIuODQ4MSAxNy4zOTczIDEyLjU3NCAxNy41MTA4QzEyLjI5OTkgMTcuNjI0NCAxMS45OTgzIDE3LjY1NDEgMTEuNzA3NCAxNy41OTYyQzExLjQxNjQgMTcuNTM4MyAxMS4xNDkxIDE3LjM5NTQgMTAuOTM5MyAxNy4xODU3QzEwLjcyOTYgMTYuOTc1OSAxMC41ODY3IDE2LjcwODYgMTAuNTI4OCAxNi40MTc2QzEwLjQ3MDkgMTYuMTI2NyAxMC41MDA3IDE1LjgyNTEgMTAuNjE0MiAxNS41NTFDMTAuNzI3NyAxNS4yNzY5IDEwLjkyIDE1LjA0MjYgMTEuMTY2NiAxNC44Nzc4QzExLjQxMzMgMTQuNzEzIDExLjcwMzMgMTQuNjI1IDEyIDE0LjYyNUMxMi4zOTc4IDE0LjYyNSAxMi43Nzk0IDE0Ljc4MyAxMy4wNjA3IDE1LjA2NDNDMTMuMzQyIDE1LjM0NTYgMTMuNSAxNS43MjcyIDEzLjUgMTYuMTI1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
          icon.style.width = '24px';
          icon.style.height = '24px';
          titleContainer.appendChild(icon);

          // Create title
          const messageTitle = document.createElement('p');
          messageTitle.textContent = 'AI Impovements';
          messageTitle.style.color = '#FFF';
          messageTitle.style.fontSize = '20px';
          messageTitle.style.fontStyle = 'normal';
          messageTitle.style.fontWeight = '600';
          messageTitle.style.lineHeight = '1.4';
          messageTitle.style.margin = '0';
          titleContainer.appendChild(messageTitle);

          overlay.appendChild(titleContainer);

          // Create message
          const messageElem = document.createElement('p');
          messageElem.textContent = 'Would you like to make any improvements or edits?';
          messageElem.style.color = 'rgba(255, 255, 255, 0.90)';
          messageElem.style.height = '48px';
          messageElem.style.margin = '0';
          messageElem.style.fontSize = '16px';
          messageElem.style.fontStyle = 'normal';
          messageElem.style.fontWeight = '400';
          messageElem.style.lineHeight = '24px';

          overlay.appendChild(messageElem);

          // Create input container
          const inputContainer = document.createElement('div');
          inputContainer.style.display = 'flex';
          inputContainer.style.alignItems = 'center';
          inputContainer.style.padding = '8px';
          inputContainer.style.width = '640px';
          inputContainer.style.gap = '16px'
          inputContainer.style.borderRadius = '100px';
          inputContainer.style.background = 'rgba(0, 0, 0, 0.40)';
          inputContainer.style.boxShadow = '0px 0px 0px 0px var(--Colors-Effects-Shadows-shadow-xs, rgba(16, 24, 40, 0.05))';
          inputContainer.style.backdropFilter = 'blur(25px)';

          // Create mic button
          const micButton = document.createElement('div');
          micButton.style.display = 'flex';
          micButton.style.width = '64px';
          micButton.style.height = '64px';
          micButton.style.alignItems = 'center';
          micButton.style.justifyContent = 'center';
          micButton.style.borderRadius = '100px';
          micButton.style.border = '1px solid rgba(255, 255, 255, 0.10)';
          micButton.style.background = 'rgba(255, 255, 255, 0.20)';
          micButton.style.boxShadow = '0px 0px 12px 0px rgba(255, 255, 255, 0.03) inset, 0px 8px 30px 0px rgba(0, 0, 0, 0.41)';
          micButton.style.backdropFilter = 'blur(100px)';
          micButton.style.cursor = 'pointer';

          const micIcon = document.createElement('img');
          micIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIj4KICA8ZyBvcGFjaXR5PSIwLjgiPgogICAgPHBhdGggZD0iTTE2IDIyQzE3LjU5MDggMjEuOTk4MyAxOS4xMTYgMjEuMzY1NyAyMC4yNDA4IDIwLjI0MDhDMjEuMzY1NyAxOS4xMTYgMjEuOTk4MyAxNy41OTA4IDIyIDE2VjhDMjIgNi40MDg3IDIxLjM2NzkgNC44ODI1OCAyMC4yNDI2IDMuNzU3MzZDMTkuMTE3NCAyLjYzMjE0IDE3LjU5MTMgMiAxNiAyQzE0LjQwODcgMiAxMi44ODI2IDIuNjMyMTQgMTEuNzU3NCAzLjc1NzM2QzEwLjYzMjEgNC44ODI1OCAxMCA2LjQwODcgMTAgOFYxNkMxMC4wMDE3IDE3LjU5MDggMTAuNjM0MyAxOS4xMTYgMTEuNzU5MiAyMC4yNDA4QzEyLjg4NCAyMS4zNjU3IDE0LjQwOTIgMjEuOTk4MyAxNiAyMlpNMTIgOEMxMiA2LjkzOTEzIDEyLjQyMTQgNS45MjE3MiAxMy4xNzE2IDUuMTcxNTdDMTMuOTIxNyA0LjQyMTQzIDE0LjkzOTEgNCAxNiA0QzE3LjA2MDkgNCAxOC4wNzgzIDQuNDIxNDMgMTguODI4NCA1LjE3MTU3QzE5LjU3ODYgNS45MjE3MiAyMCA2LjkzOTEzIDIwIDhWMTZDMjAgMTcuMDYwOSAxOS41Nzg2IDE4LjA3ODMgMTguODI4NCAxOC44Mjg0QzE4LjA3ODMgMTkuNTc4NiAxNy4wNjA5IDIwIDE2IDIwQzE0LjkzOTEgMjAgMTMuOTIxNyAxOS41Nzg2IDEzLjE3MTYgMTguODI4NEMxMi40MjE0IDE4LjA3ODMgMTIgMTcuMDYwOSAxMiAxNlY4Wk0xNyAyNS45NVYzMEMxNyAzMC4yNjUyIDE2Ljg5NDYgMzAuNTE5NiAxNi43MDcxIDMwLjcwNzFDMTYuNTE5NiAzMC44OTQ2IDE2LjI2NTIgMzEgMTYgMzFDMTUuNzM0OCAzMSAxNS40ODA0IDMwLjg5NDYgMTUuMjkyOSAzMC43MDcxQzE1LjEwNTQgMzAuNTE5NiAxNSAzMC4yNjUyIDE1IDMwVjI1Ljk1QzEyLjUzNDYgMjUuNjk5MSAxMC4yNDk3IDI0LjU0MyA4LjU4NzMgMjIuNzA1MUM2LjkyNDkgMjAuODY3MiA2LjAwMzA1IDE4LjQ3ODIgNiAxNkM2IDE1LjczNDggNi4xMDUzNiAxNS40ODA0IDYuMjkyODkgMTUuMjkyOUM2LjQ4MDQzIDE1LjEwNTQgNi43MzQ3OCAxNSA3IDE1QzcuMjY1MjIgMTUgNy41MTk1NyAxNS4xMDU0IDcuNzA3MTEgMTUuMjkyOUM3Ljg5NDY0IDE1LjQ4MDQgOCAxNS43MzQ4IDggMTZDOCAxOC4xMjE3IDguODQyODUgMjAuMTU2NiAxMC4zNDMxIDIxLjY1NjlDMTEuODQzNCAyMy4xNTcxIDEzLjg3ODMgMjQgMTYgMjRDMTguMTIxNyAyNCAyMC4xNTY2IDIzLjE1NzEgMjEuNjU2OSAyMS42NTY5QzIzLjE1NzEgMjAuMTU2NiAyNCAxOC4xMjE3IDI0IDE2QzI0IDE1LjczNDggMjQuMTA1NCAxNS40ODA0IDI0LjI5MjkgMTUuMjkyOUMyNC40ODA0IDE1LjEwNTQgMjQuNzM0OCAxNSAyNSAxNUMyNS4yNjUyIDE1IDI1LjUxOTYgMTUuMTA1NCAyNS43MDcxIDE1LjI5MjlDMjUuODk0NiAxNS40ODA0IDI2IDE1LjczNDggMjYgMTZDMjUuOTk3IDE4LjQ3ODIgMjUuMDc1MSAyMC44NjcyIDIzLjQxMjcgMjIuNzA1MUMyMS43NTAzIDI0LjU0MyAxOS40NjU0IDI1LjY5OTEgMTcgMjUuOTVaIiBmaWxsPSJ3aGl0ZSIvPgogIDwvZz4KPC9zdmc+';
          micIcon.style.width = '32px';
          micIcon.style.height = '32px';
          micButton.appendChild(micIcon);

          inputContainer.appendChild(micButton);

          // Create input field
          const input = document.createElement('input');
          input.type = 'text';
          input.id = 'update-input';
          input.placeholder = 'Enter your command here...';
          input.autofocus = true;
          input.style.flex = '1 1 0';
          input.style.fontSize = '20px';
          input.style.color = '#FFF';
          input.style.fontFamily = 'Arial, sans-serif';
          input.style.fontStyle = 'normal';
          input.style.fontWeight = '200';
          input.style.lineHeight = '28px';
          input.style.background = 'transparent';
          input.style.border = 'none';
          input.style.outline = 'none';
          input.style.placeholder = 'white';

          inputContainer.appendChild(input);

          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.continuous = false;
          recognition.interimResults = false;

          micButton.addEventListener('click', () => {
              recognition.start();
              micButton.style.background = '#30D158';
          });

          recognition.onend = () => {
              micButton.style.background = 'rgba(255, 255, 255, 0.20)';
          };

          recognition.onerror = (event) => {
              micButton.style.background = 'rgba(255, 255, 255, 0.20)';
              console.error('Speech recognition error: ', event.error);
          };

          recognition.onresult = (event) => {
              micButton.style.background = 'rgba(255, 255, 255, 0.20)';
              const transcript = event.results[0][0].transcript;
              input.value = transcript;

              setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13, // Enter key code
                    which: 13,
                    bubbles: true
                });
                input.dispatchEvent(enterEvent);
              }, 2000);
          };

          overlay.appendChild(inputContainer);

          // Add overlay to the chat root
          chatRoot.appendChild(overlay);

          // Wait for input and return it
          return new Promise((resolve) => {
              input.addEventListener('keydown', function(event) {
                  if (event.key === 'Enter') {
                      const userInput = input.value;
                      if (userInput !== '') {
                          chatRoot.removeChild(overlay);
                          resolve(userInput);
                      }
                  }
              });
          });
      })();
      `,
      awaitPromise: true
    });
  
    return result.result.value as string;
  }

  export { executeCommand, wait, attachDebugger, detachDebugger, askForConfirmation, askForUpdate };