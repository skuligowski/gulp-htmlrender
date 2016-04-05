'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var data = require('gulp-data');
var htmlrender = require('./');
var path = require('path');
var fs = require('fs');


function assertDecorated(stream, content, expected, cb) {
	stream.on('data', function (data) {
		assert.equal(data.contents.toString(), expected);
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		contents: new Buffer(content)
	}));

	stream.end();
}

function assertRendered(file, cb) {
	var stream = htmlrender.render(),
		inFile = path.join(__dirname, 'fixtures', 'partials', file),
		outFile = path.join(__dirname, 'fixtures', 'rendered', file);

	stream.on('data', function (data) {
		assert.equal(data.contents.toString('utf8'), fs.readFileSync(outFile, 'utf8'));
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		path: inFile
	}));

	stream.end();
}

it('should decorate using custom function', function (cb) {
	var stream = htmlrender.decorator().fn(function(content) {
		return 'START_' + content + '_END';
	}).apply();
	var data = '<li>foo</li><li>bar</li>';
	var expected = 'START_<li>foo</li><li>bar</li>_END';

	assertDecorated(stream, data, expected, cb);
});

it('should decorate using static variables', function (cb) {
	var stream = htmlrender.decorator().vars({
		someVar: 'test',
		otherVar: 'other'
	}).apply();

	var data = '<li><%=someVar%></li><li><%=otherVar%></li>';
	var expected = '<li>test</li><li>other</li>';

	assertDecorated(stream, data, expected, cb);
});

it('should decorate using function variables', function (cb) {
	var stream = htmlrender.decorator().vars({
		someVar: 'test',
		otherVar: function() {
			return 'fn';
		}
	}).apply();

	var data = '<li><%=someVar%></li><li><%=otherVar%></li>';
	var expected = '<li>test</li><li>fn</li>';

	assertDecorated(stream, data, expected, cb);
});

it('should render without precacheing', function (cb) {
	assertRendered('simple.html', cb);
});

it('should render with simple include', function (cb) {
	assertRendered('simple-include.html', cb);
});

it('should render with relative includes', function (cb) {
	assertRendered('relative-include.html', cb);
});

it('should render with deeply nested includes', function (cb) {
	assertRendered('deeply-nested.html', cb);
});

it('should render angular template with include', function (cb) {
	htmlrender.addTemplate('template', '<script id="{{id}}" type="text/ng-template"><%include src="{{src}}"%></script>');
	assertRendered('angular-template.html', cb);
});

it('should render custom template with whitespaces and special chars', function (cb) {
	htmlrender.addTemplate('info', '<div class="{{  class }}">{{ text }}</div>');
	assertRendered('ws-in-template.html', cb);
});

it('should render nested templates', function (cb) {
	htmlrender.addTemplate('infobox', '<div class="infobox"><%info class="{{class}}" text="{{text}}"%></div>');
	htmlrender.addTemplate('info', '<div class="{{  class }}">{{ text }}</div>');
	assertRendered('nested-templates.html', cb);
});

it('should render include with glob patterns', function (cb) {
	assertRendered('glob-template.html', cb);
});

it('should not render file when glob pattern does not match', function (cb) {
	assertRendered('empty-glob-template.html', cb);
});
