#!/usr/bin/env bash
browserify app/assets/js/app.js -o app/assets/js/build.js -t [ babelify --presets [ es2015 ] ] -t [ stringify --extensions [.html .hbs] ]