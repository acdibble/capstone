const s = document.createElement('script');
s.id = 'extension-script-tag';
s.lang = 'javascript';
s.src = chrome.extension.getURL('dist/script.js');
document.documentElement.appendChild(s);

const port = chrome.runtime.connect(chrome.runtime.id, { name: 'inject' });

port.onMessage.addListener((message: unknown) => {
  s.dispatchEvent(new CustomEvent('classified', { detail: message }));
});

s.addEventListener('classify', ((message: CustomEvent) => {
  port.postMessage(message.detail);
}) as EventListener);
