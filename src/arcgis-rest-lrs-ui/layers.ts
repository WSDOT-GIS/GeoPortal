import Color = require("esri/Color");
import PopupTemplate = require("esri/dijit/PopupTemplate");
import FeatureLayer = require("esri/layers/FeatureLayer");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");

const pointSymbol = new SimpleMarkerSymbol();
pointSymbol.setColor(new Color("red"));
const pointRenderer = new SimpleRenderer(pointSymbol);

export interface IField {
  name: string;
  type: string;
  alias?: string;
}

type dateFormat =
  /** 12/21/1997 */
  | "shortDate"
  /** 21/12/1997 */
  | "shortDateLE"
  /** December 21,1997 */
  | "longMonthDayYear"
  /** 21 Dec 1997 */
  | "dayShortMonthYear"
  /** Sunday, December 21, 1997 */
  | "longDate"
  /** 12/21/1997 6:00:00 PM */
  | "shortDateLongTime"
  /** 21/12/1997 6:00:00 PM */
  | "shortDateLELongTime"
  /** 12/21/1997 6:00 PM */
  | "shortDateShortTime"
  /** 21/12/1997 6:00 PM */
  | "shortDateLEShortTime"
  /** 12/21/1997 18:00 */
  | "shortDateShortTime24"
  /** 21/12/1997 18:00 */
  | "shortDateLEShortTime24"
  /** 12/21/1997 18:00 */
  | "shortDateShortTime24"
  /** 21/12/1997 18:00 */
  | "shortDateLEShortTime24"
  /** December 1997 */
  | "longMonthYear"
  /** Dec 1997 */
  | "shortMonthYear"
  /** 1997 */
  | "year";

export interface IFieldFormat {
  places?: number;
  digitSeparator?: boolean;
  dateFormat?: dateFormat;
}

export interface IFieldInfo {
  fieldName: string;
  label?: string;
  format?: IFieldFormat;
  visible?: boolean;
  tooltip?: string;
  stringFieldOption?: "richtext" | "textarea" | "textbox";
}

export interface IMediaInfo {
  title: string;
  caption: string;
  type: "image" | "piechart" | "barchart" | "columnchart" | "linechart";
  refreshInterval?: number;
  value:
    | {
        sourceUrl: string;
        linkUrl: string;
      }
    | {
        fields: string[];
        normalizedField: string;
      };
  theme?: string;
}

export interface IExpressionInfo {
  expression: string;
  name: string;
  returnType?: "string" | "number";
  title?: string;
}

const countyExpression: IExpressionInfo = {
  expression: `// Extract county identifier and convert to number.
  var cid = Number(Mid($feature.RouteId, 2, 3))

  // Return the county name corresponding to the county id.
  Decode (
      cid,
      1, "Adams",
      3, "Asotin",
      5, "Benton",
      7, "Chelan",
      9, "Clallam",
      11, "Clark",
      13, "Columbia",
      15, "Cowlitz",
      17, "Douglas",
      19, "Ferry",
      21, "Franklin",
      23, "Garfield",
      25, "Grant",
      27, "Grays Harbor",
      29, "Island",
      31, "Jefferson",
      33, "King",
      35, "Kitsap",
      37, "Kittitas",
      39, "Klickitat",
      41, "Lewis",
      43, "Lincoln",
      45, "Mason",
      47, "Okanogan",
      49, "Pacific",
      51, "Pend Oreille",
      53, "Pierce",
      55, "San Juan",
      57, "Skagit",
      59, "Skamania",
      61, "Snohomish",
      63, "Spokane",
      65, "Stevens",
      67, "Thurston",
      69, "Wahkiakum",
      71, "Walla Walla",
      73, "Whatcom",
      75, "Whitman",
      77, "Yakima",
      "Invalid"
  )`,
  name: "county",
  returnType: "string",
  title: "County"
};

const countyRdNoExpression: IExpressionInfo = {
  name: "roadNumber",
  expression: "Mid($feature.RouteId, 5, 5)",
  title: "County Road Number",
  returnType: "string"
};

const pointLayerFields = new Array<IField>(
  {
    name: "routeId",
    type: "esriFieldTypeString",
    alias: "Route ID"
  },
  {
    name: "status",
    type: "esriFieldTypeString",
    alias: "Locating Status"
  },
  {
    name: "measure",
    type: "esriFieldTypeDouble",
    alias: "Measure"
  }
);

function fieldToFieldInfo(field: IField): IFieldInfo {
  const output: IFieldInfo = {
    fieldName: field.name,
    label: field.alias || field.name,
    visible: field.name !== "routeId"
  };
  if (/Double$/i.test(field.type)) {
    output.format = { places: 3 };
  }
  return output;
}

function expressionToFieldInfo(expressionInfo: IExpressionInfo): IFieldInfo {
  const output: IFieldInfo = {
    fieldName: `expression/${expressionInfo.name}`,
    label: expressionInfo.title || expressionInfo.name,
    visible: true
  };
  return output;
}

// Create the line layer fields
// 1. Copy the point layer fields.
// 2. Rename measure to fromMeasure.
// 3. Add endMeasure field.
const lineLayerFields = pointLayerFields
  .map(f => {
    let { name, alias } = f;
    const { type } = f;
    if (name === "measure") {
      name = "fromMeasure";
      alias = "From Measure";
      return { name, type, alias };
    }
    return f;
  })
  .concat([
    {
      name: "toMeasure",
      type: "esriFieldTypeDouble",
      alias: "To Measure"
    }
  ]);

const pointLayerDefinition = {
  geometryType: "esriGeometryPoint",
  fields: pointLayerFields
};

const lineLayerDefinition = {
  geometry: "esriGeometryLine",
  fields: lineLayerFields
};

const expressionInfos = [countyExpression, countyRdNoExpression];
const expressionFieldInfos = expressionInfos.map(expressionToFieldInfo);

const pointsPopupTemplate = new PopupTemplate({
  title: "Located CRAB Point",
  fieldInfos: expressionFieldInfos.concat(
    pointLayerFields.map(fieldToFieldInfo)
  ),
  expressionInfos
});

const linePopupTempate = new PopupTemplate({
  title: "Located CRAB Line Segment",
  fieldInfos: expressionFieldInfos.concat(
    lineLayerFields.map(fieldToFieldInfo)
  ),
  expressionInfos
});

// Create the layer for located points and add to map.
const crabPointsLayer = new FeatureLayer(
  {
    layerDefinition: pointLayerDefinition,
    featureSet: null
  },
  {
    id: "CRAB Points"
  }
);
crabPointsLayer.setInfoTemplate(pointsPopupTemplate);
crabPointsLayer.setRenderer(pointRenderer);

const crabLinesLayer = new FeatureLayer(
  {
    layerDefinition: lineLayerDefinition,
    featureSet: null
  },
  {
    id: "CRAB Lines"
  }
);
crabLinesLayer.setInfoTemplate(linePopupTempate);
const lineSymbol = new SimpleLineSymbol(
  SimpleLineSymbol.STYLE_SOLID,
  new Color("red"),
  3
);
const lineRenderer = new SimpleRenderer(lineSymbol);
crabLinesLayer.setRenderer(lineRenderer);

export { crabPointsLayer, crabLinesLayer };
