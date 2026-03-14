// wcc-memfs.js — In-memory virtual filesystem for WASI programs
// Used by the xcc compiler to read headers/source and write output

function MemFS() {
	this.files = {};   // path → Uint8Array
	this.dirs = {};    // path → true
	this.dirs['/'] = true;
}

MemFS.prototype.normalizePath = function(p) {
	var parts = p.split('/').filter(function(s) { return s !== '' && s !== '.'; });
	var resolved = [];
	for (var i = 0; i < parts.length; i++) {
		if (parts[i] === '..') {
			resolved.pop();
		} else {
			resolved.push(parts[i]);
		}
	}
	return '/' + resolved.join('/');
};

MemFS.prototype.writeFile = function(path, data) {
	path = this.normalizePath(path);
	var parts = path.split('/');
	for (var i = 2; i < parts.length; i++) {
		var dir = parts.slice(0, i).join('/');
		if (!this.dirs[dir]) this.dirs[dir] = true;
	}
	this.files[path] = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
};

MemFS.prototype.readFile = function(path) {
	path = this.normalizePath(path);
	return this.files[path] || null;
};

MemFS.prototype.stat = function(path) {
	path = this.normalizePath(path);
	if (this.dirs[path]) return { type: 3, size: 0 };  // directory
	if (this.files[path]) return { type: 4, size: this.files[path].length }; // regular file
	return null;
};

MemFS.prototype.unlink = function(path) {
	path = this.normalizePath(path);
	if (this.files[path]) {
		delete this.files[path];
		return true;
	}
	return false;
};

// Shallow copy — safe because writeFile always replaces the whole Uint8Array
MemFS.prototype.clone = function() {
	var newFs = new MemFS();
	for (var k in this.dirs) newFs.dirs[k] = true;
	for (var k in this.files) newFs.files[k] = this.files[k];
	return newFs;
};
