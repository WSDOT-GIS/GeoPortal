/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint confusion: true */


/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3"/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>

(function ($) {
    "use strict";

    dojo.require("dojo.number");
    dojo.require("dijit.form.ValidationTextBox");
    dojo.require("dijit.form.NumberSpinner");
    dojo.require("dijit.form.DateTextBox");
    dojo.require("dijit.form.RadioButton");
    dojo.require("dijit.form.CheckBox");
    dojo.require("dijit.form.Button");

    dojo.require("dijit.layout.BorderContainer");
    dojo.require("dijit.layout.TabContainer");
    dojo.require("dijit.layout.ContentPane");

    $.fn.lrsTools = function (map) {
        // LRS Tools
        var locatedMilepostsLayer = null;

        // Add the HTML controls.
        this.append('<div id="milepostContainer"> <div id="milepostContainerCenter"> <div id="milepostTabs"> <div id="findMilepost"> <div><label>Route</label> <input type="text" id="routeTextBox" /> <input type="checkbox" id="decreaseCheckbox" value="true" title="Decrease" /> <label for="decreaseCheckBox">Decrease</label> </div> <div> <input type="radio" value="ARM" name="armOrSrmp" checked="checked" id="armRadioButton" /> <label for="armRadioButton">ARM</label> <input type="radio" value="SRMP" name="armOrSrmp" id="srmpRadioButton" /> <label for="srmpRadioButton">SRMP</label> </div> <div> <label for="milepostBox">Milepost</label> <input type="number" min="0" id="milepostBox" value="0" /> <div id="backContainer"> <input type="checkbox" id="backCheckBox" disabled="disabled" title="Back" value="true" /> <label for="backCheckBox">Back</label> </div> </div> <div> <label>Reference Date</label> <input type="date" id="referenceDateBox" /> </div> <button id="findMilepostButton" type="button">Find Milepost</button> <img id="milepostLoadingIcon" src="images/ajax-loader.gif" alt="loading icon" /> </div> <div id="findNearestMilepost"><div> <label>Radius</label> <input id="radiusBox" type="number" value="0" min="0" /> <span>Feet</span> </div> <button type="button" id="findNearestMPButton">Find</button> <img id="findNearestLoadingIcon" src="images/ajax-loader.gif" alt="loading icon" /> </div> </div> </div> <div id="milepostContainerBottom"> <button type="button" id="clearMPResultsButton">Clear Results</button> </div> </div>');

        // Convert the HTML controls into dijits.
        dijit.form.ValidationTextBox({ style: "width: 100px", required: true, regExp: "\\d{3}(\\w{2}\\w{6})?", invalidMessage: "Invalid state route ID",
            onBlur: function () {
                // If a one or two digit number is enter, pad with zeros until there are three digits.
                if (this.displayedValue.match(/^\d{1,2}$/)) {
                    this.set("displayedValue",dojo.number.format(Number(this.displayedValue), { pattern: "000" }));
                }
            }
        }, "routeTextBox");
        dijit.form.NumberSpinner({ constraints: { min: 0 }, value: 0, style: "width: 100px" }, "milepostBox");
        dijit.form.DateTextBox({ value: new Date() }, "referenceDateBox");
        dijit.form.RadioButton({ onClick: function () { esri.hide(dojo.byId("backContainer")); }, checked: true }, "armRadioButton");
        dijit.form.RadioButton({ onClick: function () { esri.show(dojo.byId("backContainer")); } }, "srmpRadioButton");
        $("#findMilepost label:first-child").css("display", "block");

        dijit.form.CheckBox(null, "decreaseCheckbox");

        dijit.form.CheckBox(null, "backCheckBox");


        var tabContainer = new dijit.layout.TabContainer({ style: "width: 100%; height: 100%" }, "milepostTabs");
        tabContainer.addChild(new dijit.layout.ContentPane({ title: "Find Milepost" }, "findMilepost"));
        tabContainer.addChild(new dijit.layout.ContentPane({ title: "Find Nearest Milepost" }, "findNearestMilepost"));

        tabContainer.startup();

        var borderContainer = new dijit.layout.BorderContainer({ style: "width: 100%; height: 100%", gutters: false }, "milepostContainer");
        borderContainer.addChild(new dijit.layout.ContentPane({ region: "center", style: "padding: 0;" }, "milepostContainerCenter"));
        borderContainer.addChild(new dijit.layout.ContentPane({ region: "bottom", style: "text-align: center" }, "milepostContainerBottom"));
        borderContainer.startup();
        esri.hide(dojo.byId("backContainer"));

        function createLocatedMilepostsLayer() {
            /// <summary>
            /// Creates the "Located Mileposts" layer if it does not already exist.  If the layer exists, visibility is turned on if it is not already visible.
            /// </summary>
            if (!locatedMilepostsLayer) {
                locatedMilepostsLayer = new esri.layers.GraphicsLayer({ id: "Located Mileposts" });
                var 
                    symbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([48, 186, 0])).setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE),
                    renderer = new esri.renderer.SimpleRenderer(symbol);
                locatedMilepostsLayer.setRenderer(renderer);
                locatedMilepostsLayer.setInfoTemplate(new esri.InfoTemplate("Route Location", "${*}"));
                map.addLayer(locatedMilepostsLayer);
            }
            // 
            if (!locatedMilepostsLayer.visible) {
                locatedMilepostsLayer.show();
            }
        }

        function createAttributeTableForElcResult(result) {
            var table = "<table>",
                value,
                includeRe = /(?:Arm)|(?:Srmp)|(?:RouteId)/i,  // Define which attributes will be shown in the output window.
                aliases = {
                    "Arm": "ARM",
                    "Measure": "ARM",
                    "Srmp": "SRMP",
                    "ReferenceDate": "Reference Date",
                    "ResponseDate": "Response Date",
                    "RealignmentDate": "Realignment Date",
                    "ArmCalcReturnCode": "ARM Calc Return Code",
                    "LrsType": "LRS Type",
                    "LOC_ANGLE": "Angle",
                    "RouteId": "Route",
                    "OffsetDistance": "Offset Distance",
                    "RightSide": "Right Side"
                },
                attr;
            for (attr in result) {
                if (result.hasOwnProperty(attr)) {
                    if (attr.match(includeRe)) {
                        value = result[attr];
                        if (!((attr === "LocatingError" && value === "LOCATING_OK") || (attr === "Message" && value === "") || (attr === "OffsetDistance" && value === 0))) {
                            // Convert date values from long 
                            if (attr === "OffsetDistance") {
                                if (value < 0) {
                                    value = Math.abs(Math.round(value * 100) / 100);
                                }
                                value = value + "'";
                            }
                            else if (attr === "Srmp" && Boolean(result.Back) === true) {
                                value += "B";
                            }
                            else if (attr.match(/(?:\w*Distance)|(?:Measure)|(?:Arm)|(?:LOC_ANGLE)/i)) {
                                value = Math.round(value * 1000) / 1000;
                            }
                            table += "<tr>";
                            if (aliases[attr]) {
                                table += "<th>" + aliases[attr] + "</th>";
                            } else {
                                table += "<th>" + attr + "</th>";
                            }
                            table += "<td>" + value + "</td>";
                            table += "</tr>";
                        }
                    }
                }
            }
            table += "</table>";
            return table;
        }


        dijit.form.Button({ onClick: function () {
            // Make sure the route text box contains a valid value.  If it does not, do not submit query to the server (i.e., exit the method).
            var routeTextBox = dijit.byId("routeTextBox");
            if (!routeTextBox.isValid()) {
                routeTextBox.focus();
                return;
            }

            createLocatedMilepostsLayer();

            var location = {
                Route: dijit.byId("routeTextBox").value,
                Decrease: dijit.byId("decreaseCheckbox").checked
            };
            if (dijit.byId("armRadioButton").checked) {
                location.Arm = dijit.byId("milepostBox").value;
            }
            else {
                location.Srmp = dijit.byId("milepostBox").value;
                location.Back = dijit.byId("backCheckBox").checked;
            }

            esri.show(dojo.byId("milepostLoadingIcon"));
            dijit.byId("findMilepostButton").set("disabled", true);


            esri.request({
                url: wsdot.config.locateMileposts.url,
                content: {
                    referenceDate: dijit.byId("referenceDateBox").value,
                    routeLocations: JSON.stringify([location]),
                    spatialReference: map.spatialReference.wkid
                },
                handleAs: "json",
                load: function (results) {
                    var geometry = null, graphic, result, i, l, content;

                    esri.hide(dojo.byId("milepostLoadingIcon"));
                    dijit.byId("findMilepostButton").set("disabled", false);


                    // Process the results.
                    if (results.length >= 1) {
                        for (i = 0, l = results.length; i < l; i += 1) {
                            result = results[i];
                            if (result.RoutePoint) {
                                geometry = new esri.geometry.Point(result.RoutePoint);
                                content = createAttributeTableForElcResult(result);
                                graphic = new esri.Graphic(geometry, null, result, new esri.InfoTemplate("Route Location", content));
                                locatedMilepostsLayer.add(graphic);
                                map.infoWindow.setContent(content).setTitle("Route Location").show(map.toScreen(geometry));
                            }
                            else {
                                if ($.pnotify) {
                                    $.pnotify({
                                        pnotify_title: 'Unable to find route location',
                                        pnotify_text: createAttributeTableForElcResult(result),
                                        pnotify_hide: true
                                    }).effect("bounce");
                                }
                                else {
                                    $("<div>").html(createAttributeTableForElcResult(result)).dialog({
                                        title: "Unable to find route location",
                                        dialogClass: "alert",
                                        modal: true,
                                        close: function () { $(this).dialog("destroy"); $(this).remove(); }
                                    });
                                }
                            }


                        }
                    }

                    // Zoom to the last geometry added to the map.
                    if (geometry !== null) {
                        if (geometry.type === "point") {
                            if (!isNaN(geometry.x) && !isNaN(geometry.y)) {
                                map.centerAndZoom(geometry, 12);
                            }
                        }
                        else {
                            map.setExtent(geometry.getExtent(), true);
                        }
                    }
                },
                error: function (error) {
                    esri.hide(dojo.byId("milepostLoadingIcon"));
                    dijit.byId("findMilepostButton").set("disabled", false);
                    if (console && console.error) {
                        console.error(error);
                    }
                }
            }, wsdot.config.locateMileposts.options);
        }
        }, "findMilepostButton");

        esri.hide(dojo.byId("milepostLoadingIcon"));

        esri.hide(dojo.byId("findNearestLoadingIcon"));

        // Setup find nearest milepost tools
        dijit.form.NumberSpinner({ constraints: { min: 0 }, value: 200, style: "width:100px" }, "radiusBox");
        dijit.form.Button({ onClick: function () {
            var button = dijit.byId("findNearestMPButton"),
                loadingIcon = dojo.byId("findNearestLoadingIcon"),
                drawToolbar;

            createLocatedMilepostsLayer();
            drawToolbar = new esri.toolbars.Draw(map);
            dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                esri.show(loadingIcon);
                drawToolbar.deactivate();
                button.set("disabled", true);

                esri.request({
                    url: wsdot.config.locateNearestMileposts.url,
                    content: {
                        spatialReference: map.spatialReference.wkid,
                        coordinates: geometry.x + "," + geometry.y,
                        maxSearchDistance: dijit.byId("radiusBox").value
                    },
                    handleAs: "json",
                    load: function (results) {
                        esri.hide(loadingIcon);
                        button.set("disabled", false);

                        if (results && results.length > 0) {
                            var currentResult, table, graphic, geometry, i, l;
                            for (i = 0, l = results.length; i < l; i += 1) {

                                currentResult = results[i];
                                table = createAttributeTableForElcResult(currentResult);
                                if (currentResult.RoutePoint) {
                                    geometry = new esri.geometry.Point(currentResult.RoutePoint);
                                    geometry.setSpatialReference(map.spatialReference);
                                    graphic = new esri.Graphic({ "geometry": geometry, "attributes": currentResult, "infoTemplate": new esri.InfoTemplate("Route Location", table) });
                                    locatedMilepostsLayer.add(graphic);
                                    map.infoWindow.setContent(table).setTitle("Route Location").show(map.toScreen(geometry));
                                }
                                else {
                                    $.pnotify({
                                        pnotify_title: 'No routes found',
                                        pnotify_text: currentResult.LocatingError,
                                        pnotify_history: false
                                    });
                                }
                            }
                        }
                        else {
                            $.pnotify({
                                pnotify_title: 'No routes found',
                                pnotify_text: 'No routes were found within the given search radius',
                                pnotify_history: false
                            });
                        }
                    },
                    error: function (error) {
                        esri.hide(loadingIcon);
                        button.set("disabled", false);
                        $.pnotify({
                            pnotify_title: 'Locating Error',
                            pnotify_text: error,
                            pnotify_type: 'error',
                            pnotify_hide: false
                        });
                    }
                }, wsdot.config.locateNearestMileposts.options);
            });
            drawToolbar.activate(esri.toolbars.Draw.POINT);
        }
        }, "findNearestMPButton");

        dijit.form.Button({ onClick: function () {
            if (locatedMilepostsLayer && locatedMilepostsLayer.clear) {
                locatedMilepostsLayer.clear();
            }
        }
        }, "clearMPResultsButton");
        $("#findNearestMilepost label:first-child").css("display", "block");



    };
} (jQuery));