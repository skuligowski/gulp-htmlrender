'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var data = require('gulp-data');
var htmlrender = require('./');


it('should decorate using custom function', function (cb) {
	var stream = htmlrender.decorator().fn(function(content) {
		return 'START_' + content + '_END';
	}).apply();

	stream.on('data', function (data) {
		assert.equal(data.contents.toString(), 'START_<li>foo</li><li>bar</li>_END');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		contents: new Buffer('<li>foo</li><li>bar</li>')
	}));

	stream.end();
});

it('should decorate using static variables', function (cb) {
	var stream = htmlrender.decorator().vars({
		someVar: 'test',
		otherVar: 'other'
	}).apply();

	stream.on('data', function (data) {
		assert.equal(data.contents.toString(), '<li>test</li><li>other</li>');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		contents: new Buffer('<li><%=someVar%></li><li><%=otherVar%></li>')
	}));

	stream.end();
});

it('should decorate using function variables', function (cb) {
	var stream = htmlrender.decorator().vars({
		someVar: 'test',
		otherVar: function() {
			return 'fn';
		}
	}).apply();

	stream.on('data', function (data) {
		assert.equal(data.contents.toString(), '<li>test</li><li>fn</li>');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		contents: new Buffer('<li><%=someVar%></li><li><%=otherVar%></li>')
	}));

	stream.end();
});

it('should decorate using macro', function (cb) {
	var stream = htmlrender.decorator().vars({
		someVar: 'test',
		otherVar: function() {
			return 'fn';
		}
	}).apply();

	stream.on('data', function (data) {
		assert.equal(data.contents.toString(), '<li>test</li><li>fn</li>');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		contents: new Buffer('<li><%=someVar%></li><li><%=otherVar%></li>')
	}));

	stream.end();
});
