var L = require('leaflet'),
    test = require('tape'),
    pointFeature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [11.94, 57.73]
        },
        properties: {
            id: 1
        }
    },
    pointFeature2 = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [11.9, 57.75]
        },
        properties: {
            id: 2
        }
    };

function setupRealtime(t, source, options, updateHandler) {
    var realtime = L.realtime(source, L.extend({
            start: false
        }, options || {})),
        done = false;

    realtime.on('update', function(e) {
        updateHandler(e);
        done = true;
    });

    setTimeout(function() {
        if (!done) {
            t.fail('Update event didn\'t fire, or wasn\'t handled.');
            t.end();
        }
    }, 100);

    return realtime;
}

require('../src/L.Realtime');

test('update event is fired', function(t) {
    var realtime = setupRealtime(t, function(success) {
            success([]);
        }, {}, function() {
            t.end();
        });

    realtime.update();
});

test('enter set is valid', function(t) {
    var realtime = setupRealtime(t, function(success) {
            success(pointFeature);
        }, {}, function(e) {
            var f = e.enter[pointFeature.properties.id];
            t.ok(f);
            t.deepEqual(f, pointFeature);
            t.end();
        });

    realtime.update();
});

test('enter set does not contain updates', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, function(success) {
            success(pointFeature);
        }, {}, function(e) {
            var f = e.enter[pointFeature.properties.id];
            updateCount++;

            if (updateCount > 1) {
                t.notOk(f);
                t.end();
            }
        });

    realtime.update();
    realtime.update();
});

test('update set contains updates', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, function(success) {
            success(pointFeature);
        }, {}, function(e) {
            var f = e.update[pointFeature.properties.id];
            updateCount++;

            if (updateCount === 1) {
                t.notOk(f);
            } else if (updateCount > 1) {
                t.ok(f);
            }
        });

    t.plan(3);
    realtime.update();
    realtime.update();
    realtime.update();
});

test('exit set contains removed features', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, function(success) {
            success(updateCount === 0 ? pointFeature : []);
        }, {}, function(e) {
            var f = e.exit[pointFeature.properties.id];
            updateCount++;

            if (updateCount === 2) {
                t.ok(f);
            } else {
                t.notOk(f);
            }
        });

    t.plan(3);
    realtime.update();
    realtime.update();
    realtime.update();
});

test('features set contains current features', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, function(success) {
            success(updateCount < 2 ? pointFeature : []);
        }, {}, function(e) {
            var f = e.features[pointFeature.properties.id];
            updateCount++;

            if (updateCount < 3) {
                t.ok(f);
                t.equal(Object.keys(e.features).length, 1);
            } else {
                t.notOk(f);
                t.equal(Object.keys(e.features).length, 0);
            }
        });

    t.plan(6);
    realtime.update();
    realtime.update();
    realtime.update();
});

test('update with explicit data adds data', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, undefined, {}, function(e) {
            updateCount++;

            switch (updateCount) {
            case 1:
                t.equal(e.enter[pointFeature.properties.id], pointFeature);
                t.equal(Object.keys(e.update).length, 0);
                t.equal(Object.keys(e.exit).length, 0);
                break;
            case 2:
                t.equal(e.enter[pointFeature2.properties.id], pointFeature2);
                t.equal(e.update[pointFeature.properties.id], pointFeature);
                t.equal(Object.keys(e.exit).length, 0);
                break;
            case 3:
                t.equal(Object.keys(e.enter).length, 0);
                t.equal(Object.keys(e.update).length, 0);
                t.equal(Object.keys(e.exit).length, 0);
                break;
            }
        });

    t.plan(9);
    realtime.update(pointFeature);
    realtime.update([pointFeature, pointFeature2]);
    realtime.update([]);
});

test('remove removes data', function(t) {
    var updateCount = 0,
        realtime = setupRealtime(t, undefined, {}, function(e) {
            updateCount++;

            if (updateCount === 2) {
                t.equal(Object.keys(e.features).length, 0, 'Feature set empty after removal');
                t.equal(e.exit[pointFeature.properties.id], pointFeature, 'Removed feature is in exit set');
            }
        });

    t.plan(2);
    realtime.update(pointFeature);
    realtime.remove(pointFeature);
});

test('point layer is preserved through updates', function(t) {
    var updateCount = 0,
        layer,
        realtime = setupRealtime(t, function(success) {
            success(pointFeature);
        }, {}, function(e) {
            updateCount++;

            if (updateCount === 1) {
                layer = realtime.getLayer(1);
            } else if (updateCount > 1) {
                t.equal(realtime.getLayer(1), layer);
            }
        });

    t.plan(1);
    realtime.update();
    realtime.update();
});
