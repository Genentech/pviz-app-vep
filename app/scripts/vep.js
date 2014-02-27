define([], function() {
    //
    'use strict';
    var VEP = {};
    VEP.Output = function() {
        var _this = this;

        return _this;
    };

    VEP.Output.prototype.load = function(content, success) {
        var _this = this;
        _this.comments = '';
        _this.indexName = {};
        _this.nbLines = 0;

        var reComment = /^##\s*(.*)/;
        var reHeader = /^#(.*)/;
        var reNames = /\bHGNC=(.+?)(;|$)/;

        content.split('\n').forEach(function(line) {
            var m = reComment.exec(line);
            if (m) {
                _this.comments += m[1] + '\n';
                return;
            }

            m = reHeader.exec(line);
            if (m) {
                _this.headerColumns = m[1].split('\t');
                _this.headerColumnIndex = {};
                for (var i = 0; i < _this.headerColumns.length; i++) {
                    _this.headerColumnIndex[_this.headerColumns[i]] = i;
                }
                return;
            }

            m = reNames.exec(line);
            if (m) {
                var name = m[1];
                if (_this.indexName[name] === undefined) {
                    _this.indexName[name] = line;
                } else {
                    _this.indexName[name] += '\n' + line;
                }
                _this.nbLines++;
            }

        });

        success(_this);
    };

    VEP.Output.prototype.listNames = function() {
        var _this = this;
        return Object.keys(_this.indexName).sort();
    };

    VEP.Output.prototype.getByName = function(name) {
        var _this = this;
        var block = _this.indexName[name];
        if (!block) {
            window.alert('no entries for entry ' + name);
            return;
        }

        var splitExtraBlock = function(val) {
            var xt = {};
            val.split(';').forEach(function(token) {
                var tktmp = token.split('=', 2);
                xt[tktmp[0]] = tktmp[1];
            });
            return xt;
        };

        var features = block.split('\n').map(function(line) {
            var tmp = line.split('\t');
            var n = tmp.length;
            var feature = {};
            for (var i = 0; i < n; i++) {
                var col = _this.headerColumns[i];
                var val = tmp[i];
                if (/.*_position/.test(col)) {
                    if (val === '-') {
                        feature[col] = undefined;
                    } else if (val.indexOf('-') > 0) {
                        var ptmp = val.split('-');
                        feature[col] = {
                            start : parseInt(ptmp[0], 10),
                            end : parseInt(ptmp[1], 10)
                        };
                    } else {
                        var p = parseInt(val, 10);
                        feature[col] = {
                            start : p,
                            end : p
                        };
                    }
                } else if (col === 'Extra') {
                    feature.Extra = splitExtraBlock(val);
                } else {
                    feature[col] = val;
                }
            }
            return feature;
        });

        return features;
    };

    return VEP;
});
