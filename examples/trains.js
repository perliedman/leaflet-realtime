var map = L.map('map').fitBounds([[54, 7], [76, 23]]),
	requestData = function(success, error) {
		var bounds = map.getBounds(),
			sw = bounds.getSouthWest(),
			ne = bounds.getNorthEast(),
			bbox = [ne.lat, ne.lng, sw.lat, sw.lng];
		L.Realtime.reqwest({
	        url: 'http://www.tagkartan.se/json/tag2.php?bounds=' +
	        	bbox.join(',') + '&_=' + Math.random() + '&callback=?',
	        type: 'jsonp'
	    }).then(function(data) {
	    	success(data
	    		.filter(function(train) {
	    			return train.lat > 0 || train.lon > 0;
	    		})
	    		.map(function(train) {
	    		return {
	    			type: 'Feature',
	    			properties: {
	    				id: train.id,
	    			},
    				geometry: {
    					type: 'Point',
    					coordinates: [train.lon, train.lat]
    				}
	    		};
	    	}));
	    }).catch(function(err) {
	    	error(err);
	    });
	},
    realtime = L.realtime(requestData, {
        interval: 10 * 1000
    }).addTo(map),
    moved = false;

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors; Train data courtesy of <a href="http://www.tagkartan.se/">Tågkartan</a>'
}).addTo(map);

map.on('mousedown', function() { moved = true; });

realtime.on('update', function(e) {
	if (!moved) {
	    map.fitBounds(realtime.getBounds());		
	}
});
