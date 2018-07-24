import InfoTemplate = require("esri/InfoTemplate");

import Graphic = require("esri/graphic");

/**
 * A custom InfoTemplate for the Traffic Info map service
 * @module TrafficInfoTemplate
 */

const numberFormat = new Intl.NumberFormat();

/**
 * Get attribute names in a custom sort order. Years are listed in descending order.
 * @param {Object} attr - Graphic's attributes object.
 * @returns {string[]} an array of property names.
 */
function getAttributeNames(attr: any) {
  const ignoreRe = /^(?:ESRI_)?((O(BJECT)?ID(_\d+)?)|(Shape(\.STLength\(\))?))$/i;
  const yearRe = /^Year[\s_]\d{4}$/i;
  const yearNames = [];
  const otherNames = [];
  for (const name in attr) {
    if (attr.hasOwnProperty(name) && !ignoreRe.test(name)) {
      if (yearRe.test(name)) {
        yearNames.push(name);
      } else {
        otherNames.push(name);
      }
    }
  }
  const output = otherNames.concat(yearNames.sort().reverse());
  return output;
}

type GraphicWithResults = Graphic & { [key: string]: any };

/**
 * Creates a table of attributes of a graphic.
 * @param {esri/Graphic} graphic - a graphic
 * @returns {HTMLTableElement} - An HTML table
 */
function createDefinitionList(graphic: GraphicWithResults) {
  const displayFieldName = graphic.result.displayFieldName;
  const layerName = graphic.result.layerName;
  const attr = graphic.attributes;
  const derivedRe = /^([\d,]+)\*$/;
  const nullRe = /^(?:Null)?$/i;
  const numberFieldNameRe = /^(?:(?:Year)|(?:AADT))([\s_]\d{4})?$/i;
  const numberRe = /^\d+$/;
  const percentFieldNameRe = /P(?:er)?c(?:en)?t$/i;
  const dl = document.createElement("dl");
  dl.classList.add("traffic");

  // Loop through all of the attributes and add
  // corresponding table rows.
  const attrNames = getAttributeNames(attr);

  for (const fieldLabel of attrNames) {
    let handled = false;
    let value = attr[fieldLabel];
    const dt = document.createElement("dt");
    dt.textContent = fieldLabel;

    const dd = document.createElement("dd");

    // Apply formatting for special cases.
    if (typeof value === "number") {
      value = numberFormat.format(value);
    } else if (typeof value === "string") {
      if (numberFieldNameRe.test(fieldLabel) && numberRe.test(value)) {
        value = numberFormat.format(value.replace(",", "") as any);
      } else if (nullRe.test(value)) {
        dd.classList.add("null");
        handled = true;
      } else if (percentFieldNameRe.test(fieldLabel)) {
        dd.classList.add("percent");
      } else {
        const match = value.match(derivedRe);
        if (match) {
          dd.classList.add("derived");
          dd.textContent = numberFormat.format(
            parseInt(match[1].replace(",", ""), 10)
          );
          handled = true;
        }
      }
    }

    if (!handled) {
      dd.textContent = value;
    }

    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  return dl;
}

function createContent(graphic: Graphic) {
  return createDefinitionList(graphic);
}

/**
 * @alias module:TrafficInfoTemplate
 */
export = new InfoTemplate({
  content: createContent,
  title(graphic: GraphicWithResults) {
    try {
      return graphic.result.layerName;
    } catch (ex) {
      return "";
    }
  }
});
