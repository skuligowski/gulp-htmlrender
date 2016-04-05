# gulp-htmlrender 

## Install

```
$ npm install --save-dev gulp-htmlrender
```


## Basic usage

#### `src/index.html`
```html
<div class="main">
	<%include src="layout/header.html"%>
</div>
```

#### `src/layout/header.html`
```html
<h3 class="header">Hello!</h3>
```

#### `gulpfile.js`
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

#### `dist/index.html`
```html
<div class="main">
	<h3 class="header">Hello!</h3>
</div>
```


## Glob patterns for `src` attribute of `include` tag

Glob patterns can be used to include more than one partial at once. All included files will be separated with `\n` delimiter.

```html
<div class="main">
	<%include src="layout/**/*.html"%>
</div>
```


## Custom templates - AngularJS inlined template example

Custom tags can be defined to render more complicated content. 

#### `src/index.html`
```html
<body>
	<%template id="tpl/some-template" src="modules/some-template.html"%>
</body>
```

#### `src/modules/some-template.html`
```html
<div>Some template</div>
```

#### `gulpfile.js`
```js
var gulp = require('gulp');
var htmlrender = require('gulp-htmlrender');

htmlrender.addTemplate('template', 
	'<script id="{{id}}" type="text/ng-template">'+
		'<%include src="{{src}}"%>'+
	'</script>');

gulp.task('render', function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});
```

#### `dist/index.html`
```html
<body>
	<script id="tpl/some-template" type="text/ng-template">
		<div>Some template</div>
	</script>
</body>
```


## Modifying partials before rendering

Before each rendering phase, some individual partials can be decorated and pushed in the renderer cache. You can pipe custom gulp plugins directly before `htmlrenderer.cache()` invocation.

#### `gulpfile.js`
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



## Decorating with static and dynamic variables

More advanced decoration allows to render inlined variables inside of partials.

#### `src/index.html`
```html
<div class="version"><%=version%></div>
<div class="timestamp"><%=timestamp%></div>
```

#### `gulpfile.js`
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

#### `dist/index.html`
```html
<div class="version">2.0.1</div>
<div class="timestamp">1443219469588</div>
```


## Chaining multiple decorators

#### `gulpfile.js`
```js
gulp.task('decorate', function() {
	return gulp.src('src/index.html')
		.pipe(htmlrender.decorator()
			.vars({
				staticVar: 'value',
				dynamicVar: function() {
					return 'value'
				}
			})
			.fn(function(content) {
				return '<div>' + content + '</div>';
			})
			.apply())
		.pipe(htmlrender.cache());
});
```


## Transforming included content at render phase

Transform functions can be defined to modify included partial before rendering. 

#### `src/templates.yaml`
```yaml
tpl/main-view: ../layout/main.html
tpl/modal-view: ../layout/modal.html
```

#### `src/index.html`
```html
<%include src="templates.yaml" transform="yaml2html"%>
```

#### `gulpfile.js`
```js
htmlrender.addTransform('yaml2html', function(yamlString) {
	var yamlObject = yamljs.parse(yamlString);
	return _.map(yamlObject, function(tpl, id) { 
		return '<script id="' + id + '"><%include src="' + tpl + '"%></script>';
	})
});

gulp.task('render', function() {
	return gulp.src('src/index.html', {read: false})
		.pipe(htmlrender.render())
		.pipe(gulp.dest('dist'));
});
```

#### `src/index.html` transformed

The following content will be saved in partials cache. During rendering all includes will be resolved to referenced files.

```html
<script id="tpl/main-view"><%include src="../layout/main.html"%></script>
<script id="tpl/modal-view"><%include src="../layout/modal.html"%></script>
```


## API

### render()
### cache()
### decorator()
### addTemplate()
### addTransform()


## Release history

### 0.3.0
1. Glob patterns in `src` attribute for `include` tag
2. Transforming functions with declarative usage

### 0.2.0
1. Custom templates
2. Decorating partials before putting to the cache

## License

MIT © [Sebastian Kuligowski](http://kuligowski.pl)
