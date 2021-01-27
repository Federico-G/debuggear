dg.language.valid_expression = {
	reset: function() {
		dg.language.valid_expression.variables = [];
	},
	variables: [],

	_parse: function(expression, startNode) {
		dg.grammar.ParserStart = startNode;
		try {
			var parser = new nearley.Parser(nearley.Grammar.fromCompiled(dg.grammar));
			parser.feed(expression);
			return dg.language.valid_expression._resolve(parser.results[0]);
		} catch (e) {
			return "Error de sintaxis. No se esperaba \"" + e.token.value + "\"";
		}
	},

	_resolve: function(parser_result) {
		// Usually when expression is empty
		if (!parser_result) {
			return "La sintaxis de este elemento es incorrecto";
		}

		switch (parser_result.type) {
			case "IN":
				if (parser_result.parameters) {
					return dg.language.valid_expression._resolveParameters(parser_result.parameters);
				} else if (parser_result.identifiers) {
					return dg.language.valid_expression._resolveIdentifiers(parser_result.identifiers);
				}
				break;

			case "OUT":
			case "WHILE":
			case "FOR":
			case "DOWHILE":
			case "IF":
				return dg.language.valid_expression._resolveIdentifiers(parser_result.identifiers);
				break;

			case "OP":
				return dg.language.valid_expression._resolveStatements(parser_result.statements);
				break;

			case "FUNCTION":
				var errorF = dg.language.valid_expression._resolveFunctionName(parser_result.functionName);
				if (errorF) {
					return errorF;
				}
				return dg.language.valid_expression._resolveParameters(parser_result.parameters);
				break;

			default:
				return "???";
		}
	},

	_resolveStatements: function(statements) {
		var errors = "";
		for (var i = 0; i < statements.length; i++) {
			if (statements[i]) {
				if (statements[i].type == "declaration") {
					errors += dg.language.valid_expression._resolveDeclaration(statements[i]);
				} else if (statements[i].type == "expression") {
					errors += dg.language.valid_expression._resolveExpression(statements[i]);
				} else if (statements[i].type == "return") {
					// XXX check if function???
					errors += dg.language.valid_expression._resolveExpression(statements[i]);
				}
			}
		}
		return errors;
	},

	_resolveDeclaration: function(declaration) {
		declaration.declarators.reverse();

		var error = "";

		for (var i = 0; i < declaration.declarators.length; i++) {
			if (declaration.declarators[i].identifiers) {
				error = dg.language.valid_expression._resolveIdentifiers(declaration.declarators[i].identifiers);
				if (error) {
					return error;
				}
			}
			error = dg.language.valid_expression._resolveParameters([{
				identifier: declaration.declarators[i].value,
				dataType: declaration.declarationType
			}]);
			if (error) {
				return error;
			}
		}

		return "";
	},

	_resolveExpression: function(expression) {
		return dg.language.valid_expression._resolveIdentifiers(expression.identifiers);
	},

	_resolveFunctionName: function(functionName) {
		if (dg.language.reserved_names.indexOf(functionName) !== -1) {
			return "El nombre de la función \"" + functionName +
				"\" no puede ser utilizado. Es una palabra reservada\n";
		} else {
			dg.language.valid_expression.variables.push(functionName);
		}
	},

	_resolveParameters: function(parameters) {
		var errors = "";
		for (var i = 0; i < parameters.length; i++) {
			if (dg.language.valid_expression.variables.indexOf(parameters[i].identifier) !== -1) {
				errors += "El identificador \"" + parameters[i].identifier + "\" ya está definido\n";
			} else if (dg.language.reserved_names.indexOf(parameters[i].identifier) !== -1) {
				errors += "El identificador \"" + parameters[i].identifier +
					"\" no puede ser utilizado. Es una palabra reservada\n";
			}
		}
		if (errors) {
			return errors;
		} else {
			for (var i = 0; i < parameters.length; i++) {
				dg.language.valid_expression.variables.push(parameters[i].identifier);
			}
			return "";
		}

	},

	_resolveIdentifiers: function(identifiers) {
		if (identifiers) {
			var errors = "";
			for (var i = 0; i < identifiers.length; i++) {
				errors += dg.language.valid_expression._resolveIdentifier(identifiers[i]);
			}
			return errors;
		}
	},

	_resolveIdentifier: function(identifier) {
		if (dg.language.valid_expression.variables.indexOf(identifier) === -1 &&
			dg.language.declared_variables.indexOf(identifier) === -1 &&
			dg.language.declared_functions().indexOf(identifier) === -1) {
			if (dg.language.reserved_names.indexOf(identifier) !== -1) {
				return "El identificador \"" + identifier +
					"\" no puede ser utilizado. Es una palabra reservada\n";
			} else {
				return "El identificador \"" + identifier + "\" no esta definido\n";
			}
		}
		return "";
	},

	start: function(expression) {
		return "";
	},
	end: function(expression) {
		return "";
	},

	in: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgIN");
	},
	out: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgOUT");
	},
	op: function(expression) {
		if (expression[expression.length - 1] !== ";")
			expression += ";";
		return dg.language.valid_expression._parse(expression, "dgOP");
	},
	while: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgWHILE");
	},
	for: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgFOR");
	},
	dowhile: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgDOWHILE");
	},
	if: function(expression) {
		return dg.language.valid_expression._parse(expression, "dgIF");
	},
	"function": function(expression) {
		return dg.language.valid_expression._parse(expression, "dgFUNCTION");
	}
};


