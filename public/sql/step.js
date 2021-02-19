dg.step = {
	check: function() {
		var screen = localStorage.getItem("screen") || "tables";
		if (screen === "executeSQL") {
			dg.step.screenExecuteSQL();
		} else if (screen === "scanSQL") {
			dg.step.screenScanSQL();
		} else if (screen === "generateTable") {
			dg.step.screenGenerateTable();
		} else { 
			dg.step.screenTables();
		}
	},

	screenTables: function() {
		localStorage.removeItem("query");
		localStorage.setItem("screen", "tables");
		dg.menu.clean();
		dg.menu.generarFooter(["scan_photo_table", "scan_image_table", "scan_photo_query", "scan_image_query"]);
		dg.menu.generarTables();
	},

	screenGenerateTable: function() {
		localStorage.setItem("screen", "generateTable");
		dg.menu.clean();
		dg.menu.generarFooter(["back_to_tables", "generate_table"]);

		// var tableData = localStorage.getItem("tableData");

		dg.menu.generarGenerateTable();
	},

	screenScanSQL: function() {
		localStorage.setItem("screen", "scanSQL");
		dg.menu.clean();
		dg.menu.generarFooter(["back_to_tables", "execute"]);

		dg.menu.generarScanSQL();
	},

	screenExecuteSQL: function() {
		localStorage.setItem("screen", "executeSQL");
		dg.menu.clean();
		dg.menu.generarFooter(["edit", "export_result_table", "show_query?", "exe_prev", "exe_next"]);

		// TODO todo
	}
}
