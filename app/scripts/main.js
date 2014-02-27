/*global require*/
//
'use strict';

require.config({
    shim : {
        underscore : {
            exports : '_'
        },
        backbone : {
            deps : ['underscore', 'jquery'],
            exports : 'Backbone'
        },
        bootstrap : {
            deps : ['jquery'],
            exports : 'jquery'
        },
        'jquery.cookie' : {
            deps : ['jquery']
        },
        d3 : {
            exports : 'd3'
        },
        typeahead : {
            deps : ['jquery']
        }

    },
    paths : {
        jquery : '../bower_components/jquery/jquery',
        'jquery.cookie' : '../bower_components/jquery.cookie/jquery.cookie',
        backbone : '../bower_components/backbone/backbone',
        underscore : '../bower_components/underscore/underscore',
        d3 : '../bower_components/d3/d3',
        pviz : '../bower_components/pviz/dist/pviz-amd',
        bootstrap : '../bower_components/sass-bootstrap/dist/js/bootstrap',
        typeahead : '../bower_components/typeahead.js/dist/typeahead',
        text : '../bower_components/requirejs-text/text',
        colorbrewer : '../lib/colorbrewer'
    }
});

require(['app'], function() {

});
