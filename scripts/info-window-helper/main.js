/*global define*/
define([
    "esri/SpatialReference",
    "esri/geometry/webMercatorUtils",
    "dojo/dnd/Moveable",
    "utils",
    "dojo/text!./print.css"
], function (SpatialReference, webMercatorUtils, Moveable, utils, printCss) {
    var wgs84SR = new SpatialReference(4326);

    /**
     * Creates a Google Street View URL from a geometry.
     * @param {esri/geometry/Point} point - A point.
     * @returns {string} - A Google street view URL.
     */
    function getGoogleStreetViewUrl(point) {
        var xy, output = null;
        // Get the xy coordinates of the point.
        xy = [point.x, point.y];
        // Create the output URL, inserting the xy coordinates.
        if (xy) {
            // http://maps.google.com/maps?q=&layer=c&cbll=47.15976,-122.48359&cbp=11,0,0,0,0
            output = ["http://maps.google.com/maps?q=&layer=c&cbll=", xy[1], ",", xy[0], "&cbp=11,0,0,0,0"].join("");
        }
        return output;
    }

    function addExportFeatureLink(infoWindow) {
        var actionList = infoWindow.domNode.querySelector(".actionList");
        var link = document.createElement("a");
        var docFrag = document.createDocumentFragment();
        link.textContent = "Export";
        link.href = "#";
        link.title = "Exports the feature to JSON";
        link.classList.add("action");
        link.classList.add("export-feature");
        // Add a space before adding link.
        docFrag.appendChild(document.createTextNode(" "));
        docFrag.appendChild(link);

        link.onclick = function () {
            // Get the currently selected feature.
            var feature = infoWindow.features[infoWindow.selectedIndex];

            // Project to WGS 84 if possible.
            if (webMercatorUtils.canProject(feature.geometry, wgs84SR)) {
                feature.geometry = webMercatorUtils.project(feature.geometry, wgs84SR);
            }

            // Convert to regular object.
            feature = feature.toJson();
            // Convert to JSON string.
            feature = JSON.stringify(feature, null, "\t");
            var uri = ["data:application/json", encodeURIComponent(feature)].join(",");
            this.href = uri;
            this.target = "_blank";

            //return false;
        };

        actionList.appendChild(docFrag);
        return link;
    }

    function addGoogleStreetViewLink(infoWindow) {
        var actionList = infoWindow.domNode.querySelector(".actionList");
        var link = document.createElement("a");
        var docFrag = document.createDocumentFragment();
        link.textContent = "Google Street View";
        link.href = "#";
        link.title = "Shows the current location in Google Street View";
        link.classList.add("action");
        link.classList.add("google");
        link.classList.add("google-street-view");
        // Add a space before adding link.
        docFrag.appendChild(document.createTextNode(" "));
        docFrag.appendChild(link);

        link.onclick = function () {
            // Get the currently selected feature.
            var feature = infoWindow.features[infoWindow.selectedIndex];

            // Get the currently selected feature's geometry.
            var geometry = feature.geometry;

            // If the geometry's type is not a point, get the point that
            // the info window is currently pointing to.
            if (geometry.type !== "point") {
                geometry = infoWindow.location;
            }

            // Project to WGS 84 if possible.
            if (webMercatorUtils.canProject(geometry, wgs84SR)) {
                geometry = webMercatorUtils.project(geometry, wgs84SR);
            }
            var url = getGoogleStreetViewUrl(geometry);
            window.open(url, "_blank");

            return false;
        };

        actionList.appendChild(docFrag);
        return link;

    }

    /**
     * Makes an InfoWindow draggable.
     * @param {esri/InfoWindow} infoWindow - an info window.
     */
    function makeDraggable(infoWindow) {
        if (!infoWindow) {
            throw new TypeError("No InfoWindow was provided.");
        }
        var handle = infoWindow.domNode.querySelector(".title");
        var dnd = new Moveable(infoWindow.domNode, {
            handle: handle
        });

        // when the infoWindow is moved, hide the arrow:
        dnd.on('FirstMove', function () {
            // hide pointer and outerpointer (used depending on where the pointer is shown)
            var arrowNode = infoWindow.domNode.querySelector(".outerPointer");
            arrowNode.classList.add("hidden");

            arrowNode = infoWindow.domNode.querySelector(".pointer");
            arrowNode.classList.add("hidden");
        }.bind(this));
    }

    /**
     * Adds a link to an InfoWindow that, when clicked, will show all the current features' attributes in tables.
     * @param {InfoWindow} infoWindow - an info window
     * @param {string} [fallbackUrl] - Url on same domain to use for IE "Access is denied" workaround.
     * @returns {HTMLAnchorElement} - Returns the HTML anchor element.
     */
    function addPrintLink(infoWindow, fallbackUrl) {
        var actionList = infoWindow.domNode.querySelector(".actionList");
        var link = document.createElement("a");
        var docFrag = document.createDocumentFragment();
        link.textContent = "Print";
        link.href = "#";
        link.title = "Opens identify results in a new window for printing.";
        link.classList.add("action");
        link.classList.add("print");
        link.classList.add("print");
        // Add a space before adding link.
        docFrag.appendChild(document.createTextNode(" "));
        docFrag.appendChild(link);

        link.onclick = function () {
            var doc = document.implementation.createHTMLDocument("attributes");
            const frag = utils.graphicsToTables(doc, infoWindow.features);

            // Create a new HTML document and add the tables to it.
            doc.body.appendChild(frag);

            var style = doc.createElement("style");
            style.type = "text/css";
            style.textContent = printCss;
            doc.head.appendChild(style);

            var htmlMarkup = "<!DOCTYPE html>" + doc.documentElement.outerHTML;

            const newWindow = window.open(fallbackUrl, "geoportal_attribute_table");
            newWindow.document.write(htmlMarkup);
            newWindow.focus();

            return false;
        };

        actionList.appendChild(docFrag);
        return link;
    }

    return {
        addExportFeatureLink: addExportFeatureLink,
        addGoogleStreetViewLink: addGoogleStreetViewLink,
        makeDraggable: makeDraggable,
        addPrintLink: addPrintLink
    };
});