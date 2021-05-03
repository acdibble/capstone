const port = chrome.runtime.connect({ name: 'popup' });

document.getElementById('reset-button')?.addEventListener('click', () => port.postMessage({ action: 'reset' }));

export {};
