const CACHE_NAME = 'pba-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data/pokemon_cardDB.json',
  './img/icons/icon-192x192.png',
  './img/icons/icon-512x512.png',
  './img/pokemon/bulbasaur.png',
  './img/pokemon/charmander.png',
  './img/pokemon/pikachu.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
