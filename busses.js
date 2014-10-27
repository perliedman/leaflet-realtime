var map = L.map('map', {center: [35.0545, -85.28], zoom: 12}),
    realtime = L.realtime(undefined, {
        getFeatureId: function(f) { return f.id; },
        start: false
    }).addTo(map);

function update(e) {
    realtime.update(JSON.parse(e.data));
}

function remove(e) {
    realtime.remove(JSON.parse(e.data));
}

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var source = new EventSource('http://api.chab.us/buses/tail');
source.addEventListener('add', update);
source.addEventListener('change', update);
source.addEventListener('remove', remove);

realtime.on('update', function(e) {
    var popupContent = function(fId) {
            var feature = e.features[fId];
            return '<h3>' + feature.properties.route + '</h3>' +
                feature.properties.routeDirection;
        },
        bindFeaturePopup = function(fId) {
            realtime.getLayer(fId).bindPopup(popupContent(fId));
        },
        updateFeaturePopup = function(fId) {
            realtime.getLayer(fId).getPopup().setContent(popupContent(fId));
        };

    Object.keys(e.enter).forEach(bindFeaturePopup);
    Object.keys(e.update).forEach(updateFeaturePopup);
});
