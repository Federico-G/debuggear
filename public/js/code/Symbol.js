// TODO move to language
dg.code.Symbol = function(type, data) { // TODO add size to add arrays
	if (!validType(type)) {
		return null;
	}

	this.type = type;
	this.data = createData(type, data);

	/* private functions */

	function createData(type, data) {
		var variable = new dg.code.Symbol.type[type](1);
		if (data) {
			switch (type) {
				case "char":
					variable[0] = data[0].charCodeAt(0);
					break;
				case "short int":
				case "int":
				case "long int":
					var match = /^([+-]?[0-9]+).*/.exec(data);
					if (match) {
						variable[0] = +match[1];
					}
					break;
				case "float":
				case "double":
					var match = /^([+-]?(?:[0-9]+(?:[.][0-9]*)?|[.][0-9]+)).*/.exec(data);
					if (match) {
						variable[0] = +match[1];
					}
					break;
			}
		}
		return variable;
	}

	function validType(type) {
		return Object.keys(dg.code.Symbol.type).indexOf(type) !== -1;
	}
}

dg.code.Symbol.type = {
	"char": Uint8Array,
	"string": Uint8Array,
	"short int": Int16Array,
	"int": Int32Array,
	"long int": Int32Array,
	"float": Float32Array,
	"double": Float64Array
};

dg.code.Symbol.prototype.codeVariable = function(name) {
	var variable;
	switch (this.type) {
		case 'char':
			variable = "'" + this.data + "'";
			break;
		case 'string':
			variable = "\"" + this.data + "\"";
			break;
		default:
			variable = this.data;
	}
	return this.type.replaceAll("_", " ") + " " + name + " = " + variable + ";\n";
}

dg.code.Symbol.prototype.codePrint = function(name) {
	var format = dg.language.typeToFormat(this.type);
	return "printf(\"" + format + "\\n\", " + name + ");\n";
}

dg.code.Symbol.prototype.toString = function() {
	switch (this.type) {
		case "char":
			return String.fromCharCode(this.data[0]);
		case "string":
			var aux = [];
			for (var i = 0; i < this.data.length; i++) {
				if (!this.data[i]) {
					break;
				}
				aux.push(String.fromCharCode(this.data[i]));
			}
			return aux.join("");
		default:
			return this.data[0];
	}
}
