const { src, dest, watch, series } = require('gulp')
const htmlmin = require('gulp-htmlmin')
const uglify = require('gulp-uglify')
const minifyInline = require('gulp-minify-inline')
const minifyInlineJSON = require('gulp-minify-inline-json')
const pump = require('pump')
const historyApiFallback = require('connect-history-api-fallback')
const fileinclude = require('gulp-file-include')
const browserSync = require('browser-sync').create()
const del = require('del')
const plumber = require('gulp-plumber')

const compress = cb => {
  return pump([src('src/*.js'), uglify(), dest('dist')], cb)
}

const clean = () => {
  return del(['dist/**', 'src/html-compiled/**'])
}

const fileInclude = series(clean, () => {
  return src(['src/html/*.html'])
    .pipe(plumber())
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: '@file'
      })
    )
    .pipe(dest('src/html-compiled/'))
    .pipe(browserSync.stream())
})

const minify = series(fileInclude, () => {
  return src('src/html-compiled/**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(minifyInline())
    .pipe(minifyInlineJSON())
    .pipe(dest('dist'))
})

const copy = () => {
  return src(['src/_redirects', 'src/*.xml', 'src/*.txt']).pipe(dest('dist'))
}

const build = series(minify, compress, copy)

// Static server
const browserSyncTask = series(fileInclude, () => {
  browserSync.init({
    server: {
      baseDir: './src/html-compiled/'
    },
    middleware: simpleURLRewrite
  })
})

const browserSyncDist = series(build, () => {
  browserSync.init({
    server: {
      baseDir: './dist/'
    },
    middleware: simpleURLRewrite
  })
})

const includeWatch = series(fileInclude, browserSync.reload)

const watchBuild = series(fileInclude, browserSyncTask, function () {
  watch('./src/html/**/*.html', includeWatch)
  watch('./src/*.json', includeWatch)
})

const watchDist = series(build, () => {
  watch('./dist/*.html', browserSync.reload)
})

function simpleURLRewrite (req, res, next) {
  if (req.url === '/') {
    req.url = '/index'
  }
  if (req.url.indexOf('.') === -1) {
    req.url += '.html'
  }
  return next()
}

// const default = series(watchBuild)
const dist = series(watchDist, browserSyncDist)

exports.dist = dist
exports.browserSyncDist = browserSyncDist
exports.browserSyncTask = browserSyncTask
exports.watchDist = watchDist
exports.build = build
exports.watchBuild = watchBuild
exports.includeWatch = includeWatch
exports.copy = copy
exports.minify = minify
exports.fileInclude = fileInclude
exports.clean = clean
exports.compress = compress
exports.default = watchBuild
