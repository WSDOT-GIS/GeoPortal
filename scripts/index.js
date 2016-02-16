/*global require, gaTracker, $ */
// jscs: disable

/*
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
*/

var wsdot;

require(["require", "dojo/ready", "dojo/on", "dijit/registry",
    "QueryStringManager",
    "geoportal/QueryStringManagerHelper",
    "geoportal/showDisclaimer",
    "geoportal/setupToolbar",
    "geoportal/setupLayout",
    "geoportal/configUtils",
    "geoportal/drawUIHelper",

    "esri/Color",
    "esri/config",
    "esri/map",
    "esri/geometry/jsonUtils",
    "esri/geometry/Point",
    "esri/geometry/Extent",
    "esri/tasks/GeometryService",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/toolbars/navigation",
    "esri/layers/GraphicsLayer",
    "esri/dijit/HomeButton",

    "dijit/form/Button",

    "dijit/layout/TabContainer",
    "esri/dijit/Scalebar",
    "esri/graphic",
    "esri/geometry/webMercatorUtils",
    "esri/InfoTemplate",


    "esri/dijit/BasemapGallery",
    "esri/dijit/BasemapLayer",
    "esri/SpatialReference",
    "esri/dijit/Measurement",
    "esri/request",
    "esri/layers/LabelLayer",
    "esri/renderers/SimpleRenderer",

    "BufferUI",
    "BufferUI/BufferUIHelper",
    
    "GeolocateButton",
    

    "info-window-helper",
    "esri/dijit/Search",


    "dijit/form/RadioButton",
    "dijit/form/Select",
    "dijit/form/FilteringSelect",
    "dojo/data/ItemFileReadStore",
    "dijit/form/NumberSpinner",
    "dijit/form/DateTextBox",
    "dojo/parser",
    "esri/dijit/Attribution",
    "esri/map",
    "esri/arcgis/utils",
    "esri/dijit/Scalebar",
    "esri/tasks/geometry",
    "esri/tasks/query",
    "esri/toolbars/navigation",
    "esri/toolbars/draw",
    "esri/tasks/gp",
    "esri/layers/FeatureLayer",
    "esri/IdentityManager",
    "esri/dijit/Popup",
    "extensions/esriApiExtensions",
    "extensions/htmlPopupExtensions",
    "extensions/metadataExtensions",
    "extensions/extent",
    "extensions/graphicsLayer",
    "extensions/map",
    "scripts/layerList.js",
    "scripts/zoomToXY.js", "scripts/extentSelect.js", "scripts/layerSorter.js"
], function (
    require,
    ready,
    on,
    registry,

    QueryStringManager,
    QueryStringManagerHelper,
    showDisclaimer,
    setupToolbar,
    setupLayout,
    configUtils,
    geoportalDrawUIHelper,

    Color,
    esriConfig,
    Map,
    jsonUtils,
    Point,
    Extent,
    GeometryService,
    ArcGISTiledMapServiceLayer,
    Navigation,
    GraphicsLayer,
    HomeButton,

    Button,
    TabContainer,
    Scalebar,
    Graphic,
    webMercatorUtils,
    InfoTemplate,
    BasemapGallery,
    BasemapLayer,
    SpatialReference,
    Measurement,
    esriRequest,
    LabelLayer,
    SimpleRenderer,

    BufferUI,
    BufferUIHelper,
    createGeolocateButton,
    

    infoWindowHelper,
    Search
) {
    "use strict";

    var extents = null, navToolbar, qsManager;
    wsdot = { config: {} };
    wsdot.map = null;

    // Setup other geoportals links
    (function (form) {
        var select = form.querySelector("select[name=config]");

        /**
         * When a config query string parameter has been specified,
         * set the default selected option to match.
         */
        function syncSelectedWithQSSetting() {
            var currentConfig, selectedOption;
            currentConfig = location.search.match("config=([^=&]+)");
            if (currentConfig) {
                currentConfig = currentConfig[1];
                selectedOption = select.querySelector("option[selected]");
                if (selectedOption) {
                    selectedOption.removeAttribute("selected");
                }
                selectedOption = select.querySelector("option[value='" + currentConfig + "']");
                if (selectedOption) {
                    selectedOption.setAttribute("selected", "selected");
                }
            }
        }

        syncSelectedWithQSSetting();

        // If config/internal-airport.json cannot be reached, remove internal options.
        var request = new XMLHttpRequest();
        request.open("head", "config/internal-airport.json");
        request.onloadend = function (e) {
            var internalGroup;
            if (e.target.status !== 200) {
                internalGroup = select.querySelector("optgroup[label='internal']");
                select.removeChild(internalGroup);
            }
        };
        request.send();

        select.addEventListener("change", function () {
            form.submit();
        });
    }(document.getElementById("otherGeoportalsForm")));

    function doPostConfig() {
        var button;

        // Add a method to the Date object that will return a short date string.
        if (Date.toShortDateString === undefined) {
            /**
             * Returns a string representation of the date in the format Month-Date-Year.
             * @returns {string} Short date representation of the date.
             */
            Date.prototype.toShortDateString = function () {
                return String(this.getMonth()) + "-" + String(this.getDate()) + "-" + String(this.getFullYear());
            };
        }

        (function () {
            var match = location.search.match(/\btree(=((?:1)|(?:true)|(?:on)))?\b/i), link;

            // If the "tree" query string parameter is set to true, replace the stylesheet for the layer list.
            if (match) {
                link = document.querySelector("link[href='style/layerList.css']");
                if (link) {
                    link.href = "style/layerListPlusMinus.css";
                }
            }
        }());

        document.getElementById("mainContainer").style.display = "";

        // If a title is specified in the config file, replace the page title.
        if (wsdot.config.pageTitle) {
            document.querySelector(".page-title").innerHTML = wsdot.config.pageTitle;
            document.title = wsdot.config.pageTitle;
        }

        function init() {
            var gaTrackEvent, initBasemap = null;

            if (wsdot.config.additionalStylesheets && wsdot.config.additionalStylesheets.length > 0) {
                wsdot.config.additionalStylesheets.forEach(function (path) {
                    var link = document.createElement("link");
                    link.href = path;
                    link.rel = "stylesheet";
                    document.head.appendChild(link);
                });
            }

            esriConfig.defaults.io.proxyUrl = "proxy.ashx";
            // Specify list of CORS enabled servers.
            (function (servers) {
                if (wsdot.config.corsEnabledServers) {
                    servers = servers.concat(wsdot.config.corsEnabledServers);
                }
                for (var i = 0; i < servers.length; i++) {
                    esriConfig.defaults.io.corsEnabledServers.push(servers[i]);
                }
            }(["www.wsdot.wa.gov", "data.wsdot.wa.gov"]));
            esriConfig.defaults.geometryService = new GeometryService(wsdot.config.geometryServer);

            function setupNorthArrow() {
                // Create the north arrow.
                var img = document.createElement("img");
                img.id = "northArrow";
                img.src = "images/NorthArrow.png";
                img.alt = "North Arrow";
                document.getElementById("map_root").appendChild(img);
            }

            /**
             * Adds a Google Analytics tracking event for the addition of a layer to the map.
             * @param {Event} e - layer add event.
             * @param {Layer} e.layer - layer that was added
             * @param {Layer} e.error - Error that occured when trying to add layer.
             */
            gaTrackEvent = function (e) {

                var label, basemapIdRe = /^layer\d+$/i, layer, error, action;

                layer = e.layer;
                error = e.error;

                label = basemapIdRe.exec(layer.id) ? "Basemap: " + layer.url : layer.id + ": " + layer.url;
                action = error ? 'Add - Fail' : 'Add';

                gaTracker.send('event', 'Layers', action, label);
            };

            /**
             * Updates the scale level.
             * @param {number} level - the new scale level.
             */
            function setScaleLabel(level) {
                // Set the scale.
                var scale = wsdot.map.getScale(level);
                var scaleNode = document.getElementById("scaleText");
                var nFormat = window.Intl && window.Intl.NumberFormat ? new window.Intl.NumberFormat() : null;
                var value = nFormat ? nFormat.format(scale) : scale;
                scaleNode.textContent = scale ? ["1", value].join(":") : "";
            }

            setupLayout.setupLayout();

            function setupExtents() {
                var extentSpatialReference = new SpatialReference({ wkid: 102100 });
                // Define zoom extents for menu.
                extents = {
                    fullExtent: new Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference })
                };
            }

            setupExtents();


            // Create the map, using options defined in the query string (if available).
            ////wsdot.config.mapOptions = QueryStringManager.getMapInitOptions(wsdot.config.mapOptions);
            if (wsdot.config.mapOptions.extent) {
                // Convert the extent definition in the options into an Extent object.
                wsdot.config.mapOptions.extent = new jsonUtils.fromJson(wsdot.config.mapOptions.extent);
            }

            wsdot.map = new Map("map", wsdot.config.mapOptions);

            setupLayout.setupLegend();

            // Once the map loads, update the extent or zoom to match query string.
            (function (ops) {
                if (ops.zoom && ops.center) {
                    wsdot.map.on("load", function () {
                        wsdot.map.centerAndZoom(ops.center, ops.zoom);
                    });
                }
            }(QueryStringManager.getMapInitOptions()));

            /**
             * @typedef {Object} LabelingInfoItem
             * @property {string} labelExpression - JSON string representation of array of field names.
             * @property {string} labelPlacement - e.g., "always-horizontal"
             * @property {TextSymbol} symbol
             * @property {Boolean} useCodedValues
             */

            /** Add a LabelLayer if a text layer has that defined.
             * @param {Object} result
             * @param {Layer} result.layer
             * @param {LabelingInfoItem[]} result.layer.labelingInfo
             * @param {Map} result.target
             * @param {Error} [result.error]
             */
            wsdot.map.on("layer-add-result", function (result) {
                var layer, labelingInfo, liItem, labelLayer, renderer;

                /**
                 * Moves the label layer's list item below that of the layer it is labelling.
                 */
                function moveLabelLayerListItem() {
                    var labelLayerCB, labelLayerLI, layerCB, layerLI;
                    labelLayerCB = document.querySelector("[data-layer-id='" + labelLayer.id + "']");
                    labelLayerLI = labelLayerCB.parentElement;
                    layerCB = document.querySelector("[data-layer-id='" + layer.id + "']");
                    layerLI = layerCB.parentElement;
                    layerLI.parentElement.insertBefore(labelLayerLI, layerLI.nextSibling);
                }

                /**
                 * @param {string} labelExpression - E.g., "[WRIA_NR]"
                 * @returns {string} - E.g., "${WRIA_NR}"
                 */
                function labelExpressionToTextExpression(labelExpression) {
                    var re = /\[([^\]]+)/i, match, output;
                    match = labelExpression.match(re);
                    if (match) {
                        output = "${" + match[1] + "}";
                    }
                    return output;
                }

                if (result.layer && result.layer.labelingInfo) {
                    layer = result.layer;
                    labelingInfo = layer.labelingInfo;
                    if (labelingInfo.length) {
                        if (labelingInfo.length >= 1) {
                            liItem = labelingInfo[0];
                            labelLayer = new LabelLayer({
                                id: [layer.id, "(label)"].join(" ")
                            });
                            renderer = new SimpleRenderer(liItem.symbol);
                            labelLayer.addFeatureLayer(layer, renderer, labelExpressionToTextExpression(liItem.labelExpression), liItem);
                            wsdot.map.addLayer(labelLayer);
                            moveLabelLayerListItem();
                        }
                    }
                }
            });

            // Setup the basemap gallery
            (function () {
                var basemaps = wsdot.config.basemaps, i, l, layeri, basemapGallery, customLegend;

                for (i = 0, l = basemaps.length; i < l; i += 1) {
                    for (layeri in basemaps.layers) {
                        if (basemaps.layers.hasOwnProperty(layeri)) {
                            basemaps.layers[layeri] = new BasemapLayer(basemaps.layers[layeri]);
                        }
                    }
                }

                basemapGallery = new BasemapGallery({
                    showArcGISBasemaps: true,
                    map: wsdot.map,
                    basemaps: basemaps,
                    basemapLayers: wsdot.map.layerIds
                }, "basemapGallery");

                basemapGallery.startup();

                // Remove the unwanted default basemaps as defined in config.js (if any are defined).
                basemapGallery.on("load", function () {
                    /** Gets a list IDs corresponding to basemaps that should be removed, as defined in the config file.
                     * @returns {string[]} The names of the basemaps.
                     */
                    function getBasemapsByLabel() {
                        var outputIds = [], bItem, rItem;
                        if (wsdot.config.basemapsToRemove) {
                            for (var i = 0, l = wsdot.config.basemapsToRemove.length; i < l; i += 1) {
                                rItem = wsdot.config.basemapsToRemove[i];
                                for (var b = 0, bl = basemapGallery.basemaps.length; b < bl; b += 1) {
                                    bItem = basemapGallery.basemaps[b];
                                    if (bItem.title === rItem) {
                                        outputIds.push(bItem.id);
                                        break;
                                    }
                                }
                            }
                        }
                        return outputIds;
                    }

                    if (wsdot.config.basemapsToRemove) {
                        var i, removed, toRemove = getBasemapsByLabel();
                        for (i = 0; i < toRemove.length; i += 1) {
                            removed = basemapGallery.remove(toRemove[i]);
                            if (console && console.warn) {
                                if (removed === null) {
                                    console.warn("Basemap removal failed: basemap not found: " + toRemove[i]);
                                }
                            }
                        }
                    }

                    // If an initial basemap was specified in the config file, 
                    // select that basemap now.
                    if (wsdot.config.initialBasemap) {
                        (function () {
                            var firstBasemap, currentBasemap;
                            for (var i = 0, l = basemapGallery.basemaps.length; i < l; i += 1) {
                                currentBasemap = basemapGallery.basemaps[i];
                                if (currentBasemap.title === wsdot.config.initialBasemap) {
                                    firstBasemap = currentBasemap;
                                    break;
                                }
                            }
                            if (firstBasemap) {
                                basemapGallery.select(firstBasemap.id);
                            }
                        }());
                    }
                });

                on(basemapGallery, "error", function (msg) {
                    // Show error message
                    if (console) {
                        if (console.error) {
                            console.error(msg);
                        }
                    }
                });

                // Check for an existing customLegend
                customLegend = $("#legend").data("customLegend");
                if (customLegend) {
                    customLegend.setBasemapGallery(basemapGallery);
                }
            }());

            if (wsdot.config.mapInitialLayer && wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
                initBasemap = new ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
                wsdot.map.addLayer(initBasemap);
            }

            (new HomeButton({ map: wsdot.map }, "homeButton")).startup();

            // Setup Zoom Button
            createGeolocateButton(document.getElementById("geolocateButton"), wsdot.map);

            wsdot.map.on("load", function () {

                function setupSearchControls() {
                    // Address Search
                    var toolbar = document.getElementById("toolbar");
                    var addressDiv = document.createElement("div");
                    addressDiv.id = "search";
                    toolbar.insertBefore(addressDiv, toolbar.firstChild);


                    var search = new Search({
                        map: wsdot.map,
                        enableHighlight: false
                    }, addressDiv);

                    search.on("load", function () {
                        var source = search.sources[0];
                        source.countryCode = "US";
                        // Set the extent to WA. Values from http://epsg.io/1416-area.
                        source.searchExtent = extents.fullExtent;
                    });

                    search.startup();
                }

                if (wsdot.airspaceCalculator) {
                    wsdot.airspaceCalculator.map = wsdot.map;

                    wsdot.airspaceCalculator.form.addEventListener("add-from-map", function () {
                        wsdot.map.disablePopups();
                    });

                    wsdot.airspaceCalculator.form.addEventListener("draw-complete", function () {
                        wsdot.map.enablePopups();
                    });
                }

                setupSearchControls();

                // Set the scale.
                setScaleLabel();

                // Show the buffer tools form when the buffer link is clicked.
                (function () {
                    var bufferLink;
                    if (wsdot.bufferUI) {
                        BufferUIHelper.attachBufferUIToMap(wsdot.map, wsdot.bufferUI);
                        bufferLink = wsdot.map.infoWindow.domNode.querySelector("a.buffer");
                        bufferLink.addEventListener("click", function () {
                            registry.byId("toolsAccordion").selectChild("bufferPane");
                            registry.byId("tabs").selectChild("toolsTab");

                            document.querySelector(".buffer-ui [name=distances]").focus();
                        });
                    }
                }());

                infoWindowHelper.addGoogleStreetViewLink(wsdot.map.infoWindow);
                infoWindowHelper.makeDraggable(wsdot.map.infoWindow);
                infoWindowHelper.addPrintLink(wsdot.map.infoWindow, "blank.html");

                // Show the disclaimer if one has been defined.
                showDisclaimer(wsdot.config.alwaysShowDisclaimer);

                setupNorthArrow();
                setupToolbar();

                Scalebar({ map: wsdot.map, attachTo: "bottom-left" });

                // Setup Google Analytics tracking of the layers that are added to the map.
                if (window.gaTracker) {
                    on(wsdot.map, "layer-add-result", gaTrackEvent);
                }

                // Setup either a tabbed layer list or a normal one depending on the config setting.
                if (wsdot.config.tabbedLayerList) {
                    $("#layerList").tabbedLayerList({
                        layers: wsdot.config.layers,
                        startLayers: configUtils.getVisibleLayerIdsFromConfig().concat(),
                        startCollapsed: false,
                        map: wsdot.map
                    }).css({
                        "padding": [0, 0, 0, 0],
                        "margin": [0, 0, 0, 0]
                    });
                    // Setting the padding and margin to 0 is required for IE.
                } else {
                    $("#layerList").layerList({
                        layers: wsdot.config.layers,
                        startLayers: configUtils.getVisibleLayerIdsFromConfig().concat(),
                        startCollapsed: false,
                        map: wsdot.map
                    });
                }

                wsdot.map.setupIdentifyPopups({
                    ignoredLayerRE: wsdot.config.noPopupLayerRe ? new RegExp(wsdot.config.noPopupLayerRe, "i") : /^layer\d+$/i
                });

                geoportalDrawUIHelper(wsdot.map);

                qsManager = new QueryStringManager(wsdot.map);

                QueryStringManagerHelper.setupLayerListForQueryString(wsdot.map);

                // Attach the map to the print form (if config contains print URL).
                if (wsdot.printForm) {
                    wsdot.printForm.map = wsdot.map;
                }
            });

            /**
             * @param {esri.geometry.ScreenPoint} zoomArgs.anchor
             * @param {esri.geometry.Extent} zoomArgs.extent
             * @param {number} zoomArgs.level
             * @param {esri.Map} zoomArgs.target
             * @param {number} zoomArgs.zoomFactor
             */
            on(wsdot.map, "zoom-end", function (zoomArgs) {
                setScaleLabel(zoomArgs.level);
            });

            // Setup the navigation toolbar.
            navToolbar = new Navigation(wsdot.map);
            navToolbar.on("extent-history-change", function () {
                registry.byId("previousExtentButton").attr("disabled", navToolbar.isFirstExtent());
                registry.byId("nextExtentButton").attr("disabled", navToolbar.isLastExtent());
            });

            button = new Button({
                iconClass: "zoomprevIcon",
                showLabel: false,
                onClick: function () {
                    navToolbar.zoomToPrevExtent();
                }
            }, "previousExtentButton");

            button = new Button({
                iconClass: "zoomnextIcon",
                showLabel: false,
                onClick: function () {
                    navToolbar.zoomToNextExtent();
                }
            }, "nextExtentButton");

        }

        //show map on load
        ready(init);
    }

    configUtils.getConfig().then(doPostConfig, function (error) {
        console.error(error);
    });

});