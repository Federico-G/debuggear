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