dg.language.reserved_names = ["auto", "break", "case", "char", "const", "continue", "default", "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "inline", "int", "long", "register", "restrict", "return", "short", "signed", "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "_Bool", "_Complex", "_Imaginary", "main", "__r__0__"];

dg.language.declared_variables = ["abort", "abs", "acos", "asin", "atan", "atan2", "atexit", "atof", "atoi", "atol", "bsearch", "btowc", "calloc", "ceil", "clearerr", "cos", "cosh", "div", "erf", "erfc", "exit", "exp", "fabs", "fclose", "fdopen5", "feof", "ferror", "fflush1", "fgetc1", "fgetpos1", "fgets1", "fgetwc6", "fgetws6", "fileno5", "floor", "fmod", "fopen", "fprintf", "fputc1", "fputs1", "fputwc6", "fputws6", "fread", "free", "freopen", "frexp", "fscanf", "fseek1", "fsetpos1", "ftell1", "fwide6", "fwprintf6", "fwrite", "fwscanf6", "gamma", "getc1", "getchar1", "getenv", "gets", "getwc6", "hypot", "j0", "j1", "jn", "labs", "ldexp", "ldiv", "log", "log10", "malloc", "mblen", "mbstowcs", "mbtowc", "memchr", "memcmp", "memcpy", "memmove", "memset", "modf", "nextafter", "nextafterl", "nexttoward", "nexttowardl", "perror", "pow", "printf", "putc1", "putchar1", "putenv", "puts", "putwc6", "qsort", "quantexpd32", "quantexpd64", "quantexpd128", "quantized32", "quantized64", "quantized128", "samequantumd32", "samequantumd64", "samequantumd128", "rand", "rand_r", "realloc", "remove", "rename", "rewind1", "scanf", "setbuf", "setvbuf", "sin", "sinh", "snprintf", "sprintf", "sqrt", "srand", "sscanf", "strcat", "strchr", "strcmp", "strcoll", "strcpy", "strcspn", "strerror", "strlen", "strncat", "strncmp", "strncpy", "strpbrk", "strrchr", "strspn", "strstr", "strtod", "strtod32", "strtod64", "strtod128", "strtof", "strtok", "strtok_r", "strtol", "strtold", "strtoul", "strxfrm", "system", "tan", "tanh", "tmpfile", "tmpnam", "ungetc1", "ungetwc6", "vfprintf", "vfscanf", "vfwprintf6", "vfwscanf", "vprintf", "vscanf", "vsprintf", "vsnprintf", "vsscanf", "vswscanf", "vwscanf", "wcstombs", "wctomb", "y0", "y1", "yn"];

dg.language.declared_functions = () => Object.keys(JSON.parse(localStorage.getItem("functions") || "{}"));
