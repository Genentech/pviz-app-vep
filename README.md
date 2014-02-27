#pViz.js/VEP viewer: A browser side only application to view Ensemble Variant Effect Predictor output files
The [Ensembl Variant Effect Predictor](http://ensembl.ebi.com/vep) produces '.vep' files with, among others, protein positioned features of variant.

We propose a tool to parse such an output, retrieve the protein sequence from [Ensembl REST API](http://beta.rest.ensembl.org), and align the features on the sequence, grouped by categories.
##Data sources
Any '.vep' file can be fitted in the tool, either on of the test set or a loaded local files. Files with up to 1.5M lines can be parsed in a chrome browser in approximatively 10 seconds.
###Parsed features
Any features with protein position are displayed. By default, only the protein with an 'ENSP.+' identifier can be displayed by default as the sequence is retrieved on a server (change the Ensembl REST url in the configuration menu to connect to a local store).

The field in the 'Extras' column are displayed when mousing over a feature.

##Usage
Enter a gene name to display the related protein.

Zoom in the sequence by dragging the mouse and zoom out by double clicking.

Clone the project, then

    npm install
    bower install

    #if grunt was not installed with -g
    alias grunt=./node_modules/grunt-cli/bin/grunt

    grunt server

Et Voilà

###Deploy

    grunt build
    rsync --recursive --delete dist/* your.host:/your/path/

##Authors
This application is based on the versatile [pViz.js: a dynamic JavaScript and SVG library for visualization of protein sequence features](http://github.com/genentech/pviz),
written by [Alexandre Masselot](mailto://masselot.alexandre@gene.com) and [Kiran Mukhyala](mailto://mukhyala.kiran@gene.com),
from the Bioinformatics & Computational Biology Department, at [Genentech Inc.](http://www.gene.com) Research.

##Reference
Please provide a reference to this application by citing:
'''xxx.xx 2014'''

##Thanks to
This app is aimed at demonstrating pViz.js library.
But it would never have existed without a myriad of other useful an inspiring projects: [d3.js](http://d3js.org),
[color brewer](http://colorbrewer2.org) (and Mike Bostock [implementation](http://bl.ocks.org/mbostock/5577023)),
[grunt](http://gruntjs.com), [bower](https://npmjs.org/package/bower),
[bootstrap](http://getbootstrap.com/css,
[jQuery](http://jquery.com) (and [$.cookie)](https://github.com/carhartl/jquery-cookie),
[backbone.js](http://backbonejs.org), [require.js](http://requirejs.org),
[underscore.js](http://underscorejs.org), [typeahead.js](http://twitter.github.io/typeahead.js),
[Miso.dataset](http://misoproject.com/dataset) and a few others.


###License
The library is distributed under a BSD license. Full description can be found in [LICENSE.txt](LICENSE.txt)