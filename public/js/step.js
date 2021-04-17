dg.step = {
	check: function() {
		var screen = localStorage.getItem("screen");
		var diagram = localStorage.getItem("diagram");
		var code = localStorage.getItem("code");
		if (screen === null) {
			if (code) {
				dg.step._screen3();
			} else if (diagram) {
				dg.step._screen2();
			} else {
				dg.step.screenInfo();
			}
		} else if (screen === "info") {
			dg.step.screenInfo();
		} else if (screen === "help") {
			dg.step.screenHelp();
		} else if (screen === "functions") {
			dg.step.screenFunctions();
		} else if (screen === "main") {
			dg.step.screenMain();
		}
	},

	// info
	screenInfo: function() {
		localStorage.setItem("screen", "info");
		dg.menu.clean();
		dg.menu.generarFooter();
		dg.menu.generarInfo();
	},

	screenHelp: function() {
		localStorage.setItem("screen", "help");
		dg.menu.clean();
		dg.menu.generarFooter();
		dg.menu.generarHelp();
	},

	screenFunctions: function() {
		localStorage.setItem("screen", "functions");
		dg.menu.clean();
		dg.menu.generarFooter();
		dg.menu.generarFunctions();
	},

	screenMain: function() {
		var diagram = localStorage.getItem("diagram");
		var code = localStorage.getItem("code");
		if (code) {
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
		localStorage.removeItem("code");
		localStorage.setItem("screen", "main");
		dg.menu.clean();
		dg.menu.generarFooter(["scan_photo", "scan_image", "import_diagram", "from_scratch"]);
		dg.menu.generarCrear();
	},

	// edit
	_screen2: function() {
		localStorage.setItem("screen", "main");
		dg.menu.clean();
		document.getElementById("shape-container").style.display = 'block';
		dg.menu.generarFooter(["new", "export_diagram", "improve_detection", "validate_and"]);

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
		localStorage.setItem("screen", "main");
		dg.menu.clean();
		document.getElementById("shape-container").style.display = 'block';
		dg.menu.generarFooter(["edit", "export_code", "show_symbol_table", "exe_prev", "exe_next"]);

		dg.code.pg = new dg.code.Tree();
		dg.code.pg.fromCode(JSON.parse(localStorage.getItem("code")));

		dg.menu.generarBGImage();
		// dg.menu.generarConsole();
		dg.shape.generateTriggers();
		dg.shape.generateSVG();
	},

	processImage: function(img, predictions) {
		var pred_format = predictions.map(function(p) {
			var x = p.box.left;
			var y = p.box.top;
			var width = p.box.width;
			var height = p.box.height;
			switch (p.label) {
				case 'shape-dowhile':
					width = (img.width - p.box.left);
					height = 100;
					y = p.box.top + p.box.height - height;
					break;
				case 'shape-while':
					width = (img.width - p.box.left);
					height = 100;
					break;
				case 'shape-if':
					height = 150;
					break;
			}
			return {
				x: x,
				y: y,
				width: width,
				height: height
			};
		});

		var relation = img.width / dg.config.width;

		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/recognizeText",
			dataType: "json",
			method: "post",
			data: JSON.stringify({
				image: img.src,
				bounds: pred_format
			}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(json) {
			var json_diagram = [],
				p,
				content;
			for (var i = 0; i < predictions.length; i++) {
				p = predictions[i];
				content = json[i].text;
				if (!content && dg.shape.isFlag(p.label)) {
					if (p.label === "shape-start") {
						content = "C";
					} else if (p.label === "shape-end") {
						content = "F";
					}
				}
				json_diagram.push({
					shape: p.label,
					x: p.box.left / relation,
					y: p.box.top / relation,
					width: ["shape-for", "shape-while", "shape-dowhile"].includes(p.label) ?
						((img.width - p.box.left * 1.8) / relation) : (p.box.width / relation),
					height: p.box.height / relation,
					content: content
				});
			}

			localStorage.setItem("diagram", JSON.stringify(json_diagram));
			dg.step._screen2();
		});
	},

	processFunction: function() {
		var functions = JSON.parse(localStorage.getItem("functions") || "{}");
		var diagram = JSON.parse(localStorage.getItem("diagram"));

		dg.grammar.ParserStart = "dgFUNCTION";
		var parser = new nearley.Parser(nearley.Grammar.fromCompiled(dg.grammar));
		parser.feed(diagram[0].content);
		var parser_result = parser.results[0];

		var language = dg.language.CodeToLanguage(dg.step._diagramToCode(diagram));

		var new_function = {
			name: parser_result.functionName,
			return_type: parser_result.returnType,
			parameters: parser_result.parameters,
			diagram: diagram,
			language: language
		};

		if (functions[new_function.name]) {
			if (!confirm("Ya existe una función con ese nombre. ¿Desea sobrescribirla?")) {
				return;
			}
		}

		functions[new_function.name] = new_function;
		localStorage.setItem("functions", JSON.stringify(functions));
		dg.step.screenFunctions();
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
			if (dg.shape.isBlock(element.shape) !== -1) {
				for (var j = 0; j < diagram.length; j++) {
					insideElement = diagram[j];
					if (!insideElement.included && overlap(element, insideElement)) {
						if (element.shape === 'shape-if') {
							insideElement.if = (element.x + element.width / 2) >
								(insideElement.x + insideElement.width / 2) ? "true" : "false";
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
