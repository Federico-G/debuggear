dg.step = {
	check: function() {
		var screen = localStorage.getItem("sql-screen") || "tables";
		if (screen === "executeSQL") {
			dg.step.screenExecuteSQL();
		} else if (screen === "generateTable") {
			dg.step.screenGenerateTable();
		} else if (screen === "seeTable") {
			dg.step.screenSeeTable();
		} else {
			dg.step.screenTables();
		}
	},

	screenTables: function() {
		localStorage.removeItem("query");
		localStorage.setItem("sql-screen", "tables");
		dg.menu.clean();
		dg.menu.generarFooter(["scan_photo_table", "scan_image_table", "scan_photo_query", "scan_image_query"]);
		dg.menu.generarTables();
	},

	screenGenerateTable: function() {
		localStorage.setItem("sql-screen", "generateTable");
		dg.menu.clean();
		dg.menu.generarFooter(["back_to_tables", "generate_table"]);

		dg.menu.generarGenerateTable();
	},

	screenSeeTable: function() {
		localStorage.setItem("sql-screen", "seeTable");
		dg.menu.clean();
		dg.menu.generarFooter(["go_to_tables"]);

		dg.menu.generarSeeTable();
	},

	screenExecuteSQL: function() {
		localStorage.setItem("sql-screen", "executeSQL");
		dg.menu.clean();
		dg.menu.generarFooter(["back_to_tables", "execute"]);

		dg.menu.generarExecuteSQL();
	},

	processImageTable: function(img) {
		function error() {
			alert("Error al leer los datos de la tabla");
			dg.step.screenTables();
		}
		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/recognizeSchema",
			dataType: "json",
			method: "post",
			data: JSON.stringify({
				image: img.src
			}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(table) {
			if (!table || !table.name || !table.fields) {
				error();
			} else {
				localStorage.setItem("sql-table", JSON.stringify(table));
				dg.step.screenGenerateTable();
			}
		}).fail(function() {
			error();
		});
	},

	processImageQuery: function(img) {
		function error() {
			alert("Error al leer los datos de la consulta");
			dg.step.screenTables();
		}
		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/recognizeStatement",
			dataType: "text",
			method: "post",
			data: JSON.stringify({
				image: img.src
			}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(statement) {
			localStorage.setItem("sql-statement", statement + "\n");
			dg.step.screenExecuteSQL();
		}).fail(function() {
			error();
		});
	},

	processTableData: function() {
		function getData(type, quantity) {
			var data = [];
			if (type === "unique.unique") {
				faker.id = 0;
			}
			var types = type.split(".");
			var ext = types[1].split(":");
			types[1] = ext[0];
			ext = ext[1] !== undefined ? ext[1] : "";
			for (var i = 0; i < quantity; i++) {
				if (ext !== "") {
					data.push(faker[types[0]][types[1]](+ext));
				} else {
					data.push(faker[types[0]][types[1]]());
				}
			}

			return data;
		}

		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
		var HTMLTable = $("#formGenerador").serializeArray();
		var tableEdit = HTMLTable[0].value;
		var name = HTMLTable[1].value;

		if (tableEdit !== name && tables[name]) {
			if (!confirm("Ya existe una tabla con ese nombre. ¿Desea sobreescribirla?")) {
				return;
			}
		}

		var tableQ = +HTMLTable[2].value;
		var tableFields = {};
		for (var i = 3; i < HTMLTable.length; i += 2) {
			if (HTMLTable[i].value && HTMLTable[i + 1].value) {
				tableFields[HTMLTable[i].value] = {
					type: HTMLTable[i + 1].value,
					data: getData(HTMLTable[i + 1].value, tableQ)
				};
			}
		}

		tables[name] = {
			name: name,
			fields: tableFields
		};

		if (tableEdit !== name) {
			delete tables[tableEdit];
		}

		localStorage.setItem("sql-tables", JSON.stringify(tables));
		localStorage.setItem("sql-table", name);
		dg.step.screenSeeTable();
	},


	executeStatement: function() {
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
		var statement = localStorage.getItem("sql-statement");

		var sql_tables = [],
			sql_insert = [],
			sqlv_tables = [],
			sql_fields,
			sql_data,
			sqlv_fields;
		var table, field, dataQ;
		for (var tableName in tables) {
			table = tables[tableName];
			dataQ = table.fields[Object.keys(table.fields)[0]].data.length;

			sql_tables.push("CREATE TABLE " + table.name + "(\n");
			sqlv_tables.push(table.name + "(")
			sql_insert.push("INSERT INTO " + table.name + " VALUES\n");
			sql_fields = [];
			sql_data = [];
			sqlv_fields = [];
			for (var i = 0; i < dataQ; i++) {
				sql_data[i] = [];
			}

			for (var fieldName in table.fields) {
				field = table.fields[fieldName];
				sql_fields.push(fieldName + " " + (field.sqliteType || dg.sql.types[field.type].sqliteType));
				sqlv_fields.push(fieldName);

				for (var i = 0; i < dataQ; i++) {
					sql_data[i].push("'" + field.data[i] + "'");
				}
			}

			for (var i = 0; i < dataQ; i++) {
				sql_data[i] = sql_data[i].join(", ");
			}

			sql_tables.push(sql_fields.join(",\n") + "\n);\n");
			sqlv_tables.push(sqlv_fields.join(", ") + ")\n");

			sql_insert.push("(" + sql_data.join("),\n(") + ");\n");
		}

		sql_tables = sql_tables.join("");
		sql_insert = sql_insert.join("");
		sqlv_tables = sqlv_tables.join("");

		var db = new dg.sql.sqljs.Database();
		db.run(sql_tables);
		db.run(sql_insert);

		try {
			var results = db.exec(statement);
			var result = results[0];
			dg.menu.generarExecuteResults(result, statement, db);
		} catch (e) {
			dg.menu.errorExecuteResults(e);
		}

		var url = "http://demo.queryvis.com/local.php?schema=" + encodeURIComponent(sqlv_tables) +
			"&query=" + encodeURIComponent(statement);

		dg.menu.limpiarDiagramResults();

		$.ajax({
			url: "https://us-central1-debuggear-web.cloudfunctions.net/getQueryDiagram",
			dataType: "text",
			method: "post",
			data: JSON.stringify({
				url: url
			}),
			contentType: "text/plain; charset=utf-8"
		}).done(function(base64) {
			dg.menu.generarDiagramResults(base64);
		});
	}
}
