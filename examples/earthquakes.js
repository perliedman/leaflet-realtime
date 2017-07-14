function createRealtimeLayer(url, container) {
    return L.realtime(url, {
        interval: 60 * 1000,
        getFeatureId: function(f) {
            return f.properties.url;
        },
        cache: true,
        container: container,
        onEachFeature(f, l) {
            l.bindPopup(function() {
                return '<h3>' + f.properties.place + '</h3>' +
                    '<p>' + new Date(f.properties.time) +
                    '<br/>Magnitude: <strong>' + f.properties.mag + '</strong></p>' +
                    '<p><a href="' + f.properties.url + '">More information</a></p>';
            });
        }
    });
}

var map = L.map('map'),
    clusterGroup = L.markerClusterGroup().addTo(map),
    subgroup1 = L.featureGroup.subGroup(clusterGroup),
    subgroup2 = L.featureGroup.subGroup(clusterGroup),
    realtime1 = createRealtimeLayer('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', subgroup1).addTo(map),
    realtime2 = createRealtimeLayer('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', subgroup2);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php">USGS Earthquake Hazards Program</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.layers(null, {
    'Earthquakes 2.5+': realtime1,
    'All Earthquakes': realtime2
}).addTo(map);

realtime1.once('update', function() {
    map.fitBounds(realtime1.getBounds(), {maxZoom: 3});
});
