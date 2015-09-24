var gulp = require('gulp'),
	htmlrenderer = require('./'),
	fillCache = htmlrenderer.fillCache,
	render = htmlrenderer.render,
	cache = htmlrenderer.cache,
	gulpFilter = require('gulp-filter'),
	watch = require('gulp-watch'),
	batch = require('gulp-batch');
var removeHtmlComments = require('gulp-remove-html-comments');


htmlrenderer.addMacro('template', ['id', 'src'], function(id, src) {
	return '<script id="' + id + '" type="text/ng-template"><%include src="' + src + '"%></script>';
});

gulp.task('decoratePartials', function() {
	return gulp.src(['../pekaotb/tb/src/tb-app/tb.html'])
		.pipe(htmlrenderer.decorator()
			.vars({
				stylesPath: 'styles.css',
				scriptsPath: function() {
					return 'scripts.js'
				}
			})
			.macro('template')
			.fn(function(content) {
				return 'a' + content + 'x';
			})
			.apply())
		.pipe(htmlrenderer.cache());
})

gulp.task('render', ['decoratePartials'], function() {
	return gulp.src('../pekaotb/tb/src/tb-app/tb.html', {read: false})
		.pipe(render())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['render'], function () {
	var filter = gulpFilter(['test1.html']);

	watch(['../pekaotb/tb/src/**/*.html'], batch(function (events, done) {
        gulp.start('render', done);
    }));
	//gulp.watch(['src/**/*.html'], ['render']);
	// return gulp.src(['test/test1.html'], {cwd: 'src'})
	//   		.pipe(render())
	//         .pipe(gulp.dest('dist'));

	// gulp.src(['test/*.html', 'test2/*.html'], {cwd: 'src'})
	//  .pipe(watch(['**/*.html'], {cwd: 'src'}, batch(function(events, cb) {
	//   	console.log('inside batch')
	//   	return gulp.src(['test/test1.html'], {cwd: 'src'})
	//   		.pipe(render())
	//          .pipe(gulp.dest('dist'));
	//   })))
 //     .pipe(cache());

});

