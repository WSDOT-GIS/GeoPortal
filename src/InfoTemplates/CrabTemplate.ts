import Graphic from "esri/graphic";
import InfoTemplate from "esri/InfoTemplate";

// Create a mapping of county IDs to county names
const countyMap = new Map([
  [1, "Adams"],
  [3, "Asotin"],
  [5, "Benton"],
  [7, "Chelan"],
  [9, "Clallam"],
  [11, "Clark"],
  [13, "Columbia"],
  [15, "Cowlitz"],
  [17, "Douglas"],
  [19, "Ferry"],
  [21, "Franklin"],
  [23, "Garfield"],
  [25, "Grant"],
  [27, "Grays Harbor"],
  [29, "Island"],
  [31, "Jefferson"],
  [33, "King"],
  [35, "Kitsap"],
  [37, "Kittitas"],
  [39, "Klickitat"],
  [41, "Lewis"],
  [43, "Lincoln"],
  [45, "Mason"],
  [47, "Okanogan"],
  [49, "Pacific"],
  [51, "Pend Oreille"],
  [53, "Pierce"],
  [55, "San Juan"],
  [57, "Skagit"],
  [59, "Skamania"],
  [61, "Snohomish"],
  [63, "Spokane"],
  [65, "Stevens"],
  [67, "Thurston"],
  [69, "Wahkiakum"],
  [71, "Walla Walla"],
  [73, "Whatcom"],
  [75, "Whitman"],
  [77, "Yakima"]
]);

interface ICrabGraphic extends Graphic {
  attributes: {
    [key: string]: string | number | null;
    RouteId: string;
  };
}

/**
 * Parses a CRAB route feature's RouteId property into component county and roadNumber parts.
 * @param routeId CRAB route feature RouteId attribute
 */
function parseRouteId(routeId: string) {
  // routeId.slice(0,2) will give the state ID, but since its always
  // going to be WA (53), this part can be ignored.
  const countyId = parseInt(routeId.slice(2, 5), 0);
  const county = countyMap.get(countyId);
  const roadNumber = routeId.slice(5, -1);
  return { county, roadNumber };
}

/**
 * Creates the popup content using the attributes of a graphic.
 * @param graphic a CRAB route graphic
 */
function createContent(graphic: ICrabGraphic) {
  const routeId = graphic.attributes.RouteId;
  const { county, roadNumber } = parseRouteId(routeId);

  const values: any = {
    County: county,
    "County Road #": roadNumber
  };

  const table = document.createElement("table");
  for (const label in values) {
    if (values.hasOwnProperty(label)) {
      const value = values[label];
      const row = table.insertRow();
      const th = document.createElement("th");
      th.innerText = label;
      row.appendChild(th);
      row.insertCell().innerText = value;
    }
  }

  return table;
}

/**
 * Creates the title for a CRAB route feature's popup.
 */
function createTitle(graphic: ICrabGraphic) {
  const { county, roadNumber } = parseRouteId(graphic.attributes.RouteId);
  return `${county} #${roadNumber}`;
}

export = new InfoTemplate(createTitle, createContent);
