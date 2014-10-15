var L = require('leaflet'),
    reqwest = require('reqwest');

L.Realtime = L.GeoJSON.extend({
    includes: L.Mixin.Events,

    options: {
        start: true,
        interval: 60 * 1000,
        getFeatureId: function(f) {
            return f.properties.id;
        }
    },

    initialize: function(src, options) {
        L.GeoJSON.prototype.initialize.call(this, undefined, options);

        this._src = src;
        this.features = {};

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
        var getValue = reqwest(this._src);
        getValue.then(L.bind(this._onNewData, this), L.bind(this._onError, this));
    },

    _onNewData: function(response) {
        var oef = this.options.onEachFeature,
            known = {};

        this.options.onEachFeature = L.bind(function onEachFeature(f, l) {
            var fId,
                oldLayer;

            if (oef) {
                oef(f, l);
            }

            fId = this.options.getFeatureId(f);
            oldLayer = this.features[fId];

            if (oldLayer) {
                this.removeLayer(oldLayer);
            }
            this.features[fId] = l;
            known[fId] = true;
        }, this);

        this.addData(response);
        this._removeUnknown(known);

        this.fire('newdata', {
            features: this._features
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
        var fId;
        for (fId in this._features) {
            if (!known[fId]) {
                this.removeLayer(this._features[fId]);
                delete this.features[fId];
            }
        }
    }
});

L.realtime = function(src, options) {
    return new L.Realtime(src, options);
};

module.exports = L.Realtime;