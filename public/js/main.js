window.dg = {
	version: "v1.1.1",
	config: {
		width: 1000,
		autoScale: true,
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

dg.config.fontSize = 40;


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

	function autoScale() {
		if (dg.config.autoScale) {
			dg.config.scale = document.getElementById("main").clientWidth / dg.config.width;
			document.getElementById("shape-container").style.width = "";
		} else {
			dg.config.width = document.getElementById("main").clientWidth / dg.config.scale;
			document.getElementById("shape-container").style.width = dg.config.width + "px";
			document.getElementById("diagram-bg-image").style.transform = "scale(" + (1000 / dg.config.width) + ")";
		}
		// TODO cambiar de lugar
		$("#shapeRange").val(Math.log2(dg.config.scale * 10));
	}

	$(window).on("resize", autoScale);
	autoScale();

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
