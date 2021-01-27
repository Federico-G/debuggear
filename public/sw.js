const cacheName = 'Cache v1.0.0-alpha1';
const resourcesToPrecache = [
	'/',
	'index.html',
	'favicon.ico',
	'dict.txt',
	'model.json',
	'group1-shard1of2.bin',
	'group1-shard2of2.bin',

	'css/font-awesome.min.css',
	'css/bootstrap.min.css',
	'css/main.css',

	'js/bootstrap.bundle.min.js',
	'js/compressor.min.js',
	'js/interact.min.js',
	'js/interact-init.js',
	'js/jquery.min.js',
	'js/main.js',
	'js/menu.js',
	'js/nearley.js',
	'js/shape.js',
	'js/step.js',
	'js/tf.min.js',
	'js/tf-automl.min.js',
	'js/code/Console.js',
	'js/code/Node.js',
	'js/code/Step.js',
	'js/code/Symbol.js',
	'js/code/SymbolTable.js',
	'js/code/Tree.js',
	'js/language/c/bnf.js',
	'js/language/c/solver.js',
	'js/language/c/to-code.js',
	'js/language/c/validation.js',

	'fonts/fontawesome-webfont.woff2',

	'image/white-icon.svg'
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