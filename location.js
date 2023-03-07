var lastKnownPosition;

var totalDistanceTravelled = 0;

window.onload = function() {
    navigator.geolocation.getCurrentPosition(function(position) {
    lastKnownPosition = position;
    });
};

navigator.geolocation.watchPosition(function (position) {
    // same as above
     
    var newDistanceTraveled = calculateDistance(lastKnownPosition.coords.latitude, lastKnownPosition.coords.longitude,
            position.coords.latitude, position.coords.longitude);
    
    totalDistanceTravelled += newDistanceTraveled;

    roundedDistance = Math.round(totalDistanceTravelled * 100) / 100
    document.getElementById('roundedDistance').innerHTML = roundedDistance;

    document.getElementById('distance').innerHTML = totalDistanceTravelled;
    document.getElementById('newDistance').innerHTML = newDistanceTraveled;

    lastKnownPosition = position;
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = (lat2 - lat1).toRad();
    var dLon = (lon2 - lon1).toRad();
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}
Number.prototype.toRad = function () {
    return this * Math.PI / 180;
}