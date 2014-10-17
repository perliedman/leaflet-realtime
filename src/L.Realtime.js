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
        }
    },

    initialize: function(src, options) {
        L.GeoJSON.prototype.initialize.call(this, undefined, options);

        if (typeof(src) === 'function') {
            this._src = src;
        } else {
            this._src = function(responseHandler, errorHandler) {
                reqwest(src).then(responseHandler, errorHandler);
            };
        }

        this._features = {};

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
    },

    stop: function() {
        if (this._timer) {
            clearTimeout(this._timer);
            delete this._timer;
        }
    },

    isRunning: function() {
        return this._timer;
    },

    update: function() {
        var responseHandler = L.bind(this._onNewData, this),
            errorHandler = L.bind(this._onError, this);

        this._src(responseHandler, errorHandler);
    },

    getLayer: function(featureId) {
        return this._features[featureId];
    },

    _onNewData: function(response) {
        var oef = this.options.onEachFeature,
            known = {},
            layersToRemove = [],
            enter = {},
            update = {},
            exit,
            i;

        this.options.onEachFeature = L.bind(function onEachFeature(f, l) {
            var fId,
                oldLayer,
                newLayer;

            if (oef) {
                oef(f, l);
            }

            fId = this.options.getFeatureId(f);
            oldLayer = this._features[fId];

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

            this._features[fId] = l;
            known[fId] = true;
        }, this);

        this.addData(response);
        exit = this._removeUnknown(known);
        for (i = 0; i < layersToRemove.length; i++) {
            this.removeLayer(layersToRemove[i]);
        }

        this.fire('newdata', {
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
        for (fId in this._features) {
            if (!known[fId]) {
                this.removeLayer(this._features[fId]);
                removed[fId] = this._features[fId];
                delete this._features[fId];
            }
        }

        return removed;
    }
});

L.realtime = function(src, options) {
    return new L.Realtime(src, options);
};

module.exports = L.Realtime;