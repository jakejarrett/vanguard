var gulp = require('gulp'),
    install = require("gulp-install"),
    util = require('gulp-util'),
    NwBuilder = require('node-webkit-builder'),

    nw = new NwBuilder({
        files: ['**', './**', '!./nwjs.app/**',  '!./cache/**', '!./build/**'], // use the glob format
        macZip: 'true',
        platforms: ['win', 'osx', 'linux']
    });


gulp.src(['./package.json'])
  .pipe(install());

gulp.task('default', function() {
  // place code for your default task here

  nw.on('log',  console.log);

    // Build returns a promise
    nw.build().then(function () {
       console.log('all done!');
    }).catch(function (error) {
        console.error(error);
    });

});
