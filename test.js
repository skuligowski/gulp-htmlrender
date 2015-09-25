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

it('should decorate using template', function (cb) {
	htmlrender.addTemplate('info', '<div class="{{class}}">{{text}}</div>');

	var stream = htmlrender.decorator().template('info').apply();
	var data = '<body><%info class="warn" text="This is the warning"%></body>';
	var expected = '<body><div class="warn">This is the warning</div></body>';

	assertDecorated(stream, data, expected, cb);
});

it('should not resolve missing param when template', function (cb) {
	htmlrender.addTemplate('info', '<div class="{{class}}">{{text}}</div>');

	var stream = htmlrender.decorator().template('info').apply();
	var data = '<body><%info class="warn"%></body>';
	var expected = '<body><div class="warn">{{text}}</div></body>';

	assertDecorated(stream, data, expected, cb);
});

it('should resolve with whitespaces', function (cb) {
	htmlrender.addTemplate('info', '<div class="{{ class }}">{{ text  }}</div>');

	var stream = htmlrender.decorator().template('info').apply();
	var data = '<body><%info class="warn" text="This is the info" %></body>';
	var expected = '<body><div class="warn">This is the info</div></body>';

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
