'use strict';

import gulp from 'gulp';
import sequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';

let reload = browserSync.reload;
let plugins = gulpLoadPlugins();
// add browserify to use import *.

const DIRS = {
  src: 'app',
  dest: 'build',
  js: { app: 'js/app.js', libs: 'js/libs.js' }
};

const JS_DEPENDENCIES = [
  'node_modules/angular/angular.js',
  'node_modules/angular-ui-router/release/angular-ui-router.js',
  'node_modules/jquery/dist/jquery.js',
  'node_modules/bootstrap/dist/js/bootstrap.js'
];

const CSS_DEPENDENCIES = [
  'node_modules/bootstrap/dist/css/bootstrap.css',
  'node_modules/bootstrap/dist/css/bootstrap-theme.css'
];

const PATHS = {
  sass: [`${DIRS.src}/scss/*.scss`, `${DIRS.src}/scss/**/*.scss`],
  js: [`${DIRS.src}/js/*.js`, `${DIRS.src}/js/**/*.js`],
  html: [`${DIRS.src}/templates/*.html`, `${DIRS.src}/templates/**/*.html`]
};

// Handle sass changes.
gulp.task('sass', done => {
  return gulp.src(PATHS.sass)
    // TODO fix sourcemaps
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass())
    .pipe(plugins.concat('css/main.min.css'))
    .pipe(plugins.cleanCss())
    .pipe(plugins.sourcemaps.write(`../${DIRS.dest}`))
    .pipe(gulp.dest(DIRS.dest))
    .pipe(browserSync.stream({match: '**/*.css'}))
    .on('end', () => {
      gulp
        .src(CSS_DEPENDENCIES)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.cleanCss())
        .pipe(plugins.concat('css/styles.min.css'))
        .pipe(plugins.sourcemaps.write(`../${DIRS.dest}`))
        .pipe(gulp.dest(DIRS.dest))
        .pipe(browserSync.stream({match: '**/*.css'}))
    });
});

// Handle html changes.
gulp.task('html', done => {
  return gulp.src(PATHS.html)
    .pipe(gulp.dest(`${DIRS.dest}/templates`))
    .pipe(browserSync.stream({match: '**/*.html'}))
});

// Handle assets changes.
gulp.task('assets', done => {
  return gulp.src(`${DIRS.src}/assets/*`)
    .pipe(gulp.dest(`${DIRS.dest}/assets`));
});

// Handle js changes.
gulp.task('js', done => {
  return gulp.src(PATHS.js)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .pipe(plugins.concat(DIRS.js.app))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(DIRS.dest))
    .pipe(browserSync.stream({match: '**/*.js'}))
    .on('end', () => {
      gulp
        .src(JS_DEPENDENCIES)
        .pipe(plugins.concat(DIRS.js.libs))
        .pipe(gulp.dest(DIRS.dest));
    });
});

// Minify js
gulp.task('minjs', done => {
  return gulp
    .src(PATHS.js)
    .pipe(plugins.concat(DIRS.js.app))
    .pipe(plugins.babel())
    .pipe(plugins.uglify())
    .pipe(gulp.dest(DIRS.dest))
    .on('end', () => {
      gulp
        .src(JS_DEPENDENCIES)
        .pipe(plugins.concat(DIRS.js.libs))
        .pipe(plugins.uglify())
        .pipe(gulp.dest(DIRS.dest));
    });
});

// Start the development sever task.
gulp.task('server', () => {
  browserSync({
    notify: false,
    server: DIRS.dest,
    open: false,
    tunnel: false,
    port: 3000
  });
});

// Task for watching file changes and livereloading the development server.
gulp.task('watch', cb => {
  sequence(['sass', 'js', 'html', 'assets'], 'revision', ['server', 'watching'], cb);
});

gulp.task('watching', () => {
  gulp.watch(PATHS.js, ['js', reload]);
  gulp.watch(PATHS.sass, ['sass']);
  gulp.watch(PATHS.html, ['html']);
});

// Gulp default task.
gulp.task('default', ['watch']);

gulp.task('revision', () => {
  return gulp.src(`${DIRS.src}/index.html`)
    .pipe(gulp.dest(DIRS.dest))
    .pipe(plugins.revAppend())
    .pipe(gulp.dest(DIRS.dest));
});

// Build command
gulp.task('build', cb => sequence(['sass', 'minjs', 'html', 'assets'], 'revision', cb));
