dg.code.Node = function(type, element, expression) {
	if (!validType(type)) {
		return null;
	}

	this.type = type;
	this.element = element;
	this.expression = expression || null;
	this.parentNode = null;
	this.nextNode = null;
	this.prevNode = null;
	this.childrenNodes = [];

	/* private functions */

	function validType(type) {
		return dg.code.Node.type.indexOf(type) !== -1;
	}
}

dg.code.Node.type = [
	"main", "start", "end", "in", "out", "op", "while", "dowhile", "for", "if"
];


dg.code.Node.prototype.addNode = function(type, element, expression, opts) {
	var newNode = new dg.code.Node(type, element, expression);
	if (opts) {
		for (var opt in opts) {
			newNode[opt] = opts[opt];
		}
	}

	// Sibling - Sibling
	if (this.childrenNodes.length) {
		var prevNode;
		if (this.type == 'if') {
			prevNode = this.childrenNodes.slice().reverse().find(x => x.if === newNode.if);
		} else {
			prevNode = this.childrenNodes[this.childrenNodes.length - 1];
		}
		if (prevNode) {
			prevNode.nextNode = newNode;
			newNode.prevNode = prevNode;
		}
	}
	// Parent - Child
	newNode.parentNode = this;
	this.childrenNodes.push(newNode);

	return newNode;
}

dg.code.Node.prototype.getNextNode = async function(symbolTable, prevNode, console) {
	var returnNext = () => {
		if (this.nextNode) {
			return this.nextNode;
		} else {
			// XXX if parentNode -> if, recall returnNext, o getNextNode
			return this.parentNode;
		}
	};
	switch (this.type) {
		case 'main':
			if (!prevNode) {
				return this.childrenNodes[0];
			} else {
				// XXX old?
				console.info("Fin de ejecución");
				return null;
			}
			break;
		case 'end':
			console.info("Fin de ejecución");
			return null;
			break;
		case 'start':
		case 'in':
		case 'op':
		case 'out':
			return returnNext();
			break;
		case 'while':
			var data = await dg.language.solve("expression", this.expression, symbolTable);
			if (data.error) {
				console.error(data.error);
				return null;
			}

			// XXX turbio
			symbolTable.table = data.symbolTable.table;
			if (data.result) {
				if (this.childrenNodes.length) {
					return this.childrenNodes[0];
				} else {
					return this;
				}
			} else {
				return returnNext();
			}
			break;
		case 'dowhile':
			// XXX test cause i think evaluation 
			if (!this.childrenNodes.length) {
				return returnNext();
			}
			if (prevNode === this.childrenNodes[this.childrenNodes.length - 1]) {
				var data = await dg.language.solve("expression", this.expression, symbolTable);
				if (data.error) {
					console.error(data.error);
					return null;
				}

				// XXX turbio
				symbolTable.table = data.symbolTable.table;
				if (!data.result) {
					return returnNext();
				}
			}
			return this.childrenNodes[0];
			break;
		case 'for':
			var parts = this.expression.split(";");

			var data,
				prevChainingNode = this.prevNode || this.parentNode;
			if (prevChainingNode === prevNode) {
				data = await dg.language.solve("expression", parts[0], symbolTable);
			} else {
				data = await dg.language.solve("expression", parts[2], symbolTable);
			}
			if (data.error) {
				console.error(data.error);
				return null;
			}
			// XXX turbio
			symbolTable.table = data.symbolTable.table;


			data = await dg.language.solve("expression", parts[1], symbolTable);
			if (data.error) {
				console.error(data.error);
				return null;
			}

			// XXX turbio
			symbolTable.table = data.symbolTable.table;
			if (data.result) {
				if (this.childrenNodes.length) {
					return this.childrenNodes[0];
				} else {
					return this;
				}
			} else {
				return returnNext();
			}
			break;
		case 'if':
			prevChainingNode = this.prevNode || this.parentNode;
			if (prevChainingNode !== prevNode) {
				// SEGUNDA VEZ
				return returnNext();
			}

			var data = await dg.language.solve("expression", this.expression, symbolTable);
			if (data.error) {
				console.error(data.error);
				return null;
			}

			// XXX turbio
			symbolTable.table = data.symbolTable.table;
			if (this.childrenNodes.length === 0) {
				return returnNext();
			}

			var nodeif = data.result ? "true" : "false";
			var childIf = this.childrenNodes.find(node => node.if === nodeif);
			return childIf ? childIf : returnNext();
			break;
	}
}

dg.code.Node.prototype.getElement = function() {
	return this.element;
}

// TODO use grammar to those things. Could de loaded in the symbols itselfs
dg.code.Node.prototype.run = async function(symbolTable, console) {
	switch (this.type) {
		case 'in':
			var expr = this.expression.split(" ");
			var name = expr.pop();
			var type = expr.join(" ");
			var data = prompt("Ingrese un valor de tipo " + type + " para: " + name);
			symbolTable.addSymbol(name, new dg.code.Symbol(type, data));
			break;
		case 'out':
			var out = [];
			var expr = this.expression.split(",");
			var exprTrim;
			for (var i = 0; i < expr.length; i++) {
				exprTrim = expr[i].trim();
				if (exprTrim[0] === '"') {
					out.push(exprTrim.substring(1, exprTrim.length - 1));
				} else if(/^[a-zA-Z_]$/.test(exprTrim[0])) {
					out.push(symbolTable.table[exprTrim].toString());
				} else {
					out.push(exprTrim);
				}
			}
			console.log(out.join(""));
			break;
		case 'op':
			var data = await dg.language.solve("statements", this.expression, symbolTable);
			if (data.error) {
				console.error(data.error);
				return null;
			}

			symbolTable.table = data.symbolTable.table;
			break;

		case 'function':

			break;
	}
}
