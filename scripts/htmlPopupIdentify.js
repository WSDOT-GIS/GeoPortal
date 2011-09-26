/*global dojo, dijit, esri, jQuery */
/*jslint nomen: true, white:true, devel: true, browser: true, maxerr: 50, indent: 4 */

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
This jQuery plugin is used to create an identify control for an ArcGIS JavaScript API web application.
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
*/

/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.2-vsdoc.js"/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.14/jquery-ui.js"/>
/// <reference path="pathto/script.js"/>
(function ($) {
    "use strict";
    dojo.require("esri.graphic");
    dojo.require("esri.tasks.identify");
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.symbol");

    $.widget("ui.htmlPopupIdentify", {
        // default options
        options: {
            map: null,
            layers: []  // Specify a list of layers.  If this parameter is provided, then map layers will not be automatically added
        },
        _mapClickEvent: null,
        create: function () {
            var self = this, div;
            $(this.element).addClass("ui-html-popup-identify");
            div = $("<div>").appendTo(this.element);
            $("<label>").attr({ "for": "ui-html-popup-identify-layer-select" }).appendTo(div);
            $("<select>").appendTo(div).attr({
                id: "ui-html-popup-identify-layer-select",
                multiple: true
            }).htmlPopupIdentify(layers || map.layers);
            div = $("<div>").appendTo(this.element);
            $("<input>").attr({
                id: "ui-html-popup-identify-enabled-checkbox",
                type: "checkbox"
            }).appendTo(div).change(function () {
                console.debug(arguments);
            });
            $("<label>").text("enable").attr("for", "ui-html-popup-identify-enabled-checkbox").appendTo(div);
        },
        enable: function () {
            $.Widget.prototype.enable.apply(this, arguments);
        },
        disable: function () {
            $.Widget.prototype.disable.apply(this, arguments);
        },
        destroy: function () {
            $.Widget.prototype.destroy.apply(this, arguments); // default destroy
            this.element.removeClass("ui-html-popup-identify");
            dojo.forEach([this._layerAddHandler, this._layerRemoveHandler, this._clickHandler], dojo.disconnect); // Remove map event handlers
        }
    });
} (jQuery));