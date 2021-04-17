/// <reference types="@types/chrome" />

const oldOpen = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof oldOpen>) {
  const [, url] = args;
  const { pathname } = new URL(url);
  if (pathname === '/i/api/2/timeline/home.json') {
    console.log('got timeline request');
  } else {
    console.log(args);
  }
  return oldOpen.apply(this, args);
} as typeof oldOpen;
