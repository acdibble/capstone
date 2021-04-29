const port = chrome.runtime.connect({ name: 'popup' });

document.getElementById('reset-button')!.onclick = () => port.postMessage({ action: 'reset' });

export {};
