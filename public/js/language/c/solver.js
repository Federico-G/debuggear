// Compiles and runs C code using xcc (WebAssembly)

(function() {
	var worker = null;
	var pendingRequests = {};
	var requestId = 0;
	var workerReady = false;
	var workerInitPromise = null;

	function getWorker() {
		if (worker) return workerInitPromise;

		try {
			worker = new Worker('js/language/c/wcc-worker.js');
		} catch (e) {
			// Workers don't work on file:// protocol
			workerInitPromise = Promise.reject(
				"El compilador requiere un servidor HTTP. Abrir el archivo directamente no es compatible."
			);
			return workerInitPromise;
		}
		worker.onmessage = function(e) {
			var data = e.data;
			if (data.action === 'ready') {
				workerReady = true;
				return;
			}
			if (data.action === 'result' && pendingRequests[data.id]) {
				pendingRequests[data.id](data);
				delete pendingRequests[data.id];
			}
			if (data.action === 'error') {
				console.error('WCC Worker error:', data.message);
			}
		};

		workerInitPromise = new Promise(function(resolve) {
			var originalHandler = worker.onmessage;
			worker.onmessage = function(e) {
				if (e.data.action === 'ready') {
					workerReady = true;
					worker.onmessage = originalHandler;
					resolve();
				} else if (e.data.action === 'error') {
					console.error('WCC Worker init error:', e.data.message);
					resolve(); // resolve anyway, errors will be handled per-request
				}
				// Forward to original handler too
				if (originalHandler) originalHandler(e);
			};
			worker.postMessage({ action: 'init' });
		});

		return workerInitPromise;
	}

	dg.language.solve = function(type, expression, symbolTable, preStatement) {
		return new Promise(function(resolve, reject) {
			var newSymbolTable = symbolTable.clone();

			var variables = "";
			for (var key in symbolTable.table) {
				variables += symbolTable.table[key].codeVariable(key);
			}

			var prints = "";
			for (var key in symbolTable.table) {
				prints += symbolTable.table[key].codePrint(key);
			}

			var functions = JSON.parse(localStorage.getItem("functions"));
			var function_codes = functions ? (Object.keys(functions).map(function(x) {
				return functions[x].language;
			}).join('\n') + '\n') : "";

			var code;
			var extraPrint = "";
			if (type == 'statements') {
				// Checked grammar of op for more codes
				dg.grammar.ParserStart = "dgOP";
				try {
					var parser = new nearley.Parser(nearley.Grammar.fromCompiled(dg.grammar));
					parser.feed(expression + ";");
					var statements = parser.results[0].statements;
					for (var i = 0; i < statements.length; i++) {
						if (statements[i] && statements[i].type == "declaration") {
							for (var j = 0; j < statements[i].declarators.length; j++) {
								var symbol = new dg.code.Symbol(statements[i].declarationType);
								newSymbolTable.addSymbol(statements[i].declarators[j].value, symbol);
								prints += symbol.codePrint(statements[i].declarators[j].value);
							}
						}
					}
				} catch (e) {

				}
				code = expression + ";\n";
			} else if (type == 'expression') {
				code = "int __r__0__ = !!(\n" + expression + "\n);\n";
				extraPrint = "printf(\"%d\\n\", __r__0__);\n";
			}

			var preCode = preStatement ? (preStatement + ";\n") : "";

			var program = '#include <stdio.h>\n#include <math.h>\n#include <string.h>\n#include <stdlib.h>\n' +
				function_codes +
				'int main(void) {\n' +
				variables +
				preCode +
				code +
				prints +
				extraPrint +
				'}\n';

			// Send to WebAssembly worker for compilation and execution
			getWorker().then(function() {
				var id = ++requestId;
				var timeout = setTimeout(function() {
					if (pendingRequests[id]) {
						delete pendingRequests[id];
						resolve({ error: "Tiempo de ejecución excedido" });
					}
				}, 10000);

				pendingRequests[id] = function(data) {
					clearTimeout(timeout);

					if (data.error) {
						resolve({ error: data.error });
						return;
					}

					var output = (data.stdout || '').trim();
					if (!output) {
						resolve({ error: data.stderr || "" });
						return;
					}

					var values = output.split("\n");

					var i = values.length - Object.keys(newSymbolTable.table).length - (type !== 'statements' ? 1 : 0);
					for (var key in newSymbolTable.table) {
						newSymbolTable.table[key].data[0] = values[i++];
					}

					resolve({
						result: values[i] === "1",
						symbolTable: newSymbolTable
					});
				};

				worker.postMessage({ action: 'solve', id: id, code: program });
			}, function(err) {
				resolve({ error: err });
			});
		});
	};

	dg.language.warmup = function() {
		getWorker();
	};
})();
