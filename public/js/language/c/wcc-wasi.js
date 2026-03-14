// wcc-wasi.js — WASI Preview 1 implementation for browser Web Workers
// Spec: https://github.com/WebAssembly/WASI (wasi_snapshot_preview1)
// Only the 14 functions that cc.wasm actually imports are implemented.
// Any other import is auto-stubbed via Proxy (see wcc-worker.js).
//
// Depends on: MemFS (wcc-memfs.js)

// WASI error codes
var WASI_SUCCESS = 0;
var WASI_EBADF   = 8;
var WASI_EINVAL  = 28;
var WASI_ENOENT  = 44;
var WASI_ENOSYS  = 52;

// Thrown by proc_exit to halt WASM execution
function WasiExit(code) {
	this.code = code;
}

// --- Constructor ---

function WasiPreview1(fs, args, preopens) {
	this.fs = fs;
	this.args = args || [];
	this.preopens = preopens || [];
	this.instance = null;
	this.stdout = '';
	this.stderr = '';

	// File descriptor table: 0=stdin, 1=stdout, 2=stderr, 3+=preopens/files
	this.fds = {};
	this.fds[0] = { type: 'stdin' };
	this.fds[1] = { type: 'stdout' };
	this.fds[2] = { type: 'stderr' };
	this.nextFd = 3;
	for (var i = 0; i < this.preopens.length; i++) {
		this.fds[this.nextFd++] = {
			type: 'preopen',
			guestPath: this.preopens[i].guestPath,
			hostPath: this.preopens[i].hostPath
		};
	}
}

// --- WASM memory helpers ---

WasiPreview1.prototype.setInstance = function(instance) {
	this.instance = instance;
};

WasiPreview1.prototype._view = function() {
	return new DataView(this.instance.exports.memory.buffer);
};

WasiPreview1.prototype._bytes = function() {
	return new Uint8Array(this.instance.exports.memory.buffer);
};

WasiPreview1.prototype._readString = function(ptr, len) {
	return new TextDecoder().decode(this._bytes().subarray(ptr, ptr + len));
};

WasiPreview1.prototype._writeString = function(ptr, str) {
	var encoded = new TextEncoder().encode(str);
	this._bytes().set(encoded, ptr);
	return encoded.length;
};

// --- Path resolution ---

WasiPreview1.prototype._resolvePath = function(dirfd, pathPtr, pathLen) {
	var fd = this.fds[dirfd];
	if (!fd) return null;
	var relPath = this._readString(pathPtr, pathLen);
	var basePath;
	if (fd.type === 'preopen') basePath = fd.hostPath;
	else if (fd.type === 'dir') basePath = fd.path;
	else return null;
	if (relPath.startsWith('/')) return this.fs.normalizePath(relPath);
	return this.fs.normalizePath(basePath + '/' + relPath);
};

// --- Filestat struct helper (64 bytes) ---

WasiPreview1.prototype._writeFilestat = function(bufPtr, filetype, size) {
	var view = this._view();
	view.setBigUint64(bufPtr,      0n, true);  // dev
	view.setBigUint64(bufPtr + 8,  0n, true);  // ino
	view.setUint8(bufPtr + 16, filetype);       // filetype
	view.setBigUint64(bufPtr + 24, 1n, true);  // nlink
	view.setBigUint64(bufPtr + 32, BigInt(size), true); // size
	view.setBigUint64(bufPtr + 40, 0n, true);  // atim
	view.setBigUint64(bufPtr + 48, 0n, true);  // mtim
	view.setBigUint64(bufPtr + 56, 0n, true);  // ctim
};

// --- WASI imports ---

