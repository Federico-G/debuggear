dg.step = {
	check: function() {
		var screen = localStorage.getItem("screen") || "load";
		if (screen === "query") {
			dg.step._screen3();
		} else if (screen === "edit") {
			dg.step._screen2();
		} else {
			dg.step._screen1();
		}
	},

	screenMain: function() {
		var diagram = localStorage.getItem("diagram");
		var query = localStorage.getItem("query");
		if (query) {
			dg.step._screen3();
		} else if (diagram) {
			dg.step._screen2();
		} else {
			dg.step._screen1();
		}
	},

	// new
	_screen1: function() {
		localStorage.removeItem("diagram");
		localStorage.removeItem("currentImage");
		localStorage.removeItem("query");
		localStorage.setItem("screen", "load");
		dg.menu.clean();
		dg.menu.generarFooter(["scan_photo", "scan_image"]);
		dg.menu.generarCrear();
	},

	// edit
	_screen2: function() {
		localStorage.setItem("screen", "edit");
		dg.menu.clean();
		document.getElementById("shape-container").style.display = 'block';
		dg.menu.generarFooter(["new", "export_diagram", "validate_and"]);

		var diagram = localStorage.getItem("diagram");

		var div = document.getElementById("shape-container")
		div.addEventListener('click', dg.shape.deselect);

		dg.shape.import(diagram);

		dg.menu.generarBGImage();
		dg.shape.generateTriggers();
		dg.shape.generateSVG();
		dg.menu.generarAgregarShape();
		dg.menu.generarAgregarShapeTrash();
		window.addEventListener('beforeunload', dg.menu.saveDiagram);
		init_interact();
	},

	_screen3: function() {
		localStorage.setItem("screen", "query");
		dg.menu.clean();
		document.getElementById("shape-container").style.display = 'block';
		dg.menu.generarFooter(["edit", "export_code", "show_symbol_table", "exe_prev", "exe_next"]);

		dg.code.pg = new dg.code.Tree();
		// https://stackoverflow.com/a/26178015/7427553
		dg.code.pg.fromCode(JSON.parse(localStorage.getItem("code")));

		dg.menu.generarBGImage();
		dg.shape.generateTriggers();
		dg.shape.generateSVG();
	},

	processImage: function(img, predictions) {
		var pred_format = predictions.map(function(p) {
			return {
				x: p.box.left,
				y: p.box.top,
				width: p.box.width,
				height: p.box.height
			};
		});

		var relation = img.width / dg.config.width;

		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/recognizeTextSQL",
			dataType: "json",
			method: "post",
			data: JSON.stringify({image: img.src, bounds: pred_format}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(json) {
			var json_diagram = [];
			for (var i = 0; i < predictions.length; i++) {
				json_diagram.push({
					shape: predictions[i].label,
					x: predictions[i].box.left / relation,
					y: predictions[i].box.top / relation,
					width: predictions[i].box.width / relation,
					height: predictions[i].box.height / relation,
					content: json[i].text
				});
			}

			localStorage.setItem("diagram", JSON.stringify(json_diagram));
			dg.step._screen2();
		});
	},

	generateCode: function() {
		var diagram = JSON.parse(localStorage.getItem("diagram"));
		var code = dg.step._diagramToCode(diagram);
		localStorage.setItem("code", JSON.stringify(code));
		dg.step._screen3();
	},

	_diagramToCode: function(diagram) {
		function overlap(e1, e2) {
			return (e2.x + e2.width) < (e1.x + e1.width) &&
				e2.x > e1.x &&
				e2.y > e1.y &&
				(e2.y + e2.height) < (e1.y + e1.height);
		}

		// Sort by surface
		diagram.sort(function(a, b) {
			return (a.width * a.height) - (b.width * b.height)
		}).forEach(function(x, i) {
			x.included = false;
			x.overlapped = [];
		});

		// Insert element inside element only where it should
		var element, insideElement;
		for (var i = 0; i < diagram.length; i++) {
			element = diagram[i];
			if (dg.shape.blocks.indexOf(element.shape) !== -1) {
				for (var j = 0; j < diagram.length; j++) {
					insideElement = diagram[j];
					if (!insideElement.included && overlap(element, insideElement)) {
						if (element.shape === 'shape-if') {
							insideElement.if = (element.x + element.width / 2) > (insideElement.x + insideElement.width / 2) ? "true" : "false";
						}
						element.overlapped.push(insideElement);
						element.overlapped.sort(function(a, b) {
							return a.y - b.y;
						});
						insideElement.included = true;
					}
				}
			}
		}

		// Remove duplicates and sort
		diagram = diagram.filter(function(element) {
			return !element.included;
		}).sort(function(a, b) {
			return a.y - b.y;
		});

		return diagram;
	}
}
