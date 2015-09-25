var gulp = require('gulp');
var htmlrender = require('./');

htmlrender.addTemplate('template',
	'<script id="{{id}}" type="text/ng-template">'+
		'<%include src="{{src}}"%>'+
	'</script>');


gulp.task('render', function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', function() {
	gulp.watch(['src/**/*.html'], ['render']);
});
