dg.code = dg.code || {};

// TODO CHANGE!
// static Solve
dg.code.solve = function(expression, symbolTable) {
	// Hacer async sync, hace que muera un gatito
	return new Promise(function(resolve) {
		var variables = "",
			variable;
		for (var key in symbolTable.table) {
			variable = ['string', 'char'].indexOf(symbolTable.table[key].type) !== -1 ? ('"' + symbolTable.table[key].data + '"') : symbolTable.table[key].data;
			variables += /*"this." +*/ key + " = " + variable + "; ";
		}

		// Build a worker from an anonymous function body
		var blobURL = URL.createObjectURL(new Blob([
			'(function() { ' +
			'var $_$_$ = Object.keys(this);' +
			variables +
			'postMessage([eval("' + expression + '"), ' +
			'Object.keys(this).filter(function(x) { return $_$_$.indexOf(x) === -1; })' +
			'.map(function(x) { return [x, this[x]]; })' +
			'])' +
			'})()'
		], {
			type: 'application/javascript'
		}));

		var worker = new Worker(blobURL);
		URL.revokeObjectURL(blobURL);
		worker.onmessage = function(e) {
			worker.terminate();
			// build new symbolTable with new data, and return in resolve
			var newSymbolTable = new dg.code.SymbolTable();
			var variables = e.data[1];
			for (var i = 0; i < variables.length; i++) {
				newSymbolTable.addSymbol(variables[i][0], new dg.code.Symbol(variables[i][1]))
			}
			resolve([e.data[0], newSymbolTable]);
		};
	});
}

