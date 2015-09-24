'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var template = _.template;
var path = require('path');
var fs = require('fs');

var varsCache = {},
	partialsCache = {},
	macros = {},
	varRegExpCache = {},
	includeRegExp = new RegExp("<%include([^>]+)%>", "gim");

	var getAttr = function(attr, content) {
		var regExp = new RegExp(attr + '="([0-9a-zA-Z\/_.-]+)"');
		var attrMatch = content.match(regExp);
		if (!attrMatch) {
			return null;
		}

		return attrMatch[1];
	};


	var includePartial = function(partial) {
		var dir = partial.dir,
			html = partial.content,
			matches = html.match(includeRegExp);

		if (!matches) {
			return html;
		}

		for(var i = 0, max = matches.length; i < max; i++) {
			var src = getAttr('src', matches[i]),
				childPartialPath = path.join(dir, src),
				childPartial = getPartial(childPartialPath);

			if (typeof childPartial !== "undefined") {
				html = html.replace(matches[i], includePartial(childPartial));
			}
		}

		return html;
	};

	function getPartialStat(partialPath) {
		try {
			return fs.statSync(partialPath);
		} catch(e) {
			return false;
		}
	}

	function cachePartial(partialPath, content, mtime) {
		return partialsCache[partialPath] = {
			content: content,
			mtime: mtime,
			dir: path.dirname(partialPath)
		}
	}

	function getPartial(partialPath) {
		var partial = partialsCache[partialPath],
			stat = getPartialStat(partialPath);

		if (!stat) {
			console.log('ERROR: Partial ' + partialPath + ' does not exists');
			return undefined;
		}

		if (!partial || partial.mtime < stat.mtime) {
			var partialContent = fs.readFileSync(partialPath, 'utf8');
			partial = cachePartial(partialPath, partialContent, stat.mtime);
		}

		return partial;
	}

	function updatePartialFromVinyl(vinylFile) {
		var partial = partialsCache[vinylFile.path];
		cachePartial(vinylFile.path, vinylFile.contents.toString('utf8'), vinylFile.stat.mtime);
	}

	function addMacro(name, attrs, generateFn) {
		var macroRegExp = new RegExp('<%' + name + '([^>]+)%>', 'gim'),
			getAttrFns = [];

		for(var i = 0; i < attrs.length; i++) {
			var attrRegExp = new RegExp(attrs[i] + '="([0-9a-zA-Z\/_.-]+)"');
			getAttrFns.push(function(content) {
				var attrMatch = content.match(attrRegExp);
				return attrMatch ? attrMatch[1] : null;
			});
		}

		macros[name] = function(html) {
			return html.replace(macroRegExp, function(all, content) {
				var callParams = [];
				for(var i = 0; i < getAttrFns.length; i++)
					callParams[i] = getAttrFns[i](content);

				return generateFn.apply(this, callParams);
			});
		};
	}

	var renderPartial = function(partialPath) {
		var partial = getPartial(partialPath);
		return includePartial(partial);
	};




function cache() {
	return through.obj(function (file, enc, cb) {
		updatePartialFromVinyl(file);
		this.push(file);
		cb();
	});
}


function render() {
	return through.obj(function (file, enc, cb) {
		console.log('rendering: ' + file.path)
		var newFile = file.clone({contents: false});
		newFile.contents = new Buffer(renderPartial(newFile.path));
		this.push(newFile);
		cb();
	});
}


function getVarRegExp(varName) {
	return varRegExpCache[varName] || (varRegExpCache[varName] = new RegExp('<%=\\s*'+varName+'\\s*%>', 'g'));
}

function createVarDecorator(varName, value) {
	return function(content) {
		return content.replace(getVarRegExp(varName), value);
	}
}

function createVarsDecorators(vars) {
	var decoratorFns = [];
	for(var varName in vars) {
		var value = typeof vars[varName] === 'function' ? vars[varName]() : vars[varName];
		decoratorFns.push(createVarDecorator(varName, value));
	}
	return decoratorFns;
}

function createDecorator() {
	var decoratorFns = [],
		argsToArray = Array.prototype.slice;

	var api = {
		vars: function(vars) {
			decoratorFns = decoratorFns.concat(createVarsDecorators(vars));
			return api;
		},
		macro: function(macroName) {
			decoratorFns.push(function(content) {
				return macros[macroName](content);
			});
			return api;
		},
		fn: function(fn) {
			decoratorFns.push(fn);
			return api;
		},
		apply: function() {
			return through.obj(function (file, enc, cb) {
				var contents = file.contents.toString('utf8');
				for (var i = 0; i < decoratorFns.length; i++)
					contents = decoratorFns[i](contents);

				var newFile = file.clone({contents: false});
				newFile.contents = new Buffer(contents);
				this.push(newFile);
				cb();
			});
		}
	};

	return api;
}

module.exports.render = function() {
	return render();
};

module.exports.cache = function() {
	return cache();
}

module.exports.decorator = function() {
	return createDecorator();
};
module.exports.addMacro = addMacro;
