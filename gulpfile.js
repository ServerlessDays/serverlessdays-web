var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var minifyInline = require('gulp-minify-inline');
var pump = require('pump');
var historyApiFallback = require('connect-history-api-fallback');
var fileinclude = require('gulp-file-include');
var browserSync = require('browser-sync').create();

gulp.task('compress', function(cb) {
    pump([
            gulp.src('src/*.js'),
            uglify(),
            gulp.dest('dist')
        ],
        cb
    );
});

gulp.task('fileinclude', function() {
    gulp.src(['src/html/**/*.html'])
      .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
      }))
      .pipe(gulp.dest('src/html-compiled/'))
      .pipe(browserSync.stream());
  });

gulp.task('minify', ['fileinclude'], function() {
    return gulp.src('src/html-compiled/**/*.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(minifyInline())
        .pipe(gulp.dest('dist'));
});

gulp.task('copy', function() {
    return gulp.src([
            'src/_redirects',
            'src/*.xml',
            'src/*.txt'
        ])
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['minify', 'compress', 'copy']);

gulp.task('include-watch', ['fileinclude'], browserSync.reload);

gulp.task('watch', ['fileinclude', 'browser-sync'], function () {
    "use strict";
    gulp.watch("./src/html/*.html", ['include-watch']);
    gulp.watch("./src/html/*.json", ['include-watch']);
});

function simpleURLRewrite(req,res,next) {
    if (req.url === '/') {
        req.url = "/index/";
    }
    if (req.url.endsWith('/')) {
        req.url = req.url.slice(0, -1) + ".html";
    }
    return next();
}

// Static server
gulp.task('browser-sync', ['fileinclude'], function() {
    browserSync.init({
        server: {
            baseDir: "./src/html-compiled/",
        },
        middleware: simpleURLRewrite,
    });
});

gulp.task('default', ['watch']);
