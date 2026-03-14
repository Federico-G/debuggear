// wcc-worker.js — Web Worker: compiles and runs C code using xcc (WASM)
// xcc: https://github.com/tyfkda/xcc (MIT License)
//
// Architecture:
//   1. Loads compiler files from a binary bundle (wccfiles.bin)
//   2. Mounts them in a virtual filesystem (MemFS)
//   3. Runs xcc (cc.wasm) via WASI to compile C → WASM
//   4. Runs the compiled WASM to capture stdout
//
// Dependencies (loaded via importScripts):
//   - wcc-memfs.js: In-memory virtual filesystem
//   - wcc-wasi.js:  WASI Preview 1 implementation

importScripts('/js/language/c/wcc-memfs.js', '/js/language/c/wcc-wasi.js');

// ==================== Bundle Reader ====================
// Format: [count:u32] per file: [pathLen:u32][path:utf8][dataLen:u32][data:bytes]
// HTTP Content-Encoding handles compression — no JS decompression needed.

function unpackBundle(buffer) {
	var view = new DataView(buffer);
	var decoder = new TextDecoder();
	var files = {};
	var offset = 0;

	var count = view.getUint32(offset, true); offset += 4;
	for (var i = 0; i < count; i++) {
		var nameLen = view.getUint32(offset, true); offset += 4;
		var name = decoder.decode(new Uint8Array(buffer, offset, nameLen)); offset += nameLen;
		var dataLen = view.getUint32(offset, true); offset += 4;
		files[name] = new Uint8Array(buffer, offset, dataLen).slice(); offset += dataLen;
	}

	return files;
}

// ==================== Compiler ====================

var compilerModule = null;  // Pre-compiled WebAssembly.Module for cc.wasm
var baseFs = null;          // Base FS with compiler files (cloned per run)

async function initialize() {
	var resp = await fetch('/js/language/c/wccfiles.bin');
	var buffer = await resp.arrayBuffer();
	var files = unpackBundle(buffer);

	baseFs = new MemFS();
	for (var name in files) {
		baseFs.writeFile('/' + name, files[name]);
	}
	baseFs.dirs['/home'] = true;

	var ccWasm = baseFs.readFile('/usr/bin/cc');
	compilerModule = await WebAssembly.compile(ccWasm);
}

function runWasi(wasmModule, fs, args) {
	var wasi = new WasiPreview1(fs, args, [
		{ guestPath: '/', hostPath: '/' },
		{ guestPath: '.', hostPath: '/home' }
	]);

	var imports = wasi.getImports();
	imports.wasi_snapshot_preview1 = new Proxy(imports.wasi_snapshot_preview1, {
		get: function(target, prop) {
			return prop in target ? target[prop] : function() { return WASI_ENOSYS; };
		}
	});

	return WebAssembly.instantiate(wasmModule, imports).then(function(instance) {
		wasi.setInstance(instance);
		try {
			instance.exports._start();
		} catch (e) {
			if (!(e instanceof WasiExit)) throw e;
			if (e.code !== 0) {
				return { exitCode: e.code, stdout: wasi.stdout, stderr: wasi.stderr };
			}
		}
		return { exitCode: 0, stdout: wasi.stdout, stderr: wasi.stderr };
	});
}

async function compileAndRun(cCode) {
	var fs = baseFs.clone();
	fs.writeFile('/home/main.c', cCode);

	// Step 1: Compile C → WASM
	var compileResult = await runWasi(compilerModule, fs, ['/usr/bin/cc', 'main.c', '-o', 'a.wasm']);
	if (compileResult.exitCode !== 0) {
		return { error: compileResult.stderr || compileResult.stdout || 'Compilation failed' };
	}

	// Step 2: Run the compiled program
	var outputWasm = fs.readFile('/home/a.wasm');
	if (!outputWasm) {
		return { error: 'Compiler did not produce output' };
	}
	var userModule = await WebAssembly.compile(outputWasm);
	var runResult = await runWasi(userModule, fs, ['a.wasm']);

	return { stdout: runResult.stdout, stderr: runResult.stderr, exitCode: runResult.exitCode };
}

// ==================== Message Handler ====================

var initPromise = null;

self.onmessage = async function(e) {
	var data = e.data;

	if (data.action === 'init') {
		try {
			initPromise = initialize();
			await initPromise;
			self.postMessage({ action: 'ready' });
		} catch (err) {
			self.postMessage({ action: 'error', message: 'Init failed: ' + err.message });
		}
		return;
	}

	if (data.action === 'solve') {
		try {
			if (!initPromise) initPromise = initialize();
			await initPromise;

			var result = await compileAndRun(data.code);
			self.postMessage({
				action: 'result',
				id: data.id,
				stdout: result.stdout || '',
				stderr: result.stderr || '',
				error: result.error || null
			});
		} catch (err) {
			self.postMessage({
				action: 'result',
				id: data.id,
				error: err.message || 'Unknown error'
			});
		}
	}
};
