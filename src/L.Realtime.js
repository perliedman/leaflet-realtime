"use strict";

var L = require('leaflet'),
    reqwest = require('reqwest');

L.Realtime = L.GeoJSON.extend({
    includes: L.Mixin.Events,

    options: {
        start: true,
        interval: 60 * 1000,
        getFeatureId: function(f) {
            return f.properties.id;
        },
        updateFeature: function(f, oldLayer, newLayer) {
            if (f.geometry.type === 'Point') {
                oldLayer.setLatLng(newLayer.getLatLng());
                return oldLayer;
            } else {
                return newLayer;
            }
        },
        cache: false
    },

    initialize: function(src, options) {
        L.GeoJSON.prototype.initialize.call(this, undefined, options);

        if (typeof(src) === 'function') {
            this._src = src;
        } else {
            this._src = L.bind(function(responseHandler, errorHandler) {
                if ( this._url !== undefined) {
                    src.url = this._url;
                }                
                var reqOptions = this.options.cache ? src : this._bustCache(src);

                reqwest(reqOptions).then(responseHandler, errorHandler);
            }, this);
        }

        this._features = {};
        this._featureLayers = {};

        if (this.options.start) {
            this.start();
        }
    },

    start: function() {
        if (!this._timer) {
            this._timer = setInterval(L.bind(this.update, this),
                this.options.interval);
            this.update();
        }

        return this;
    },

    stop: function() {
        if (this._timer) {
            clearTimeout(this._timer);
            delete this._timer;
        }

        return this;
    },

    isRunning: function() {
        return this._timer;
    },
    
    setUrl: function (url) {
        this._url = url;
        this.update();
    },    

    update: function(geojson) {
        var responseHandler,
            errorHandler;

        if (geojson) {
            this._onNewData(false, geojson);
        } else {
            responseHandler = L.bind(function(data) { this._onNewData(true, data); }, this);
            errorHandler = L.bind(this._onError, this);

            this._src(responseHandler, errorHandler);
        }

        return this;
    },

    remove: function(geojson) {
        var features = L.Util.isArray(geojson) ? geojson : geojson.features ? geojson.features : [geojson],
            exit = {},
            i,
            len,
            fId;

        for (i = 0, len = features.length; i < len; i++) {
            fId = this.options.getFeatureId(features[i]);
            this.removeLayer(this._featureLayers[fId]);
            exit[fId] = this._features[fId];
            delete this._features[fId];
            delete this._featureLayers[fId];
        }

        this.fire('update', {
            features: this._features,
            enter: {},
            update: {},
            exit: exit
        });

        return this;
    },

    getLayer: function(featureId) {
        return this._featureLayers[featureId];
    },

    getFeature: function(featureId) {
        return this._features[featureId];
    },

    _onNewData: function(removeMissing, response) {
        var oef = this.options.onEachFeature,
            layersToRemove = [],
            features = {},
            enter = {},
            update = {},
            exit = {},
            i;

        this.options.onEachFeature = L.bind(function onEachFeature(f, l) {
            var fId,
                oldLayer,
                newLayer;

            if (oef) {
                oef(f, l);
            }

            fId = this.options.getFeatureId(f);
            oldLayer = this._featureLayers[fId];

            if (oldLayer) {
                newLayer = this.options.updateFeature(f, oldLayer, l);
                if (newLayer !== oldLayer) {
                    this.removeLayer(oldLayer);
                }
                if (newLayer !== l) {
                    layersToRemove.push(l);
                }

                l = newLayer;
                update[fId] = f;
            } else {
                enter[fId] = f;
            }

            this._featureLayers[fId] = l;
            this._features[fId] = features[fId] = f;
        }, this);

        this.addData(response);

        if (removeMissing) {
            exit = this._removeUnknown(features);
        }
        for (i = 0; i < layersToRemove.length; i++) {
            this.removeLayer(layersToRemove[i]);
        }

        this.fire('update', {
            features: this._features,
            enter: enter,
            update: update,
            exit: exit
        });

        this.options.onEachFeature = oef;
    },

    _onError: function(err, msg) {
        this.fire('error', {
            error: err,
            message: msg
        });
    },

    _removeUnknown: function(known) {
        var fId,
            removed = {};
        for (fId in this._featureLayers) {
            if (!known[fId]) {
                this.removeLayer(this._featureLayers[fId]);
                removed[fId] = this._features[fId];
                delete this._featureLayers[fId];
                delete this._features[fId];
            }
        }

        return removed;
    },

    _bustCache: function(src) {
        function fixUrl(url) {
            return url + L.Util.getParamString({'_': new Date().getTime()}, url);
        }

        if (typeof src === 'string' || src instanceof String) {
            return fixUrl(src);
        } else {
            return L.extend({}, src, {url: fixUrl(src.url)});
        }
    }
});

L.realtime = function(src, options) {
    return new L.Realtime(src, options);
};

L.Realtime.reqwest = reqwest;

module.exports = L.Realtime;
