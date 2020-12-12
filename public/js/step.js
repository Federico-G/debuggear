dg.step = {
	check: function() {
		var diagram = localStorage.getItem("diagram");
		var code = localStorage.getItem("code");
		if (!diagram) {
			if (localStorage.getItem("notFirstTime")) {
				dg.step.screen1();
			} else {
				dg.step.screen0();
			}
		} else if (code) {
			dg.step.screen3();
		} else {
			dg.step.screen2();
		}
	},

	// info
	screen0: function() {
		localStorage.setItem("notFirstTime", 1);
		dg.menu.clean();
		dg.menu.generarFooter(["new", "install"]);
		dg.menu.generarInfo();
	},

	// new
	screen1: function() {
		localStorage.removeItem("diagram");
		localStorage.removeItem("currentImage");
		localStorage.removeItem("code");
		dg.menu.clean();
		dg.menu.generarFooter(["info", "scan_photo", "scan_image", "import_diagram", "from_scratch", "install"]);
		dg.menu.generarCrear();
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

		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/recognizeText",
			dataType: "json",
			method: "post",
			data: JSON.stringify({image: img.src, bounds: pred_format}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(json) {
			var json_diagram = [];
			for (var i = 0; i < predictions.length; i++) {
				json_diagram.push({
					shape: predictions[i].label,
					x: predictions[i].box.left,
					y: predictions[i].box.top,
					width: predictions[i].box.width,
					height: predictions[i].box.height,
					content: json[i].text
				});
			}

			localStorage.setItem("diagram", JSON.stringify(json_diagram));
			dg.step.screen2();
		});


	},

	// edit
	screen2: function() {
		dg.menu.clean();
		dg.menu.generarFooter(["new", "export_diagram", "execute"]);

		var diagram = localStorage.getItem("diagram");


		var div = document.getElementById("shape-container")
		div.addEventListener('click', shape.deselect);

		shape.import(diagram);


		dg.menu.generarBGImage();
		shape.generateTriggers();
		shape.generateSVG();
		dg.menu.generarAgregarShape();
		dg.menu.generarAgregarShapeTrash();
		window.addEventListener('beforeunload', dg.menu.saveDiagram);
		init_interact();
	},

	generateCode: function() {
		function overlap(e1, e2) {
			return (e2.x + e2.width) < (e1.x + e1.width) &&
				e2.x > e1.x &&
				e2.y > e1.y &&
				(e2.y + e2.height) < (e1.y + e1.height);
		}

		// Duplicate and sort by surface
		var diagram = JSON.parse(localStorage.getItem("diagram"));
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
			if (shape.blocks.indexOf(element.shape) !== -1) {
				for (var j = 0; j < diagram.length; j++) {
					insideElement = diagram[j];
					if (!insideElement.included && overlap(element, insideElement)) {
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

		var code = JSON.stringify(diagram);

		localStorage.setItem("code", code);
		dg.step.screen3();
	},

	screen3: function() {
		dg.menu.clean();

		// TODO
		//dg.menu.generarFooter(["new", "edit", "show_symbol_table" /* modal */, "export_ccode"]);
		//  "exe_prev", "exe_next" -> opciones por fuera del footer. Pensar como
		dg.menu.generarFooter(["new", "edit", "show_symbol_table", "exe_prev", "exe_next"]);

		var elements = JSON.parse(localStorage.getItem("code"));

		// Armar programa
		function armar(elements, node) {
			var element, newNode;
			for (var i = 0; i < elements.length; i++) {
				element = elements[i];
				var HTMLElement = shape.new(document.getElementById("shape-container"),
					element.shape, element.x, element.y, element.width, element.height, element.content);
				newNode = node.addNode(element.shape.substr(6), HTMLElement, element.content);
				if (element.overlapped.length) {
					armar(element.overlapped, newNode);
				}
			}
		}

		dg.code.pg = new dg.code.Tree();
		var mainNode = dg.code.pg.getMainNode();
		armar(elements, mainNode);
		dg.menu.generarBGImage();
		dg.menu.generarConsole();
		shape.generateTriggers();
		shape.generateSVG();

	}
}
