dg.language.CodeToLanguage = function(elements, functions) {
	var variables = {};
	if (functions) {
		for (var i = 0; i < functions.length; i++) {
			variables[functions[i]] = "functions";
		}
	}

	function _parse(type, content) {
		dg.grammar.ParserStart = "dg" + type;
		var parser = new nearley.Parser(nearley.Grammar.fromCompiled(dg.grammar));
		parser.feed(content);
		return parser.results[0];
	}

	function _filter_true(element) {
		return element.if === "true";
	}

	function _filter_false(element) {
		return element.if === "false";
	}

	function process(shape, content) {
		var stype = shape.substring(6).toUpperCase();
		var parser_result;

		switch (stype) {
			case "IN":
				parser_result = _parse(stype, content);
				var type, name;
				if (parser_result.parameters) {
					name = parser_result.parameters[0].identifier;
					type = parser_result.parameters[0].dataType;
					variables[name] = type;
				} else {
					name = parser_result.identifiers[0];
					type = variables[name];
				}

				return ["scanf(\"" + dg.language.typeToFormat(type) + "\", &" + name + ");"];

			case "OUT":
				parser_result = _parse(stype, content);
				var contents = content.split(",");
				var content;
				var retornar = "";
				var extras = [""];
				var type, name, aux_content;
				for (var i = 0; i < contents.length; i++) {
					content = contents[i].trim();
					if (content[0] === "\"") {
						aux_content = content.replaceAll("%", "%%");
						retornar += aux_content.substring(1, aux_content.length - 1);
					} else if(/^[a-zA-Z_]$/.test(content[0])) {
						name = content;
						type = variables[name];
						retornar += dg.language.typeToFormat(type);
						extras.push(name);
					} else {
						retornar += aux_content;
					}
				}

				return ["printf(\"" + retornar + "\"" + (extras.length > 1 ? extras.join(", ") : "") + ");"];

			case "WHILE":
				parser_result = _parse(stype, content);
				return ["while (" + content + ")\n"];

			case "FOR":
				parser_result = _parse(stype, content);
				return ["for (" + content + ")\n"];

			case "DOWHILE":
				parser_result = _parse(stype, content);
				return ["do\n", "while (" + content + ");\n"];

			case "IF":
				parser_result = _parse(stype, content);
				return ["if (" + content + ")", "else", "{"];

			case "OP":
				content += content[content.length - 1] !== ";" ? ";" : "";
				parser_result = _parse(stype, content);
				var type;
				for (var i = 0; i < parser_result.statements.length; i++) {
					if (parser_result.statements[i].type === "declaration") {
						type = parser_result.statements[i].declarationType;
						for (var j = 0; j < parser_result.statements[i].declarators.length; j++) {
							variables[parser_result.statements[i].declarators[j].value] = type;
						}
					}
				}

				return [content];

			case "FUNCTION":
				parser_result = _parse(stype, content);
				for (var i = 0; i < parser_result.parameters.length; i++) {
					variables[parser_result.parameters[i].identifier] =
						parser_result.parameters[i].dataType;
				}

				// TODO use parser_result to prevent spaces?
				return content;

			default:
				return "";
		}
	}

	function parseChildren(elements, code, n) {
		var processed;
		for (var i = 0; i < elements.length; i++) {
			processed = process(elements[i].shape, elements[i].content);
			if (processed.length) {
				code.add(processed[0], n);
			}
			if (elements[i].overlapped.length) {
				code.add("{", n);
				if (elements[i].shape === "shape-if") {
					code = parseChildren(elements[i].overlapped.filter(_filter_true), code, n + 1);
					code.add("}", n);
					code.add(processed[1], n);
					code.add(processed[2], n);
					code = parseChildren(elements[i].overlapped.filter(_filter_false), code, n + 1);
					code.add("}", n);
				} else {
					code = parseChildren(elements[i].overlapped, code, n + 1);
					if (processed[1]) {
						code.add("} " + processed[1], n);
					} else {
						code.add("}", n);
					}
				}
			}
		}
		return code;
	}

	var code = [];
	code.add = function(x, indentation) {
		this.push("\t".repeat(indentation) + x);
	}
	if (elements[0].shape == "shape-function") {
		code.push(process(elements[0].shape, elements[0].content));
		code.push("{");
		parseChildren(elements.slice(1), code, 1);
	} else {
		code.push("#include <stdio.h>");
		code.push("#include <math.h>");
		code.push("#include <string.h>");
		code.push("#include <stdlib.h>");
		code.push("");
		
		var functions = JSON.parse(localStorage.getItem("functions"));
		for(var i in functions) {
			code.push(functions[i].language);
			code.push("");
		}

		code.push("int main()");
		code.push("{");
		parseChildren(elements, code, 1);
	}

	code.push("}");

	return code.join("\n") + "\n";
}

dg.language.typeToFormat = function(type) {
	var format;
	switch (type) {
		case 'char':
			format = "%c";
			break;
		case 'short_int':
			format = "%hd";
			break;
		case 'int':
			format = "%d";
			break;
		case 'long_int':
			format = "%ld";
			break;
		case 'float':
			format = "%f";
			break;
		case 'double':
			format = "%lf";
			break;
	}
	return format;
}
