/*global define*/

define([
    "esri/graphic",
    "esri/InfoTemplate",
    "esri/geometry/Point",
    "esri/geometry/Circle",
    "esri/geometry/webMercatorUtils"
], function (Graphic, InfoTemplate, Point, Circle, webMercatorUtils) {
    /**
     * Creates a geolocate button.
     * @param {HTMLButtonElement} button
     * @param {esri/Map} map
     */
    function createGeolocateButton(button, map) {
        var infoTemplate, nFormat;

        // Setup NumberFormat object if the browser supports it.
        nFormat = (window.Intl && window.Intl.NumberFormat) ? new window.Intl.NumberFormat() : null;

        /**
         * Formats an amount in meters.
         * @param {number} m - A number of meters.
         * @returns {string}
         */
        function formatMeters(m) {
            var value, unit;
            value = m;
            unit = "meters";

            if (m > 1000) {
                value = m / 1000;
                unit = "km.";
            }

            if (nFormat) { // Make sure browser implements Intl.NumberFormat
                value = nFormat.format(value);
            }
            return [value, unit].join(" ");
        }

        /**
         * Shows an info window at the given position.
         * Displays a Circle on the map showing the position accuracy.
         * @param {external:Position} position
         */
        function showLocationPopup(position) {
            var pt, attributes, accuracy, circle;

            button.classList.remove("busy");

            accuracy = position.coords.accuracy; // In meters.
            pt = new Point(position.coords.longitude, position.coords.latitude);
            pt = webMercatorUtils.geographicToWebMercator(pt);
            circle = new Circle(pt, {
                radius: accuracy, // Default unit is already meters.
                geodesic: true
            });
            attributes = {
                lat: position.coords.latitude.toFixed(6),
                long: position.coords.longitude.toFixed(6),
                accuracy: formatMeters(accuracy)
            };
            if (map.infoWindow.setFeatures) {
                map.infoWindow.setFeatures([
                    new Graphic(circle, null, attributes, infoTemplate)
                ]);
                map.infoWindow.show(map.toScreen(pt));
            } else {
                map.infoWindow.setTitle("You are here").setContent(
                    ["Lat: ", attributes.lat, "<br /> Long:", attributes.long].join()
                ).show(map.toScreen(pt));
            }
            map.setExtent(circle.getExtent(), false);
        }

        /**
         * Shows an error alert message
         * @param {external:PositionError} error
         */
        function showLocateError(error) {
            var message = "", strErrorCode;

            button.classList.remove("busy");

            // Check for known errors
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "This website does not have permission to use the Geolocation API";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "The current position could not be determined.";
                    break;
                case error.PERMISSION_DENIED_TIMEOUT:
                    message = "The current position could not be determined within the specified timeout period.";
                    break;
            }

            // If it's an unknown error, build a message that includes 
            // information that helps identify the situation so that 
            // the error handler can be updated.
            if (message === "") {
                strErrorCode = error.code.toString();
                message = "The position could not be determined due to an unknown error (Code: " + strErrorCode + ").";
            }
            alert(message);
        }

        /**
         * Calls the navigator.geolocation.getCurrentPosition function.
         */
        function geolocate() {
            button.classList.add("busy");
            navigator.geolocation.getCurrentPosition(showLocationPopup, showLocateError, {
                maximumAge: 0,
                timeout: 30000,
                enableHighAccuracy: true
            });
        }

        // This info template is used to format the geocode results in the info window.
        infoTemplate = new InfoTemplate(
            "You are here", [
                "<dl>",
                "<dt>Latitude</dt><dd>${lat}</dd>",
                "<dt>Longitude</dt><dd>${long}</dd>",
                "<dt>Accuracy</dt><dd>±${accuracy}</dd>",
                "</dl>"].join("")
        );

        // If the browser supports geolocation, setup the button.
        // Otherwise, remove the button.
        if (navigator.geolocation) {
            button.onclick = geolocate;
        } else {
            button.disabled = true;
        }
    }

    return createGeolocateButton;
});