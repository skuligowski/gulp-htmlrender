'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var fs = require('fs');

var varsCache = {},
	partialsCache = {},
	templates = {},
	varRegExpCache = {},
	attrRegExpCache = {},
	includeRegExp = /<%include([^>]+)%>/gim,
	attrTemplateRegExp = /\{\{[ ]*([a-zA-Z]+)[ ]*\}\}/gim,
	getSrcAttr = createGetAttrFn('src');

function renderPartial(partialPath) {
	var partial = getPartial(partialPath);
	return includePartial(partial);
}

function includePartial(partial) {
	var dir = partial.dir,
		html = partial.content,
		matches = html.match(includeRegExp);

	if (!matches) {
		return html;
	}

	for(var i = 0, max = matches.length; i < max; i++) {
		var src = getSrcAttr(matches[i]);
		if (!src) {
			gutil.log(gutil.colors.red('ERROR:'), 'Invalid src attribute in',
				gutil.colors.green(matches[i]), gutil.colors.blue('(' + partial.path + ')'));
			gutil.beep();
			continue;
		}

		var childPartialPath = path.join(dir, src),
			childPartial = getPartial(childPartialPath);

		if (typeof childPartial !== "undefined") {
			html = html.replace(matches[i], includePartial(childPartial));
		}
	}

	return html;
};

function getPartial(partialPath) {
	var partial = partialsCache[partialPath],
		stat = getPartialStat(partialPath);

	if (!stat) {
		gutil.log(gutil.colors.red('ERROR:'), 'Partial', partialPath, 'does not exists');
		gutil.beep();
		return undefined;
	}

	if (!partial || partial.mtime < stat.mtime) {
		var partialContent = fs.readFileSync(partialPath, 'utf8');
		partial = cachePartial(partialPath, partialContent, stat.mtime);
	}

	return partial;
}

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
		dir: path.dirname(partialPath),
		path: partialPath
	}
}

function updatePartialFromVinyl(vinylFile) {
	var partial = partialsCache[vinylFile.path];
	cachePartial(vinylFile.path, vinylFile.contents.toString('utf8'), vinylFile.stat.mtime);
}

function addTemplate(name, template) {
	var templateRegExp = new RegExp('<%' + name + '([^>]+)%>', 'gim'),
		attrs = resolveTemplateAttrs(template),
		getAttrFns = [];

	for(var i = 0; i < attrs.length; i++) {
		getAttrFns.push(createGetAttrFn(attrs[i]));
	}

	templates[name] = function(html) {
		return html.replace(templateRegExp, function(all, content) {
			var valuesMap = {};
			for (var i = 0; i < attrs.length; i++) {
				valuesMap[attrs[i]] = getAttrFns[i](content);
			}

			return template.replace(attrTemplateRegExp, function(all, attr) {
				return valuesMap[attr] || all;
			});
		});
	};
}

function resolveTemplateAttrs(template) {
	var match,
		existingAttrs = {},
		attrs = [];

	while(match = attrTemplateRegExp.exec(template)) {
		var attr = match[1];
		if (!existingAttrs[attr]) {
			attrs.push(attr);
			existingAttrs[attr] = true;
		}
	}
	return attrs;
}

function getAttrRegExp(attr) {
	return attrRegExpCache[attr] || (varRegExpCache[attr] = new RegExp(attr + '="([ 0-9a-zA-Z\/_.-]+)"'));
}

function createGetAttrFn(attr) {
	return function(html) {
		var attrMatch = html.match(getAttrRegExp(attr));
		return attrMatch ? attrMatch[1] : null;
	}
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
	for(var varName in vars) if (vars.hasOwnProperty(varName)) {
		var value = typeof vars[varName] === 'function' ? vars[varName]() : vars[varName];
		decoratorFns.push(createVarDecorator(varName, value));
	}
	return decoratorFns;
}

function createDecorator() {
	var decoratorFns = [];

	var api = {
		vars: function(vars) {
			decoratorFns = decoratorFns.concat(createVarsDecorators(vars));
			return api;
		},
		template: function(templateName) {
			decoratorFns.push(function(content) {
				return templates[templateName](content);
			});
			return api;
		},
		fn: function(fn) {
			decoratorFns.push(fn);
			return api;
		},
		apply: function() {
			return through.obj(function (file, enc, cb) {
				if (file.isNull()) {
					cb(null, file);
					return;
				}

				if (file.isStream()) {
					cb(new gutil.PluginError('gulp-htmlrender:decorator', 'Streaming not supported'));
					return;
				}

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

function cache() {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-htmlrender:cache', 'Streaming not supported'));
			return;
		}

		updatePartialFromVinyl(file);
		this.push(file);
		cb();
	});
}


function render() {
	return through.obj(function (file, enc, cb) {
		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-htmlrender:render', 'Streaming not supported'));
			return;
		}

		var newFile = file.clone({contents: false});
		newFile.contents = new Buffer(renderPartial(newFile.path));
		this.push(newFile);
		cb();
	});
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
module.exports.addTemplate = addTemplate;
