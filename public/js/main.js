window.dg = {
	version: "v1.0.0-alpha2",
	config: {
		width: 1000,
		_fontSize: 0,
		_scale: 1,
		set fontSize(size) {
			if (size < 1 || size > 200)
				size = 50;
			document.documentElement.style.setProperty('--font-size', size + 'px');
			this._fontSize = size;
			$(window).trigger("resize");
		},
		get fontSize() {
			return this._fontSize;
		},
		set scale(x) {
			this._scale = x;
			var shapeContainer = document.getElementById("shape-container");
			if (shapeContainer) {
				shapeContainer.style.transform = "scale(" + x + ")";
			}
		},
		get scale() {
			return this._scale;
		}
	},
	code: {},
	sql: {},
	language: {}
};

dg.config.fontSize = 50;


if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/sw.js');
	});
}


function addInstall() {
	var li = document.getElementById("instalar");
	var a = li.firstElementChild;

	var deferredPrompt;
	window.addEventListener('beforeinstallprompt', function(e) {
		e.preventDefault();
		deferredPrompt = e;
		li.style.display = 'block';
	});

	a.addEventListener('click', function(e) {
		e.preventDefault();
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then(choiceResult => {
			if (choiceResult.outcome === 'accepted') {
				li.style.display = 'none';
			}
			deferredPrompt = null;
		});

		return false;
	});
}


$(function() {
	addInstall();
	dg.config.scale = document.getElementById("main").clientWidth / dg.config.width;
	$(window).on("resize", function() {
		dg.config.scale = document.getElementById("main").clientWidth / dg.config.width;
	});
	document.getElementById("version").innerHTML = dg.version;
	dg.step.check();
});


// XXX mov
// Polyfill for array flat
if (!Array.prototype.flat) {
	Array.prototype.flat = function(depth) {
		var flattend = [];
		(function flat(array, depth) {
			for (let el of array) {
				if (Array.isArray(el) && depth > 0) {
					flat(el, depth - 1);
				} else {
					flattend.push(el);
				}
			}
		})(this, Math.floor(depth) || 1);
		return flattend;
	};
}
