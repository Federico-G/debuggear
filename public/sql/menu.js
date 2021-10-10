dg.menu = {
	clean: function() {
		document.getElementById('intro').innerHTML = '';
		clearInterval(dg.sql.cmInterval);
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
						convertSize: 1,
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
					dg.step.executeStatement();
				});

				footer.appendChild(button);
			}
		}

		var old_footer = document.getElementsByTagName("footer")[0];

		old_footer.parentNode.replaceChild(footer, old_footer);

		return footer;
	},

	generarTables: function() {
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};

		if (!tables || Object.keys(tables).length === 0) {
			$('#intro').html("<h1>¡Bienvenido!</h1><br>Elija una opción debajo para comenzar");
			return;
		}

		var HTML = [
			"<h1>Tablas</h1>",
			"<button class='btn btn-primary my-2' onclick='dg.menu.crearTablaVacia();' style='width: fit-content;'><i class='fa fa-plus'></i> Tabla vacia</button>",
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
				"<i class='fa fa-trash'></i></button> ",
				"<button class='btn btn-sm btn-info' onclick='dg.menu.exportarTabla(\"" + table + "\");' title='Exportar'>",
				"<i class='fa fa-share-square-o'></i></button> ",
				"<button class='btn btn-sm btn-warning' onclick='dg.menu.consultarTabla(\"" + table + "\");' title='Exportar'>",
				"<i class='fa fa-terminal'></i></button>",
				"</td>",
				"</tr>"
			);
		}
		HTML.push("</tbody></table>");
		$('#intro').html(HTML.join(""));
	},

	crearTablaVacia: function() {
		localStorage.setItem("sql-table", "{\"name\": \"\", \"fields\": []}");
		localStorage.setItem("sql-screen", "generateTable");
		dg.step.check();
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

	consultarTabla: function(name) {
		localStorage.setItem("sql-statement", "SELECT *\nFROM " + name + "\n");
		localStorage.setItem("sql-screen", "executeSQL");
		dg.step.check();
	},

	exportarTabla: function(name) {
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
		var table = tables[name];

		dataQ = table.fields[Object.keys(table.fields)[0]].data.length;

		sql_table = "CREATE TABLE " + table.name + "(\n";
		sql_insert = "INSERT INTO " + table.name + " VALUES\n";
		sql_fields = [];
		sql_data = [];
		for (var i = 0; i < dataQ; i++) {
			sql_data[i] = [];
		}

		for (var fieldName in table.fields) {
			field = table.fields[fieldName];
			sql_fields.push(fieldName + " " + (field.sqliteType || dg.sql.types[field.type].sqliteType));

			for (var i = 0; i < dataQ; i++) {
				sql_data[i].push("'" + field.data[i] + "'");
			}
		}

		for (var i = 0; i < dataQ; i++) {
			sql_data[i] = sql_data[i].join(", ");
		}

		sql_table += sql_fields.join(",\n") + "\n);\n";

		sql_insert += "(" + sql_data.join("),\n(") + ");\n";


		var element = document.createElement('a');
		element.setAttribute('href', 'data:application/sql;charset=utf-8,' +
			encodeURIComponent(sql_table + sql_insert));
		element.setAttribute('download', name + ".sql");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
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

	generarExecuteSQL: function() {
		var statement = localStorage.getItem("sql-statement");
		if (!statement) {
			localStorage.removeItem("sql-screen");
			dg.step.check();
			return;
		}

		var HTML = [
			"<h2 class='mb-3'>Consulta</h2>",
			"<textarea id='editStatementTextarea'>" + statement + "</textarea>",
			"<div id='diagramResults' class='mt-3'></div>",
			"<div id='executeResults' class='mt-3'></div>"
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
	},

	generarExecuteResults: function(result, statement, db) {
		if (!result) {
			$('#executeResults').html(
				"<h2>Resultado</h2><div class='alert alert-warning' style='font-size: 18px;'>" +
				"No se encontraron resultados para la consulta" +
				"</div>"
			);
			return;
		}
		var HTML = [
			"<h2>Resultado</h2>",
			"<button class='btn btn-secondary btn-sm my-2' id='newTableWithResults'>Nueva tabla con resultados</button>",
			"<div class='table-responsive'>",
			"<table class='table table-striped table-bordered table-sm' style='font-size: 18px;'>",
			"<thead><tr><th>" + result.columns.join("</th><th>") + "</th></thead><tbody>"
		];

		for (var i = 0; i < result.values.length; i++) {
			HTML.push("<tr><td>" + result.values[i].join("</td><td>") + "</td></tr>");
		}
		HTML.push("</tbody></table></div>");
		$('#executeResults').html(HTML.join(""));

		$("#newTableWithResults").on("click", function() {
			var tableName = prompt("Ingrese el nombre para la nueva tabla");
			if (!tableName) {
				return;
			}

			var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};

			if (tables[tableName]) {
				if (!confirm("Ya existe una tabla con ese nombre. ¿Desea sobreescribirla?")) {
					return;
				}
			}

			var sqliteTypes = db.exec("SELECT " + "typeof(" + result.columns.join("), typeof(") + ")" + "FROM (" + statement + ") LIMIT 1;")[0].values[0];
			sqliteTypes = sqliteTypes.map(function(type) {
				return type === "null" ? "TEXT" : type.toUpperCase();
			});

			var tableFields = {};
			for (var i = 0; i < sqliteTypes.length; i++) {
				tableFields[result.columns[i]] = {
					sqliteType: sqliteTypes[i],
					data: result.values.map(function(x) {
						return x[i];
					})
				};
			}

			tables[tableName] = {
				name: tableName,
				fields: tableFields
			};


			localStorage.setItem("sql-tables", JSON.stringify(tables));
			localStorage.setItem("sql-table", tableName);
			dg.step.screenSeeTable();
		});
	},

	errorExecuteResults: function(error) {
		$('#executeResults').html(
			"<h2>Error</h2><div class='alert alert-danger' style='font-size: 18px;'>" + error + "</div>"
		);
		$('#diagramResults').html("");
	},

	generarDiagramResults: function(base64Image) {
		$('#diagramResults').html(
			"<h2>Diagrama</h2><img src='data:image/png;base64," + base64Image + "' class='w-100' />"
		);
	},

	limpiarDiagramResults: function() {
		$('#diagramResults').html("");
	}
}
