import Moveable = require("dojo/dnd/Moveable");
import printCss = require("dojo/text!./print.css");
import InfoWindow = require("esri/dijit/InfoWindow");
import Popup = require("esri/dijit/Popup");
import Point = require("esri/geometry/Point");
import webMercatorUtils = require("esri/geometry/webMercatorUtils");
import SpatialReference = require("esri/SpatialReference");
import { graphicsToTables } from "./layerUtils";

const wgs84SR = new SpatialReference(4326);

/**
 * Creates a Google Street View URL from a geometry.
 * @param {esri/geometry/Point} point - A point.
 * @returns {string} - A Google street view URL.
 */
function getGoogleStreetViewUrl(point: Point) {
  // Get the xy coordinates of the point.
  const xy = [point.x, point.y];
  // Create the output URL, inserting the xy coordinates.
  // http://maps.google.com/maps?q=&layer=c&cbll=47.15976,-122.48359&cbp=11,0,0,0,0
  return `http://maps.google.com/maps?q=&layer=c&cbll=${xy[1]},${
    xy[0]
  }&cbp=11,0,0,0,0`;
}

export function addExportFeatureLink(infoWindow: Popup) {
  const actionList = infoWindow.domNode.querySelector(".actionList");
  const link = document.createElement("a");
  const docFrag = document.createDocumentFragment();
  link.textContent = "Export";
  link.href = "#";
  link.title = "Exports the feature to JSON";
  link.classList.add("action");
  link.classList.add("export-feature");
  // Add a space before adding link.
  docFrag.appendChild(document.createTextNode(" "));
  docFrag.appendChild(link);

  link.onclick = evt => {
    // Get the currently selected feature.
    let feature = infoWindow.features[infoWindow.selectedIndex];

    // Project to WGS 84 if possible.
    if (webMercatorUtils.canProject(feature.geometry, wgs84SR)) {
      feature.geometry = webMercatorUtils.project(feature.geometry, wgs84SR);
    }

    // Convert to regular object.
    feature = feature.toJson();
    // Convert to JSON string.
    const featureJson = JSON.stringify(feature, null, "\t");
    const uri = `data:application/json,${encodeURIComponent(featureJson)}`;
    link.href = uri;
    link.target = "_blank";

    // return false;
  };

  actionList.appendChild(docFrag);
  return link;
}

export function addGoogleStreetViewLink(infoWindow: Popup) {
  const actionList = infoWindow.domNode.querySelector(".actionList");
  const link = document.createElement("a");
  const docFrag = document.createDocumentFragment();
  link.textContent = "Google Street View";
  link.href = "#";
  link.title = "Shows the current location in Google Street View";
  link.classList.add("action");
  link.classList.add("google");
  link.classList.add("google-street-view");
  // Add a space before adding link.
  docFrag.appendChild(document.createTextNode(" "));
  docFrag.appendChild(link);

  link.onclick = () => {
    // Get the currently selected feature.
    const feature = infoWindow.features[infoWindow.selectedIndex];

    // Get the currently selected feature's geometry.
    let geometry = feature.geometry;

    // If the geometry's type is not a point, get the point that
    // the info window is currently pointing to.
    if (geometry.type !== "point") {
      geometry = infoWindow.location;
    }

    // Project to WGS 84 if possible.
    if (webMercatorUtils.canProject(geometry, wgs84SR)) {
      geometry = webMercatorUtils.project(geometry, wgs84SR);
    }
    const url = getGoogleStreetViewUrl(geometry as Point);
    window.open(url, "_blank");

    return false;
  };

  actionList.appendChild(docFrag);
  return link;
}

/**
 * Makes an InfoWindow draggable.
 * @param {esri/InfoWindow} infoWindow - an info window.
 */
export function makeDraggable(infoWindow: InfoWindow) {
  if (!infoWindow) {
    throw new TypeError("No InfoWindow was provided.");
  }
  const handle = infoWindow.domNode.querySelector(".title");
  const dnd = new Moveable(infoWindow.domNode, {
    handle
  });

  const firstMoveFunc = () => {
    // hide pointer and outerpointer (used depending on where the pointer is shown)
    let arrowNode = infoWindow.domNode.querySelector(".outerPointer");
    arrowNode.classList.add("hidden");

    arrowNode = infoWindow.domNode.querySelector(".pointer");
    arrowNode.classList.add("hidden");
  };

  // when the infoWindow is moved, hide the arrow:
  // dnd.on("FirstMove", firstMoveFunc.bind(this));
  dnd.on("FirstMove", firstMoveFunc);
}

/**
 * Adds a link to an InfoWindow that, when clicked, will show all the current features' attributes in tables.
 * @param {InfoWindow} infoWindow - an info window
 * @param {string} [fallbackUrl] - Url on same domain to use for IE "Access is denied" workaround.
 * @returns {HTMLAnchorElement} - Returns the HTML anchor element.
 */
export function addPrintLink(
  infoWindow: Popup,
  fallbackUrl: string
): HTMLAnchorElement {
  const actionList = infoWindow.domNode.querySelector(".actionList");
  const link = document.createElement("a");
  const docFrag = document.createDocumentFragment();
  link.textContent = "Print";
  link.href = "#";
  link.title = "Opens identify results in a new window for printing.";
  link.classList.add("action", "print");
  // Add a space before adding link.
  docFrag.appendChild(document.createTextNode(" "));
  docFrag.appendChild(link);

  link.onclick = () => {
    const doc = document.implementation.createHTMLDocument("attributes");
    const frag = graphicsToTables(doc, infoWindow.features);

    if (!frag) {
      alert("Error creating table.");
      return false;
    }

    // Create a new HTML document and add the tables to it.
    doc.body.appendChild(frag);

    const style = doc.createElement("style");
    style.type = "text/css";
    style.textContent = printCss;
    doc.head!.appendChild(style);

    const htmlMarkup = "<!DOCTYPE html>" + doc.documentElement!.outerHTML;

    const newWindow = window.open(fallbackUrl, "geoportal_attribute_table")!;
    newWindow.document.write(htmlMarkup);
    newWindow.focus();

    return false;
  };

  actionList.appendChild(docFrag);
  return link;
}
