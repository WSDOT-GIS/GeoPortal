﻿/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint confusion: true */

/*
Copyright (c) 2011 Washington State Department of Transportation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/*
This jQuery plugin is used to create a control in an ArcGIS JavaScript API web application that find locations in relation to WA State Routes.
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
*/

/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.4"/>
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

    $.widget("ui.lrsTools", {
        options: {
            map: null,
            controlsCreated: null
        },
        _create: function () {
            var self = this, map = this.options.map;
            if (!$.pnotify) {
                $.getScript("scripts/jquery.pnotify.min.js");
            }

            // LRS Tools
            var locatedMilepostsLayer = null, domNode = this.element;

            function formatTemplate(jqXHR, textStatus) {
                $(domNode).append(jqXHR.responseText);
                // Convert the HTML controls into dijits.
                dijit.form.ValidationTextBox({ style: "width: 100px", required: true, regExp: "\\d{3}(\\w{2}\\w{6})?", invalidMessage: "Invalid state route ID",
                    onBlur: function () {
                        // If a one or two digit number is entered, pad with zeros until there are three digits.
                        if (this.displayedValue.match(/^\d{1,2}$/)) {
                            this.set("displayedValue", dojo.number.format(Number(this.displayedValue), { pattern: "000" }));
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
                borderContainer.resize();
                esri.hide(dojo.byId("backContainer"));

                function createElcResultTable(graphic) {
                    /// <summary>Used by the GraphicsLayer's InfoTemplate to generate content for the InfoWindow.</summary>
                    /// <param name="graphic" type="esri.Graphic">A graphic object with attributes for a state route location.</param>
                    var arm, srmp, armDef, list;

                    if (graphic.attributes.LocatingError === "LOCATING_OK") {
                        list = $("<dl>");
                        // Add the route information
                        $("<dt>").text("Route").appendTo(list);
                        $("<dd>").appendTo(list).text(graphic.attributes.RouteId || "");

                        // ARM
                        if (typeof (graphic.attributes.Arm) !== "undefined" || typeof (graphic.attributes.Measure) !== "undefined") {
                            // Add the ARM information
                            $("<dt>").append($("<abbr>").attr("title", "Accumulated Route Mileage").text("ARM")).appendTo(list);
                            // Get the ARM value from either the Arm or Measure property.
                            arm = typeof (graphic.attributes.Arm) !== "undefined" ? graphic.attributes.Arm
                        : typeof (graphic.attributes.Measure !== "undefined") ? graphic.attributes.Measure
                        : null;
                            armDef = $("<dd>").appendTo(list);

                            if (arm !== null) {
                                arm = Math.abs(Math.round(arm * 100) / 100); // Round the ARM value to the nearest 100.
                                armDef.text(String(arm));
                            }
                        }

                        // SRMP
                        if (typeof (graphic.attributes.Srmp) !== "undefined") {
                            $("<dt>").append($("<abbr>").attr("title", "State Route Milepost").text("SRMP")).appendTo(list);
                            srmp = String(graphic.attributes.Srmp);
                            if (Boolean(graphic.attributes.Back) === true) {
                                srmp += "B";
                            }
                            $("<dd>").append(srmp).appendTo(list);
                        }

                        return list[0];
                    } else {
                        return graphic.attributes.LocatingError;
                    }
                }

                function createLocatedMilepostsLayer() {
                    /// <summary>
                    /// Creates the "Located Mileposts" layer if it does not already exist.  If the layer exists, visibility is turned on if it is not already visible.
                    /// </summary>
                    var symbol, renderer;
                    if (!locatedMilepostsLayer) {
                        locatedMilepostsLayer = new esri.layers.GraphicsLayer({ id: "Located Mileposts" });
                        symbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([48, 186, 0])).setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE);
                        renderer = new esri.renderer.SimpleRenderer(symbol);
                        locatedMilepostsLayer.setRenderer(renderer);
                        locatedMilepostsLayer.setInfoTemplate(new esri.InfoTemplate("Route Location", createElcResultTable));
                        map.addLayer(locatedMilepostsLayer);
                    }
                    // 
                    if (!locatedMilepostsLayer.visible) {
                        locatedMilepostsLayer.show();
                    }
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
                        	referenceDate: dijit.byId("referenceDateBox").value.toISOString(),
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
                                        // content = createAttributeTableForElcResult(result);
                                        graphic = new esri.Graphic(geometry, null, result);
                                        locatedMilepostsLayer.add(graphic);
                                        map.infoWindow.setContent(graphic.getContent()).setTitle(graphic.getTitle()).show(map.toScreen(geometry));
                                    }
                                    else {
                                        if ($.pnotify) {
                                            $.pnotify({
                                                pnotify_title: 'Unable to find route location',
                                                pnotify_text: createElcResultTable({ attributes: result }),
                                                pnotify_hide: true
                                            }).effect("bounce");
                                        }
                                        else {
                                            $("<div>").html(createElcResultTable({ attributes: result })).dialog({
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
                                        map.centerAndZoom(geometry, 10);
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
                    var button = dijit.byId("findNearestMPButton"), loadingIcon = dojo.byId("findNearestLoadingIcon"), drawToolbar;

                    createLocatedMilepostsLayer();
                    drawToolbar = new esri.toolbars.Draw(map);
                    dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                        esri.show(loadingIcon);
                        drawToolbar.deactivate();
                        self._trigger("drawDeactivate", self);
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
                                        if (currentResult.RoutePoint) {
                                            geometry = new esri.geometry.Point(currentResult.RoutePoint);
                                            geometry.setSpatialReference(map.spatialReference);
                                            graphic = new esri.Graphic({ "geometry": geometry, "attributes": currentResult });
                                            locatedMilepostsLayer.add(graphic);
                                            map.infoWindow.setContent(graphic.getContent()).setTitle(graphic.getTitle()).show(map.toScreen(geometry));
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
                    self._trigger("drawActivate", self);
                }
                }, "findNearestMPButton");

                dijit.form.Button({ onClick: function () {
                        if (locatedMilepostsLayer && locatedMilepostsLayer.clear) {
                            locatedMilepostsLayer.clear();
                        }
                    }
                }, "clearMPResultsButton");
                $("#findNearestMilepost label:first-child").css("display", "block");

                self._trigger("controlsCreated", null, self.element);
                return self;
            }

            // Load the template file and then add those elements to this widget.  Once completed, add the functionality to the controls.
            $.ajax("lrsToolsTemplate.html", {
                dataType: "html",
                complete: formatTemplate
            });
        }
    });
} (jQuery));