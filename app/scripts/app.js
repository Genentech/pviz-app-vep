define(['jquery', 'underscore', 'vep', 'pviz', 'templates', 'colorbrewer', 'typeahead', 'jquery.cookie'], function($, _, VEP, pviz, JST, colorBrewer) {
    //
    'use strict';
    // boostrap menu dropdown
    $('.dropdown-toggle').dropdown();

    /**
     *  application configuration
     * default value are taken
     * if a cookie is set, the value are taken from
     * if config form is edited, value are updated and cookie is saved
     */
    $('body').append($(JST['app/scripts/templates/configure.ejs']()));
    var configDefault = {
        url_ensembl_rest : 'http://beta.rest.ensembl.org',
        faceted_fields : 'SIFT,PolyPhen,PFAM_DOMAIN,MOTIF_NAME,HIGH_INF_POS,CELL_TYPE,SV'
    };
    var configCookieName = function(key) {
        return 'config-' + key;
    };
    var config = {};
    _.each(configDefault, function(val, key) {
        config[key] = $.cookie(configCookieName(key)) || configDefault[key];
    });

    $('input.configure-param').each(function() {
        var el = $(this);
        var key = el.attr('name');
        el.val(config[key]);
        el.change(function() {
            config[key] = el.val().trim();
            $.cookie(configCookieName(key), el.val().trim(), {
                expires : 30
            });
        });
    });

    /**
     *just add the help.
     * boostrap naming makes it called from the button
     *
     */
    $('body').append($(JST['app/scripts/templates/help.ejs']()));

    /**
     *
     *manage the blinking loading icon when loading/pre-processing the vep file
     *
     */
    var loadingShow = false;
    var loadingInterv;
    var loadingStart = function() {
        loadingShow = false;
        $('#loading').show();
        loadingInterv = setInterval(function() {
            loadingShow = !loadingShow;
            if (loadingShow) {
                $('#loading').css('color', 'red');
            } else {
                $('#loading').css('color', 'black');
            }
        }, 500);
    };
    var loadingStop = function() {
        window.clearInterval(loadingInterv);
        $('#loading').hide();
    };
    // before loading: cleanup all .output fiedl, intiated the loader icon and a new vepSrc
    var vepSrc;
    var beforeLoad = function() {
        $('#welcome').remove();
        //cleanup before loading
        $('.output').empty();
        $('#main').hide();
        vepSrc = new VEP.Output();
        loadingStart();
    };
    var processLoadedData = function(setName, vep, options) {
        $('#main').show();
        $('#set-name').text(setName + ' (' + vep.nbLines + ' lines, ' + vep.listNames().length + ' proteins)');
        $('#vep-comment').append($('<pre>' + vep.comments + '</pre>'));

        //initialize the autocomplete widget on the list of protein names
        $('#ac-typeahead').typeahead('destroy');
        $('#ac-typeahead').typeahead({
            name : 'ac',
            local : vep.listNames()
        }).on('typeahead:selected', function(evt, selected) {
            showOneGene(vep, selected.value);
        }).typeahead('setQuery', (options && options.exampleGene) || '');
        $('#ac-show').click(function() {
            showOneGene(vep, $('#ac-typeahead').val().trim());
        });
        loadingStop();

        var gname= vep.exampleName();
        showOneGene(vep, gname);
        $('#ac-typeahead').val(gname);

//        if (options && options.exampleGene) {
//            showOneGene(vep, options.exampleGene);
//        }
    };
    /**
     * setup loading .vep file possibilities
     *
     * A) load from example
     */
    $('a.load-test').click(function() {
        beforeLoad();
        var setName = $(this).attr('set');
        $.get('data/' + setName + '.vep', function(data) {
            vepSrc.load(data, function(vep) {
                processLoadedData(setName, vep);
            });
        });
    });

    /**
     * B) activate the load file if available and enable lod of client .vep
     */
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //load data from the file input field
        $('#vep-file').change(function(evt) {
            beforeLoad();

            var reader = new FileReader();
            var setName = evt.target.files[0].name;

            reader.onload = function(e) {
                var content = e.target.result;

                vepSrc.load(content, function(vep) {
                    processLoadedData(setName, vep, content);
                });
            };

            reader.onerror = function(e) {
                console.error('loading.vep file reading...', e);
            };

            reader.readAsText(evt.target.files[0]);
        });
    } else {
        var p = $('#vep-file').parent();
        $(p).empty();
        $(p).html('<strong class="text-danger">no html5 File API (update your browser)</strong>');
    }

    /**
     * pViz customizations, mousoever and display
     * Close to the pVIz default, add all extra fields as classes
     */
    //dd callback on mousing over vep_feature type
    pviz.FeatureDisplayer.setCustomHandler('vep_feature', {
        appender : function(viewport, svgGroup, features, type) {
            var sel = svgGroup.selectAll('rect' + type).data(features).enter().append('g').attr('class', function(ft) {
                var c = 'feature data ' + type;
                _.each(ft.extra, function(val, key) {
                    c += ' extra-name-' + key.toLowerCase() + ' ' + 'extra-value-' + val.replace(/\s*\(.*/, '').toLowerCase();
                });
                return c;
            });
            sel.append('rect');

            sel.append('text').attr('y', viewport.scales.y(0.5)).attr('x', 2);

            return sel;
        },
        positioner : function(viewport, d3selection) {
            d3selection.attr('transform', function(ft) {
                return 'translate(' + viewport.scales.x(ft.start - 0.4) + ',' + viewport.scales.y(ft.displayTrack - 1) + ')';
            });
            var ftWidth = function(ft) {
                return Math.max(3, viewport.scales.x(ft.end + 0.9) - viewport.scales.x(ft.start + 0.1));
            };
            d3selection.selectAll('rect').attr('width', ftWidth).attr('height', viewport.scales.y(0.76));

            var fontSize = 9;
            // self.fontSizeLine();
            var selText = d3selection.selectAll('text');
            selText.text(function(ft) {
                var text = (ft.text !== undefined) ? ft.text : ft.type;
                var w = viewport.scales.x(ft.end + 0.9) - viewport.scales.x(ft.start);
                if (w <= 5 || text.length === 0) {
                    return '';
                }
                var nchar = Math.floor(w / fontSize * 1.6);
                if (nchar >= text.length) {
                    return text;
                }
                if (nchar <= 2) {
                    return '';
                }
                return text.substr(0, nchar);
            }).style('font-size', fontSize);
            return d3selection;
        }
    });

    var timeoutCloseDetails;
    var divDetails =$('#vep-extras'); 

    pviz.FeatureDisplayer.addMouseoverCallback(['vep_feature'], function(ft) {
        if (timeoutCloseDetails !== undefined) {
            clearTimeout(timeoutCloseDetails);
        }
        var templateExtra = '<div class="col-sm-3 text-right"><span class="text-muted"><%= title %> </span></div><div class="col-sm-9"><%= value %></div>';
        divDetails.empty();
        divDetails.show();
        var pos = (ft.start === ft.end) ? (ft.start + 1) : ('' + (ft.start + 1) + '-' + (ft.end + 1));
        divDetails.append($(_.template(templateExtra, {
            title : 'variation',
            value : ft.text + ' (@' + pos + ')'
        })));
        _.each(ft.extra, function(val, key) {
            divDetails.append($(_.template(templateExtra, {
                title : key,
                value : val.replace(/,/g, ', ')
            })));
        });
    });
    pviz.FeatureDisplayer.addMouseoutCallback(['vep_feature'], function() {
        timeoutCloseDetails = setTimeout(function() {
            divDetails.hide();
        }, 3000)
    });

    /**
     * display one protein entry from the list
     */
    var showOneGene = function(vep, name) {
        $('.output.entry').empty();

        //get all the features for one gene
        var allFeatures = vep.getByName(name);

        //extract PFAM domain from the list
        allFeatures.forEach(function(ft) {
            if (ft.Extra.DOMAINS) {
                var m = /Pfam_domain:(.+?),/.exec(ft.Extra.DOMAINS + ',');
                if (m) {
                    ft.Extra.PFAM_DOMAIN = m[1];
                }
            }

        });

        //group by ENSP
        var vepFeatures = _.groupBy(allFeatures, function(ft) {
            return ft.Extra.ENSP;
        });

        //show each ENSP on a different pViz container
        _.each(vepFeatures, function(enspFeatures, ensp) {
            var id = 'pviz-ensp-' + ensp;
            var div = $('<div class="row"><div class="col-sm-12"><h4>' + ensp + '</h4></div><div class="col-sm-12" id="' + id + '"></div></div>');
            $('#pviz-list').append(div);
            showOneEnsp('#' + id, ensp, enspFeatures);
        });
        buildFacets(allFeatures);
    };

    var showOneEnsp = function(target, ensp, features) {
        //get the equence back from EBI
        var url = config.url_ensembl_rest + '/sequence/id/' + ensp;
        $.ajax({
            dataType : 'json',
            url : url,
            success : function(protDetails) {
                //build the model
                var seqEntry = new pviz.SeqEntry({
                    sequence : protDetails.seq
                });
                //build the associated view
                new pviz.SeqEntryAnnotInteractiveView({
                    model : seqEntry,
                    el : target,
                    marginLeft : 100
                }).render();

                //build the entry features from the saves block of text

                //transform the extraced features into pviz ready features
                seqEntry.addFeatures(features.filter(function(ft) {
                    return ft.Protein_position && !isNaN(ft.Protein_position.start);
                }).map(function(ft) {
                    return {
                        start : ft.Protein_position.start - 1,
                        end : ft.Protein_position.end - 1,
                        category : ft.Consequence,
                        text : ft.Amino_acids,
                        type : 'vep_feature',
                        extra : ft.Extra
                    };
                }));
            },
            error : function() {
                $(target).html('<span class="text-warning">could not retrieve ' + url + '</span>');
            }
        });
    };

    /**
     * faceting from the current list of selected features
     */
    var buildFacets = function(features) {
        var facets = {};

        //count facets based on Extras fields
        features.forEach(function(ft) {
            _.each(ft.Extra, function(val, key) {
                val = val.replace(/\s*\(.*/, '');
                if (facets[key] === undefined) {
                    facets[key] = {};
                }
                if (facets[key][val] === undefined) {
                    facets[key][val] = 1;
                } else {
                    facets[key][val]++;
                }
            });
        });

        //keep only the facet which having been matched, and keep the original order
        var actualFacets = config.faceted_fields.split(',').filter(function(f) {
            return facets[f] !== undefined;
        }).map(function(f) {
            f = f.trim();
            return {
                facet : f,
                values : _.chain(facets[f]).map(function(count, val) {
                    return {
                        value : val,
                        count : count
                    };
                }).sortBy(function(fv) {
                    return fv.value;
                }).value()
            };
        });

        var templateFacets = '<div class="col-sm-3"><div><input type="radio" name="facet-radio" class="facet-selector" value="<%= facet %>"/> <strong><%= facet %></strong></div><div><%= ltxt %></div></div>';
        actualFacets.forEach(function(f) {
            var ltxt = f.values.map(function(fv) {
                return '<span class="badge vep_feature extra-name-' + f.facet.toLowerCase() + ' extra-value-' + fv.value.toLowerCase() + ' ">&nbsp;</span> ' + fv.value + ' (' + fv.count + ')';
            }).join('<br/>');
            $('#div-facets').append($(_.template(templateFacets, {
                facet : f.facet,
                ltxt : ltxt
            })));
        });

        $('#div-facets').find('input.facet-selector').change(function() {
            var facet = $(this).val();
            var colors = colorBrewer.Set1[Math.max(3, Math.min(9, _.size(facets[facet])))];
            var elCss = $('style#style-vep');
            elCss.empty();
            var css = 'span.vep_feature, g.feature.vep_feature rect{background-color: #bbb;fill:#bbb;}';
            _.each(_.keys(facets[facet]).sort(), function(val, i) {
                var clazz = '.extra-name-' + facet.toLowerCase() + '.extra-value-' + val.toLowerCase();
                var col = colors[i];
                css += 'span.vep_feature' + clazz + ', g.feature.vep_feature' + clazz + ' rect{background-color: ' + col + ';fill:' + col + ';}';
            });
            elCss.text(css);
        });
    };
});
