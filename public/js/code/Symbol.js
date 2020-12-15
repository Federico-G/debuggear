dg.code.Symbol = function(type, data) {
	if (!validType(type)) {
		return null;
	}

	this.type = type;
	this.data = createData(data);

	/* private functions */

	function createData(type, data) {
		var variable;
		if (type === "string") {
			variable = new dg.code.Symbol.type[type](200);
			if (typeof data === "string") {
				for (var i = 0; i < data.length; i++) {
					variable[i] = data[i].charCodeAt(0);
				}
			}
		} else {
			variable = new dg.code.Symbol.type[type](1);
			if (data) {
				switch (type) {
					case "char":
						variable[0] = data[0].charCodeAt(0);
						break;
					case "short_int":
					case "int":
					case "long_int":
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
	"short_int": Int16Array,
	"int": Int32Array,
	"long_int": Int32Array,
	"float": Float32Array,
	"double": Float64Array
};

sg.code.Symbol.prototype.toString = function() {
	switch (this.type) {
		case "char":
			return String.fromCharCode(this.data[0]);
		case "string":
			var aux = [];
			for (var i = 0; i < this.data.length) {
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