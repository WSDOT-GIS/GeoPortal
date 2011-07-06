/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint white: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 50, indent: 4 */


/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3"/>
/// <reference path="dojo.js.uncompressed.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js"/>
/// <reference path="extentAutoComplete.js"/>
/// <reference path="jquery.pnotify.js"/>
/// <reference path="jquery.ba-bbq.js" />
/// <reference path="json2.js" />
/// <reference path="kmlGraphicsLayer.js" />
/// <reference path="layerList.js" />
/// <reference path="locationInfo.js" />
/// <reference path="config.js" />

(function ($) {
    "use strict";

    var map = null,
        extents = null,
        navToolbar,
        notices = {},
        geometryService,
        exportDialog = null,
        helpDialog;

    // Add a method to the Date object that will return a short date string.
    if (typeof (Date.toShortDateString) === "undefined") {
        Date.prototype.toShortDateString = function () {
            /// <summary>Returns a string representation of the date in the format Month-Date-Year.</summary>
            return this.getMonth() + "-" + this.getDate() + "-" + this.getFullYear();
        };
    }

    $(document).ready(function () {
        $("#mainContainer").css("display", "");

        // Set the links to other websites to open in a new window.  
        // Specifically selecting any element that has an href attribute and the value of that attribute does not start with # or mailto.
        $("a.newTab").each(function (index, element) {
            // Store the current value of the href attribute.
            var href = element.href;
            // Set a handler on the click event to open the url in a new window or tab.  (Window or tab is determined by the browser settings.)
            $(element).bind("click", { href: href }, function (event) { window.open(event.data.href); return null; });
            // Change the value of href to #.  (Otherwise the URL will still replace this application AND open in a new tab, which is not what we want.)
            element.href = "#";
        });

        // Set alternating row colors in legend
        $(".alternatingLines tbody tr:odd").addClass("alternate-row");
    });







    dojo.require("dijit.dijit"); // optimize: load dijit layer
    dojo.require("dijit.layout.BorderContainer");
    dojo.require("dijit.layout.TabContainer");
    dojo.require("dijit.layout.AccordionContainer");
    dojo.require("dijit.layout.ContentPane");

    dojo.require("dojox.layout.ExpandoPane");

    dojo.require("dijit.form.Select");
    dojo.require("dijit.form.FilteringSelect");
    dojo.require("dojo.data.ItemFileReadStore");
    dojo.require("dijit.form.NumberSpinner");
    dojo.require("dijit.form.DateTextBox");


    dojo.require("dojo.parser");

    dojo.require("esri.map");
    //dojo.require("esri.virtualearth.VETiledLayer");
    dojo.require("esri.dijit.BasemapGallery");
    dojo.require("esri.arcgis.utils");
    dojo.require("esri.dijit.Scalebar");
    dojo.require("esri.tasks.geometry");
    dojo.require("esri.tasks.query");
    dojo.require("esri.toolbars.navigation");
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.dijit.Legend");
    dojo.require("esri.dijit.Measurement");
    dojo.require("esri.tasks.gp");

    dojo.require("dojox.image.Lightbox");

    // Add a category property to the esri.layers.Layer class.
    dojo.extend(esri.layers.Layer, { "wsdotCategory": null });

    dojo.extend(esri.geometry.Extent, { "toCsv": function () {
        var propNames = ["xmin", "ymin", "xmax", "ymax"];
        var output = "";
        for (var i = 0, l = propNames.length; i < l; i++) {
            if (i > 0) {
                output += ","
            }
            output += this[propNames[i]];
        }
        return output;
    }
    });

    dojo.extend(esri.layers.GraphicsLayer, {
        "getGraphicsAsJson": function () {
            /// <summary>Returns an array of ArcGIS Server JSON graphics.</summary>
            return dojo.map(this.graphics, function (item) {
                return item.toJson();
            })
        }
    });

    dojo.extend(esri.Map, {
        "getVisibleLayers": function () {
            /// <summary>Returns an array of all of the layers in the map that are currently visible.</summary>
            /// <returns type="Array" />
            var layer;
            var visibleLayers = [];
            for (var i = 0, l = this.layerIds.length; i < l; i++) {
                layer = this.getLayer(this.layerIds[i]);
                if (layer.visible === true && (typeof (layer.wsdotCategory) === "undefined" || layer.wsdotCategory !== "Basemap")) {
                    visibleLayers.push(layer);
                }
            }
            return visibleLayers;
        },
        "getLOD": function (level) {
            /// <summary>Gets the current level of detail (LOD) for the map.</summary>
            /// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
            /// <returns type="esri.layers.LOD" />
            var firstLayer = this.getLayer(this.layerIds[0]);
            var lod = null;
            if (firstLayer.tileInfo) {
                if (typeof (level) === "undefined" || level === null) {
                    level = this.getLevel();
                }
                lod = firstLayer.tileInfo.lods[level];
            }
            return lod;
        },
        "getScale": function (level) {
            /// <summary>Returns the current scale of the map.</summary>
            /// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
            /// <returns type="Number" />
            var lod = this.getLOD(level);
            if (lod !== null) {
                return lod.scale;
            }
            else {
                return null;
            }
        },
        "getGraphicsLayers": function () {
            /// <summary>Returns all graphics layers in the map.</summary>
            /// <param name="excludeInternalGraphicsLayer" type="Boolean">Set to true to exclude the map object's internal graphics layer, false to include it.</param>
            var gfxLayers = [];
            var layer, id;
            for (var i = 0; i < this.graphicsLayerIds.length; i++) {
                id = this.graphicsLayerIds[i];
                layer = this.getLayer(id);
                if (layer.isInstanceOf(esri.layers.GraphicsLayer) && !layer.isInstanceOf(esri.layers.FeatureLayer)) {
                    gfxLayers.push(layer);
                }
            }
            return gfxLayers;

        },
        "getGraphicsAsJson": function (options) {
            /// <summary>Returns all of the graphics in all of the graphics layers in the map.</summary>
            var graphicsLayers = this.getGraphicsLayers(),
                output = {};

            // Set default values for omitted options.
            if (typeof (options) === "undefined") {
                options = {
                    removeInfoTemplate: true,
                    removeSymbol: true
                }
            }
            if (typeof (options.removeInfoTemplate) === "undefined") {
                options.removeInfoTemplate = true;
            }
            if (typeof (options.removeSymbol) === "undefined") {
                options.removeSymbol = true;
            }

            // For each layer, get a collection of JSON graphic representations
            dojo.forEach(graphicsLayers, function (layer, layerIndex) {
                var graphics;
                if (layer.graphics.length > 0) {
                    graphics = layer.getGraphicsAsJson();
                    if (options.removeInfoTemplate === true || options.removeSymbol === true) {
                        // Remove unwanted properties from each graphic representation as specified in the options object.
                        dojo.forEach(graphics, function (graphic, gIndex) {
                            if (typeof (graphic.infoTemplate) !== "undefined" && options.removeInfoTemplate === true) {
                                delete graphic.infoTemplate;
                            }
                            if (typeof (graphic.symbol) !== "undefined" && options.removeSymbol === true) {
                                delete graphic.symbol;
                            }
                        })
                    }
                    output[layer.id] = graphics;
                }
            });
            return output;
        }
    });





    function getExtentLink() {
        /// <summary>Sets the extent link in the bookmark tab to the given extent and visible layers.</summary>
        var qsParams = {
            "extent": map.extent.toCsv()
        };
        $(map.getVisibleLayers()).each(function (index, layer) {
            if (index === 0) {
                qsParams.visibleLayers = layer.id + ":" + Math.round(layer.opacity * 100) / 100;
            }
            else {
                qsParams.visibleLayers += "," + layer.id + ":" + Math.round(layer.opacity * 100) / 100;
            }
        });

        return $.param.querystring(window.location.protocol + "//" + window.location.host + window.location.pathname, qsParams);
    }

    function showHelpDialog(helpUrl) {
        /// <summary>Opens the help dialog and adds content from the given URL.</summary>
        /// <param name="helpUrl" type="String">The URL that containts the content that will be shown in the help dialog.</param>
        var helpContent;
        if (!helpDialog) {
            // Create the help dialog if it does not already exist.
            helpDialog = $("<div>").attr("id", "helpDialog").dialog({ autoOpen: false, title: "Help", height: 480 });
            helpContent = $("<div>").attr("id", "helpContent").appendTo(helpDialog);
        }
        else {
            // Clear the contents
            helpContent = $("#helpContent").empty();
        }

        helpDialog.dialog("open");

        helpContent.load(helpUrl, function (responseText, textStatus, XMLHttpRequest) {
            // Handle case where content could not be loaded.
            if (!textStatus.match(/(?:success)|(?:notmodified)/i)) {
                helpContent.text("Error loading help text.");
            }
        });
    }


    function init() {
        esri.config.defaults.io.proxyUrl = "proxy.ashx";
        //esri.config.defaults.geometryService = wsdot.config.geometryServer;

        var geometryService = new esri.tasks.GeometryService(wsdot.config.geometryServer);

        // Opera doesn't display the zoom slider correctly.  This will make it look better.
        // For more info see http://forums.arcgis.com/threads/24687-Scale-Slider-on-Opera-11.0.1
        if (dojo.isOpera) {
            esri.config.defaults.map.sliderLabel = { labels: ["state", "county", "city"], tick: 0 };
        }

        function setupNorthArrow() {
            // Create the north arrow.
            dojo.create("img", { id: "northArrow", src: "images/NorthArrow.png", alt: "North Arrow" }, "map_root", "last");
        }

        function setupToolbar() {
            dijit.form.Button({
                iconClass: "helpIcon",
                showLabel: false,
                onClick: function () {
                    // window.open("help/default.html", "GRDO Map Help");
                    showHelpDialog("help/navigation.html");
                }
            }, "helpButton");
            dijit.form.Button({
                iconClass: "linkIcon",
                showLabel: false,
                onClick: function () {
                    /// <summary>Show a dialog with a link to the application, containing query string parameters with the current extent and layers.</summary>
                    var url = getExtentLink(),
                        linkDialog = $("#linkDialog");
                    // Create the link dialog if it does not already exist.
                    if (linkDialog.length === 0) {
                        linkDialog = $("<div>").attr("id", "linkDialog").append("<a>").dialog({ "autoOpen": false, "modal": true, "title": "Bookmark" });
                    }
                    $("#linkDialog a").attr("href", url).text(url);
                    linkDialog.dialog("open");
                }
            }, "linkButton");


            // TODO: Make drop-down button instead of popping up a dialog.
            var button = dojo.create("button", { id: "saveButton" }, "toolbar", "first");
            dijit.form.Button({
                label: "Save",
                showLabel: false,
                iconClass: "dijitEditorIcon dijitEditorIconSave",
                onClick: function () {
                    // Create the export dialog if it does not already exist.
                    if (!exportDialog) {
                        exportDialog = $("<div>").attr("id", "exportDialog").dialog({ autoOpen: false, title: "Save Graphics", modal: true });
                        var form = $("<form>").attr("action", "GraphicExport.ashx").attr("method", "post").appendTo(exportDialog);

                        $("<label>").attr("for", "graphic-export-format").text("Select an export format:").appendTo(form);
                        var formatSelect = $("<select name='f' id='graphic-export-format'>").appendTo(form);

                        $([["json", "JSON"]]).each(function (index, element) {
                            $("<option>").attr("value", element[0]).text(element[1]).appendTo(formatSelect);
                        });

                        $("<button>").css("display", "block").attr("type", "button").text("Export").appendTo(form).button().click(function () {
                            // Get all of the graphics and store in a cookie.
                            var graphicsJson = JSON.stringify(map.getGraphicsAsJson());
                            $.cookie("graphics", graphicsJson);

                            // Create the request URL.
                            var url = $.param.querystring("GraphicExport.ashx", { "f": formatSelect.val() });
                            // Open the URL in a new window.
                            window.open(url);
                            exportDialog.dialog("close");
                        });
                    }

                    // Set the hidden graphics element's value.


                    // Show the export dialog
                    exportDialog.dialog("open");
                }
            }, "saveButton");
        }

        function setupLayout() {
            var mainContainer = new dijit.layout.BorderContainer({ design: "headline", gutters: false }, "mainContainer");
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "top" }, "headerPane"));
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "center" }, "mapContentPane"));

            var legendPane = new dojox.layout.ExpandoPane({ region: "leading", splitter: true, title: "Map Controls" }, "legendPane");
            var tabs = new dijit.layout.TabContainer(null, "tabs");
            tabs.addChild(new dijit.layout.ContentPane({ title: "Layers" }, "layersTab"));
            tabs.addChild(new dijit.layout.ContentPane({ title: "Legend" }, "legendTab"));
            var toolsTab = new dijit.layout.ContentPane({ title: "Tools" }, "toolsTab");
            var toolsAccordion = new dijit.layout.AccordionContainer(null, "toolsAccordion");




            // Measure tools
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Measure" }, "measureControls"));



            // Zoom tools
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Zoom Controls" }, "zoomControls"));
            // Add the help button for the zoom controls.
            dijit.form.Button({
                label: "Zoom Help",
                showLabel: false,
                iconClass: "helpIcon",
                onClick: function () {
                    showHelpDialog("../help/zoom_controls.html");
                }
            }, dojo.create("button", { id: "zoomHelp", type: "button" }, "zoomControls"));

            // Location Informatoin tools
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Location Information" }, "locationInfo"));


            // LRS Tools

            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Milepost" }, "lrsTools"));

            tabs.addChild(toolsTab);
            tabs.addChild(new dijit.layout.ContentPane({ title: "Basemap" }, "basemapTab"));
            legendPane.addChild(tabs);
            mainContainer.addChild(legendPane);

            mainContainer.startup();
        }

        function setScaleLabel(level) {
            // Set the scale.
            var scale = map.getScale(level);
            if (scale === null) {
                scale = "";
            }
            else {
                scale = "1:" + scale;
            }
            $("#scaleText").text(scale);
        }

        setupLayout();

        // Convert the extent definition in the options into an esri.geometry.Extent object.
        wsdot.config.mapOptions.extent = new esri.geometry.fromJson(wsdot.config.mapOptions.extent);


        // Define zoom extents for menu.
        var extentSpatialReference = new esri.SpatialReference({ wkid: 102100 });
        extents = {
            fullExtent: new esri.geometry.Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference }),
            countyExtents: { "Cowlitz": { "xmin": -13716608.1772, "ymin": 5756446.5261, "xmax": -13607638.501, "ymax": 5842754.0508 }, "Whitman": { "xmin": -13163464.6711, "ymin": 5847392.8245, "xmax": -13028774.4496, "ymax": 5984725.1359 }, "Spokane": { "xmin": -13116067.9387, "ymin": 5984489.784, "xmax": -13028809.6233, "ymax": 6114814.6868 }, "Okanogan": { "xmin": -13456929.5548, "ymin": 6097022.1384, "xmax": -13228768.0346, "ymax": 6274958.9602 }, "Whatcom": { "xmin": -13728170.447, "ymin": 6211586.2765, "xmax": -13431350.2501, "ymax": 6275274.979 }, "King": { "xmin": -13641277.0042, "ymin": 5955853.9667, "xmax": -13477001.0149, "ymax": 6070428.8593 }, "Kittitas": { "xmin": -13521532.7745, "ymin": 5899113.9835, "xmax": -13350070.2043, "ymax": 6040226.1383 }, "Yakima": { "xmin": -13527887.9391, "ymin": 5786789.6607, "xmax": -13343374.1361, "ymax": 5956573.2746 }, "Columbia": { "xmin": -13162673.7586, "ymin": 5780181.9819, "xmax": -13091540.6017, "ymax": 5881022.6956 }, "Skagit": { "xmin": -13666072.6368, "ymin": 6156232.4448, "xmax": -13434716.5579, "ymax": 6216862.0714 }, "Wahkiakum": { "xmin": -13773334.2204, "ymin": 5803187.7205, "xmax": -13716034.4264, "ymax": 5842274.2847 }, "San Juan": { "xmin": -13722118.9812, "ymin": 6154236.6866, "xmax": -13659272.347, "ymax": 6246272.0081 }, "Jefferson": { "xmin": -13883451.6533, "ymin": 6026992.6909, "xmax": -13647254.6175, "ymax": 6168652.2854 }, "Lewis": { "xmin": -13733788.4441, "ymin": 5842022.6891, "xmax": -13508975.7523, "ymax": 5908584.5364 }, "Ferry": { "xmin": -13232547.6219, "ymin": 6078547.14, "xmax": -13147311.3041, "ymax": 6274878.086 }, "Pend Oreille": { "xmin": -13094470.0429, "ymin": 6114408.5894, "xmax": -13027916.5477, "ymax": 6274942.0713 }, "Franklin": { "xmin": -13297953.5226, "ymin": 5811290.5149, "xmax": -13157743.3914, "ymax": 5899593.8738 }, "Walla Walla": { "xmin": -13251654.4058, "ymin": 5780326.7638, "xmax": -13134753.0631, "ymax": 5878116.3164 }, "Lincoln": { "xmin": -13244769.7727, "ymin": 5984619.1827, "xmax": -13115603.0047, "ymax": 6099856.8495 }, "Benton": { "xmin": -13344617.6406, "ymin": 5754139.5511, "xmax": -13240449.8207, "ymax": 5897751.643 }, "Clark": { "xmin": -13669582.7159, "ymin": 5707531.0819, "xmax": -13608198.7464, "ymax": 5789926.0889 }, "Pierce": { "xmin": -13675925.5501, "ymin": 5897856.0581, "xmax": -13511306.3151, "ymax": 6008212.5148 }, "Klickitat": { "xmin": -13537868.9285, "ymin": 5717448.7451, "xmax": -13343404.634, "ymax": 5787581.0243 }, "Grant": { "xmin": -13363106.9209, "ymin": 5881154.2164, "xmax": -13243995.6844, "ymax": 6100566.8755 }, "Chelan": { "xmin": -13489786.8267, "ymin": 5984760.3314, "xmax": -13342761.5943, "ymax": 6198989.41 }, "Thurston": { "xmin": -13714908.1752, "ymin": 5903319.5991, "xmax": -13603589.1089, "ymax": 5973834.5544 }, "Clallam": { "xmin": -13899444.6403, "ymin": 6084703.4441, "xmax": -13680883.6168, "ymax": 6189343.3633 }, "Douglas": { "xmin": -13393771.1496, "ymin": 5978080.6643, "xmax": -13241520.921, "ymax": 6132044.942 }, "Stevens": { "xmin": -13180410.3388, "ymin": 6072370.4054, "xmax": -13072245.7038, "ymax": 6274987.4244 }, "Adams": { "xmin": -13288154.3124, "ymin": 5898997.675, "xmax": -13131174.6649, "ymax": 5984917.9955 }, "Pacific": { "xmin": -13823107.8933, "ymin": 5818061.0061, "xmax": -13732083.3359, "ymax": 5908563.6219 }, "Island": { "xmin": -13677515.936, "ymin": 6078202.9272, "xmax": -13617553.3997, "ymax": 6176489.1526 }, "Kitsap": { "xmin": -13696574.1685, "ymin": 6008153.0256, "xmax": -13628515.5078, "ymax": 6102333.7942 }, "Garfield": { "xmin": -13120489.3456, "ymin": 5779994.9236, "xmax": -13049763.0779, "ymax": 5893758.4025 }, "Mason": { "xmin": -13748635.6001, "ymin": 5955512.1077, "xmax": -13670052.185, "ymax": 6041803.2531 }, "Grays Harbor": { "xmin": -13856990.0768, "ymin": 5908013.6975, "xmax": -13709928.0411, "ymax": 6029660.264 }, "Asotin": { "xmin": -13077814.2164, "ymin": 5779598.1341, "xmax": -13014945.7855, "ymax": 5854737.304 }, "Skamania": { "xmin": -13608832.7415, "ymin": 5708314.0933, "xmax": -13526920.5016, "ymax": 5842848.1259 }, "Snohomish": { "xmin": -13632030.2268, "ymin": 6069562.9349, "xmax": -13459351.7812, "ymax": 6156742.2548} }
        };

        var extentData = [];
        var i;
        // Convert the county JSON objects into esri.geomtry.Extents.
        for (i in extents.countyExtents) {
            if (extents.countyExtents.hasOwnProperty(i)) {
                extentData.push({ name: i, extent: new esri.geometry.fromJson(extents.countyExtents[i]).setSpatialReference(extentSpatialReference) });
            }
        }

        extents.countyExtents = extentData;

        map = new esri.Map("map", wsdot.config.mapOptions);
        var initBasemap = null;
        if (wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
            initBasemap = new esri.layers.ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
        }

        $("#locationInfoControl").locationInfo(map, wsdot.config.locationInfoUrl);
        esri.dijit.Measurement({ map: map }, dojo.byId("measureWidget")).startup();
        dijit.form.Button({
            iconClass: "helpIcon",
            label: "Measure tool help",
            showLabel: false,
            onClick: function() {
                showHelpDialog("help/measure.html");
            }
        }, dojo.create("button", { id: "measureHelp", type: "button" }, "measureControls"));


        map.addLayer(initBasemap);
        notices.updatingMap = $.pnotify({
            pnotify_title: "Updating map...",
            pnotify_text: "Please wait...",
            pnotify_notice_icon: 'ui-icon ui-icon-transferthick-e-w',
            pnotify_nonblock: true,
            pnotify_hide: false,
            pnotify_closer: false,
            pnotify_history: false
        });

        dojo.connect(map, "onLoad", map, function () {
            // Set the scale.
            setScaleLabel();

            $("#lrsTools").lrsTools(map);
            setupNorthArrow();
            setupToolbar();
            esri.dijit.Scalebar({ map: map, attachTo: "bottom-left" });

            function createBasemapGallery() {
                var basemaps = wsdot.config.basemaps;
                for (var i = 0, l = basemaps.length; i < l; i++) {
                    for (layeri in basemaps.layers) {
                        basemaps.layers[layeri] = new esri.dijit.BasemapLayer(basemaps.layers[layeri]);
                    }
                }

                var basemapGallery = new esri.dijit.BasemapGallery({
                    showArcGISBasemaps: true,
                    map: map,
                    basemaps: basemaps
                }, "basemapGallery");

                basemapGallery.startup();

                // Remove the unwanted default basemaps as defined in config.js (if any are defined).
                if (wsdot.config.basemapsToRemove) {
                    dojo.connect(basemapGallery, "onLoad", wsdot.config.basemapsToRemove, function () {
                        for (var i = 0; i < this.length; i++) {
                            var removed = basemapGallery.remove(this[i]);
                            if (console && console.warn) {
                                if (removed === null) {
                                    console.warn("Basemap removal failed: basemap not found: " + this[i]);
                                }
                            }
                        }
                    });
                }



                dojo.connect(basemapGallery, "onError", function (msg) {
                    // TODO: Show error message instead of just closing notification.
                    if (notices.loadingBasemap) {
                        notices.loadingBasemap.pnotify_remove();
                    }
                });

                // Set up code to hide or display basemap-specific legends.
                dojo.connect(basemapGallery, "onSelectionChange", function () {
                    if (notices.loadingBasemap) {
                        notices.loadingBasemap.pnotify_remove();
                    }
                });
            }


            createBasemapGallery();

            function resizeMap() {
                //resize the map when the browser resizes - view the 'Resizing and repositioning the map' section in
                //the following help topic for more details http://help.esri.com/EN/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/inside_guidelines.htm
                var resizeTimer;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    map.resize();
                    map.reposition();
                }, 500);
            }

            dojo.connect(dijit.byId('mapContentPane'), 'resize', resizeMap);

            // Zoom to the extent in the query string (if provided).
            // Test example:
            // extent=-13677603.622831678,5956814.051290565,-13576171.686297385,6004663.630997022
            var qsParams = $.deparam.querystring(true);
            if (qsParams.extent) {
                // Split the extent into its four coordinates.  Create the extent object and set the map's extent.
                var coords = $(qsParams.extent.split(/,/, 4)).map(function (index, val) { return parseFloat(val) });
                var extent = new esri.geometry.Extent(coords[0], coords[1], coords[2], coords[3], map.spatialReference);
                map.setExtent(extent);
            }

            var layers = [];

            // Load the layers that are defined in the config file.
            for (var i = 0, l = wsdot.config.layers.length; i < l; i++) {
                var layerInfo = wsdot.config.layers[i];
                var constructor;
                switch (layerInfo.layerType) {
                    case "esri.layers.ArcGISTiledMapServiceLayer":
                        constructor = esri.layers.ArcGISTiledMapServiceLayer;
                        break;
                    case "esri.layers.ArcGISDynamicMapServiceLayer":
                        constructor = esri.layers.ArcGISDynamicMapServiceLayer;
                        break;
                    case "esri.layers.FeatureLayer":
                        constructor = esri.layers.FeatureLayer;
                        break;
                    default:
                        // Unsupported type.
                        continue;
                }
                // Create an info template object if paramters are defined.
                if (layerInfo.options && layerInfo.options.infoTemplate) {
                    layerInfo.options.infoTemplate = new esri.InfoTemplate(layerInfo.options.infoTemplate)
                }
                var layer = constructor(layerInfo.url, layerInfo.options);
                // Set the category property if a category has been specified for this layer.
                if (layerInfo.wsdotCategory) {
                    layer.wsdotCategory = layerInfo.wsdotCategory;
                }
                map.addLayer(layer);
                if (layerInfo.visibleLayers) {
                    layer.setVisibleLayers(layerInfo.visibleLayers);
                }
                layers.push(layer);
            }

            $("#layerList").layerList({ "layerSource": layers, "map": map });

            // Connect the interchange drawings layer's onClick event so that when a graphic is clicked the associated PDF is opened in a new window or tab (depends on user's settings).
            dojo.connect(map.getLayer("Interchange Drawings"), "onClick", function (event) {
                var graphic = event.graphic;
                if (graphic) {
                    var pdfUrl = graphic.attributes.PDFURL;
                    if (pdfUrl) {
                        // Show the PDF.
                        window.open(pdfUrl);
                    }
                }
            });

        });

        var legend = new esri.dijit.Legend({ map: map }, "legend");
        legend.startup();

        // Setup update notifications.
        dojo.connect(map, "onUpdateStart", map, function () {
            notices.updatingMap.pnotify_display();
        });
        dojo.connect(map, "onUpdateEnd", map, function () {
            if (notices.updatingMap) {
                notices.updatingMap.pnotify_remove();
            }
        });



        dojo.connect(map, "onZoomEnd", function (extent, zoomFactor, anchor, level) {
            setScaleLabel(level);
        });


        // Setup the navigation toolbar.
        navToolbar = new esri.toolbars.Navigation(map);
        dojo.connect(navToolbar, "onExtentHistoryChange", function () {
            dijit.byId("previousExtentButton").disabled = navToolbar.isFirstExtent();
            dijit.byId("nextExtentButton").disabled = navToolbar.isLastExtent();
        });

        // Set up the zoom select boxes.
        // TODO: Make the zoom extent filtering select a dijit.
        function setupFilteringSelect(featureSet, id) {
            /// <summary>Creates a dijit.form.FilteringSelect from a feature set.</summary>
            /// <param name="featureSet" type="esri.tasks.FeatureSet">A set of features returned from a query.</param>
            var sortByName = function (a, b) { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0; };
            var data;
            if (featureSet.isInstanceOf && featureSet.isInstanceOf(esri.tasks.FeatureSet)) {
                var graphic;
                var nameAttribute = "NAME";
                data = { identifier: "name", label: "name", items: [] };
                var i, l;
                for (i = 0, l = featureSet.features.length; i < l; i += 1) {
                    graphic = featureSet.features[i];
                    data.items.push({
                        name: graphic.attributes[nameAttribute],
                        extent: graphic.geometry.getExtent()
                    });
                }
                data.items.sort(sortByName);
                data = new dojo.data.ItemFileReadStore({ data: data });
            } else {
                featureSet.sort(sortByName);
                data = new dojo.data.ItemFileReadStore({ data: { identifier: "name", label: "name", items: featureSet} });
            }
            var filteringSelect = new dijit.form.FilteringSelect({
                id: id,
                name: "name",
                store: data,
                searchAttr: "name",
                required: false,
                onChange: function (newValue) {
                    if (this.item && this.item.extent) {
                        var extent = this.item.extent[0];

                        try {
                            map.setExtent(extent);
                        } catch (e) {
                            if (console && console.debug) {
                                console.debug(e);
                            }
                        }
                    }
                    this.reset();
                }
            }, id);
            return filteringSelect;
        }

        // Setup the zoom controls.
        setupFilteringSelect(extents.countyExtents, "countyZoomSelect");
        delete extents.countyExtents;

        function CreateQueryTask(qtName) {
            /// <summary>Creates a query task and query using settings from config.js.</summary>
            /// <param name="qtName" type="String">The name of a query task from config.js.</param>
            var queryTaskSetting = wsdot.config.queryTasks[qtName];
            var qt = new esri.tasks.QueryTask(queryTaskSetting.url);
            var query = new esri.tasks.Query();
            for (var n in queryTaskSetting.query) {
                query[n] = queryTaskSetting.query[n];
            };
            return { "task": qt, "query": query };
        }


        // Setup extents for cities and urbanized area zoom tools.
        var cityQueryTask = CreateQueryTask("city");
        cityQueryTask.task.execute(cityQueryTask.query, function (featureSet) { setupFilteringSelect(featureSet, "cityZoomSelect"); });

        var urbanAreaQueryTask = CreateQueryTask("urbanArea");
        urbanAreaQueryTask.task.execute(urbanAreaQueryTask.query, function (featureSet) { setupFilteringSelect(featureSet, "urbanAreaZoomSelect"); });

        // Associate labels with select controls, so that clicking on a label activates the corresponding control.
        dojo.attr("countyZoomLabel", "for", "countyZoomSelect");
        dojo.attr("cityZoomLabel", "for", "cityZoomSelect");
        dojo.attr("urbanAreaZoomLabel", "for", "urbanAreaZoomSelect");

        // Create the button dijits.
        var button = new dijit.form.Button({
            iconClass: "zoomfullextIcon",
            showLabel: false,
            onClick: function () {
                map.setExtent(extents.fullExtent);
            }
        }, "fullExtentButton");

        button = new dijit.form.Button({
            iconClass: "zoomprevIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToPrevExtent();
            }
        }, "previousExtentButton");

        button = new dijit.form.Button({
            iconClass: "zoomnextIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToNextExtent();
            }
        }, "nextExtentButton");

        if (navigator.geolocation) {
            dijit.form.Button({
                onClick: function () {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(position.coords.longitude, position.coords.latitude));
                            var attributes = { lat: position.coords.latitude.toFixed(6), long: position.coords.longitude.toFixed(6) };
                            map.infoWindow.setTitle("You are here").setContent(esri.substitute(attributes, "Lat: ${lat} <br />Long: ${long}")).show(map.toScreen(pt));
                            map.centerAndZoom(pt, 8);
                        },
                        function (error) {
                            var message = "";
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
                                var strErrorCode = error.code.toString();
                                message = "The position could not be determined due to an unknown error (Code: " + strErrorCode + ").";
                            }
                            alert(message);
                        },
                        {
                            maximumAge: 0,
                            timeout: 30000,
                            enableHighAccuracy: true
                        }
                    );
                }
            }, "zoomToMyCurrentLocation");
        } else {
            dojo.destroy("zoomToMyCurrentLocation");
        }

    }





    //show map on load
    dojo.addOnLoad(init);
} (jQuery));