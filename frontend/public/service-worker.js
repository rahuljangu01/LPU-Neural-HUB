// Version ko v1 se v2 kar diya taaki browser ko pata chale kuch badla hai
const CACHE_NAME = "lpu-hub-v2";

// 1. Install Event: Naya Service Worker aate hi purane ko dhakka dekar hatane ki taiyari
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Purane worker ka wait mat karo, turant active ho jao
});

// 2. Activate Event: Purane version ka kachra (old cache) saaf karo
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("LPU HUB: Clearing Old Cache...");
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Sabhi tabs ka control turant le lo
  );
});

// 3. Fetch Event: "Network-First" Strategy
self.addEventListener("fetch", (event) => {
  // Sirf GET requests ko cache karein (API calls ko bypass karne ke liye aap filter bhi laga sakte hain)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Agar internet chal raha hai, toh naya data cache mein save karo aur dikhao
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Agar internet nahi hai, sirf tabhi saved (cache) file dikhao
        return caches.match(event.request);
      })
  );
});