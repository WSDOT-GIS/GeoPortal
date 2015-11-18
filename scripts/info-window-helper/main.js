/*global define*/
define([
    "esri/SpatialReference",
    "esri/geometry/webMercatorUtils",
    "dojo/dnd/Moveable",
    "dojo/text!./print.min.css"
], function (SpatialReference, webMercatorUtils, Moveable, printCss) {
    var wgs84SR = new SpatialReference(4326);

    /**
     * Creates a Google Street View URL from a geometry.
     * @param {esri/geometry/Point} point
     * @returns {string}
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

    function groupFeaturesByLayer(features) {
        var i, l, feature, output = {}, key;

        for (var i = 0, l = features.length; i < l; i++) {
            feature = features[i];
            key = [feature.layer.id, feature.result.layerId];
            if (!output.hasOwnProperty(key)) {
                output[key] = [feature];
            } else {
                output[key].push(feature);
            }
        }

        return output;
    }

    function createTable(features, doc) {
        var table, attribNames, feature, row, thead, tbody;
        table = doc.createElement("table");
        tbody = table.createTBody();

        var ignoredAttributes = /(OBJECTID)|(Shape(\.STLength)?)/i;
        var caption;

        for (var i = 0, l = features.length; i < l; i++) {
            feature = features[i];

            // Create the table header.
            if (!attribNames) {
                attribNames = [];
                for (var name in feature.attributes) {
                    if (feature.attributes.hasOwnProperty(name) && !ignoredAttributes.test(name)) {
                        attribNames.push(name);
                    }
                }
                // Set the table's caption to the layer name.
                caption = table.createCaption();
                caption.textContent = feature.result.layerName;

                thead = table.createTHead();
                row = thead.insertRow();
                attribNames.forEach(function (name) {
                    var cell = document.createElement("th");
                    cell.textContent = name;
                    row.appendChild(cell);
                });
            }

            // Add body rows
            row = tbody.insertRow(-1);

            attribNames.forEach(function (name) {
                var cell = row.insertCell();
                var value = feature.attributes[name];
                if (value != null) {
                    cell.textContent = value.toString();
                }
            });
        }

        return table;
    }

    function groupedFeaturesToTables(groupedFeatures, doc) {
        var frag, table, attribNames;

        frag = doc.createDocumentFragment();
        for (var key in groupedFeatures) {
            if (groupedFeatures.hasOwnProperty(key)) {
                table = createTable(groupedFeatures[key], doc);
                frag.appendChild(table);
            }
        }
        return frag;
    }

    /**
     * Adds a link to an InfoWindow that, when clicked, will show all the current features' attributes in tables.
     * @param {InfoWindow} infoWindow
     */
    function addPrintLink(infoWindow) {
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
            var features = groupFeaturesByLayer(infoWindow.features);
            var doc = document.implementation.createHTMLDocument("attributes");
            var tables = groupedFeaturesToTables(features, doc);
            console.log("infoWindow features", features);

            // Create a new HTML document and add the tables to it.
            doc.body.appendChild(tables);

            var style = doc.createElement("style");
            style.type = "text/css";
            style.textContent = printCss;
            doc.head.appendChild(style);
            
            var htmlMarkup = doc.documentElement.outerHTML;
            // Encode markup to base-64 for Firefox compatibility.
            var url = ["data:text/html;base64", btoa(htmlMarkup)].join(",");

            window.open(url, "geoportal_attribute_table");

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