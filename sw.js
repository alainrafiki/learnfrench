// sw.js — basic offline cache
const CACHE = 'fr-k12-cache-v1';
const CORE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './activities.js',
  './storage.js',
  './manifest.webmanifest',
  './data/lessons_index.json'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(CORE)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // Network-first for lesson JSON; cache-first for core
  if(url.pathname.includes('/data/')){
    e.respondWith(fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=> c.put(e.request, copy));
      return res;
    }).catch(()=> caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
  }
});
