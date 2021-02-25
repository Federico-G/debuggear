dg.step = {
	check: function() {
		var screen = localStorage.getItem("sql-screen") || "tables";
		if (screen === "executeSQL") {
			dg.step.screenExecuteSQL();
		} else if (screen === "scanSQL") {
			dg.step.screenScanSQL();
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

	screenScanSQL: function() {
		localStorage.setItem("sql-screen", "scanSQL");
		dg.menu.clean();
		dg.menu.generarFooter(["back_to_tables", "execute"]);

		dg.menu.generarScanSQL();
	},

	screenExecuteSQL: function() {
		localStorage.setItem("sql-screen", "executeSQL");
		dg.menu.clean();
		dg.menu.generarFooter(["edit", "export_result_table", "show_query?", "exe_prev", "exe_next"]);

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
			dg.step.screenScanSQL();
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
			for (var i = 0; i < quantity; i++) {
				data.push(faker[types[0]][types[1]]());
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
		for (var i = 2; i < HTMLTable.length; i += 2) {
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


	processStatement: function() {
		var tables = JSON.parse(localStorage.getItem("sql-tables")) || {};
		var statement = localStorage.getItem("sql-statement");

		alert("TO DO");

		// Load tables into sqlite
		// Execute query
		// Show results

		// Load tables and query for queryvis
		// http://demo.queryvis.com/local.php?schema=Likes(person%2C%20drink)%0AFrequents(person%2C%20bar)%0AServes(bar%2C%20drink%2C%20cost)&query=SELECT%09F.person%0AFROM%09Frequents%20F%2C%20Likes%20L%2C%20Serves%20S%0AWHERE%09F.person%20%3D%20L.person%0AAND%09F.bar%20%3D%20S.bar%0AAND%09L.drink%20%3D%20S.drink%0AAND%20%20%20%20%20S.drink%20IN%20(%0A%20%20%20SELECT%20Se.drink%20%0A%20%20%20FROM%20Serves%20Se%20%0A%20%20%20WHERE%20Se.cost%20%3E%2050%0A)
		// get image from that url and show
	}
}
