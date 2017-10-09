define([
    "esri/InfoTemplate"
], function (InfoTemplate) {
    "use strict";

    /**
     * A custom InfoTemplate for the Traffic Info map service
     * @module TrafficInfoTemplate
     */

    var numberFormat = new Intl.NumberFormat();

    /**
     * Get attribute names in a custom sort order. Years are listed in descending order.
     * @param {Object} attr - Graphic's attributes object.
     * @returns {string[]} an array of property names.
     */
    function getAttributeNames(attr) {
        var ignoreRe = /^(?:ESRI_)?((O(BJECT)?ID(_\d+)?)|(Shape(\.STLength\(\))?))$/i;
        var yearRe = /^Year[\s_]\d{4}$/i;
        var yearNames = [], otherNames = [];
        for (name in attr) {
            if (attr.hasOwnProperty(name) && !ignoreRe.test(name)) {
                if (yearRe.test(name)) {
                    yearNames.push(name);
                } else {
                    otherNames.push(name);
                }
            }
        }
        console.group("names");
        console.log("year names", yearNames);
        var output = otherNames.concat(yearNames.sort().reverse());
        console.log("attribute names", output);
        console.groupEnd();
        return output;
    }

    /**
     * Creates a table of attributes of a graphic.
     * @param {esri/Graphic} graphic - a graphic
     * @returns {HTMLTableElement} - An HTML table
     */
    function createTable(graphic) {
        var displayFieldName = graphic.result.displayFieldName;
        var layerName = graphic.result.layerName;
        var attr = graphic.attributes;
        var derivedRe = /^([\d,]+)\*$/;
        var nullRe = /^(?:Null)?$/i;
        var numberFieldNameRe = /^(?:(?:Year)|(?:AADT))([\s_]\d{4})?$/i;
        var numberRe = /^\d+$/;
        var percentFieldNameRe = /P(?:er)?c(?:en)?t$/i;
        var table = document.createElement("table");
        table.classList.add("traffic");

        // Loop through all of the attributes and add
        // corresponding table rows.
        var value, name, row, cell, handled, match;

        var attrNames = getAttributeNames(attr);

        attrNames.forEach(function (fieldLabel) {
            handled = false;
            value = attr[fieldLabel];
            row = table.insertRow(-1);

            cell = document.createElement("th");
            cell.textContent = fieldLabel;
            row.appendChild(cell);

            cell = document.createElement("td");

            // Apply formatting for special cases.
            if (typeof value === "number") {
                value = numberFormat.format(value);
            }
            else if (typeof value === "string") {
                if (numberFieldNameRe.test(fieldLabel) && numberRe.test(value)) {
                    value = numberFormat.format(value.replace(",", ""));
                } else if (nullRe.test(value)) {
                    cell.classList.add("null");
                    handled = true;
                } else if (percentFieldNameRe.test(fieldLabel)) {
                    cell.classList.add("percent");
                } else {
                    match = value.match(derivedRe);
                    if (match) {
                        cell.classList.add("derived");
                        cell.textContent = numberFormat.format(parseInt(match[1].replace(",", ""), 10));
                        handled = true;
                    }
                }
            }

            if (!handled) {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });

        return table;
    }

    function createContent(graphic) {
        var table = createTable(graphic);
        return table;
    }


    /**
     * @alias module:TrafficInfoTemplate
     */
    return new InfoTemplate({
        content: createContent,
        title: function (graphic) {
            try {
                return graphic.result.layerName;
            } catch (ex) {
                return "";
            }
        }
    });

});