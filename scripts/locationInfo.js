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

    $.fn.locationInfo = function (layerListUrl) {
        /// <summary>Creates the location information UI.</summary>
        /// <param name="layerListUrl" type="String">URL for the layer list REST endpoint.</param>
        var uiNode = this;

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
                { "name": "InternationalInch", "value": 109008, "description": "in." },
                { "name": "Meter", "value": 9001, "description": "m." },
                { "name": "Kilometer", "value": 9036, "description": "km." },
                { "name": "Decimeter", "value": 109005, "description": "dm." },
                { "name": "Centimeter", "value": 109006, "description": "cm." },
                { "name": "Millimeter", "value": 109007, "description": "mm." }
            /*
            ,{ "name": "FiftyKilometerLength", "value": 109030, "description": "50 Kilometer Length" },
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

            nodes.bufferUnitSelect = $("<select id='wsdot-location-info-buffer-unit-select'>");
            // Add an option for each measurement unit.
            $.each(units, function (index, value) {
                nodes.bufferUnitSelect.append("<option value='" + value.name + "' data-wkid='" + value.value + "'>" + value.description + "</option>");
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
                nodes.button = $("<button>Metadata</button>");

                nodes.td = $("<td class='metadata'>");
                nodes.td.append(nodes.button);
                nodes.td.appendTo(nodes.row);
                nodes.tbody.append(nodes.row);

                dijit.form.CheckBox({
                    value: layer.UniqueId
                }, nodes.checkbox[0]);

                nodes.button = dijit.form.Button({ label: "Metadata", id: "wsdot-location-info-metadata-button-" + layer.UniqueId }, nodes.button[0]);
                if (layer.Metadata) {
                    nodes.button.attr("data-Metadata", layer.Metadata);
                } else {
                    nodes.button.set("disabled", true);
                }

            });

            uiNode.append(nodes.dataSetsTable);

            nodes = {
                shapeButtons: $("<div>")
            };

            nodes.shapeButtons.append("<button id='wsdot-location-info-point' >Point</button>").append("<button id='wsdot-location-info-polyline'>Polyline</button>").append("<button id='wsdot-location-info-polygon'>Polygon</button>");
            uiNode.append(nodes.shapeButtons);

            // TODO: Set up button click events to draw geometries.  When the geometries are drawn, call the location info service and display the results as graphics.
            dijit.form.Button({ label: "Point" }, "wsdot-location-info-point");
            dijit.form.Button({ label: "Line" }, "wsdot-location-info-polyline");
            dijit.form.Button({ label: "Polygon" }, "wsdot-location-info-polygon");
        }

        esri.request({
            url: layerListUrl,
            content: null,
            handleAs: "json",
            load: createControl,
            error: function (error) { if (console && console.error) { console.error(error); } }
        }, { useProxy: true, usePost: false });
    };
} (jQuery));