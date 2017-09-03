const gulp = require('gulp')
const path = require('path')
const $ = require('gulp-load-plugins')()
const autoprefixer = require('gulp-autoprefixer')
const minifyCSS = require('gulp-minify-css')
const uglify = require('gulp-uglify')

const paths = {
  src: {
    less: './src/styles/less/**',
    css: './src/styles/css/*.css',
    js: './src/js/*.js',
    jslib: './src/js/libs/*',
    data: './src/data/**',
    font: './src/font/**',
    pug: './src/pug/*.pug',
    images: './src/img/*'
  },
  dist: {
    html: './dist',
    css: './dist/styles',
    js: './dist/js',
    jslib: './dist/js/libs',
    data: './dist/data',
    font: './dist/font',
    images: './dist/img'
  }
}

gulp.task('pug', () => {
  gulp.src(paths.src.pug)
    .pipe($.pug({
      basedir: path.resolve()
    }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('less', () => {
  gulp.src(paths.src.less)
    .pipe($.less())
    .pipe(autoprefixer({
      browsers: ['last 3 versions'],
      cascade: false
    }))
    .pipe(minifyCSS({
      keepBreaks: true
    }))
    .pipe(gulp.dest(paths.dist.css))
})
gulp.task('css', () => {
  gulp.src(paths.src.css)
    .pipe(gulp.dest(paths.dist.css))
})

gulp.task('scripts', () => {
  gulp.src(paths.src.js)
    .pipe($.babel({
      presets: ['es2015']
    }))
    // .pipe(uglify())
    .pipe(gulp.dest(paths.dist.js))
})
gulp.task('jslib', () => {
  gulp.src(paths.src.jslib)
    .pipe(gulp.dest(paths.dist.jslib))
})

gulp.task('data', () => {
  gulp.src(paths.src.data)
    .pipe(gulp.dest(paths.dist.data))
})

gulp.task('font', () => {
  gulp.src(paths.src.font)
    .pipe(gulp.dest(paths.dist.font))
})

gulp.task('images', () => {
  gulp.src(paths.src.images)
    .pipe($.imagemin())
    .pipe(gulp.dest(paths.dist.images))
})

gulp.task('webserver', () => {
  gulp
    .src(paths.dist.html)
    .pipe($.webserver({
      port: 8080,
      livereload: true,
      directoryListing: false
    }))
})

gulp.task('watch', () => {
  gulp.watch(paths.src.pug, ['pug'])
  gulp.watch(paths.src.less, ['less'])
  gulp.watch(paths.src.data, ['data'])
  gulp.watch(paths.src.js, ['scripts'])
})

gulp.task('default', ['webserver', 'watch'])
gulp.task('build', ['pug', 'less', 'css', 'scripts', 'jslib', 'data', 'font'])
