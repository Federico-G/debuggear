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

dg.code.Tree.prototype.fromCode = function(elements) {
	function armar(elements, node) {
		var element, newNode, HTMLElement;
		for (var i = 0; i < elements.length; i++) {
			element = elements[i];
			HTMLElement = dg.shape.new(
				document.getElementById("shape-container"),
				element.shape, element.x, element.y, element.width, element.height, element.content
			);
			if (node.type == 'if') {
				newNode = node.addNode(element.shape.substring(6), HTMLElement, element.content, {
					"if": element.if
				});
			} else {
				newNode = node.addNode(element.shape.substring(6), HTMLElement, element.content);
			}
			if (element.overlapped.length) {
				armar(element.overlapped, newNode);
			}
		}
	}

	armar(elements, dg.code.pg.getMainNode());
}
