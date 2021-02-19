dg.shape = {

	$currentSelected: null,

	blocks: ["shape-while", "shape-dowhile", "shape-for", "shape-if"],

	flags: ["shape-start", "shape-end"],

	isBlock: function(x) {
		return dg.shape.blocks.indexOf(x) !== -1;
	},

	isFlag: function(x) {
		return dg.shape.flags.indexOf(x) !== -1;
	},

	select: function(element) {
		dg.shape.deselect();
		dg.shape.$currentSelected = $(element);
		dg.shape.$currentSelected.addClass("shape-selected");
		if (dg.shape.$currentSelected.hasClass("shape-error")) {
			dg.shape.$currentSelected.popover("show");
		}
		dg.shape.$currentSelected.trigger("resize");
		$("#trash").show();
	},

	deselect: function() {
		if (dg.shape.$currentSelected) {
			dg.shape.$currentSelected.removeClass("shape-selected");
			dg.shape.$currentSelected.popover("hide");
			dg.shape.$currentSelected.trigger("resize");
		}
		dg.shape.$currentSelected = null;
		$("#trash").hide();
	},

	removeSelected: function() {
		if (dg.shape.$currentSelected) {
			var $shape = dg.shape.$currentSelected;
			dg.shape.deselect();
			$shape.popover("dispose");
			$shape.remove();
		}
	},

	uinew: function(container, textShape, content = "Contenido") {
		//var last_shape = dg.shape.getAll().pop();
		var y = (50 + $("#main").scrollTop()) / dg.config.scale;
		//if (last_shape) {
		//	y += $(last_shape).data("y") + $(last_shape).outerHeight();
		//}

		var height = 90;
		if (dg.shape.isBlock(textShape)) {
			height = 400;
		} else if (dg.shape.flags.includes(textShape)) {
			height = 70;
		} else if (textShape === 'shape-function') {
			height = 200;
		}

		var width = 400
		if (dg.shape.isBlock(textShape)) {
			width = 700;
		} else if (dg.shape.flags.includes(textShape)) {
			width = 70;
		} else if (textShape === 'shape-function') {
			width = 800;
		}

		var newShape = dg.shape.new(container, textShape, (dg.config.width - width) / 2, y, width, height, content);
		dg.shape.editText(newShape);
	},

	new: function(container, textShape, x, y, width, height, content) {
		var $div = $(
			"<div class='shape " + textShape + "' data-shape='" + textShape + "' data-x='" + x + "' data-y='" + y + "'" +
			"style='transform: translate(" + x + "px, " + y + "px); width: " + width + "px; height: " + height + "px;'>" +
			content +
			"</div>");
		$(container).append(
			$div
		);
		$div.trigger("resize");

		return $div[0];
	},

	getAll: function() {
		var x = [];
		$(".shape").each(function() {
			x.push({
				y: this.getBoundingClientRect().y,
				element: this
			})
		});
		x.sort(function(a, b) {
			return a.y - b.y;
		});
		return x.map(function(e) {
			return e.element
		});
	},

	clear: function() {
		$(".shape").remove();
	},

	editText: function(element) {
		var functionBlur = function() {
			$element.html($input.val());
			$element.removeClass("edit-shape");
			$element.trigger("resize");
		};

		var resizeTextareaHeight = function($input) {
			var lines = $input.val().split("\n").length;
			var textHeight = 15 + dg.config.fontSize * lines * 1.5;
			$input.css("height", textHeight);
		}

		var $element = $(element);
		var previousText = $element.text();
		var $input = $("<textarea class='edit-shape' autocorrect='off' autocapitalize='none'></textarea>");
		$input.val(previousText);
		$element.addClass("edit-shape");
		resizeTextareaHeight($input);
		$element.html($input);

		setTimeout(() => {
			$input.select();
			$input.on("blur", functionBlur);
			$input.on("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
			});
			$input.on("input", function(e) {
				resizeTextareaHeight($input);
				$element.trigger("resize");
			});
			$input.on("keydown", function(e) {
				if (e.keyCode == 13 && !e.shiftKey) {
					functionBlur(e);
				}
			})
		});
	},

	export_file: function() {
		var element = document.createElement('a');
		var currentImage = localStorage.getItem("currentImage");
		if (currentImage) {
			currentImage = '"' + currentImage + '"';
		}
		element.setAttribute('href', 'data:text/json;charset=utf-8,{"elements":' +
			encodeURIComponent(dg.shape.export()) +
			', "image": ' +
			currentImage +
			'}');
		element.setAttribute('download', "debuggear-diagram.json");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	},

	import_file: function() {
		var load_json = function(e) {
			var file = e.target.files[0];
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function(evt) {
					try {
						var result = JSON.parse(evt.target.result);
						if (!result.elements) {
							alert("Formato del archivo no reconocido");
							return;
						}
						if (result.image) {
							localStorage.setItem("currentImage", result.image);
						}
						localStorage.setItem("diagram", JSON.stringify(result.elements));
						dg.step.check();
					} catch {
						alert("Error al leer el archivo");
					}
				}
				reader.onerror = function(evt) {
					alert("Error al leer el archivo");
				}
			}
		};

		var element = document.createElement('input');
		element.setAttribute('type', 'file');
		element.setAttribute('accept', 'application/json');
		element.addEventListener('change', load_json);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	},

	import: function(data) {
		var json = JSON.parse(data);
		dg.shape.clear();
		var shape_container = document.getElementById("shape-container");
		for (var i = 0; i < json.length; i++) {
			var s = json[i];
			dg.shape.new(shape_container, s.shape, s.x, s.y, s.width, s.height, s.content);
		}
	},

	export: function() {
		var json = [];
		var shapes = dg.shape.getAll();
		var $shape;
		for (var i = 0; i < shapes.length; i++) {
			$shape = $(shapes[i]);
			json.push({
				x: +shapes[i].getAttribute("data-x"),
				y: +shapes[i].getAttribute("data-y"),
				width: $shape.outerWidth(),
				height: $shape.outerHeight(),
				shape: $shape.data("shape"),
				content: $shape.text().trim()
			});
		}

		return JSON.stringify(json);
	},

	validateDiagram: function() {
		var shapes = dg.shape.getAll();

		if (!shapes.length) {
			alert("El diagrama esta vacio")
			return false;
		}

		dg.shape.cleanErrorPopovers(shapes);

		var errors = false;
		for (var i = 0; i < shapes.length; i++) {
			if (i != 0) {
				if (shapes[i].classList.contains("shape-function")) {
					errors = true;
					dg.shape.generateErrorPopover(shapes[i], "La declaración de funciones solo se puede realizar al principio");
				}
				if (shapes[i].classList.contains("shape-start")) {
					errors = true;
					dg.shape.generateErrorPopover(shapes[i], "La declaración del comienzo del algoritmo solo se puede realizar al principio");
				}
			}
			if (i != shapes.length - 1) {
				if (shapes[i].classList.contains("shape-end")) {
					errors = true;
					dg.shape.generateErrorPopover(shapes[i], "La declaración del find del algoritmo solo se puede realizar al final");
				}
			}
		}
		if (!shapes[0].classList.contains("shape-function") && !shapes[0].classList.contains("shape-start")) {
			errors = true;
			dg.shape.generateErrorPopover(shapes[0], "El primer elemento debe ser una declaración de comienzo o de función");
		}
		if (!shapes[shapes.length - 1].classList.contains("shape-end")) {
			errors = true;
			dg.shape.generateErrorPopover(shapes[shapes.length - 1], "El último elemento debe ser el cierre del algoritmo");
		}
		if (errors) {
			$(window).trigger("resize");
			return false;
		}

		if (shapes[0].classList.contains("shape-function")) {
			// function
		} else {
			// normal
		}

		dg.language.valid_expression.reset();
		for (var i = 0; i < shapes.length; i++) {
			var shape_type = shapes[i].dataset.shape.substring(6);
			var error = dg.language.valid_expression[shape_type]($(shapes[i]).text().trim());
			if (error) {
				errors = true;
				dg.shape.generateErrorPopover(shapes[i], error);
			}
		}

		$(window).trigger("resize");
		return errors ? false : true;
	},

	generateErrorPopover: function(shape, error) {
		shape.classList.add("shape-error");
		shape.dataset.content = error;
		$(shape).popover({
			container: '#main',
			placement: 'bottom',
			trigger: 'manual'
		});
		if(shape.classList.contains("shape-selected")) {
			$(shape).popover("show");
		}
		// TODO
		// if field changedm, remove shapeerror and all datas and js init
	},

	cleanErrorPopover: function(shape) {
		shape.classList.remove("shape-error");
		shape.dataset.content = "";
		$(shape).popover("dispose");
	},

	cleanErrorPopovers: function(shapes) {
		for (var i = 0; i < shapes.length; i++) {
			dg.shape.cleanErrorPopover(shapes[i]);
		}
	},

	generateTriggers: function() {
		// Could be avoided
		$(window).off("resize", dg.shape.generateSVG).on("resize", dg.shape.generateSVG);

		$(".shape-start").off("resize").on("resize", function() {
			dg.shape.generateSTART(this);
		});
		$(".shape-end").off("resize").on("resize", function() {
			dg.shape.generateEND(this);
		});
		$(".shape-in").off("resize").on("resize", function() {
			dg.shape.generateIN(this);
		});
		$(".shape-out").off("resize").on("resize", function() {
			dg.shape.generateOUT(this);
		});
		$(".shape-op").off("resize").on("resize", function() {
			dg.shape.generateOP(this);
		});
		$(".shape-while").off("resize").on("resize", function() {
			dg.shape.generateWHILE(this);
		});
		$(".shape-dowhile").off("resize").on("resize", function() {
			dg.shape.generateDOWHILE(this);
		});
		$(".shape-for").off("resize").on("resize", function() {
			dg.shape.generateFOR(this);
		});
		$(".shape-if").off("resize").on("resize", function() {
			dg.shape.generateIF(this);
		});
		$(".shape-function").off("resize").on("resize", function() {
			dg.shape.generateFUNCTION(this);
		});
	},

	generateSVG: function() {
		$(".shape-start").each(function() {
			dg.shape.generateSTART(this);
		});
		$(".shape-end").each(function() {
			dg.shape.generateEND(this);
		});
		$(".shape-in").each(function() {
			dg.shape.generateIN(this);
		});
		$(".shape-out").each(function() {
			dg.shape.generateOUT(this);
		});
		$(".shape-op").each(function() {
			dg.shape.generateOP(this);
		});
		$(".shape-while").each(function() {
			dg.shape.generateWHILE(this);
		});
		$(".shape-dowhile").each(function() {
			dg.shape.generateDOWHILE(this);
		});
		$(".shape-for").each(function() {
			dg.shape.generateFOR(this);
		});
		$(".shape-if").each(function() {
			dg.shape.generateIF(this);
		});
		$(".shape-function").each(function() {
			dg.shape.generateFUNCTION(this);
		});
	},

	generateSTART: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${bounds.height / 2}
			A 1 ${bounds.height / bounds.width} 0 0 0 ${bounds.width - stroke}, ${bounds.height / 2}
			A 1 ${bounds.height / bounds.width} 0 0 0 ${stroke}, ${bounds.height / 2}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateEND: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width / 2}, ${bounds.height - stroke}
			L ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateIN: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var xr = bounds.width - Math.min(stroke + bounds.height / 4, bounds.width / 2);
		var xl = Math.min(bounds.height / 4 + stroke, bounds.width / 2);
		var xm = (xl + xr) / 2;
		if (xl > xm - 5) {
			xl = xm - 5;
		}
		if (xr < xm + 5) {
			xr = xm + 5;
		}
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${xr}, ${bounds.height - stroke}
			L ${xl}, ${bounds.height - stroke}
			L ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateOUT: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var xr = bounds.width - Math.min(stroke + bounds.height / 4, bounds.width / 2);
		var xl = Math.min(bounds.height / 4 + stroke, bounds.width / 2);
		var xm = (xl + xr) / 2;
		if (xl > xm - 5) {
			xl = xm - 5;
		}
		if (xr < xm + 5) {
			xr = xm + 5;
		}
		var path = `
			M ${xr}, ${stroke}
			L ${xl}, ${stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${xr}, ${stroke}
			L ${xl}, ${stroke}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateOP: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateWHILE: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var lines = ($element.text() || $element.children().val() || "").split("\n").length;
		var textHeight = (15 + dg.config.fontSize * lines * 1.5) * dg.config.scale;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width - stroke}, ${textHeight}
			L ${stroke}, ${textHeight}
			L ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var path2 = `
			M ${stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${textHeight}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'<path fill="none" vector-effect="non-scaling-stroke" d="' + path2 + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},


	generateDOWHILE: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var lines = ($element.text() || $element.children().val() || "").split("\n").length;
		var textHeight = (15 + dg.config.fontSize * lines * 1.5) * dg.config.scale;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width - stroke}, ${bounds.height - stroke - textHeight}
			L ${stroke}, ${bounds.height - stroke - textHeight}
			L ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var path2 = `
			M ${stroke}, ${bounds.height - stroke - textHeight}
			L ${bounds.width - stroke}, ${bounds.height - stroke - textHeight}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height - stroke - textHeight}
			L ${bounds.width - stroke}, ${bounds.height - stroke - textHeight}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="none" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path2 + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateFOR: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var textHeight = (15 + dg.config.fontSize * 3.5) * dg.config.scale;
		var marginLeft = 0;
		var paddingLeft = textHeight;

		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "1";
		var path = `
			M ${marginLeft + paddingLeft + stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${marginLeft + paddingLeft + stroke}, ${bounds.height - stroke}
			L ${marginLeft + paddingLeft + stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			`;

		var path2 = `
			M ${marginLeft + stroke}, ${bounds.height / 2}
			A 3 2 0 0 0 ${paddingLeft * 2 - stroke}, ${bounds.height / 2}
			A 3 2 0 0 0 ${marginLeft + stroke}, ${bounds.height / 2}
			L ${paddingLeft * 2 - stroke}, ${bounds.height / 2}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="none" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path2 + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},


	generateIF: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var lines = ($element.text() || $element.children().val() || "").split("\n").length;
		var textHeight = (15 + dg.config.fontSize * (lines + 1) * 1.5) * dg.config.scale;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${bounds.width / 2}, ${stroke}
			L ${bounds.width - stroke}, ${textHeight}
			L ${stroke}, ${textHeight}
			L ${bounds.width / 2}, ${stroke}
			L ${bounds.width - stroke}, ${textHeight}
			`;

		var path2 = `
			M ${stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${stroke}, ${textHeight}
			L ${bounds.width - stroke}, ${textHeight}
			M ${bounds.width / 2}, ${textHeight}
			L ${bounds.width / 2}, ${bounds.height - stroke}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'<path fill="none" vector-effect="non-scaling-stroke" d="' + path2 + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	generateFUNCTION: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = dg.shape._generateFillColor($element);
		var fillOpacity = "0.8";
		var path = `
			M ${bounds.width - Math.min(stroke + bounds.height / 8, bounds.width / 2)}, ${stroke}
			L ${Math.min(bounds.height / 8 + stroke, bounds.width / 2)}, ${stroke}
			L ${stroke}, ${bounds.height / 2}
			L ${bounds.width - stroke}, ${bounds.height / 2}
			L ${bounds.width - Math.min(stroke + bounds.height / 8, bounds.width / 2)}, ${stroke}
			L ${Math.min(bounds.height / 8 + stroke, bounds.width / 2)}, ${stroke}


			M ${stroke}, ${bounds.height / 2}
			L ${bounds.width - stroke}, ${bounds.height / 2}
			L ${bounds.width - Math.min(stroke + bounds.height / 8, bounds.width / 2)}, ${bounds.height - stroke}
			L ${Math.min(bounds.height / 8 + stroke, bounds.width / 2)}, ${bounds.height - stroke}
			L ${stroke}, ${bounds.height / 2}
			L ${bounds.width - stroke}, ${bounds.height / 2}
			`;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
			'<g stroke="black" fill="none" stroke-width="' + stroke + '">' +
			'<path fill="' + fillColor + '" fill-opacity="' + fillOpacity + '" vector-effect="non-scaling-stroke" d="' + path + '" />' +
			'</g>' +
			'</svg>';
		var SVG64 = window.btoa(svg);
		$element.css("background-image", "url('data:image/svg+xml;base64," + SVG64 + "')");
	},

	_generateFillColor: function($element) {
		if ($element.hasClass("shape-selected")) {
			if ($element.hasClass("shape-error")) {
				return "#FCA";
			} else {
				return "#FD0";
			}

		} else if ($element.hasClass("shape-error")) {
			return "#F99";
		}
		return "#FFF";
	}
};
