const cacheName = 'Cache v0.3.5';
const resourcesToPrecache = [
	'/',
	'index.html',
	'favicon.ico',
	'css/font-awesome.min.css',
	'css/bootstrap.min.css',
	'css/main.css',
	'fonts/fontawesome-webfont.woff2',
	'image/white-icon.svg',
	'js/jquery.min.js',
	'js/bootstrap.bundle.min.js',
	'js/interact.min.js',
	'js/interact-init.js',
	'js/main.js',
	'js/shape.js',
	'js/menu.js',
	'js/step.js',
	'js/code/code.js',
	'js/tf-automl.min.js',
	'js/tf.min.js',
	'js/compressor.min.js',
	'tf.js',
	'dict.txt',
	'model.json',
	'group1-shard1of2.bin',
	'group1-shard2of2.bin'
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(cacheName).then(cache => cache.addAll(resourcesToPrecache))
	);
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(cachedResponse => cachedResponse || fetch(event.request))
	);
});
