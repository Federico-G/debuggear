var shape = {

	$currentSelected: null,

	blocks: ["shape-while", "shape-dowhile", "shape-for", "shape-if"],

	select: function(element) {
		if (shape.$currentSelected) {
			shape.$currentSelected.removeClass("shape-selected");
			shape.$currentSelected.trigger("resize");
		}
		shape.$currentSelected = $(element);
		shape.$currentSelected.addClass("shape-selected");
		shape.$currentSelected.trigger("resize");
		$("#trash").show();
	},

	deselect: function() {
		if (shape.$currentSelected) {
			shape.$currentSelected.removeClass("shape-selected");
			shape.$currentSelected.trigger("resize");
		}
		shape.$currentSelected = null;
		$("#trash").hide();
	},

	removeSelected: function() {
		if (shape.$currentSelected) {
			var $shape = shape.$currentSelected;
			shape.deselect();
			$shape.remove();
		}
	},

	uinew: function(container, textShape) {
		var last_shape = shape.getAll().pop();
		var y = 20;
		if (last_shape) {
			y += $(last_shape).data("y") + $(last_shape).outerHeight();
		}

		var height = 45;
		if (shape.blocks.includes(textShape)) {
			height = 150;
		}

		var width = 150
		if (shape.blocks.includes(textShape)) {
			width = 300;
		}

		var newShape = shape.new(container, textShape, ($("body").width() - width) / 2, y, width, height, "Contenido");
		shape.editText(newShape);
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
		var $element = $(element);
		var previousText = $element.text();
		var $input = $("<textarea class='edit-shape' autocorrect='off' autocapitalize='none'></textarea>");
		$input.val(previousText);
		$element.addClass("edit-shape");
		$element.html($input);
		$input.select();
		$input.on("blur", function() {
			$element.html($input.val());
			$element.removeClass("edit-shape");
			$element.trigger("resize");
		});
	},

	export_file: function() {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(shape.export()));
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
						// TODO considerar imagen
						localStorage.setItem("diagram", evt.target.result);
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
		shape.clear();
		var shape_container = document.getElementById("shape-container");
		for (var i = 0; i < json.length; i++) {
			var s = json[i];
			shape.new(shape_container, s.shape, s.x, s.y, s.width, s.height, s.content);
		}
	},

	export: function() {
		var json = [];
		var shapes = shape.getAll();
		var $shape;
		for (var i = 0; i < shapes.length; i++) {
			$shape = $(shapes[i]);
			json.push({
				x: $shape.data("x"),
				y: $shape.data("y"),
				width: $shape.outerWidth(),
				height: $shape.outerHeight(),
				shape: $shape.data("shape"),
				content: $shape.text().trim()
			});
		}

		return JSON.stringify(json);
	},

	generateTriggers: function() {
		// Could be avoided
		$(window).off("resize", shape.generateSVG).on("resize", shape.generateSVG);

		$(".shape-in").off("resize").on("resize", function() {
			shape.generateIN(this);
		});
		$(".shape-out").off("resize").on("resize", function() {
			shape.generateOUT(this);
		});
		$(".shape-op").off("resize").on("resize", function() {
			shape.generateOP(this);
		});
		$(".shape-while").off("resize").on("resize", function() {
			shape.generateWHILE(this);
		});
		$(".shape-dowhile").off("resize").on("resize", function() {
			shape.generateDOWHILE(this);
		});
		$(".shape-for").off("resize").on("resize", function() {
			shape.generateFOR(this);
		});
		$(".shape-if").off("resize").on("resize", function() {
			shape.generateIF(this);
		});
	},

	generateSVG: function() {
		$(".shape-in").each(function() {
			shape.generateIN(this);
		});
		$(".shape-out").each(function() {
			shape.generateOUT(this);
		});
		$(".shape-op").each(function() {
			shape.generateOP(this);
		});
		$(".shape-while").each(function() {
			shape.generateWHILE(this);
		});
		$(".shape-dowhile").each(function() {
			shape.generateDOWHILE(this);
		});
		$(".shape-for").each(function() {
			shape.generateFOR(this);
		});
		$(".shape-if").each(function() {
			shape.generateIF(this);
		});
	},

	generateIN: function(element) {
		var $element = $(element);
		var bounds = $element[0].getBoundingClientRect();
		var stroke = 2;
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
		var fillOpacity = "0.8";
		var path = `
			M ${stroke}, ${stroke}
			L ${bounds.width - stroke}, ${stroke}
			L ${bounds.width - Math.min(stroke + bounds.height / 4, bounds.width / 2)}, ${bounds.height - stroke}
			L ${Math.min(bounds.height / 4 + stroke, bounds.width / 2)}, ${bounds.height - stroke}
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
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
		var fillOpacity = "0.8";
		var path = `
			M ${bounds.width - Math.min(stroke + bounds.height / 4, bounds.width / 2)}, ${stroke}
			L ${Math.min(bounds.height / 4 + stroke, bounds.width / 2)}, ${stroke}
			L ${stroke}, ${bounds.height - stroke}
			L ${bounds.width - stroke}, ${bounds.height - stroke}
			L ${bounds.width - Math.min(stroke + bounds.height / 4, bounds.width / 2)}, ${stroke}
			L ${Math.min(bounds.height / 4 + stroke, bounds.width / 2)}, ${stroke}
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
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
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
		var textHeight = 40;
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
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
		var textHeight = 40;
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
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
		var marginLeft = 10;
		var paddingLeft = 50;
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
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
			A 10 10 0 0 0 ${paddingLeft * 2 - stroke}, ${bounds.height / 2}
			A 10 10 0 0 0 ${marginLeft + stroke}, ${bounds.height / 2}
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
		var textHeight = 80;
		var fillColor = $element.hasClass("shape-selected") ? "#FD0" : "#FFF";
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
	}

};
