dg.menu = {
	clean: function() {
		document.getElementById('intro').innerHTML = '';
		clearInterval(dg.sql.cmInterval);
		delete dg.sql.db;
		delete dg.sql.cm;
		delete dg.sql.cmInterval;
	},
	//"edit", "export_result_table", "show_query?", "exe_prev", "exe_next"
	generarFooter: function(opciones) {
		if (!opciones) {
			opciones = [];
		}
		var footer = document.createElement('footer');
		footer.innerHTML = "";
		footer.classList.add("sql-color");
		var opcion;

		function scan(mobile, callback) {
			return function(e) {
				var file = document.createElement('input');
				file.type = 'file';
				file.accept = "image/*";
				if (mobile) {
					file.capture = "environment";
				}
				file.addEventListener('change', function(e) {
					document.getElementById('intro').innerHTML = "<div style='background: #FFF; height: 100%; text-align: center;'><img src='image/black-icon.svg' style='width: 50%; z-index: 1000;' class='animacion_infinito_rotacion' /></div>";
					var tgt = e.target,
						image = tgt.files[0];
					if (!FileReader) {
						return alert("Su navegador no soporta 'File Reader API'. La misma es necesaria para cargar imagenes a la aplicación");
					}
					if (!image) {
						return alert("Error al cargar imagen");
					}

					new Compressor(image, {
						maxWidth: 1200,
						maxHeight: 1200,
						quality: 0.8,
						convertSize: 500000,
						success(result) {
							var fr = new FileReader();
							fr.onload = function() {
								localStorage.setItem("currentImage", fr.result);
								var image = new Image();
								image.addEventListener('load', function(e) {
									callback(image);
								});
								image.src = fr.result;
							}
							fr.readAsDataURL(result);
						}
					})
				});
				file.click();
			}
		}

		for (var i = 0; i < opciones.length; i++) {
			opcion = opciones[i];

			if (opcion === 'back_to_tables') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-arrow-left'></i><br><span>Volver</span>";
				button.addEventListener('click', function(e) {
					if (confirm("Todos sus cambios se perderan. ¿Desea continuar?")) {
						dg.step.screenTables();
					}
				});

				footer.appendChild(button);
			}

			if (opcion === 'go_to_tables') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-table'></i><br><span>Tablas</span>";
				button.addEventListener('click', function(e) {
					dg.step.screenTables();
				});

				footer.appendChild(button);
			}

			if (opcion === 'scan_photo_table') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-camera'></i><br><span>Capturar Tabla</span>";
				button.addEventListener('click', scan(true, dg.step.processImageTable));

				footer.appendChild(button);
			}

			if (opcion === 'scan_image_table') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-image-o'></i><br><span>Seleccionar Tabla</span>";
				button.addEventListener('click', scan(false, dg.step.processImageTable));

				footer.appendChild(button);
			}

			if (opcion === 'scan_photo_query') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-camera'></i><br><span>Capturar SQL</span>";
				button.addEventListener('click', scan(true, dg.step.processImageQuery));

				footer.appendChild(button);
			}

			if (opcion === 'scan_image_query') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-image-o'></i><br><span>Seleccionar SQL</span>";
				button.addEventListener('click', scan(false, dg.step.processImageQuery));

				footer.appendChild(button);
			}

			/*
			if (opcion === 'export_diagram') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-download'></i><br><span>Exportar diagrama</span>";
				button.addEventListener('click', dg.shape.export_file);

				footer.appendChild(button);
			}
			*/

			if (opcion === 'generate_table') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-table'></i><br><span>Generar</span>";
				button.addEventListener('click', dg.step.processTableData);

				footer.appendChild(button);
			}

			if (opcion === 'execute') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-play'></i><br><span>Ejecutar</span>";
				button.addEventListener('click', function() {
					localStorage.setItem("sql-statement", dg.sql.cm.getValue());
					dg.step.processTableData();
				});

				footer.appendChild(button);
			}

			if (opcion === 'export_code') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-file-code-o'></i><br><span>Exportar código</span>";
				button.addEventListener('click', function() {
					var diagram = JSON.parse(localStorage.getItem("diagram"));
					var language = dg.language.CodeToLanguage(dg.step._diagramToCode(diagram));
					var element = document.createElement('a');
					element.setAttribute('href', 'data:text/x-c;charset=utf-8,' + encodeURIComponent(language));
					element.setAttribute('download', "debuggear-code.c");

					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					document.body.removeChild(element);
				});

				footer.appendChild(button);
			}

			if (opcion === 'show_symbol_table') {
				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = "<i class='fa fa-table'></i><br><span>Símbolos</span>";
				button.addEventListener('click', function() {
					var table = "<table class='table table-striped'><thead><tr><th>Clave</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>";
					for (var i in dg.code.pg.currentSymbolTable.table) {
						table += "<tr><td>" +
							i +
							"</td><td>" +
							dg.code.pg.currentSymbolTable.table[i].type +
							"</td><td>" +
							dg.code.pg.currentSymbolTable.table[i].data +
							"</td></tr>"
					}

					$('#symbol-table .modal-body').html(table + "</tbody></table>");
					$('#symbol-table').modal('show');
				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_next') {
				var button = document.createElement('button');
				button.type = 'button';
				button.id = 'footer_exe_next';
				button.innerHTML = "<i class='fa fa-step-forward'></i><br><span>Siguiente</span>";
				button.addEventListener('click', function() {
					button.disabled = true;
					var node = dg.code.pg.nextStep();
					setTimeout(function() {
						node = dg.code.pg.currentNode;
						button.disabled = false;
						if (!node) {
							this.disabled = true;
						} else {
							dg.shape.select(node.getElement());
						}
						document.getElementById("console-container").innerHTML =
							"<div>" + dg.code.pg.currentConsole.getHTML() + "</div>";
						document.getElementById("console-container").firstChild.scrollIntoView(false);
						document.getElementById("footer_exe_prev").disabled = false;
					}, 2000);

				});

				footer.appendChild(button);
			}

			if (opcion === 'exe_prev') {
				var button = document.createElement('button');
				button.type = 'button';
				button.id = 'footer_exe_prev';
				button.innerHTML = "<i class='fa fa-step-backward'></i><br><span>Anteior</span>";
				button.addEventListener('click', function() {
					var node = dg.code.pg.prevStep();
					if (!node) {
						this.disabled = true;
					} else {
						dg.shape.select(node.getElement());
					}
					document.getElementById("console-container").innerHTML =
						"<div>" + dg.code.pg.currentConsole.getHTML() + "</div>";
					document.getElementById("console-container").firstChild.scrollIntoView(false);
					document.getElementById("footer_exe_next").disabled = false;
				});

				footer.appendChild(button);
			}
		}

		var old_footer = document.getElementsByTagName("footer")[0];

		old_footer.parentNode.replaceChild(footer, old_footer);

		return footer;
	},


	// XXX ???
	generarBGImage: function() {
		var currentImage = localStorage.getItem("currentImage");

		if (currentImage) {
			var image = document.createElement('img');
			var divBGImage = document.getElementById("diagram-bg-image");
			divBGImage.innerHTML = '';
			divBGImage.appendChild(image);
			image.style.position = 'absolute';
			image.style.width = '100%';
			image.src = currentImage;
		}
	},


	generarTables: function() {
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || null;

		if (!tables) {
			$('#intro').html("<h1>¡Bienvenido!</h1><br>Elija una opción debajo para comenzar");
			return;
		}

		var HTML = [
			"<h1>Tablas</h1><br>",
			"<table class='table table-striped table-bordered table-sm' style='font-size: 18px;'>",
			"<thead><tr><th>Tabla</th><th>Opciones</th></thead><tbody>"
		];
		for (var table in tables) {
			HTML.push(
				"<tr>",
				"<td>" + table + "</td>",
				"<td>",
				"<button class='btn btn-sm btn-primary' onclick='dg.menu.verTabla(\"" + table + "\");' title='Ver'>",
				"<i class='fa fa-eye'></i></button> ",
				"<button class='btn btn-sm btn-secondary' onclick='dg.menu.editarTabla(\"" + table + "\");' title='Editar'>",
				"<i class='fa fa-pencil'></i></button> ",
				"<button class='btn btn-sm btn-danger' onclick='dg.menu.borrarTabla(\"" + table + "\");' title='Borrar'>",
				"<i class='fa fa-trash'></i></button>",
				"</td>",
				"</tr>"
			);
		}
		HTML.push("</tbody></table>");
		$('#intro').html(HTML.join(""));
	},

	verTabla: function(name) {
		localStorage.setItem("sql-table", name);
		localStorage.setItem("sql-screen", "seeTable");
		dg.step.check();
	},

	editarTabla: function(name) {
		localStorage.setItem("sql-table", name);
		localStorage.setItem("sql-screen", "generateTable");
		dg.step.check();
	},

	borrarTabla: function(name) {
		if (confirm("¿Está seguro de eliminar la tabla '" + name + "'?")) {
			var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
			delete tables[name];
			localStorage.setItem("sql-tables", JSON.stringify(tables));
			dg.step.check();
		}
	},

	generarGenerateTable: function() {
		var SQLTable = localStorage.getItem("sql-table");
		var edit = false;
		if (!SQLTable) {
			localStorage.removeItem("sql-screen");
			dg.step.check();
			return;
		}
		if (SQLTable[0] === "{") {
			// New
			SQLTable = JSON.parse(SQLTable);
			var fields = SQLTable.fields.reduce(function(a, x) {
				a[x] = {};
				return a;
			}, {});

			SQLTable = {
				name: SQLTable.name,
				fields: fields
			}
		} else {
			// Edit
			edit = true;
			var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
			SQLTable = tables[SQLTable];
			if (!SQLTable) {
				localStorage.removeItem("sql-screen");
				dg.step.check();
				return;
			}
		}

		var HTML = [
			"<form id='formGenerador'>",
			edit ? "<h2 class='mb-2'>Editando</h2>" : "<h2 class='mb-2'>Generando</h2>",
			"<input type='hidden' name='tableSource' value='" + (edit ? SQLTable.name : "") + "'>",

			"<div class='form-group row'>",
			"<div class='col-5'>",
			"<label for='tableName'>Tabla: </label>",
			"</div><div class='col-7'>",
			"<input type='text' id='tableName' class='form-control form-control' name='table' value='" + SQLTable.name + "'>",
			"</div></div>",

			"<div class='form-group row'>",
			"<div class='col-5'>",
			"<label for='tableQ'>N° Datos: </label>",
			"</div><div class='col-7'>",
			"<input type='number' id='tableQ' class='form-control form-control' name='tableQ' value='100'>",
			"</div></div>",

			"<table class='table table-striped table-bordered table-sm' style='font-size: 18px;'>",
			"<thead><th>Campos</th><th>Tipo</th><th>&nbsp;</th></thead><tbody>",
			"</tbody>",
			"<tfoot><tr><td colspan='99'>",
			"<button type='button' class='btn w-100 btn-primary' onclick='dg.menu.agregarCampo();' title='Agregar'><i class='fa fa-plus'></i> Agregar campo</button>",
			"</td></tr></tfoot>",
			"</table></form>"
		];
		$('#intro').html(HTML.join(""));

		for (var field in SQLTable.fields) {
			if (SQLTable.fields[field].type) {
				dg.menu.agregarCampo(field, SQLTable.fields[field].type);
			} else {
				dg.menu.agregarCampo(field);
			}

		}
	},

	_options: (function() {
		var options = [],
			gt = dg.sql.groupTypes;
		for (var group in gt) {
			options.push("<optgroup label='" + group + "'>");
			for (var i = 0; i < gt[group].length; i++) {
				options.push("<option value='" + gt[group][i].value + "'>" + gt[group][i].text + "</option>");
			}
			options.push("</optgroup>");
		}

		return options.join("");
	})(),

	agregarCampo: function(fieldValue, typeValue) {
		if (!fieldValue) {
			fieldValue = "";
		}

		var $tbody = $("#formGenerador table>tbody");
		$tbody.append([
			"<tr><td>",
			"<input type='text' class='form-control form-control-sm' name='field[]' value='" + fieldValue + "'>",
			"</td><td>",
			"<select name='type[]' class='custom-select custom-select-sm selectType'>",
			dg.menu._options,
			"</select>",
			"</td><td>",
			"<button type='button' class='btn btn-sm m-1 btn-danger' onclick='this.parentNode.parentNode.remove();' title='Borrar'><i class='fa fa-minus'></i></button>",
			"</td></tr>",
		].join(""));

		if (typeValue) {
			$tbody.find(".selectType").last().val(typeValue);
		}
	},

	generarSeeTable: function() {
		var SQLTableName = localStorage.getItem("sql-table");
		if (!SQLTableName) {
			localStorage.removeItem("sql-screen");
			dg.step.check();
			return;
		}
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
		var SQLTable = tables[SQLTableName];
		var fields = SQLTable.fields;

		var dataQ = fields[Object.keys(fields)[0]].data.length;
		var keys = Object.keys(fields);

		var rows = [];
		for (var i = 0; i < dataQ; i++) {
			rows.push("<tr>" + keys.reduce(function(a, fieldName) {
				return a + "<td>" + fields[fieldName].data[i] + "</td>";
			}, "") + "</tr>");
		}

		var HTML = [
			"<h2 class='mb-3'>" + SQLTableName + "</h2>",
			"<div class='table-responsive'>",
			"<table class='table table-striped table-bordered table-sm' style='font-size: 14px;'>",
			"<thead><th>" + keys.join("</th><th>") + "</th></thead><tbody>",
			rows.join(""),
			"</tbody></table></div>"
		];
		$('#intro').html(HTML.join(""));
	},

	generarScanSQL: function() {
		var statement = localStorage.getItem("sql-statement");
		if (!statement) {
			localStorage.removeItem("sql-screen");
			dg.step.check();
			return;
		}

		var HTML = [
			"<h2 class='mb-3'>Consulta</h2>",
			"<textarea id='editStatementTextarea'>" + statement + "</textarea>"
		];

		$('#intro').html(HTML.join(""));

		dg.sql.cm = CodeMirror.fromTextArea(document.getElementById('editStatementTextarea'), {
			theme: "mbo",
			lineNumbers: true,
			matchBrackets: true
		});

		dg.sql.cmInterval = setInterval(function() {
			localStorage.setItem("sql-statement", dg.sql.cm.getValue());
		}, 5000);
	}
}
