const CACHE_NAME = "herb-pwa-shell-v1";
const RUNTIME_CACHE = "herb-pwa-runtime-v1";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
    OFFLINE_URL,
    "/login",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/js/core/pwa.js",
    "/js/core/page-loader.js"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .catch(() => null)
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

function isStaticAsset(pathname) {
    return /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/i.test(pathname);
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        return (await caches.match(OFFLINE_URL)) || Response.error();
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        fetch(request)
            .then(async (fresh) => {
                const cache = await caches.open(RUNTIME_CACHE);
                cache.put(request, fresh);
            })
            .catch(() => null);
        return cached;
    }

    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        return (await caches.match(OFFLINE_URL)) || Response.error();
    }
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io/")) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.pathname === "/manifest.webmanifest" || isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
    }
});
