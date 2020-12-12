window.dg = window.dg || {};
dg.code = dg.code || {};


// SymbolTable
dg.code.SymbolTable = function() {
	this.table = {};
}

dg.code.SymbolTable.prototype.addSymbol = function(name, symbol) {
	if (typeof name === typeof "" && typeof symbol == typeof {} && symbol.constructor == dg.code.Symbol) {
		this.table[name] = symbol;
	}
}

dg.code.SymbolTable.prototype.clone = function() {
	var st = new dg.code.SymbolTable;
	st.table = Object.create(this.table);
	return st;
}

// Symbol
dg.code.Symbol = function(data, type) {
	this.data = data;
	if (!type) {
		this.type = (!isNaN(data) && !isNaN(parseFloat(data))) ? 'double' : (data.length === 1 ? 'char' : 'string');
	} else {
		this.type = type;
	}
}

dg.code.Symbol.prototype.toString = function() {
	return "[type=" + this.type + ", data=" + this.data + "]";
}


// Symbol
dg.code.Console = function() {
	this.lines = [];
}

dg.code.Console.prototype.log = function(string) {
	this.lines.push(string);
}

dg.code.Console.prototype.clone = function() {
	var c = new dg.code.Console;
	c.lines = this.lines.slice(0);
	return c;
}

dg.code.Console.prototype.getLines = function() {
	return this.lines;
}


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


// Tree
dg.code.Tree = function() {
	this.currentSymbolTable = new dg.code.SymbolTable();
	this.currentConsole = new dg.code.Console();
	this.mainNode = new dg.code.Node("main");
	this.currentNode = this.mainNode;
	this.history = [];
}

dg.code.Tree.prototype.getMainNode = function() {
	return this.mainNode;
}

dg.code.Tree.prototype.nextStep = function() {
	if (!this.currentNode) {
		return null;
	}
	var previousNode = this.getPreviousNode();
	this.history.push(new dg.code.Step(this.currentNode, this.currentSymbolTable.clone(), this.currentConsole.clone()));
	this.currentNode.run(this.currentSymbolTable, this.currentConsole);
	var that = this;
	this.currentNode.getNextNode(this.currentSymbolTable, previousNode, this.currentConsole).then(function(result) {
		that.currentNode = result;
	});
	return this.currentNode;

}

dg.code.Tree.prototype.prevStep = function() {
	if (this.history.length) {
		var step = this.history.pop();
		this.currentSymbolTable = step.getSymbolTable();
		this.currentConsole = step.getConsole();
		this.currentNode = step.getNode();
		return this.history.length ? this.history[this.history.length - 1].getNode() : null;
	}
	return null;
}

dg.code.Tree.prototype.getStepNumber = function() {
	return this.history.length;
}

dg.code.Tree.prototype.getPreviousNode = function() {
	return this.history.length ? this.history[this.history.length - 1].getNode() : null;
}

dg.code.Tree.prototype.setStep = function(stepNumber) {
	if (stepNumber < this.history.length) {
		this.history.splice(stepNumber + 1);
		var step = this.history[stepNumber];
		this.currentSymbolTable = step.getSymbolTable();
		return this.currentNode = step.getNode();
	}
}


// Step
dg.code.Step = function(node, symbolTable, console) {
	this.node = node;
	this.symbolTable = symbolTable;
	this.console = console;
}

dg.code.Step.prototype.getNode = function() {
	return this.node;
}

dg.code.Step.prototype.getSymbolTable = function() {
	return this.symbolTable;
}

dg.code.Step.prototype.getConsole = function() {
	return this.console;
}


// Node
dg.code.Node = function(type, element, expression) {
	this.type = type;
	this.element = element;
	this.expression = expression || null;
	this.parentNode = null;
	this.nextNode = null;
	this.prevNode = null;
	this.childrenNodes = [];
}

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
			var data = prompt("Ingrese un valor para: " + this.expression);
			if (!data) {
				console.error("");
			}
			symbolTable.addSymbol(this.expression, new dg.code.Symbol(data));
			break;
		case 'out':
			var symbol = symbolTable.table[this.expression];
			if (symbol) {
				console.log(this.expression + ": " + symbol);
			} else {
				console.log(this.expression);
			}
			break;
		case 'op':
			var data = await dg.code.solve(this.expression, symbolTable);
			// XXX turbio
			symbolTable.table = data[1].table;
	}
}