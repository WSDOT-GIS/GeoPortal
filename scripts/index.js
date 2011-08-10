/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint browser: true, devel: true, white: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 50, indent: 4 */


/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3"/>
/// <reference path="dojo.js.uncompressed.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js"/>
/// <reference path="jquery.ba-bbq.js" />
/// <reference path="json2.js" />
/// <reference path="layerList.js" />
/// <reference path="locationInfo.js" />
/// <reference path="config.js" />

(function ($) {
    "use strict";

    var map = null,
        extents = null,
        navToolbar,
        helpDialog,
        createLinks = {};


    // Add a method to the Date object that will return a short date string.
    if (typeof (Date.toShortDateString) === "undefined") {
        Date.prototype.toShortDateString = function () {
            /// <summary>Returns a string representation of the date in the format Month-Date-Year.</summary>
            return String(this.getMonth()) + "-" + String(this.getDate()) + "-" + String(this.getFullYear());
        };
    }

    function getMetadataUrl(id) {
        return "Metadata.ashx?oid=" + String(id);
    }

    function layerInfoToLayer(layerInfo) {
        /// <summary>Converts a layer information object from the config.js file into an ESRI JavaScript API Layer object.</summary>
        /// <param name="layerInfo" type="Object">An object containing information that will be used to create a esri.layers.Layer object.</param>
        /// <returns type="esri.layers.Layer" />
        var constructor, layer = null;

        if (!layerInfo) {
            throw new Error("layerInfoToLayer: The 'layerInfo' parameter cannot be null or undefined.");
        }
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
                constructor = null;
                break;
        }
        if (constructor) {
            // Create an info template object if paramters are defined.
            if (layerInfo.options && layerInfo.options.infoTemplate) {
                layerInfo.options.infoTemplate = new esri.InfoTemplate(layerInfo.options.infoTemplate);
            }
            layer = constructor(layerInfo.url, layerInfo.options);
            //// map.addLayer(layer);
            if (layerInfo.visibleLayers) {
                layer.setVisibleLayers(layerInfo.visibleLayers);
            }
            // Add a property containing metadata IDs.
            if (layerInfo.metadataIds) {
                layer.metadataUrls = dojo.map(layerInfo.metadataIds, getMetadataUrl);
            }
        }

        return layer;
    }

    $(document).ready(function () {
        $("#mainContainer").css("display", "");

        // If a title is specified in the config file, replace the page title.
        if (wsdot.config.pageTitle) {
            $("h1").empty().text(wsdot.config.pageTitle);
            $("title").text(wsdot.config.pageTitle);
        }

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

        ////// Show a warning for old versions of IE.
        ////if (dojo.isIE && dojo.isIE < 9) {
        ////    var slowDialog = $("<div>");
        ////    $("<img>").attr("src", "images/turtle.png").css("width", "64px").css("height", "92px").css("float", "left").appendTo(slowDialog);
        ////    $("<p>").text("You are using Internet Explorer " + String(dojo.isIE) + ".").appendTo(slowDialog);
        ////    $("<p>").text("This is an old browser that runs JavaScript very, very slowly.  As this is a very JavaScript intensive site, you will get much better performance if you use a modern web browser.").appendTo(slowDialog);
        ////    var list = $("<ul>").appendTo(slowDialog);
        ////    $("<li>").append($("<a>").attr("href", "http://www.firefox.com/").text("Mozilla Firefox")).appendTo(list);
        ////    $("<li>").append($("<a>").attr("href", "http://www.google.com/chrome/").text("Google Chrome")).appendTo(list);
        ////    $("<li>").append($("<a>").attr("href", "http://www.apple.com/safari/").text("Apple Safari")).appendTo(list);
        ////    if (dojo.isIE > 7) {
        ////        $("<li>").append($("<a>").attr("href", "http://www.microsoft.com/windows/internet-explorer/").text("Internet Explorer 9 or higher (Windows 7 or higher only)")).appendTo(list);
        ////    }
        ////    slowDialog.dialog({
        ////        title: "Warning: IE is slow",
        ////        buttons: {
        ////            "OK": function () {
        ////                $(this).dialog("close");
        ////            }
        ////        },
        ////        close: function () {
        ////            $(this).dialog("destroy").remove();
        ////        }
        ////    });
        ////}

    });

    dojo.require("dojo.number");
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

    dojo.require("esri.layers.FeatureLayer");

    dojo.extend(esri.geometry.Extent, { "toCsv": function () {
        var propNames = ["xmin", "ymin", "xmax", "ymax"],
            output = "",
            i, l;
        for (i = 0, l = propNames.length; i < l; i++) {
            if (i > 0) {
                output += ",";
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
                // TODO: Make the projection to geographic optional.  For the purposes of this application, though, this works just fine.
                var geometry = esri.geometry.webMercatorToGeographic(item.geometry),
                    json = item.toJson();
                json.geometry = geometry.toJson();
                return json;
            });
        }
    });

    dojo.extend(esri.Map, {
        "lods": null,
        "getLOD": function (level) {
            /// <summary>Gets the current level of detail (LOD) for the map.</summary>
            /// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
            /// <returns type="esri.layers.LOD" />
            if (typeof (level) === "undefined") {
                level = map.getLevel();
            }
            return map.lods[level];
        },
        "getScale": function (level) {
            /// <summary>Returns the current scale of the map.</summary>
            /// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
            /// <returns type="Number" />
            var lod = this.getLOD(level);
            if (lod) {
                return lod.scale;
            }
            else {
                return null;
            }
        },
        "getVisibleLayers": function () {
            /// <summary>Returns an array of all of the layers in the map that are currently visible.</summary>
            /// <returns type="Array" />
            var layer,
                visibleLayers = [],
                i, l;
            for (i = 0, l = this.layerIds.length; i < l; i++) {
                layer = this.getLayer(this.layerIds[i]);
                if (layer.visible === true && (typeof (layer.wsdotCategory) === "undefined" || layer.wsdotCategory !== "Basemap")) {
                    visibleLayers.push(layer);
                }
            }
            return visibleLayers;
        },
        "getGraphicsLayers": function () {
            /// <summary>Returns all graphics layers in the map.</summary>
            var gfxLayers = [],
                layer, id,
                i;
            for (i = 0; i < this.graphicsLayerIds.length; i++) {
                id = this.graphicsLayerIds[i];
                layer = this.getLayer(id);
                if (layer.isInstanceOf(esri.layers.GraphicsLayer) && !layer.isInstanceOf(esri.layers.FeatureLayer)) {
                    gfxLayers.push(layer);
                }
            }
            return gfxLayers;

        },
        "getGraphicsCount": function () {
            /// <summary>Returns the total number of graphics displayed on the map (in all graphics layers).</summary>
            var graphicsLayers = this.getGraphicsLayers(),
                output = 0;

            // For each layer, get a collection of JSON graphic representations
            dojo.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
                output += layer.graphics.length;
            });
            return output;
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
                };
            }
            if (typeof (options.removeInfoTemplate) === "undefined") {
                options.removeInfoTemplate = true;
            }
            if (typeof (options.removeSymbol) === "undefined") {
                options.removeSymbol = true;
            }

            // For each layer, get a collection of JSON graphic representations
            dojo.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
                var graphics;
                if (layer.graphics.length > 0) {
                    graphics = layer.getGraphicsAsJson();
                    if (options.removeInfoTemplate === true || options.removeSymbol === true) {
                        // Remove unwanted properties from each graphic representation as specified in the options object.
                        dojo.forEach(graphics, function (graphic /*, gIndex*/) {
                            if (typeof (graphic.infoTemplate) !== "undefined" && options.removeInfoTemplate === true) {
                                delete graphic.infoTemplate;
                            }
                            if (typeof (graphic.symbol) !== "undefined" && options.removeSymbol === true) {
                                delete graphic.symbol;
                            }
                        });
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
                qsParams.visibleLayers = String(layer.id) + ":" + String(Math.round(layer.opacity * 100) / 100);
            }
            else {
                qsParams.visibleLayers += "," + String(layer.id) + ":" + String(Math.round(layer.opacity * 100) / 100);
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

        helpContent.load(helpUrl, function (responseText, textStatus /*, XMLHttpRequest*/) {
            // Handle case where content could not be loaded.
            if (!textStatus.match(/(?:success)|(?:notmodified)/i)) {
                helpContent.text("Error loading help text.");
            }
        });
    }


    function init() {
        esri.config.defaults.io.proxyUrl = "proxy.ashx";
        esri.config.defaults.geometryService = new esri.tasks.GeometryService(wsdot.config.geometryServer);

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
            // Set the background color for the extent link.

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
                    var linkDialog = $("#linkDialog");
                    // Create the link dialog if it does not already exist.
                    if (linkDialog.length === 0) {
                        linkDialog = $("<div>").attr("id", "linkDialog").dialog({
                            "autoOpen": true,
                            "modal": true,
                            "title": "Bookmark",
                            "open": function () {
                                var url = getExtentLink();
                                $("<p>").text("This link can be used to open this application, zoomed to the current extent.").appendTo(this);
                                $("<input>").attr("type", "url").attr("value", url).css("width", "100%").appendTo(this).select();
                            },
                            "close": function () {
                                // Remove the dialog from the DOM.
                                $(this).dialog("destroy").remove();
                            }
                        });
                    }

                }
            }, "linkButton");

            // TODO: Make drop-down button instead of popping up a dialog.
            dijit.form.Button({
                label: "Export Graphics",
                showLabel: false,
                iconClass: "dijitEditorIcon dijitEditorIconSave",
                onClick: function () {
                    var form, formatSelect, exportDialog = $("#exportDialog");

                    // Create the export dialog if it does not already exist.
                    if (exportDialog.length < 1) {
                        exportDialog = $("<div>").attr("id", "exportDialog").dialog({
                            autoOpen: false,
                            title: "Save Graphics",
                            modal: true,
                            close: function () {
                                // Remove the value from the hidden input element named "graphics".
                                $("input[name=graphics]", this).attr("value", null);
                            },
                            open: function () {
                                var graphics;
                                // Show / hide the form and "no graphics" message based on the number of graphics in the map.
                                if (map.getGraphicsCount() < 1) {
                                    $(".no-graphics-message", exportDialog).show();
                                    $("form", exportDialog).hide();
                                } else {
                                    graphics = map.getGraphicsAsJson();

                                    // Set the hidden graphics element's value.
                                    $("input[name=graphics]", exportDialog).attr("value", JSON.stringify(graphics));

                                    $(".no-graphics-message", exportDialog).hide();
                                    $("form", exportDialog).show();
                                }

                            }
                        });
                        // Create the message that will appear when this form is opened but the user has no graphics in their map.  This message will be hidden initially.
                        $("<p>").addClass("no-graphics-message").text("You do not currently have any graphics in your map to export.").appendTo(exportDialog).hide();
                        // Create a form that will open its submit action in a new window.
                        form = $("<form>").attr("action", "GraphicExport.ashx").attr("method", "post").attr("target", "_blank").appendTo(exportDialog);

                        $("<label>").attr("for", "graphic-export-format").text("Select an export format:").appendTo(form);
                        formatSelect = $("<select>").attr("name", 'f').attr("id", 'graphic-export-format').appendTo(form);

                        // Populate the output format select element with options.
                        $([["kml", "KML"], ["kmz", "KMZ"], ["json", "JSON"]]).each(function (index, element) {
                            $("<option>").attr("value", element[0]).text(element[1]).appendTo(formatSelect);
                        });

                        // This hidden element will hold the graphics information while the dialog is opened.
                        $("<input>").attr("type", "hidden").attr("name", "graphics").appendTo(form);

                        // Create the submit button and convert it to a jQueryUI button.
                        $("<button>").css("display", "block").attr("type", "submit").text("Export").appendTo(form).button();

                        // The submit button doesn't work in IE without doing the following for some reason.
                        if (dojo.isIE) {
                            $("button", form).click(function () {
                                form.submit();
                            });
                        }
                    }

                    // Show the export dialog
                    exportDialog.dialog("open");
                }
            }, dojo.create("button", { id: "saveButton" }, "toolbar", "first"));

            dijit.form.Button({
                label: "Measure",
                showLabel: false,
                iconClass: "distanceIcon",
                onClick: function () {
                    var measureDialog = $("#measureWidgetContainer"),
                    titleBar;

                    function hideMeasureWidget() {
                        // Hide the dialog and disable all of the tools.
                        var measureWidget = dijit.byId("measureWidget");
                        measureWidget.clearResult();
                        dojo.forEach(["area", "distance", "location"], function (toolName) {
                            measureWidget.setTool(toolName, false);
                        });
                        measureDialog.hide();
                        $("#measureWidgetContainer").hide();
                    }

                    // Create the measure dialog if it does not already exist.
                    if (!measureDialog || measureDialog.length < 1) {
                        // Create the dialog.
                        measureDialog = $("<div>").attr("id", "measureWidgetContainer").appendTo($("#mapContentPane")).draggable().addClass("ui-widget").addClass("ui-dialog ui-widget ui-widget-content ui-corner");
                        titleBar = $("<div>").attr("class", "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").appendTo(measureDialog);
                        $("<span>").attr("id", "ui-dialog-title-dialog").addClass("ui-dialog-title").text("Measure").appendTo(titleBar);
                        $("<a>").text("?").addClass("ui-corner-all").appendTo(titleBar).css("position", "absolute").css("right", "2.5em").css("text-decoration", "none").click(function () { showHelpDialog("help/measure.html"); });
                        $("<a>").addClass("ui-dialog-titlebar-close ui-corner-all").attr("href", "#").append($('<span>').addClass("ui-icon ui-icon-closethick").text("close")).appendTo(titleBar).click(hideMeasureWidget);
                        $("<div>").attr("id", "measureWidget").appendTo(measureDialog);
                        // Create the widget.
                        esri.dijit.Measurement({ map: map }, dojo.byId("measureWidget")).startup();
                    } else {
                        // If the dialog already exists, toggle its visibility.
                        measureDialog = $("#measureWidgetContainer:visible");

                        if (measureDialog && measureDialog.length > 0) {
                            hideMeasureWidget();
                        }
                        else {
                            // Show the dialog.
                            $("#measureWidgetContainer").show();
                        }
                    }
                }
            }, "measureButton");
        }

        function setupLayout() {
            var mainContainer, mapControlsPane, tabs, toolsTab, toolsAccordion;
            mainContainer = new dijit.layout.BorderContainer({ design: "headline", gutters: false }, "mainContainer");
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "top" }, "headerPane"));
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "center" }, "mapContentPane"));

            mapControlsPane = new dojox.layout.ExpandoPane({ region: "leading", splitter: true, title: "Map Controls" }, "mapControlsPane");
            tabs = new dijit.layout.TabContainer(null, "tabs");
            tabs.addChild(new dijit.layout.ContentPane({ title: "Layers", id: "layersTab" }, "layersTab"));
            tabs.addChild(new dijit.layout.ContentPane({ title: "Legend", onShow: function () {
                // Create the legend dijit if it does not already exist.
                if (!dijit.byId("legend")) {
                    new esri.dijit.Legend({ map: map }, "legend").startup();
                }
            }
            }, "legendTab"));
            toolsTab = new dijit.layout.ContentPane({ title: "Tools" }, "toolsTab");
            toolsAccordion = new dijit.layout.AccordionContainer(null, "toolsAccordion");

            // LRS Tools
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Milepost", id: "lrsTools" }, dojo.create("div", { id: "lrsTools" }, "toolsAccordion")));
            createLinks.milepostTab = dojo.connect(dijit.byId("lrsTools"), "onShow", function () {
                $.getScript("scripts/lrsTools.js", function () {
                    $("#lrsTools").lrsTools({
                        map: map,
                        controlsCreated: function () {
                            // Add help button to the LrsTools control.
                            dijit.form.Button({
                                label: "Milepost Help",
                                iconClass: "helpIcon",
                                showLabel: false,
                                onClick: function () {
                                    showHelpDialog("help/milepost.html");
                                }
                            }, dojo.create("button", { type: "button" }, "milepostContainerBottom"));
                        }
                    });

                });

                dojo.disconnect(createLinks.milepostTab);
                delete createLinks.milepostTab;
            });




            // Zoom tools
            $("<div>").attr({ id: "zoomControlsPane" }).appendTo("#toolsAccordion");
            $("<div>").attr({ id: "zoomControls" }).appendTo("#zoomControlsPane");

            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Zoom Controls" }, "zoomControlsPane"));
            createLinks.zoomControls = dojo.connect(dijit.byId("zoomControlsPane"), "onShow", function () {

                function createZoomControls() {
                    /// <summary>Creates the HTML elments that will later be used to create Dojo dijits.</summary>
                    var zoomControlsDiv, table, body;

                    zoomControlsDiv = $("#zoomControls");

                    $("<button>").attr({ id: "zoomToMyCurrentLocation", type: "button" }).text("Zoom to my current location").appendTo(zoomControlsDiv);
                    table = $("<table>").appendTo(zoomControlsDiv);
                    body = $("<tbody>").appendTo(table);
                    $.each([
                    { id: "countyZoom", text: "County" },
                    { id: "cityZoom", text: "City" },
                    { id: "urbanAreaZoom", text: "Urban Area" }
                    ], function (index, data) {
                        var row, cell;
                        row = $("<tr>").appendTo(body);
                        cell = $("<td>").appendTo(row);
                        $("<label>").attr({ id: data.id + "Label" }).text(data.text).appendTo(cell);
                        cell = $("<td>").appendTo(row);
                        $("<img>").attr({ id: data.id + "Select", src: "images/ajax-loader.gif", alt: "Loading..." }).appendTo(cell);
                    });
                }

                createZoomControls();
                $.getScript("scripts/extentSelect.js", function (data, textScatus) {
                    // Set up the zoom select boxes.
                    // Setup the zoom controls.
                    $("#countyZoomSelect").extentSelect(extents.countyExtents, map);
                    delete extents.countyExtents;




                    function createQueryTask(qtName) {
                        /// <summary>Creates a query task and query using settings from config.js.</summary>
                        /// <param name="qtName" type="String">The name of a query task from config.js.</param>
                        var queryTaskSetting = wsdot.config.queryTasks[qtName],
                        qt = new esri.tasks.QueryTask(queryTaskSetting.url),
                        query = new esri.tasks.Query(),
                        n;
                        for (n in queryTaskSetting.query) {
                            if (queryTaskSetting.query.hasOwnProperty(n)) {
                                query[n] = queryTaskSetting.query[n];
                            }
                        }
                        return { "task": qt, "query": query };
                    }
                    function runQueryTasks() {
                        var cityQueryTask, urbanAreaQueryTask;
                        // Setup extents for cities and urbanized area zoom tools.
                        cityQueryTask = createQueryTask("city");
                        cityQueryTask.task.execute(cityQueryTask.query, function (featureSet) { $("#cityZoomSelect").extentSelect(featureSet, map); });

                        urbanAreaQueryTask = createQueryTask("urbanArea");
                        urbanAreaQueryTask.task.execute(urbanAreaQueryTask.query, function (featureSet) { $("#urbanAreaZoomSelect").extentSelect(featureSet, map); });
                    }

                    runQueryTasks();

                    // Associate labels with select controls, so that clicking on a label activates the corresponding control.
                    dojo.attr("countyZoomLabel", "for", "countyZoomSelect");
                    dojo.attr("cityZoomLabel", "for", "cityZoomSelect");
                    dojo.attr("urbanAreaZoomLabel", "for", "urbanAreaZoomSelect");



                    if (navigator.geolocation) {
                        dijit.form.Button({
                            onClick: function () {
                                navigator.geolocation.getCurrentPosition(
                        function (position) {
                            var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(position.coords.longitude, position.coords.latitude)),
                                attributes = { lat: position.coords.latitude.toFixed(6), long: position.coords.longitude.toFixed(6) };
                            map.infoWindow.setTitle("You are here").setContent(esri.substitute(attributes, "Lat: ${lat} <br />Long: ${long}")).show(map.toScreen(pt));
                            map.centerAndZoom(pt, 8);
                        },
                        function (error) {
                            var message = "", strErrorCode;
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

                    // Add the help button for the zoom controls.
                    dijit.form.Button({
                        label: "Zoom Help",
                        showLabel: false,
                        iconClass: "helpIcon",
                        onClick: function () {
                            showHelpDialog("help/zoom_controls.html");
                        }
                    }, dojo.create("button", { id: "zoomHelp", type: "button" }, "zoomControls"));

                    dojo.disconnect(createLinks.zoomControls);
                    delete createLinks.zoomControls;
                });
            });


            // Location Information tools
            dojo.create("div", { id: "locationInfo" }, "toolsAccordion");
            dojo.create("img", { id: "locationInfoControl", src: "images/ajax-loader.gif", alt: "Loading..." }, "locationInfo");
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Location Information" }, "locationInfo"));
            createLinks.locationInfo = dojo.connect(dijit.byId("locationInfo"), "onShow", function () {
                $("#locationInfoControl").locationInfo(map, wsdot.config.locationInfoUrl);

                // Add the help button
                dijit.form.Button({
                    label: "Location Info. Help",
                    iconClass: "helpIcon",
                    showLabel: false,
                    onClick: function () {
                        showHelpDialog("help/location_info.html");
                    }
                }, dojo.create("button", { type: "button" }, "locationInfo"));

                dojo.disconnect(createLinks.locationInfo);
                delete createLinks.locationInfo;
            });





            // Identify
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Identify" }, dojo.create("div", { id: "identifyTools" }, "toolsAccordion")));
            createLinks.identify = dojo.connect(dijit.byId("identifyTools"), "onShow", function () {
                $.getScript("scripts/identify.js", function (data, textStatus) {
                    function getOrCreateLayer(layerInfo) {
                        /// <summary>Gets an existing layer from the map with a matching ID.  If no such layer exists, a new layer object is created.</summary>
                        /// <param name="layerInfo" type="Object">An object with properties that define how a layer object can be created.</param>
                        /// <returns type="esri.layers.Layer" />
                        var layer = null;
                        for (var i = 0, l = map.layerIds.length; i < l; i++) {
                            if (layerInfo.id === map.layerIds[i]) {
                                layer = map.getLayer(map.layerIds[i]);
                                break;
                            }
                        }

                        if (layer !== null) {
                            return layer;
                        } else {
                            return layerInfoToLayer(layerInfo);
                        }
                    }

                    $("<div>").attr("id", "identifyControl").appendTo("#identifyTools").identify({
                        layers: dojo.map(wsdot.config.identifyLayers, layerInfoToLayer),
                        map: map
                    });
                    dojo.disconnect(createLinks.identify);
                    delete createLinks.identify;
                });
            });

            // Address Search
            toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Find an Address" }, dojo.create("div", { id: "searchTools" }, "toolsAccordion")));
            createLinks.search = dojo.connect(dijit.byId("searchTools"), "onShow", function () {
                $.getScript("scripts/addressLocator.js", function (data, textStatus) {
                    $("<div>").attr("id", "searchControl").appendTo("#searchTools").addressLocator({
                        map: map,
                        addressLocator: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Streets_US_10/GeocodeServer"
                    });
                    dojo.disconnect(createLinks.search);
                    delete createLinks.search;
                });
            });

            tabs.addChild(toolsTab);
            tabs.addChild(new dijit.layout.ContentPane({ title: "Basemap", id: "basemapTab" }, "basemapTab"));

            createLinks.basemapTab = dojo.connect(dijit.byId("basemapTab"), "onShow", function () {
                var basemaps = wsdot.config.basemaps, i, l, layeri, basemapGallery;

                for (i = 0, l = basemaps.length; i < l; i++) {
                    for (layeri in basemaps.layers) {
                        if (basemaps.layers.hasOwnProperty(layeri)) {
                            basemaps.layers[layeri] = new esri.dijit.BasemapLayer(basemaps.layers[layeri]);
                        }
                    }
                }

                basemapGallery = new esri.dijit.BasemapGallery({
                    showArcGISBasemaps: true,
                    map: map,
                    basemaps: basemaps
                }, "basemapGallery");

                basemapGallery.startup();

                // Remove the unwanted default basemaps as defined in config.js (if any are defined).
                if (wsdot.config.basemapsToRemove) {
                    dojo.connect(basemapGallery, "onLoad", wsdot.config.basemapsToRemove, function () {
                        var i, removed;
                        for (i = 0; i < this.length; i++) {
                            removed = basemapGallery.remove(this[i]);
                            if (console && console.warn) {
                                if (removed === null) {
                                    console.warn("Basemap removal failed: basemap not found: " + this[i]);
                                }
                            }
                        }
                    });
                }



                dojo.connect(basemapGallery, "onError", function (msg) {
                    // Show error message
                    alert(msg);
                });

                dojo.disconnect(createLinks.basemapTab);
                delete createLinks.basemapTab;
            });


            mapControlsPane.addChild(tabs);
            mainContainer.addChild(mapControlsPane);

            mainContainer.startup();
        }

        function setScaleLabel(level) {
            // Set the scale.
            var scale = map.getScale(level);
            if (typeof (scale) === "undefined" || scale === null) {
                $("#scaleText").text("");
            }
            else {
                $("#scaleText").text("1:" + dojo.number.format(scale));
            }

        }

        setupLayout();

        function setupExtents() {
            // Define zoom extents for menu.
            var extentSpatialReference = new esri.SpatialReference({ wkid: 102100 }),
                extentData = [],
                i;
            extents = {
                fullExtent: new esri.geometry.Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference }),
                countyExtents: { "Cowlitz": { "xmin": -13716608.1772, "ymin": 5756446.5261, "xmax": -13607638.501, "ymax": 5842754.0508 }, "Whitman": { "xmin": -13163464.6711, "ymin": 5847392.8245, "xmax": -13028774.4496, "ymax": 5984725.1359 }, "Spokane": { "xmin": -13116067.9387, "ymin": 5984489.784, "xmax": -13028809.6233, "ymax": 6114814.6868 }, "Okanogan": { "xmin": -13456929.5548, "ymin": 6097022.1384, "xmax": -13228768.0346, "ymax": 6274958.9602 }, "Whatcom": { "xmin": -13728170.447, "ymin": 6211586.2765, "xmax": -13431350.2501, "ymax": 6275274.979 }, "King": { "xmin": -13641277.0042, "ymin": 5955853.9667, "xmax": -13477001.0149, "ymax": 6070428.8593 }, "Kittitas": { "xmin": -13521532.7745, "ymin": 5899113.9835, "xmax": -13350070.2043, "ymax": 6040226.1383 }, "Yakima": { "xmin": -13527887.9391, "ymin": 5786789.6607, "xmax": -13343374.1361, "ymax": 5956573.2746 }, "Columbia": { "xmin": -13162673.7586, "ymin": 5780181.9819, "xmax": -13091540.6017, "ymax": 5881022.6956 }, "Skagit": { "xmin": -13666072.6368, "ymin": 6156232.4448, "xmax": -13434716.5579, "ymax": 6216862.0714 }, "Wahkiakum": { "xmin": -13773334.2204, "ymin": 5803187.7205, "xmax": -13716034.4264, "ymax": 5842274.2847 }, "San Juan": { "xmin": -13722118.9812, "ymin": 6154236.6866, "xmax": -13659272.347, "ymax": 6246272.0081 }, "Jefferson": { "xmin": -13883451.6533, "ymin": 6026992.6909, "xmax": -13647254.6175, "ymax": 6168652.2854 }, "Lewis": { "xmin": -13733788.4441, "ymin": 5842022.6891, "xmax": -13508975.7523, "ymax": 5908584.5364 }, "Ferry": { "xmin": -13232547.6219, "ymin": 6078547.14, "xmax": -13147311.3041, "ymax": 6274878.086 }, "Pend Oreille": { "xmin": -13094470.0429, "ymin": 6114408.5894, "xmax": -13027916.5477, "ymax": 6274942.0713 }, "Franklin": { "xmin": -13297953.5226, "ymin": 5811290.5149, "xmax": -13157743.3914, "ymax": 5899593.8738 }, "Walla Walla": { "xmin": -13251654.4058, "ymin": 5780326.7638, "xmax": -13134753.0631, "ymax": 5878116.3164 }, "Lincoln": { "xmin": -13244769.7727, "ymin": 5984619.1827, "xmax": -13115603.0047, "ymax": 6099856.8495 }, "Benton": { "xmin": -13344617.6406, "ymin": 5754139.5511, "xmax": -13240449.8207, "ymax": 5897751.643 }, "Clark": { "xmin": -13669582.7159, "ymin": 5707531.0819, "xmax": -13608198.7464, "ymax": 5789926.0889 }, "Pierce": { "xmin": -13675925.5501, "ymin": 5897856.0581, "xmax": -13511306.3151, "ymax": 6008212.5148 }, "Klickitat": { "xmin": -13537868.9285, "ymin": 5717448.7451, "xmax": -13343404.634, "ymax": 5787581.0243 }, "Grant": { "xmin": -13363106.9209, "ymin": 5881154.2164, "xmax": -13243995.6844, "ymax": 6100566.8755 }, "Chelan": { "xmin": -13489786.8267, "ymin": 5984760.3314, "xmax": -13342761.5943, "ymax": 6198989.41 }, "Thurston": { "xmin": -13714908.1752, "ymin": 5903319.5991, "xmax": -13603589.1089, "ymax": 5973834.5544 }, "Clallam": { "xmin": -13899444.6403, "ymin": 6084703.4441, "xmax": -13680883.6168, "ymax": 6189343.3633 }, "Douglas": { "xmin": -13393771.1496, "ymin": 5978080.6643, "xmax": -13241520.921, "ymax": 6132044.942 }, "Stevens": { "xmin": -13180410.3388, "ymin": 6072370.4054, "xmax": -13072245.7038, "ymax": 6274987.4244 }, "Adams": { "xmin": -13288154.3124, "ymin": 5898997.675, "xmax": -13131174.6649, "ymax": 5984917.9955 }, "Pacific": { "xmin": -13823107.8933, "ymin": 5818061.0061, "xmax": -13732083.3359, "ymax": 5908563.6219 }, "Island": { "xmin": -13677515.936, "ymin": 6078202.9272, "xmax": -13617553.3997, "ymax": 6176489.1526 }, "Kitsap": { "xmin": -13696574.1685, "ymin": 6008153.0256, "xmax": -13628515.5078, "ymax": 6102333.7942 }, "Garfield": { "xmin": -13120489.3456, "ymin": 5779994.9236, "xmax": -13049763.0779, "ymax": 5893758.4025 }, "Mason": { "xmin": -13748635.6001, "ymin": 5955512.1077, "xmax": -13670052.185, "ymax": 6041803.2531 }, "Grays Harbor": { "xmin": -13856990.0768, "ymin": 5908013.6975, "xmax": -13709928.0411, "ymax": 6029660.264 }, "Asotin": { "xmin": -13077814.2164, "ymin": 5779598.1341, "xmax": -13014945.7855, "ymax": 5854737.304 }, "Skamania": { "xmin": -13608832.7415, "ymin": 5708314.0933, "xmax": -13526920.5016, "ymax": 5842848.1259 }, "Snohomish": { "xmin": -13632030.2268, "ymin": 6069562.9349, "xmax": -13459351.7812, "ymax": 6156742.2548} }
            };

            extentData = [];
            // Convert the county JSON objects into esri.geomtry.Extents.
            for (i in extents.countyExtents) {
                if (extents.countyExtents.hasOwnProperty(i)) {
                    extentData.push({ name: i, extent: new esri.geometry.fromJson(extents.countyExtents[i]).setSpatialReference(extentSpatialReference) });
                }
            }

            extents.countyExtents = extentData;
        }

        setupExtents();

        // Convert the extent definition in the options into an esri.geometry.Extent object.
        wsdot.config.mapOptions.extent = new esri.geometry.fromJson(wsdot.config.mapOptions.extent);
        map = new esri.Map("map", wsdot.config.mapOptions);
        var initBasemap = null;
        if (wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
            initBasemap = new esri.layers.ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
        }



        map.addLayer(initBasemap);

        dojo.connect(map, "onLoad", map, function () {
            map.lods = dojo.clone(map.getLayer(map.layerIds[0]).tileInfo.lods);

            // Set the scale.
            setScaleLabel();



            setupNorthArrow();
            setupToolbar();
            esri.dijit.Scalebar({ map: map, attachTo: "bottom-left" });



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

            function setExtentFromParams() {
                // Zoom to the extent in the query string (if provided).
                // Test example:
                // extent=-13677603.622831678,5956814.051290565,-13576171.686297385,6004663.630997022
                var qsParams = $.deparam.querystring(true), coords, extent;
                if (qsParams.extent) {
                    // Split the extent into its four coordinates.  Create the extent object and set the map's extent.
                    coords = $(qsParams.extent.split(/,/, 4)).map(function (index, val) { return parseFloat(val); });
                    extent = new esri.geometry.Extent(coords[0], coords[1], coords[2], coords[3], map.spatialReference);
                    map.setExtent(extent);
                }
            }

            setExtentFromParams();

            function setupLayers() {
                var layers = {},
                tabName, groupName, i, l, layerInfo, constructor, layer;



                // Load the layers that are defined in the config file.
                for (tabName in wsdot.config.layers) {
                    if (wsdot.config.layers.hasOwnProperty(tabName)) {
                        layers[tabName] = {};
                        for (groupName in wsdot.config.layers[tabName]) {
                            if (wsdot.config.layers[tabName].hasOwnProperty(groupName)) {
                                layers[tabName][groupName] = [];
                                for (i = 0, l = wsdot.config.layers[tabName][groupName].length; i < l; i += 1) {
                                    layerInfo = wsdot.config.layers[tabName][groupName][i];
                                    layer = layerInfoToLayer(layerInfo);
                                    if (layer) {
                                        map.addLayer(layer);
                                        ////if (layerInfo.visibleLayers) { layer.setVisibleLayers(layerInfo.visibleLayers); }
                                        layers[tabName][groupName].push(layer);
                                    }
                                }
                            }
                        }
                    }
                }

                return layers;
            }

            $("#layerList").layerList({ "layerSource": setupLayers(), "map": map });

            // Connect the interchange drawings layer's onClick event so that when a graphic is clicked the associated PDF is opened in a new window or tab (depends on user's settings).
            dojo.connect(map.getLayer("Interchange Drawings"), "onClick", function (event) {
                var graphic = event.graphic,
                    pdfUrl;
                if (graphic) {
                    pdfUrl = graphic.attributes.PDFURL;
                    if (pdfUrl) {
                        // Show the PDF.
                        window.open(pdfUrl);
                    }
                }
            });

        });



        // Setup update notifications.
        dojo.connect(map, "onUpdateStart", map, function () {
            $("#loading-bar").show();
        });
        dojo.connect(map, "onUpdateEnd", map, function () {
            $("#loading-bar").hide();
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

        // Create the button dijits.
        dijit.form.Button({
            iconClass: "zoomfullextIcon",
            showLabel: false,
            onClick: function () {
                map.setExtent(extents.fullExtent);
            }
        }, "fullExtentButton");

        dijit.form.Button({
            iconClass: "zoomprevIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToPrevExtent();
            }
        }, "previousExtentButton");

        dijit.form.Button({
            iconClass: "zoomnextIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToNextExtent();
            }
        }, "nextExtentButton");



    }





    //show map on load
    dojo.addOnLoad(init);
} (jQuery));