/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>

/*global esri, dojo, jQuery */
/*jslint white: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 50, indent: 4 */

dojo.require("esri.layers.graphics");

dojo.declare("wsdot.layers.KmlGraphicsLayer", esri.layers.GraphicsLayer, {
    onRefreshStart: function () {
    },
    onRefreshEnd: function (error) {
    },
    constructor: function (options) {
        this.url = options.url;
        this.iconWidth = options.iconWidth;
        this.iconHeight = options.iconHeight;
        this.refresh();
    },
    refresh: function () {
        this.clear();
        this.onRefreshStart();
        var layer = this;
        return dojo.xhrGet({
            url: this.url,
            handleAs: "xml",
            load: function (data) {
                try {
                    var iconWidth = layer.iconWidth;
                    var iconHeight = layer.iconHeight;
                    var kml = data;

                    var placemarks = $("Placemark:has(Point)", kml);

                    /// <summary>Creates a symbol from a KML style node.  Currently only supports Icon styles (Points)</summary>
                    /// <param name="kmlStyleNode" type="Object">A KML Style DOM node.</param>
                    /// <param name="width" type="Number">The width to use for the output PictureMarkerSymbol.  Defaults to 16.</param>
                    /// <param name="height" type="Number">The height to use for the output PictureMarkerSymbol.  Defaults to 16.</param>
                    /// <returns type="esri.symbol.PictureMarkerSymbol" />
                    function kmlStyleToMarkerSymbol(kmlStyleNode, width, height) {
                        if (!width) {
                            width = 16;
                        }
                        if (!height) {
                            height = 16;
                        }
                        return new esri.symbol.PictureMarkerSymbol($("Icon > href", kmlStyleNode).text(), width, height);
                    }

                    /// <summary>Creates a UniqueValueRenderer from the Style nodes in a KML document.</summary>
                    /// <param name="styleNodes" type="Array">An array of Style nodes.</param>
                    /// <param name="width" type="Number">The width to use for the PictureMarkerSymbols in the renderer.  Defaults to 16.</param>
                    /// <param name="height" type="Number">The height to use for the PictureMarkerSymbols in the renderer.  Defaults to 16.</param>
                    /// <returns type="esri.renderer.Renderer" />
                    function createRenderer(styleNodes, width, height) {
                        var renderer = new esri.renderer.UniqueValueRenderer(new esri.symbol.SimpleMarkerSymbol(), "styleUrl");
                        $(styleNodes).each(function (index, domElement) {
                            var value = $(domElement).attr("id");
                            var symbol = kmlStyleToMarkerSymbol(domElement, width, height);
                            renderer.addValue({
                                value: value,
                                symbol: symbol
                            });
                        });
                        return renderer;
                    }

                    /// <summary>Converts the text from a KML coordinates tag into a Point.</summary>
                    /// <param name="coordsString" type="String">The value from a Point > coordinates KML tag.</param>
                    /// <param name="convertToWebMercator" type="Boolean">If set to true, the point will be converted from geographic to web mercator.</param>
                    /// <returns type="esri.geometry.Point" />
                    function parsePoint(coordsString, convertToWebMercator) {
                        var point = new esri.geometry.Point($.map(coordsString.split(","), function (element, index) { return Number(element); }));
                        if (convertToWebMercator === true) {
                            point = esri.geometry.geographicToWebMercator(point);
                        }
                        return point;
                    }

                    // Convert the placemarks into graphics.
                    var graphics = placemarks.map(function (index, domElement) {
                        var point = parsePoint($("Point > coordinates", domElement).text(), true);
                        var attributes = {};
                        attributes.id = $(domElement).attr("id");
                        attributes.name = $("name", domElement).text();
                        // TODO: Add support for Extended Data. 
                        var extendedData = $(["ExtendedData"], domElement);
                        if (extendedData.length !== 0) {
                            attributes.extendedData = {};
                            // Add a property for each ExtendedData/Data element to attributes.extendedData.
                            var el;
                            $(["Data", "SimpleData"], extendedData).each(function (index, element) {
                                el = $(element);
                                extendedData[el.attr("name")] = $("value", el).text();
                            });
                        }
                        attributes.description = $("description", domElement).text();
                        attributes.styleUrl = $("styleUrl", domElement).text().replace(/^#/, "");
                        var infoTemplate = null;
                        var graphic = new esri.Graphic(point, null, attributes, infoTemplate);
                        return graphic;
                    });

                    layer.setRenderer(createRenderer($("Style", kml), iconWidth, iconHeight));

                    dojo.forEach(graphics, function (item, index, array) {
                        this.add(item);
                    }, layer);

                    layer.setInfoTemplate(new esri.InfoTemplate("${name}", "${description}"));
                    layer.onRefreshEnd();
                } catch (e) {
                    layer.onRefreshEnd(e);
                }
            },
            error: function (error) {
                layer.onRefreshEnd(error);
            }
        });
    }
});