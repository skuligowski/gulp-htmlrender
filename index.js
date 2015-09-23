'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var multimatch = require('multimatch');
var template = _.template;
var path = require('path');
var fs = require('fs');

var varsCache = {},
	partialsCache = {},

	includeRegExp = new RegExp("<%include([^>]+)%>", "gim"),
	templateRegExp = new RegExp("<%template([^>]+)%>", "gim");

	var getAttr = function(attr, content) {
		var regExp = new RegExp(attr + '="([0-9a-zA-Z\/_.-]+)"');
		var attrMatch = content.match(regExp);
		if (!attrMatch) {
			return null;
		}

		return attrMatch[1];
	};

	var renderTemplates = function(html) {
		return html.replace(templateRegExp, function(all, content) {
			var id = getAttr('id', content),
				src = getAttr('src', content);

			return '<script id="' + id + '" type="text/ng-template"><%include src="' + src + '"%></script>';
		});
	};

	var renderData = function(html) {
		_.forEach(varsCache, function(value, prop) {
			var re = new RegExp('<%=\\s*'+prop+'\\s*%>', 'g');
			html = html.replace(re, value);
		});
		return html;
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
		console.log('updating: ' + partialPath)
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
			console.log('ERROR: Partial ' + partialPath + 'does not exists');
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
		if (!partial || partial.mtime < vinylFile.stat.mtime) {
			cachePartial(vinylFile.path, vinylFile.contents.toString('utf8'), vinylFile.stat.mtime);
		}
	}

	var renderPartial = function(partialPath) {
		var partial = getPartial(partialPath);
		return includePartial(partial);
	};

	var evaluateVars = function(vars) {
		var oldVars = _.clone(varsCache);
		varsCache = {};
		_.forEach(vars, function(value, paramName) {
			varsCache[paramName] = _.isFunction(value) ? value() : value;
		});
		return !_.isEqual(oldVars, varsCache);
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

module.exports.render = function() {
	return render();
};

module.exports.cache = function() {
	return cache();
}
