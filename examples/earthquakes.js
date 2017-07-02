var map = L.map('map'),
    realtime = L.realtime('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', {
        interval: 60 * 1000,
        getFeatureId: function(f) {
        	return f.properties.url;
        },
        cache: true,
        container: L.markerClusterGroup(),
        onEachFeature(f, l) {
        	l.bindPopup(function() {
        		return '<h3>' + f.properties.place + '</h3>' +
        			'<p>' + new Date(f.properties.time) +
        			'<br/>Magnitude: <strong>' + f.properties.mag + '</strong></p>' +
        			'<p><a href="' + f.properties.url + '">More information</a></p>';
        	});
        }
    }).addTo(map);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php">USGS Earthquake Hazards Program</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

realtime.once('update', function() {
    map.fitBounds(realtime.getBounds(), {maxZoom: 3});
});
