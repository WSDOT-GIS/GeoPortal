define([
    "dojo/Deferred",
    "esri/request",
    "esri/InfoTemplate"
], function (Deferred, esriRequest, InfoTemplate) {
    "use strict";

    var numberFormat = new Intl.NumberFormat();

    function createTable(graphic) {
        var displayFieldName = graphic.result.displayFieldName;
        var layerName = graphic.result.layerName;
        var attr = graphic.attributes;
        var ignoreRe = /^((O(BJECT)?ID(_\d+)?)|(Shape(\.STLength\(\))?))$/i;
        var derivedRe = /^(\d+)\*$/;
        var nullRe = /^Null$/i;
        var numberFieldNameRe = /^Year\s\d{4}$/i, numberRe = /^\d+$/;
        var table = document.createElement("table");
        var caption = document.createElement("caption");
        caption.textContent = [layerName, attr[displayFieldName]].join(" - ");

        table.appendChild(caption);
        table.classList.add("traffic");

        // Loop through all of the attributes and add
        // corresponding table rows.
        var value, name, row, cell, handled, match;

        for (name in attr) {
            if (attr.hasOwnProperty(name) && !ignoreRe.test(name)) {
                handled = false;
                value = attr[name];
                row = table.insertRow(-1);

                cell = document.createElement("th");
                cell.textContent = name;
                row.appendChild(cell);

                cell = document.createElement("td");

                // Apply formatting for special cases.
                if (typeof value === "number") {
                    value = numberFormat.format(value);
                }
                else if (typeof value === "string") {
                    if (numberFieldNameRe.test(name) && numberRe.test(value)) {
                        value = numberFormat.format(value);
                    } else if (nullRe.test(value)) {
                        cell.classList.add("null");
                        handled = true;
                    } else {
                        match = value.match(derivedRe);
                        if (match) {
                            cell.classList.add("derived");
                            cell.textContent = numberFormat.format(parseInt(match[1], 10));
                            handled = true;
                        }
                    }
                }

                if (!handled) {
                    cell.textContent = value;
                }
                row.appendChild(cell);
            }
        }

        return table;
    }

    function createContent(graphic) {
        var table = createTable(graphic);
        return table;
    }

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