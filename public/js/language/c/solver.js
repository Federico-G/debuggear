dg.language.solve = function(type, expression, symbolTable) {
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

		var program = '#include <stdio.h>\n#include <math.h>\n#include <string.h>\n#include <stdlib.h>\n' +
			function_codes +
			'int main(void) {\n' +
			variables +
			code +
			prints +
			extraPrint +
			'}\n';

		var to_compile = {
			"LanguageChoice": "6", // C
			"Program": program,
			"Input": "",
			"CompilerArgs": "-Wall -std=gnu99 -fcompare-debug-second -O1 -o a.out source_file.c"
		};

		$.ajax({
			url: "https://rextester.com/rundotnet/api",
			type: "POST",
			data: to_compile,

		}).done(function(data) {
			if (data.Errors) {
				resolve({
					error: data.Errors
				});
			} else if (data.Result) {
				var values = data.Result.trim().split("\n");

				var i = values.length - Object.keys(newSymbolTable.table).length - (type !== 'statements' ? 1 : 0);
				for (var key in newSymbolTable.table) {
					newSymbolTable.table[key].data[0] = values[i++];
				}

				resolve({
					result: values[i] === "1",
					symbolTable: newSymbolTable
				});
			} else {
				resolve({
					error: ""
				});
			}

		}).fail(function(data, err) {
			resolve({
				error: "fail " + JSON.stringify(data) + " " + JSON.stringify(err)
			});
		});
	})
}