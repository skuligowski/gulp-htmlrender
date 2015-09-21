'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var multimatch = require('multimatch');
var template = _.template;
var path = require('path');

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

	var refreshPartials = function(files) {
		var modifiedPartials = [];
		_.forEach(files, function(partialPath) {
			var mtime = fs.statSync(partialPath).mtime,
				currentPartial = partialsCache[partialPath];

			if (!currentPartial || currentPartial.mtime < mtime) {
				var partial = fs.readFileSync(partialPath);
				partialsCache[partialPath] = {
					content: renderTemplates(renderData(partial.toString())),
					mtime: mtime
				};
				modifiedPartials.push(partialPath);
				grunt.log.writeln('Refreshing ' + partialPath);
			}
		});
		return modifiedPartials.length > 0;
	};

	var includeFile = function(dir, html) {
		var matches = html.match(includeRegExp);

		if (!matches) {
			return html;
		}

		for(var i = 0, max = matches.length; i < max; i++) {
			var src = getAttr('src', matches[i]),
				partialPath = path.join(dir, src),
				partial = partialsCache[partialPath];

			if (typeof partial !== "undefined") {
				var partialContent = includeFile(path.dirname(partialPath), partial.content);
				html = html.replace(matches[i], partialContent);
			} else {
				console.log('Partial not found: ' + partialPath);
			}
		}

		return html;
	};

	var renderPartial = function(partialPath) {
		var partial = partialsCache[partialPath];
		if (!partial) {
			console.log('Partial ' + partialPath + ' not found!');
		}
		return includeFile(path.dirname(partialPath), partial.content);
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
	var files = [];
	return through.obj(function (file, enc, cb) {
		partialsCache[file.path] = {
			content: file.contents.toString(enc)
		}
		console.log('caching: ' + file.path)
		this.push(file);
		cb();
	});
}


function render(pattern) {
	return through.obj(function (file, enc, cb) {
		console.log('rendering: ' + file.path)
		var newFile = file.clone({contents: false});
		newFile.contents = new Buffer(renderPartial(newFile.path));
		this.push(newFile);
		cb();
	});
}

module.exports.render = function (pattern) {
	return render(pattern);
};

module.exports.cache = function() {
	return cache();
}
