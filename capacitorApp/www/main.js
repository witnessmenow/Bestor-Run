/*jslint browser, devel */
/*global capacitorExports */
const { registerPlugin } = capacitorExports;
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

let lastKnownPosition;
let isFirst = true;
let intervalId;
let totalDistanceTravelled = 0;

const started = Date.now();
const watcher_colours = {};
const colours = [
    "red",
    "green",
    "blue",
    "yellow",
    "pink",
    "orange",
    "purple",
    "cyan"
];

function timestamp(time) {
    return String(Math.floor((time - started) / 1000));
}

function log_for_watcher(text, time, colour = "gray") {
    const li = document.createElement("li");
    li.style.color = colour;
    li.innerText = (
        "L" + timestamp(time) + ":W" + timestamp(Date.now()) + ":" + text
    );
    const container = document.getElementById("log");
    return container.insertBefore(li, container.firstChild);
}

function log_error(error, colour = "gray") {
    console.error(error);
    return log_for_watcher(
        error.name + ": " + error.message,
        Date.now(),
        colour
    );
}

function log_location(location, watcher_ID) {
    return log_for_watcher(
        location.latitude + ":" + location.longitude + " - " + location.accuracy,
        location.time,
        watcher_colours[watcher_ID]
    );
}

function add_watcher(background) {
    let id;
    BackgroundGeolocation.addWatcher(
        Object.assign({
            stale: true
        }, (
            background
                ? {
                    backgroundTitle: "Bestor is tracking your location.",
                    backgroundMessage: "Cancel to prevent battery drain."
                }
                : {
                    // distanceFilter: 10
                }
        )),
        function callback(location, error) {
            if (error) {
                if (
                    error.code === "NOT_AUTHORIZED" &&
                    window.confirm(
                        "This app needs your location, " +
                        "but does not have permission.\n\n" +
                        "Open settings now?"
                    )
                ) {
                    BackgroundGeolocation.openSettings();
                }
                return log_error(error, watcher_colours[id]);
            }
            getPosition(location)
            return log_location(location, id);
        }
    ).then(function retain_the_watcher_id(the_id) {
        id = the_id;

        const watcher_nr = Object.keys(watcher_colours).length;
        watcher_colours[id] = colours[watcher_nr];

        const container = document.getElementById("watchers");
        const li = document.createElement("li");
        li.style.backgroundColor = watcher_colours[id];
        li.innerText = (
            background
                ? "BG"
                : "FG"
        );

        const remove_btn = document.createElement("button");
        remove_btn.innerText = "Remove";
        remove_btn.onclick = function () {
            return BackgroundGeolocation.removeWatcher({ id }).then(
                function () {
                    container.removeChild(
                        container.children.item(
                            Object.keys(watcher_colours).indexOf(id)
                        )
                    );
                    delete watcher_colours[id];
                }
            ).catch(
                (error) => log_error(error, watcher_colours[id])
            );
        };

        li.appendChild(remove_btn);

        return container.appendChild(li);
    });
}

// Produces the most accurate location possible within the specified time limit.
function make_guess(timeout) {
    return new Promise(function (resolve) {
        let last_location = null;
        let id;
        BackgroundGeolocation.addWatcher(
            {
                requestPermissions: false,
                stale: true
            },
            function callback(location) {
                last_location = location;
            }
        ).then(function retain_callback_id(the_id) {
            id = the_id;
        });

        setTimeout(function () {
            resolve(last_location);
            BackgroundGeolocation.removeWatcher({ id });
        }, timeout);
    });
}

function guess(timeout) {
    return make_guess(timeout).then(function (location) {
        return (
            location === null
                ? log_for_watcher("null", Date.now())
                : log_for_watcher(
                    [
                        location.latitude,
                        location.longitude
                    ].map(String).join(":"),
                    location.time
                )
        );
    });
}

function getPosition(location) {
    if (isFirst) {
        lastKnownPosition = location;
        isFirst = false;
    } else {
        var newDistanceTraveled = calculateDistance(lastKnownPosition.latitude, lastKnownPosition.longitude,
            location.latitude, location.longitude);

        totalDistanceTravelled += newDistanceTraveled;

        var roundedDistance = Math.trunc(totalDistanceTravelled * 100) / 100
        document.getElementById('roundedDistance').innerHTML = roundedDistance;

        document.getElementById('distance').innerHTML = totalDistanceTravelled;
        document.getElementById('newDistance').innerHTML = newDistanceTraveled;

        lastKnownPosition = location;
    }
}

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
