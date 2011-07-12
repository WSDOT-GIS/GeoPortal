/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo, esri */
/*jslint white: false, browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

(function ($) {
    "use strict";

    dojo.require("dijit.form.Button");
    dojo.require("dijit.form.CheckBox");
    dojo.require("dijit.form.NumberSpinner");
    dojo.require("dijit.form.Select");

    dojo.require("dijit.layout.TabContainer");
    dojo.require("dijit.layout.ContentPane");

    dojo.require("esri.toolbars.draw");
    dojo.require("esri.layers.graphics");

    // Add a method to the Date object that will return a short date string.
    if (typeof (Date.toShortDateString) === "undefined") {
        Date.prototype.toShortDateString = function () {
            /// <summary>Returns a string representation of the date in the format Month-Date-Year.</summary>
            return this.getMonth() + "-" + this.getDate() + "-" + this.getFullYear();
        }
    }

    var methods = {
        init: function (map, locationInfoUrl) {
            /// <summary>Creates the location information UI.</summary>
            /// <param name="locationInfoUrl" type="String">URL for the layer list REST endpoint.</param>

            var uiNode = $("<div>").attr("id", this.attr("id")).replaceAll(this);
            var locationInfoLayers = {
                points: null,
                polylines: null,
                polygons: null
            };
            var tabContainer;

            if (!map) {
                throw new Error("No map was specified.");
            }

            function handleClickEvent(event) {
                /// <summary>Handles the graphics layer's onClick event.</summary>
                /// <param name="event" type="Object">An object that contains screenPoint, mapPoint, and graphic properties.</param>

                function createHtmlTable(queryResult) {
                    /// <summary>Creates an HTML table for the results of a Location Information query.</summary>
                    if (queryResult.ResultTable.length < 1) {
                        return $(esri.substitute(queryResult.LayerInfo, "<p>No results for <a href='${MetadataUrl}'>${LayerName}</p>"));
                    } else {
                        var table = $("<table>");
                        var resultRow;

                        var omittedFields = /OBJECTID/i;
                        var dotNetDateRe = /\/Date\((.+)\)\//i;
                        var resultValue;
                        var resultMatch;

                        var tr;
                        ////table.append(esri.substitute(queryResult.LayerInfo, "<caption><a href='${MetadataUrl}'>${LayerName}</caption>"));
                        for (var i = 0, l = queryResult.ResultTable.length; i < l; i++) {
                            resultRow = queryResult.ResultTable[i];
                            // Create the header row if this is the first row.
                            if (i === 0) {
                                tr = $("<tr>");
                                for (var heading in resultRow) {
                                    if (!heading.match(omittedFields)) {
                                        tr.append("<th>" + heading + "</th>");
                                    }
                                }
                                table.append(tr);
                            }
                            tr = $("<tr>");
                            for (var heading in resultRow) {
                                if (!heading.match(omittedFields)) {
                                    resultValue = resultRow[heading];
                                    // Convert the .NET JSON Date string into a Date object.
                                    if (typeof (resultValue) === "string") {
                                        resultMatch = resultValue.match(dotNetDateRe);
                                        if (resultMatch) {
                                            resultValue = (new Date(new Number(resultMatch[1]))).toShortDateString();
                                        }
                                    }
                                    tr.append("<td>" + resultValue + "</td>");
                                }
                            }
                            table.append(tr);

                        }
                        return table;
                    }
                }

                var queryResult;
                var resultTable;



                // Create the div element that will become the tab container
                tabContainer = dojo.create("div", { id: "wsdot-location-info-tab-container" }, dojo.doc.body);
                var contentPane;
                ////// Add the tabContainer div to the InfoWindow.  Once it is added to the DOM we can start to create dijits.
                ////map.infoWindow.setContent(tabContainer).setTitle("Location Information");
                // Create the tabContainer.
                tabContainer = new dijit.layout.TabContainer({ style: "width: 100%; height: 100%" }, tabContainer);

                // Create a content pane for each layer's result data and add to the tab container.
                for (var i = 0, l = event.graphic.attributes.QueryResults.length; i < l; i += 1) {
                    queryResult = event.graphic.attributes.QueryResults[i];
                    contentPane = new dijit.layout.ContentPane({ title: queryResult.LayerInfo.LayerName, content: createHtmlTable(queryResult) });
                    tabContainer.addChild(contentPane);
                }

                tabContainer.startup();

                ////map.infoWindow.show(event.screenPoint);
                tabContainer.resize();

                // Show a jQuery UI dialog.
                $(tabContainer.domNode).dialog({
                    title: 'Location Information',
                    modal: true,
                    close: function () {
                        // Destroy the dialog, TabContainer, and associated DOM elements.
                        if (tabContainer) {
                            $(tabContainer.domNode).dialog("destroy");
                            tabContainer.destroyRecursive(false);
                        }
                    }

                });
            }

            dojo.connect(map, "onLoad", locationInfoLayers, function () {
                var layer;

                locationInfoLayers.points = new esri.layers.GraphicsLayer({ id: "locationInfoPoints" });
                locationInfoLayers.polylines = new esri.layers.GraphicsLayer({ id: "locationInfoLines" });
                locationInfoLayers.polygons = new esri.layers.GraphicsLayer({ id: "locationInfoPolygons" });



                locationInfoLayers.points.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleMarkerSymbol()));
                locationInfoLayers.polylines.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleLineSymbol()));
                locationInfoLayers.polygons.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleFillSymbol()));


                for (var l in locationInfoLayers) {
                    layer = locationInfoLayers[l];
                    map.addLayer(layer);
                    dojo.connect(layer, "onClick", handleClickEvent);
                }
            });




            function createControl(data) {
                uiNode.addClass("ui-location-info");

                // Set up an object for temprorarily holding DOM nodes as they are created.  Once added to "uiNode" they can be deleted from the nodes object.
                var nodes = {};
                nodes.bufferControl = $("<div>");
                nodes.bufferControl.addClass("wsdot-location-info-buffer").append("<label style='padding-right: 5px'>Buffer</label>");

                nodes.bufferValue = $("<input type='number' value='0' min='0' id='wsdot-location-info-buffer-size'>");
                nodes.bufferControl.append(nodes.bufferValue);
                dijit.form.NumberSpinner({ value: 0, constraints: { min: 0 }, style: "width: 50px" }, nodes.bufferValue[0]);

                // These are all of the measurement units for the buffer.
                var units = [
                    { "name": "Foot", "value": 9002, "description": "ft." },
                    { "name": "StatuteMile", "value": 9093, "description": "miles" },
                    { "name": "Kilometer", "value": 9036, "description": "km." },
                    { "name": "Decimeter", "value": 109005, "description": "dm." },
                    { "name": "Meter", "value": 9001, "description": "m." }

                /*
                ,{ "name": "InternationalInch", "value": 109008, "description": "in." },
                { "name": "Centimeter", "value": 109006, "description": "cm." },
                { "name": "Millimeter", "value": 109007, "description": "mm." },
                { "name": "FiftyKilometerLength", "value": 109030, "description": "50 Kilometer Length" },
                { "name": "OneHundredFiftyKilometerLength", "value": 109031, "description": "150 Kilometer Length" },
                { "name": "GermanMeter", "value": 9031, "description": "German legal meter" },
                { "name": "SurveyFoot", "value": 9003, "description": "US survey foot" },
                { "name": "ClarkeFoot", "value": 9005, "description": "Clarke's foot" },
                { "name": "Fathom", "value": 9014, "description": "Fathom" },
                { "name": "NauticalMile", "value": 9030, "description": "Nautical Miles" },
                { "name": "SurveyChain", "value": 9033, "description": "US survey chain" },
                { "name": "SurveyLink", "value": 9034, "description": "US survey link" },
                { "name": "SurveyMile", "value": 9035, "description": "US survey mile" },
                { "name": "ClarkeYard", "value": 9037, "description": "Yard (Clarke's ratio)" },
                { "name": "ClarkeChain", "value": 9038, "description": "Chain (Clarke's ratio)" },
                { "name": "ClarkeLink", "value": 9039, "description": "Link (Clarke's ratio)" },
                { "name": "SearsYard", "value": 9040, "description": "Yard (Sears)" },
                { "name": "SearsFoot", "value": 9041, "description": "Sears' foot" },
                { "name": "SearsChain", "value": 9042, "description": "Chain (Sears)" },
                { "name": "SearsLink", "value": 9043, "description": "Link (Sears)" },
                { "name": "Benoit1895A_Yard", "value": 9050, "description": "Yard (Benoit 1895 A)" },
                { "name": "Benoit1895A_Foot", "value": 9051, "description": "Foot (Benoit 1895 A)" },
                { "name": "Benoit1895A_Chain", "value": 9052, "description": "Chain (Benoit 1895 A)" },
                { "name": "Benoit1895A_Link", "value": 9053, "description": "Link (Benoit 1895 A)" },
                { "name": "Benoit1895B_Yard", "value": 9060, "description": "Yard (Benoit 1895 B)" },
                { "name": "Benoit1895B_Foot", "value": 9061, "description": "Foot (Benoit 1895 B)" },
                { "name": "Benoit1895B_Chain", "value": 9062, "description": "Chain (Benoit 1895 B)" },
                { "name": "Benoit1895B_Link", "value": 9063, "description": "Link (Benoit 1895 B)" },
                { "name": "IndianFoot", "value": 9080, "description": "Indian geodetic foot" },
                { "name": "Indian1937Foot", "value": 9081, "description": "Indian foot (1937)" },
                { "name": "Indian1962Foot", "value": 9082, "description": "Indian foot (1962)" },
                { "name": "Indian1975Foot", "value": 9083, "description": "Indian foot (1975)" },
                { "name": "IndianYard", "value": 9084, "description": "Indian yard" },
                { "name": "Indian1937Yard", "value": 9085, "description": "Indian yard (1937)" },
                { "name": "Indian1962Yard", "value": 9086, "description": "Indian yard (1962)" },
                { "name": "Indian1975Yard", "value": 9087, "description": "Indian yard (1975)" },
                { "name": "Foot1865", "value": 9070, "description": "Foot (1865)" },
                { "name": "British1936Foot", "value": 9095, "description": "British Foot (1936)" },
                { "name": "GoldCoastFoot", "value": 9094, "description": "Gold Coast Foot" },
                { "name": "InternationalChain", "value": 109003, "description": "International Chain" },
                { "name": "InternationalLink", "value": 109004, "description": "International Link" },
                { "name": "InternationalYard", "value": 109001, "description": "Yards" },
                { "name": "StatuteMile", "value": 9093, "description": "Miles" },
                { "name": "SurveyYard", "value": 109002, "description": "US survey Yard" },
                { "name": "USsurveyInch", "value": 109009, "description": "US survey inch" },
                { "name": "InternationalRod", "value": 109010, "description": "International rod" },
                { "name": "USsurveyRod", "value": 109011, "description": "US survey rod" },
                { "name": "USNauticalMile", "value": 109012, "description": "US nautical mile (pre-1954)" },
                { "name": "UKNauticalMile", "value": 109013, "description": "UK nautical mile (pre-1970)" }
                */
                ];

                nodes.bufferUnitSelect = $("<select>").attr("id", 'wsdot-location-info-buffer-unit-select');
                // Add an option for each measurement unit.
                $.each(units, function (index, value) {
                    $("<option>").attr("value", value.name).attr("data-wkid", value.value).text(value.description).appendTo(nodes.bufferUnitSelect);
                });
                nodes.bufferControl.append(nodes.bufferUnitSelect);
                dijit.form.Select(null, nodes.bufferUnitSelect[0]);
                uiNode.append(nodes.bufferControl);


                /*
                "data" (the layer list) looks like this:
                [
                {"UniqueId":1,"HostName":"hqolymgis06p","MapServiceName":"CGIS\/QueryMapService","MapId":0,"MapName":"QueryMapService","LayerId":0,"LayerName":"County Boundary","MapServiceUrl":"http:\/\/hqolymgis06p\/ArcGIS\/services\/CGIS\/QueryMapService\/MapServer","Metadata":null},
                {"UniqueId":2,"HostName":"hqolymgis06p","MapServiceName":"CGIS\/QueryMapService","MapId":0,"MapName":"QueryMapService","LayerId":1,"LayerName":"WSDOT Region","MapServiceUrl":"http:\/\/hqolymgis06p\/ArcGIS\/services\/CGIS\/QueryMapService\/MapServer","Metadata":null},
                {"UniqueId":3,"HostName":"hqolymgis06p","MapServiceName":"CGIS\/QueryMapService","MapId":0,"MapName":"QueryMapService","LayerId":2,"LayerName":"Township Section Range","MapServiceUrl":"http:\/\/hqolymgis06p\/ArcGIS\/services\/CGIS\/QueryMapService\/MapServer","Metadata":null},
                {"UniqueId":4,"HostName":"hqolymgis06p","MapServiceName":"CGIS\/QueryMapService","MapId":0,"MapName":"QueryMapService","LayerId":3,"LayerName":"City Limit","MapServiceUrl":"http:\/\/hqolymgis06p\/ArcGIS\/services\/CGIS\/QueryMapService\/MapServer","Metadata":null},
                {"UniqueId":5,"HostName":"hqolymgis06p","MapServiceName":"CGIS\/QueryMapService","MapId":0,"MapName":"QueryMapService","LayerId":4,"LayerName":"Public Lands","MapServiceUrl":"http:\/\/hqolymgis06p\/ArcGIS\/services\/CGIS\/QueryMapService\/MapServer","Metadata":null}
                ]
                */

                nodes = {};
                // Create the table of layers.
                nodes.dataSetsTable = $("<table class='wsdot-location-info-layer-table'><!-- <thead><tr><th></th><th>Layer</th><th>Metadata</th></tr></thead> --><tbody></tbody></table>");
                // Populate the table.

                nodes.dataSetsTable.append("<caption>Select data sets</caption>");

                nodes.tbody = $("tbody", nodes.dataSetsTable);

                // Add checkbox, label, and metadata button for each layer.
                $.each(data, function (index, layer) {
                    nodes.row = $("<tr>");
                    nodes.checkbox = $("<input type='checkbox'>");
                    //nodes.checkbox.attr("data-UniqueId", layer.UniqueId);
                    nodes.checkbox.attr("id", "wsdot-location-info-layer-" + layer.UniqueId);
                    nodes.td = $("<td>");
                    nodes.td.append(nodes.checkbox);
                    nodes.row.append(nodes.td);
                    nodes.row.append("<td>" + layer.LayerName + "</td>");

                    if (layer.MetadataUrl) {
                        nodes.button = $("<button>").text("Metadata");
                        nodes.td = $("<td class='metadata'>").append(nodes.button).appendTo(nodes.row);
                    }
                    nodes.tbody.append(nodes.row);

                    dijit.form.CheckBox({
                        value: layer.UniqueId,
                        onClick: function (e) {
                            var shouldEnable = $("[id^=wsdot-location-info-layer-]:checked").length > 0;
                            $.each(["wsdot-location-info-point", "wsdot-location-info-polyline", "wsdot-location-info-polygon"], function (index, valueOfElement) {
                                dijit.byId(valueOfElement).set("disabled", !shouldEnable);
                            });

                        }
                    }, nodes.checkbox[0]);

                    if (layer.MetadataUrl) {
                        nodes.button = dijit.form.Button({
                            label: "Metadata",
                            id: "wsdot-location-info-metadata-button-" + layer.UniqueId,
                            onClick: function () {
                                window.open(layer.MetadataUrl + "&xslt=FGDC%20Plus.xsl");
                            }
                        }, nodes.button[0]);
                    }

                });

                uiNode.append(nodes.dataSetsTable);

                nodes = {
                    shapeButtons: $("<div>")
                };

                nodes.shapeButtons.append("<button id='wsdot-location-info-point' >Point</button>").append("<button id='wsdot-location-info-polyline'>Polyline</button>").append("<button id='wsdot-location-info-polygon'>Polygon</button>");
                // Add the clear button.
                uiNode.append(nodes.shapeButtons).append("<button id='wsdot-location-info-clear-results'>Clear Results</button>");
                dijit.form.Button({
                    label: "Clear Results",
                    onClick: function () {
                        for (var layer in locationInfoLayers) {
                            locationInfoLayers[layer].clear();
                        }
                    }
                }, 'wsdot-location-info-clear-results');


                var drawToolbar = new esri.toolbars.Draw(map, { showTooltips: true });
                dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                    drawToolbar.deactivate();
                    var points;
                    var symbol;
                    var layer
                    switch (geometry.type) {
                        case "point":
                            points = [geometry.x, geometry.y];
                            layer = locationInfoLayers.points;
                            break;
                        case "polyline":
                            points = geometry.paths;
                            layer = locationInfoLayers.polylines;
                            break;
                        case "polygon":
                            points = geometry.rings;
                            layer = locationInfoLayers.polygons;
                            break;
                        default:
                            throw new Error("Invalid geometry type.");
                    }
                    points = JSON.stringify(points);
                    var layerIds = [];
                    try {
                        $("[id^=wsdot-location-info-layer-]:checked").map(function (index, element) { layerIds.push(dijit.byId($(element).attr("id")).value); });
                        layerIds = JSON.stringify(layerIds);
                    } catch (err) {
                        console.error(err)
                    }
                    var params = {
                        // locationInfoUrl: locationInfoUrl,
                        geometry: points,
                        sr: map.spatialReference.wkid,
                        bufferDistance: dijit.byId("wsdot-location-info-buffer-size").value,
                        bufferUnit: dijit.byId("wsdot-location-info-buffer-unit-select").value,
                        layerUniqueIds: layerIds,
                        f: "json"
                    };

                    var url = esri.substitute(params, "${locationInfoUrl}/Query.ashx?geometries=${geometries}&sr=${sr}&bufferDistance=${bufferDistance}&bufferUnit=${bufferUnit}&layerUniqueIds=${layerUniqueIds}&xslt=XSLT/ResultsToHtml.xslt");
                    esri.request({
                        url: locationInfoUrl + "/Query.ashx",
                        content: params,
                        handleAs: "json",
                        load: function (data) {
                            data.SearchGeometry = esri.geometry.fromJson(data.SearchGeometry);
                            data.BufferedGeometry = esri.geometry.fromJson(data.BufferedGeometry);
                            // Format the results into a table.
                            var resultLayer;
                            ////var tablesContainer = $("<div>");
                            for (var i = 0, resultCount = data.QueryResults.length; i < resultCount; i++) {
                                resultLayer = data.QueryResults[i];
                                ////tablesContainer.append(createHtmlTable(resultLayer));
                            }
                            var graphic = new esri.Graphic(data.SearchGeometry, null, data, null); ////new esri.InfoTemplate("Location Info.", tablesContainer.html()));
                            layer.add(graphic);

                        },
                        error: function (error) { console.error(error); }
                    }, { usePost: true });
                    // window.open(url);
                });

                // Set up button click events to draw geometries.  When the geometries are drawn, call the location info service and display the results as graphics.
                dijit.form.Button({ label: "Point", onClick: function (event) { drawToolbar.activate(esri.toolbars.Draw.POINT); } }, "wsdot-location-info-point").set("disabled", true);
                dijit.form.Button({ label: "Line", onClick: function (event) { drawToolbar.activate(esri.toolbars.Draw.POLYLINE); } }, "wsdot-location-info-polyline").set("disabled", true);
                dijit.form.Button({ label: "Polygon", onClick: function (event) { drawToolbar.activate(esri.toolbars.Draw.POLYGON); } }, "wsdot-location-info-polygon").set("disabled", true);
            }



            esri.request({
                url: locationInfoUrl + "/LocationInfoFinder.svc/rest/GetLayerList?includeMetadata=false",
                content: null,
                handleAs: "json",
                load: createControl,
                error: function (error) { if (console && console.error) { console.error(error); } }
            }, { useProxy: true, usePost: false });

            return uiNode;
        }
    }

    $.fn.locationInfo = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.locationInfo');
        }
    }
} (jQuery));