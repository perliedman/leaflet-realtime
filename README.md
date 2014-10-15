# Leaflet Realtime

Put realtime data on a Leaflet map.

## Example

Checkout the [Leaflet Realtime Demo](http://www.liedman.net/leaflet-realtime).

```javascript
var map = L.map('map'),
    realtime = L.realtime({
        url: 'https://wanderdrone.appspot.com/',
        crossOrigin: true,
        type: 'json'
    }, {
        interval: 3 * 1000
    }).addTo(map);

realtime.on('newdata', function() {
    map.fitBounds(realtime.getBounds(), {maxZoom: 3});
});
```

## Usage

Leaflet Realtime reads GeoJSON from a provided source. Data is fetched using [reqwest](https://github.com/ded/reqwest).

`L.Realtime` extends `L.GeoJSON`, but automatically updates the data with the result from a periodic HTTP request. You can basically do anything you can do with `L.GeoJSON` with `L.Realtime` - styling, `onEachFeature`, gettings bounds, etc.

To track which feature to move or update between requests, Leaflet Realtime needs to get an identifier for each feature. This is done by the option `getFeatureId`, which, given a feature, should return a unique id for this feature. Unless specified, the feature's `properties.id` is used by default.
