const s = document.createElement('script');
s.id = 'extension-script-tag';
s.lang = 'javascript';
s.src = chrome.extension.getURL('dist/script.js');
document.documentElement.appendChild(s);

const port = chrome.runtime.connect(chrome.runtime.id);

port.onMessage.addListener((message: unknown) => {
  console.log('forwarding message back to web page', message);
  s.dispatchEvent(new CustomEvent('classified', { detail: message }));
});

s.addEventListener('classify', ((message: CustomEvent) => {
  console.log('forwarding message to port', message);
  port.postMessage(message.detail);
}) as EventListener);