WasiPreview1.prototype.getImports = function() {
	var self = this;

	return { wasi_snapshot_preview1: {

		// ---- Args ----

		args_get: function(argv, argvBuf) {
			var view = self._view();
			var bytes = self._bytes();
			var offset = argvBuf;
			for (var i = 0; i < self.args.length; i++) {
				view.setUint32(argv + i * 4, offset, true);
				var len = self._writeString(offset, self.args[i]);
				bytes[offset + len] = 0;
				offset += len + 1;
			}
			return WASI_SUCCESS;
		},

		args_sizes_get: function(argc, argvBufSize) {
			var view = self._view();
			view.setUint32(argc, self.args.length, true);
			var totalSize = 0;
			for (var i = 0; i < self.args.length; i++) {
				totalSize += new TextEncoder().encode(self.args[i]).length + 1;
			}
			view.setUint32(argvBufSize, totalSize, true);
			return WASI_SUCCESS;
		},

		// ---- File descriptor I/O ----

		fd_write: function(fd, iovsPtr, iovsLen, nwrittenPtr) {
			var view = self._view();
			var bytes = self._bytes();
			var totalWritten = 0;

			for (var i = 0; i < iovsLen; i++) {
				var buf = view.getUint32(iovsPtr + i * 8, true);
				var bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
				var chunk = bytes.subarray(buf, buf + bufLen);

				if (fd === 1) {
					self.stdout += new TextDecoder().decode(chunk);
				} else if (fd === 2) {
					self.stderr += new TextDecoder().decode(chunk);
				} else if (self.fds[fd] && self.fds[fd].type === 'file') {
					var fdEntry = self.fds[fd];
					var fileData = self.fs.readFile(fdEntry.path) || new Uint8Array(0);
					var needed = fdEntry.offset + bufLen;
					if (needed > fileData.length) {
						var newData = new Uint8Array(needed);
						newData.set(fileData);
						fileData = newData;
					}
					fileData.set(chunk, fdEntry.offset);
					self.fs.writeFile(fdEntry.path, fileData);
					fdEntry.offset += bufLen;
				} else {
					view.setUint32(nwrittenPtr, 0, true);
					return WASI_EBADF;
				}
				totalWritten += bufLen;
			}

			view.setUint32(nwrittenPtr, totalWritten, true);
			return WASI_SUCCESS;
		},

		fd_read: function(fd, iovsPtr, iovsLen, nreadPtr) {
			var view = self._view();
			var bytes = self._bytes();
			var totalRead = 0;

			if (!self.fds[fd] || self.fds[fd].type !== 'file') {
				view.setUint32(nreadPtr, 0, true);
				return fd === 0 ? WASI_SUCCESS : WASI_EBADF;
			}

			var fdEntry = self.fds[fd];
			var fileData = self.fs.readFile(fdEntry.path);
			if (!fileData) {
				view.setUint32(nreadPtr, 0, true);
				return WASI_SUCCESS;
			}

			for (var i = 0; i < iovsLen; i++) {
				var buf = view.getUint32(iovsPtr + i * 8, true);
				var bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
				var remaining = fileData.length - fdEntry.offset;
				var toRead = Math.min(bufLen, remaining);
				if (toRead <= 0) break;
				bytes.set(fileData.subarray(fdEntry.offset, fdEntry.offset + toRead), buf);
				fdEntry.offset += toRead;
				totalRead += toRead;
			}

			view.setUint32(nreadPtr, totalRead, true);
			return WASI_SUCCESS;
		},

		fd_seek: function(fd, offset, whence, newOffsetPtr) {
			if (!self.fds[fd] || self.fds[fd].type !== 'file') return WASI_EBADF;
			var fdEntry = self.fds[fd];
			var fileData = self.fs.readFile(fdEntry.path);
			var fileSize = fileData ? fileData.length : 0;
			var off = Number(offset);

			if (whence === 0) fdEntry.offset = off;            // SET
			else if (whence === 1) fdEntry.offset += off;      // CUR
			else if (whence === 2) fdEntry.offset = fileSize + off; // END
			else return WASI_EINVAL;

			self._view().setBigUint64(newOffsetPtr, BigInt(fdEntry.offset), true);
			return WASI_SUCCESS;
		},

		fd_close: function(fd) {
			if (fd <= 2) return WASI_SUCCESS;
			if (!self.fds[fd]) return WASI_EBADF;
			delete self.fds[fd];
			return WASI_SUCCESS;
		},

		// ---- Preopen enumeration ----

		fd_prestat_get: function(fd, bufPtr) {
			var fdEntry = self.fds[fd];
			if (!fdEntry || fdEntry.type !== 'preopen') return WASI_EBADF;
			var view = self._view();
			view.setUint8(bufPtr, 0); // PREOPENTYPE_DIR
			view.setUint32(bufPtr + 4, new TextEncoder().encode(fdEntry.guestPath).length, true);
			return WASI_SUCCESS;
		},

		fd_prestat_dir_name: function(fd, pathPtr, pathLen) {
			var fdEntry = self.fds[fd];
			if (!fdEntry || fdEntry.type !== 'preopen') return WASI_EBADF;
			self._writeString(pathPtr, fdEntry.guestPath);
			return WASI_SUCCESS;
		},

		// ---- File/dir metadata ----

		fd_fdstat_get: function(fd, bufPtr) {
			var fdEntry = self.fds[fd];
			if (!fdEntry) return WASI_EBADF;
			var view = self._view();
			var isDir = fdEntry.type === 'preopen' || fdEntry.type === 'dir';
			view.setUint8(bufPtr, isDir ? 3 : fdEntry.type === 'file' ? 4 : 0);
			view.setUint16(bufPtr + 2, 0, true);
			view.setBigUint64(bufPtr + 8, 0xFFFFFFFFFFFFFFFFn, true);  // rights: all
			view.setBigUint64(bufPtr + 16, 0xFFFFFFFFFFFFFFFFn, true);
			return WASI_SUCCESS;
		},

		fd_filestat_get: function(fd, bufPtr) {
			var fdEntry = self.fds[fd];
			if (!fdEntry) return WASI_EBADF;
			if (fdEntry.type === 'file') {
				var data = self.fs.readFile(fdEntry.path);
				self._writeFilestat(bufPtr, 4, data ? data.length : 0);
			} else if (fdEntry.type === 'preopen' || fdEntry.type === 'dir') {
				self._writeFilestat(bufPtr, 3, 0);
			} else {
				self._writeFilestat(bufPtr, 0, 0);
			}
			return WASI_SUCCESS;
		},

		// ---- Path operations ----

		path_open: function(dirfd, dirflags, pathPtr, pathLen, oflags, fsRightsBase, fsRightsInheriting, fdflags, fdPtr) {
			var fullPath = self._resolvePath(dirfd, pathPtr, pathLen);
			if (!fullPath) return WASI_EBADF;

			var stat = self.fs.stat(fullPath);

			if (!stat) {
				if (!(oflags & 1)) return WASI_ENOENT; // OFLAGS_CREAT
				self.fs.writeFile(fullPath, new Uint8Array(0));
			} else if (stat.type === 3) { // directory
				var newFd = self.nextFd++;
				self.fds[newFd] = { type: 'dir', path: fullPath };
				self._view().setUint32(fdPtr, newFd, true);
				return WASI_SUCCESS;
			} else if (oflags & 8) { // OFLAGS_TRUNC
				self.fs.writeFile(fullPath, new Uint8Array(0));
			}

			var newFd = self.nextFd++;
			self.fds[newFd] = { type: 'file', path: fullPath, offset: 0 };
			self._view().setUint32(fdPtr, newFd, true);
			return WASI_SUCCESS;
		},

		path_filestat_get: function(fd, flags, pathPtr, pathLen, bufPtr) {
			var fullPath = self._resolvePath(fd, pathPtr, pathLen);
			if (!fullPath) return WASI_EBADF;
			var stat = self.fs.stat(fullPath);
			if (!stat) return WASI_ENOENT;
			self._writeFilestat(bufPtr, stat.type, stat.size);
			return WASI_SUCCESS;
		},

		path_unlink_file: function(fd, pathPtr, pathLen) {
			var fullPath = self._resolvePath(fd, pathPtr, pathLen);
			if (!fullPath) return WASI_EBADF;
			return self.fs.unlink(fullPath) ? WASI_SUCCESS : WASI_ENOENT;
		},

		// ---- Process/system ----

		proc_exit: function(code) {
			throw new WasiExit(code);
		},

		random_get: function(bufPtr, bufLen) {
			crypto.getRandomValues(self._bytes().subarray(bufPtr, bufPtr + bufLen));
			return WASI_SUCCESS;
		}
	}};
};
