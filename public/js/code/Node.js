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

	function validExpression() {
		// TODO validExpression
	}
}

dg.code.Node.type = [
	"main", "in", "out", "op", "while", "dowhile", "for", "if"
];


dg.code.Node.prototype.addNode = function(type, element, expression) {
	var newNode = new dg.code.Node(type, element, expression);
	// Sibling - Sibling
	if (this.childrenNodes.length) {
		var prevNode = this.childrenNodes[this.childrenNodes.length - 1];
		prevNode.nextNode = newNode;
		newNode.prevNode = prevNode;
	}
	// Parent - Child
	newNode.parentNode = this;
	this.childrenNodes.push(newNode);

	if (type == 'if') {
		newNode.addNode('if-true');
		newNode.addNode('if-false');
	}

	return newNode;
}

dg.code.Node.prototype.getNextNode = async function(symbolTable, prevNode, console) {
	var returnNext = () => {
		if (this.nextNode) {
			return this.nextNode;
		} else {
			return this.parentNode;
		}
	};
	switch (this.type) {
		case 'main':
			if (!prevNode) {
				return this.childrenNodes[0];
			} else {
				console.log("Fin de ejecución");
				return null;
			}
			break;
		case 'in':
		case 'op':
		case 'out':
			return returnNext();
			break;
		case 'while':
			var data = await dg.code.solve(this.expression, symbolTable);
			// XXX turbio
			symbolTable.table = data[1].table;
			if (data[0]) {
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
			if (!this.childrenNodes.length) {
				return returnNext();
			}
			if (prevNode === this.childrenNodes[this.childrenNodes.length - 1]) {
				var data = await dg.code.solve(this.expression, symbolTable);
				// XXX turbio
				symbolTable.table = data[1].table;
				if (!data[0]) {
					return returnNext();
				}
			}
			return this.childrenNodes[0];
			break;
		case 'for':
			break;
		case 'if':
			break;
	}
}

dg.code.Node.prototype.getElement = function() {
	return this.element;
}

dg.code.Node.prototype.run = async function(symbolTable, console) {
	switch (this.type) {
		case 'in':
			var expr = this.expression.split(" ");
			var name = expr.pop();
			var type = expr.join("_");
			var data = prompt("Ingrese un valor de tipo " + type + " para: " + name);
			symbolTable.addSymbol(name, new dg.code.Symbol(type, data));
			break;
		case 'out':
			var out = [];
			var expr = this.expression.split(",");
			for (var i = 0; i < expr.length; i++) {
				if (expr[i][0] === '"') {
					out.push(expr[i].substring(1, expr[i].length - 1));
				} else {
					out.push(symbolTable.table[this.expression].toString());
				}
			}
			console.log(out.join(""));
			break;
		case 'op':
			// declaracion
			// guardado de datos
			// TODO cambiar
			var data = await dg.code.solve(this.expression, symbolTable);
			symbolTable.table = data[1].table;
	}
}
