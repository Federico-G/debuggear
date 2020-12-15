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
