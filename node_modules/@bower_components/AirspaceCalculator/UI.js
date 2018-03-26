/*global define, require, module*/
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "dms-conversion", "./AirspaceCalculator"], factory);
    }
})(function (require, exports) {
    "use strict";
    /**
     * Provides Airspace Calculator UI
     * @module AirspaceCalculator/UI
     */
    var dms_conversion_1 = require("dms-conversion");
    var AirspaceCalculator_1 = require("./AirspaceCalculator");
    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    /**
     * Creates a button
     * @param {Object} options
     * @param {(string|HTMLElement)} options.caption - button caption
     * @param {(string|HTMLElement)} [options.title] - button title
     * @param {(string|string[])} [options.iconClass] - CSS class(es) used to give the button an icon.
     * @param {string} [options.type=button] - The type of button to create (E.g., "button", "submit", or "reset")
     * @returns {HTMLButtonElement}
     */
    function createButton(options) {
        options = options || {};
        var button = document.createElement("button");
        button.type = options.type || "button";
        if (options.title) {
            button.title = options.title;
        }
        var iconSpan = document.createElement("span");
        iconSpan.classList.add("icon");
        if (typeof options.iconClass === "string") {
            iconSpan.classList.add(options.iconClass);
        }
        else if (Array.isArray(options.iconClass)) {
            options.iconClass.forEach(function (s) {
                iconSpan.classList.add(s);
            });
        }
        var captionSpan = document.createElement("span");
        captionSpan.classList.add("caption");
        if (typeof options.caption === "string") {
            captionSpan.textContent = options.caption;
        }
        else if (options.caption instanceof HTMLElement) {
            captionSpan.appendChild(options.caption);
        }
        button.appendChild(iconSpan);
        button.appendChild(captionSpan);
        return button;
    }
    /**
     * Creates a document fragment containing a label and an input element.
     * @param {Object} options - Properties correspond to input attributes.
     * @param {string} [label] - Text for the label element. If omitted, a label element will not be created.
     * @returns {HTMLDocumentFragment}
     */
    function createLabelAndInput(options) {
        options = options || {};
        var docFrag = document.createDocumentFragment();
        if (options.label) {
            var label = document.createElement("label");
            label.textContent = options.label;
            docFrag.appendChild(label);
        }
        var input = document.createElement("input");
        input.required = Boolean(options.required);
        var ignoredOptionNames = /^(?:(?:label)|(required))$/i, propVal;
        for (var name_1 in options) {
            var option = options[name_1];
            if (options.hasOwnProperty(name_1) && !ignoredOptionNames.test(option) && option != null) {
                propVal = option;
                if (propVal instanceof RegExp) {
                    input.setAttribute(name_1, propVal.source);
                }
                else {
                    input.setAttribute(name_1, propVal);
                }
            }
        }
        docFrag.appendChild(input);
        return docFrag;
    }
    /**
     * UI for the AirspaceCalculator
     * @constructor
     * @alias module:AirspaceCalculator/UI
     * @param {string} imageServiceUrl
     */
    var UI = (function () {
        function UI(imageServiceUrl, elevationServiceUrl) {
            this._airspaceCalc = new AirspaceCalculator_1.default(imageServiceUrl, elevationServiceUrl);
            var self = this;
            var coordinateBlur = function () {
                var form = this.form;
                // Parse to coordinates.
                var x = dms_conversion_1.parseDms(form.x.value);
                var y = dms_conversion_1.parseDms(form.y.value);
                var dms;
                // Create a DmsCoordinates object to ensure values are valid.
                try {
                    dms = new dms_conversion_1.default(y, x);
                }
                catch (err) {
                    // Set to null if not valid.
                    dms = null;
                }
                var evt = new CustomEvent("coordinates-update", {
                    detail: dms
                });
                form.dispatchEvent(evt);
            };
            var form = document.createElement("form");
            this._form = form;
            form.classList.add("airspace-calculator");
            var inputContainer = document.createElement("div");
            inputContainer.classList.add("container");
            // Add latitude controls.
            var frag = createLabelAndInput({
                label: "Longitude",
                name: "x",
                type: "text",
                pattern: dms_conversion_1.default.dmsRe.source,
                placeholder: "longitude",
                title: "Longitude in dec. degrees or DMS format.",
                required: "required",
                autocomplete: "on"
            });
            var div = document.createElement("div");
            div.appendChild(frag);
            inputContainer.appendChild(div);
            // Add longitude controls.
            frag = createLabelAndInput({
                label: "Latitude",
                name: "y",
                type: "text",
                pattern: dms_conversion_1.default.dmsRe.source,
                placeholder: "latitude",
                title: "Latitude in dec. degrees or DMS format.",
                required: "required",
                autocomplete: "on"
            });
            div = document.createElement("div");
            div.appendChild(frag);
            inputContainer.appendChild(div);
            // Add height controls.
            frag = createLabelAndInput({
                label: "Structure Height",
                name: "height",
                type: "number",
                placeholder: "Structure Height",
                title: "Enter a structure height in feet",
                min: 1,
                required: "required"
            });
            div = document.createElement("div");
            div.appendChild(frag);
            inputContainer.appendChild(div);
            form.appendChild(inputContainer);
            var mapButtons = document.createElement("div");
            mapButtons.classList.add("map-buttons");
            var btn = createButton({
                caption: "Get coords. from map",
                title: "Pick coordinates by clicking a location on the map",
                iconClass: ["fa", "fa-location-arrow"]
            });
            mapButtons.appendChild(btn);
            btn.addEventListener("click", function () {
                var evt = new CustomEvent("add-from-map", {
                    detail: null
                });
                form.dispatchEvent(evt);
            });
            btn = createButton({
                caption: "Clear Graphics",
                title: "Clears graphics from the map created by this control",
                iconClass: ["fa", "fa-trash"]
            });
            mapButtons.appendChild(btn);
            btn.addEventListener("click", function () {
                var evt = new CustomEvent("clear-graphics", {
                    detail: null
                });
                form.dispatchEvent(evt);
            });
            form.appendChild(mapButtons);
            // Add buttons
            div = document.createElement("div");
            div.classList.add("btn-group");
            btn = createButton({
                type: "submit",
                caption: "Calculate",
                title: "Begin the calculation"
            });
            div.appendChild(btn);
            btn = createButton({
                type: "reset",
                caption: "Reset",
                title: "Resets the form"
            });
            div.appendChild(btn);
            form.appendChild(div);
            form.x.addEventListener("blur", coordinateBlur);
            form.y.addEventListener("blur", coordinateBlur);
            // Disable default form submission behavior (which is to navigate away from current page)
            form.onsubmit = function () {
                var x = dms_conversion_1.parseDms(form.x.value);
                var y = dms_conversion_1.parseDms(form.y.value);
                var dms;
                try {
                    dms = new dms_conversion_1.default(y, x);
                }
                catch (e) {
                    dms = null;
                    alert("Invalid coordinates");
                }
                if (dms) {
                    var agl = Number(form.height.value);
                    self._airspaceCalc.calculate(x, y, agl).then(function (response) {
                        var evt = new CustomEvent("calculation-complete", {
                            detail: response
                        });
                        form.dispatchEvent(evt);
                    }, function (error) {
                        var evt = new CustomEvent("calculation-error", {
                            detail: error
                        });
                        form.dispatchEvent(evt);
                    });
                }
                return false;
            };
            form.addEventListener("reset", function () {
                var evt = new CustomEvent("coordinates-update", {
                    detail: null
                });
                form.dispatchEvent(evt);
            });
        }
        Object.defineProperty(UI.prototype, "airspaceCalculator", {
            get: function () {
                return this._airspaceCalc;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UI.prototype, "form", {
            get: function () {
                return this._form;
            },
            enumerable: true,
            configurable: true
        });
        return UI;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = UI;
});
//# sourceMappingURL=UI.js.map