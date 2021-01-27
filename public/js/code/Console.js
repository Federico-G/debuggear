dg.code.Console = function() {
	this.lines = [];
}

dg.code.Console.prototype.log = function(string) {
	this.lines.push({
		type: "log",
		value: string
	});
}

dg.code.Console.prototype.error = function(string) {
	this.lines.push({
		type: "error",
		value: string
	});
}

dg.code.Console.prototype.info = function(string) {
	this.lines.push({
		type: "info",
		value: string
	});
}


dg.code.Console.prototype.clone = function() {
	var c = new dg.code.Console;
	c.lines = this.lines.slice(0);
	return c;
}

dg.code.Console.prototype.getLines = function() {
	return this.lines;
}

dg.code.Console.prototype.getHTML = function() {
	return this.lines.reduce(function(acc, line) {
		var css = "";
		switch (line.type) {
			case 'log':
				css = "";
				break;
			case 'error':
				css = "danger";
				break;
			default:
				css = line.type;
		}
		var ele = (css ? ("<span class='text-" + css + "'>") : ("<span>")) + line.value + "</span>"
		return acc + ele + "<br>"
	}, "");
}
