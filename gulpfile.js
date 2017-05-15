var gulp             = require('gulp'),
	mainBowerFiles 	 = require('gulp-main-bower-files'),
	compass          = require('gulp-compass'),
	minifyCSS   	 = require('gulp-minify-css'),
	concat 			 = require('gulp-concat'),
	notify           = require('gulp-notify'),
	plumber          = require('gulp-plumber'),
	uglify 			 = require('gulp-uglify'),
	rename 			 = require('gulp-rename'),
	imagemin         = require('gulp-imagemin'),
	htmlmin 		 = require('gulp-htmlmin'),
	cache 			 = require('gulp-cache'),
	gulpFilter 		 = require('gulp-filter'),
	banner 			 = require('gulp-banner'),
	package 		 = require('./package.json'),
	path             = require('path'),
	browserSync 	 = require('browser-sync').create();


var comment = '/*\n' +
    ' * <%= pkg.name %> <%= pkg.version %>\n' +
    ' * <%= pkg.description %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' *\n' +
    ' * Copyright 2017, <%= pkg.author %>\n' +
    ' * Released under the <%= pkg.license %> license.\n' +
    '*/\n\n';

var htmlcomment = '<!--\n' +
    ' * <%= pkg.name %> <%= pkg.version %>\n' +
    ' * <%= pkg.description %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' *\n' +
    ' * Copyright 2017, <%= pkg.author %>\n' +
    ' * Released under the <%= pkg.license %> license.\n' +
    '-->\n\n'; 

var config = {
	appDir: "public",
	srcDir: "src"
};

var jsFiles = [
				config.srcDir + '/js/app.js',
			];

var notifyInfo = {
	title: 'Gulp workin on ' + package.name,
	icon: path.join(__dirname, 'gulp.png')
};

// Error notification settings for plumber
var plumberErrorHandler = { errorHandler: notify.onError({
		title: notifyInfo.title,
		icon: notifyInfo.icon,
		message: "Error: <%= error.message %>"
	})
};

// Compass for style
gulp.task('compass', function(){
	return gulp.src([config.srcDir + '/sass/builder.scss', config.srcDir + '/sass/responsive.scss'])
		   .pipe(plumber({
		      errorHandler: function (error) {
		        console.log(error.message);
		        this.emit('end');
		    }}))
		   .pipe(compass({
		      css: config.srcDir + '/css',
		      sass: config.srcDir + '/sass',
		      image: config.appDir + '/assets/img'
		    }))
		   .pipe(minifyCSS())
		   .pipe(banner(comment, {
            pkg: package
      		}))
		   .pipe(gulp.dest(config.appDir + '/assets/css'));
});

// Concatenate JS Files
gulp.task('scripts', function() {
      return gulp.src(jsFiles)
      .pipe(concat('scripts.js'))
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(banner(comment, {
            pkg: package
      }))
      .pipe(gulp.dest(config.appDir + '/assets/js'));
});

// Optimize the images
gulp.task('images', function() {
  return gulp.src(config.srcDir + '/img/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
    .pipe(gulp.dest(config.appDir + '/assets/img'));
});

// Bower Files
gulp.task('main-bower-files', function() {
    var filterJS 	= gulpFilter('**/*.js', { restore: true });
    var filterCSS 	= gulpFilter('**/*.css', { restore: true });

    return gulp.src('./bower.json')
        .pipe(mainBowerFiles({
            overrides: {
                bootstrap: {
                    main: [
                        './dist/js/bootstrap.js',
                        './dist/css/*.min.*',
                        './dist/fonts/*.*'
                    ]
                },
                'font-awesome': {
			        main: [
			            "css/*.min.*",
			            "fonts/*.*",
			        ]
			    }
            }
        }))
        .pipe(filterJS)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(banner(comment, {
            pkg: package
      	}))
        .pipe(filterJS.restore)
        .pipe(filterCSS)
        .pipe(minifyCSS())
        .pipe(filterCSS.restore)
        .pipe(gulp.dest(config.appDir + '/assets/libs'));
});

// Live Website
gulp.task('live', function() {
	// Browser Sync
	browserSync.init({
        server: {
            baseDir: "./" + config.appDir
        }
    });

    // Watch .js files
	gulp.watch(config.srcDir + '/js/**/*.js', ['scripts']);

	// Watch .scss files
	gulp.watch(config.srcDir + '/sass/**/*.scss', ['compass']);

	// Watch images files
	gulp.watch(config.srcDir + '/img/**/*', ['images']);

	//reload when a template file, the minified css, or the minified js file changes
	gulp.watch([config.srcDir + '/*.html', config.srcDir + '/js/**/*.js', config.srcDir + '/sass/**/*.scss', config.srcDir + '/img/**/*'], function(event) {
		gulp.src(event.path)
			.pipe(plumber())
			.pipe(notify({
				title: notifyInfo.title,
				icon: notifyInfo.icon,
				message: event.path.replace(__dirname, '').replace(/\\/g, '/') + ' was ' + event.type + ' and reloaded'
			})
		);
	}).on('change', browserSync.reload);
});

gulp.task('default', ['scripts', 'compass', 'images', 'main-bower-files', 'live']);
