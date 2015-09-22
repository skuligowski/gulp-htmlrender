var gulp = require('gulp'),
	htmlrenderer = require('./'),
	fillCache = htmlrenderer.fillCache,
	render = htmlrenderer.render,
	cache = htmlrenderer.cache,
	gulpFilter = require('gulp-filter'),
	watch = require('gulp-watch'),
	batch = require('gulp-batch');


gulp.task('render', function() {
	return gulp.src('test/test1.html', {cwd: 'src', read: false})
		.pipe(render())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['render'], function () {
	var filter = gulpFilter(['test1.html']);

	watch(['src/**/*.html'], batch(function (events, done) {
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

