"use strict";
import Marionette from "backbone.marionette";
import LandingPage from "./modules/landing/landing";

/**
 * Setup App
 */
var App = new Marionette.Application();

App.on("start", function() {

    App.rootLayout = new LandingPage({
        el: "#app"
    });

    App.rootLayout.render();

});

App.start();
