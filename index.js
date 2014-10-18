var map = L.map('map'),
    realtime = L.realtime({
        url: 'https://wanderdrone.appspot.com/',
        crossOrigin: true,
        type: 'json'
    }, {
        interval: 3 * 1000
    }).addTo(map);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

realtime.on('update', function(e) {
    var coordPart = function(v, dirs) {
            return dirs.charAt(v >= 0 ? 0 : 1) +
                (Math.round(Math.abs(v) * 100) / 100).toString();
        },
        popupContent = function(fId) {
            var feature = e.features[fId],
                c = feature.geometry.coordinates;
            return 'Wander drone at ' +
                coordPart(c[1], 'NS') + ', ' + coordPart(c[0], 'EW');
        },
        bindFeaturePopup = function(fId) {
            realtime.getLayer(fId).bindPopup(popupContent(fId));
        },
        updateFeaturePopup = function(fId) {
            realtime.getLayer(fId).getPopup().setContent(popupContent(fId));
        };

    map.fitBounds(realtime.getBounds(), {maxZoom: 3});

    Object.keys(e.enter).forEach(bindFeaturePopup);
    Object.keys(e.update).forEach(updateFeaturePopup);
});
