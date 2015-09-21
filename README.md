# gulp-template [![Build Status](https://travis-ci.org/sindresorhus/gulp-template.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-template)

> Render/precompile [Lo-Dash/Underscore templates](http://lodash.com/docs#template)

*Issues with the output should be reported on the Lo-Dash [issue tracker](https://github.com/lodash/lodash/issues).*


## Install

```
$ npm install --save-dev gulp-template
```


## Usage

### `src/greeting.html`

```erb
<h1>Hello <%= name %></h1>
```

### `gulpfile.js`

```js
var gulp = require('gulp');
var template = require('gulp-template');

gulp.task('default', function () {
	return gulp.src(['test/*.html'], {cwd: 'src'})
			 .pipe(watch(['**/*.html'], {cwd: 'src'}, batch(function(events, cb) {
			 	return gulp.src(['test/test1.html'], {cwd: 'src'})
			 		.pipe(render())
			        .pipe(gulp.dest('dist'));
			 })))
		     .pipe(cache());
});
```

### `dist/greeting.html`

```html
<h1>Hello Sindre</h1>
```


## API

### template(data, [options])

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
