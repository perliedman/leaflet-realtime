var map = L.map('map'),
    trail = {
        type: 'Feature',
        properties: {
            id: 1
        },
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    },
    realtime = L.realtime(function(success, error) {
        L.Realtime.reqwest({
            url: 'https://wanderdrone.appspot.com/',
            crossOrigin: true,
            type: 'json'
        })
        .then(function(data) {
            var trailCoords = trail.geometry.coordinates;
            trailCoords.push(data.geometry.coordinates);
            trailCoords.splice(0, Math.max(0, trailCoords.length - 5));
            success({
                type: 'FeatureCollection',
                features: [data, trail]
            });
        })
        .catch(error);
    }, {
        interval: 3 * 1000
    }).addTo(map);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

realtime.on('update', function() {
    map.fitBounds(realtime.getBounds(), {maxZoom: 3});
});
