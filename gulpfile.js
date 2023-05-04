import gulp from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import pug from 'gulp-pug';
import browserSync from 'browser-sync';
import webpack from 'webpack-stream';
import imagemin from 'gulp-imagemin';
import { deleteAsync } from "del"
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import gulpif from 'gulp-if';
import changed from 'gulp-changed';

const sass = gulpSass(dartSass);

const modeProd = process.argv.includes('--build');
const modeDev = !process.argv.includes('--build');

const config = {
  src: {
    css: './src/styles/styles.scss',
    js: './src/scripts/index.js',
    html: './src/pages/index.pug',
    fonts: './src/fonts/**/*',
    img: './src/images/**/*',
  },
  watch: {
    css: './src/styles/**/*.scss',
    js: './src/scripts/**/*.js',
    html: './src/pages/**/*.pug',
    fonts: './src/fonts/**/*',
    img: './src/images/**/*',
  },
  build: {
    css: './build',
    js: './build',
    html: './build',
    img: './build/assets',
    fonts: './build/fonts',
  },
  clean: './build',
}

function buildStyles() {
  const plugins = [
    autoprefixer(),
    cssnano()
  ];

  return gulp.src(config.src.css, { sourcemaps: modeDev })
    .pipe(changed(config.watch.css))
    .pipe(sass())
    .pipe(gulpif(modeProd, postcss(plugins)))
    .pipe(gulp.dest(config.build.css))
    .pipe(browserSync.stream());
};

function buildScripts() {
  return gulp.src(config.src.js, { sourcemaps: modeDev })
    .pipe(changed(config.watch.js))
    .pipe(webpack({
      mode: modeProd ? 'production' : 'development',
      output: {
        filename: 'main.js'
      }
    }))
    .pipe(gulp.dest(config.build.js))
    .pipe(browserSync.stream());
}

function buildHTML() {
  return gulp.src(config.src.html)
    .pipe(changed(config.watch.html))
    .pipe(pug({ pretty: true, }))
    .pipe(gulp.dest(config.build.html))
    .pipe(browserSync.stream());
}

function getImages() {
  return gulp.src(config.src.img)
    .pipe(gulpif(modeProd, imagemin()))
    .pipe(gulp.dest(config.build.img))
    .pipe(browserSync.stream());
}

function getFonts() {
  return gulp.src(config.src.fonts)
    .pipe(gulp.dest(config.build.fonts))
    .pipe(browserSync.stream());
}

function server() {
  browserSync.init({
    server: {
      baseDir: './build',
    },
    notify: false,
    open: false,
    port: 3000,
  });
};

async function clean() {
  const deletedDirectoryPaths = await deleteAsync(config.clean);
}

function watcher() {
  gulp.watch(config.watch.css, buildStyles);
  gulp.watch(config.watch.js, buildScripts);
  gulp.watch(config.watch.html, buildHTML);
  gulp.watch(config.watch.img, getImages);
  gulp.watch(config.watch.fonts, getFonts);
}

const build = gulp.series(clean, gulp.parallel(buildStyles, buildScripts, buildHTML, getImages, getFonts));
const dev = gulp.series(clean, build, gulp.parallel(watcher, server));

gulp.task('build', build);
gulp.task('server', dev);
