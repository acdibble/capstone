const s = document.createElement('script');
s.lang = 'javascript';
s.src = chrome.extension.getURL('dist/script.js');
document.documentElement.appendChild(s);
