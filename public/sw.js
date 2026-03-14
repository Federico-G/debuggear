var CACHE_VERSION = 'v1.2.1';
var CACHE_NAME = 'debuggear-' + CACHE_VERSION;

// Precached on SW install — just the entry points.
var PRECACHE = [
	'/',
	'/index.html',
	'/sql.html'
];

// Precached when user clicks "Instalar" — everything needed for full offline.
// Resources already cached dynamically (CSS, JS from script tags, fonts used
// by the browser) don't need to be here, but including them is harmless and
// guarantees nothing is missed.
var LAZY_PRECACHE = [
	// HTML
	'/index.html',
	'/sql.html',

	// CSS
	'/css/bootstrap.min.css',
	'/css/font-awesome.min.css',
	'/css/main.css',

	// Vendor JS
	'/js/jquery.min.js',
	'/js/lodash.min.js',
	'/js/bootstrap.bundle.min.js',
	'/js/interact.min.js',
	'/js/compressor.min.js',
	'/js/nearley.js',
	'/js/tf.min.js',
	'/js/tf-automl.min.js',
	'/tf.js',

	// App JS
	'/js/main.js',
	'/js/interact-init.js',
	'/js/shape.js',
	'/js/menu.js',
	'/js/step.js',
	'/js/code/Console.js',
	'/js/code/Node.js',
	'/js/code/Step.js',
	'/js/code/Symbol.js',
	'/js/code/SymbolTable.js',
	'/js/code/Tree.js',

	// C language
	'/js/language/c/bnf.js',
	'/js/language/c/solver.js',
	'/js/language/c/to-code.js',
	'/js/language/c/validation.js',

	// C compiler (Web Worker — not loaded by script tags)
	'/js/language/c/wcc-worker.js',
	'/js/language/c/wcc-memfs.js',
	'/js/language/c/wcc-wasi.js',
	'/js/language/c/wccfiles.bin',

	// SQL module
	'/sql/codemirror.js',
	'/sql/codemirror-sql.js',
	'/sql/codemirror.css',
	'/sql/faker.min.js',
	'/sql/main.js',
	'/sql/menu.js',
	'/sql/step.js',
	'/sql/types.js',
	'/sql/sql-wasm.js',
	'/sql/sql-wasm.wasm',
	'/sql/worker.sql-wasm.js',

	// TF model (shape detection)
	'/model.json',
	'/dict.txt',
	'/group1-shard1of5.bin',
	'/group1-shard2of5.bin',
	'/group1-shard3of5.bin',
	'/group1-shard4of5.bin',
	'/group1-shard5of5.bin',

	// Fonts
	'/fonts/fontawesome-webfont.woff2',
	'/fonts/fontawesome-webfont.woff',
	'/fonts/fontawesome-webfont.ttf',

	// Images
	'/image/white-icon.svg',
	'/image/black-icon.svg',
	'/image/algo1.jpg',
	'/image/algo2.jpg',
	'/image/der1.jpg',
	'/image/der2.jpg',

	// PWA assets
	'/manifest.json',
	'/favicon.ico',
	'/favicon-16x16.png',
	'/favicon-32x32.png',
	'/apple-touch-icon.png',
	'/android-chrome-192x192.png',
	'/android-chrome-512x512.png',
	'/safari-pinned-tab.svg',
	'/mstile-150x150.png'
];

// Install: precache entry points, take over immediately
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function(cache) { return cache.addAll(PRECACHE); })
			.then(function() { return self.skipWaiting(); })
	);
});

// Activate: delete old caches, claim all clients immediately
self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(names) {
			return Promise.all(
				names
					.filter(function(name) { return name !== CACHE_NAME; })
					.map(function(name) { return caches.delete(name); })
			);
		}).then(function() { return self.clients.claim(); })
	);
});

// Message from main thread: cache all resources for full offline (PWA install)
self.addEventListener('message', function(event) {
	if (event.data && event.data.action === 'precache-lazy') {
		caches.open(CACHE_NAME).then(function(cache) {
			return cache.addAll(LAZY_PRECACHE);
		});
	}
});

// Fetch: network-first for same-origin, cache every successful response.
// External requests (CDN, Cloud Functions) are network-only.
self.addEventListener('fetch', function(event) {
	var url = new URL(event.request.url);

	if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		fetch(event.request).then(function(response) {
			if (response.ok) {
				var copy = response.clone();
				caches.open(CACHE_NAME).then(function(cache) {
					cache.put(event.request, copy);
				});
			}
			return response;
		}).catch(function() {
			return caches.match(event.request);
		})
	);
});
