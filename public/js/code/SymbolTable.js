dg.code.SymbolTable = function() {
	this.table = {};
}

dg.code.SymbolTable.prototype.addSymbol = function(name, symbol) {
	if (typeof name === "string" && typeof symbol === "object" && symbol.constructor === dg.code.Symbol) {
		return this.table[name] = symbol;
	}
	return null;
}

dg.code.SymbolTable.prototype.clone = function() {
	var st = new dg.code.SymbolTable;
	// st.table = $.extend(true, {}, this.table);
	st.table = _.cloneDeep(this.table);
	return st;
}
