# gulp-template 

## Install

```
$ npm install --save-dev gulp-htmlrender
```


## Basic usage

### `src/index.html`

```html
<div class="main">
	<%include src="layout/header.html"%>
</div>
```

### `src/layout/header.html`

```html
<h3 class="header">Hello!</h3>
```

### `gulpfile.js`

```js
var gulp = require('gulp');
var htmlrender = require('gulp-htmlrender');

gulp.task('render', function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', function() {
	gulp.watch(['src/**/*.html'], ['render']);
});
```

### `dist/index.html`

```html
<div class="main">
	<h3 class="header">Hello!</h3>
</div>
```


## Modifying partials before rendering

### `gulpfile.js`

```js
var gulp = require('gulp');
var htmlrender = require('gulp-htmlrender');
var removeHtmlComments = require('gulp-remove-html-comments');

gulp.task('decorate', function() {
	return gulp.src('src/index.html')
		.pipe(removeHtmlComments())
		.pipe(htmlrender.cache());
});

gulp.task('render', ['decorate'], function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});
```


## Applying custom templates

### `src/index.html`

```html
<body>
	<%template id="tpl/some-template" src="modules/some-template.html"%>
</body>
```

### `src/modules/some-template.html`

```html
<div>Some template</div>
```

### `gulpfile.js`

```js
var gulp = require('gulp');
var htmlrender = require('gulp-htmlrender');

htmlrender.addTemplate('template', 
	'<script id="{{id}}" type="text/ng-template">'+
		'<%include src="{{src}}"%>'+
	'</script>');

gulp.task('decorate', function() {
	return gulp.src('src/index.html')
		.pipe(htmlrender.decorator().template('template').apply())
		.pipe(htmlrender.cache());
});

gulp.task('render', ['decorate'], function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});
```

### `dist/index.html`

```html
<body>
	<script id="tpl/some-template" type="text/ng-template">
		<div>Some template</div>
	</script>
</body>
```


## Decorating with static and dynamic variables

### `src/index.html`

```html
<div class="version"><%=version%></div>
<div class="timestamp"><%=timestamp%></div>
```

### `gulpfile.js`

```js
var gulp = require('gulp');
var htmlrender = require('gulp-htmlrender');

gulp.task('decorate', function() {
	return gulp.src('src/index.html')
		.pipe(htmlrender.decorator().
			.vars({
				version: '2.0.1',
				timestamp: function() {
					return new Date().getTime()
				}
			}).apply())
		.pipe(htmlrender.cache());
});

gulp.task('render', ['decorate'], function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});
```

### `dist/index.html`

```html
<div class="version">2.0.1</div>
<div class="timestamp">1443219469588</div>
```


## API

### render()
### cache()
### decorator()
### addTemplate()

## License

MIT © [Sebastian Kuligowski](http://kuligowski.pl)
