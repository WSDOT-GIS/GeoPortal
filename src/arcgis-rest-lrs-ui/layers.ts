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

const pointLayerFields = new Array<IField>(
  ...[
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
      name: "county",
      type: "esriFieldTypeString",
      alias: "County"
    },
    {
      name: "direction",
      type: "esriFieldTypeString",
      alias: "Direction"
    },
    {
      name: "roadNumber",
      type: "esriFieldTypeInteger",
      alias: "Road Number"
    },
    {
      name: "measure",
      type: "esriFieldTypeDouble",
      alias: "Measure"
    }
  ]
);

function makeDescriptionTemplate(fields: IField[]) {
  const rows = fields
    .map(f => `<tr><th scope="row">${f.name}</th><td>{${f.name}}</td></tr>`)
    .join("");
  return `<table>${rows}</table>`;
}

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
      name: "endMeasure",
      type: "esriFieldTypeDouble",
      alias: "End Measure"
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

const pointsPopupTemplate = new PopupTemplate({
  title: "Located CRAB Point",
  description: makeDescriptionTemplate(pointLayerFields)
});

const linePopupTempate = new PopupTemplate({
  title: "Located CRAB Line Segment",
  description: makeDescriptionTemplate(lineLayerFields)
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

const crabLinesLayer = new FeatureLayer({
  layerDefinition: lineLayerDefinition,
  featureSet: null
});
crabLinesLayer.setInfoTemplate(linePopupTempate);
const lineSymbol = new SimpleLineSymbol(
  SimpleLineSymbol.STYLE_SOLID,
  new Color("red"),
  3
);
const lineRenderer = new SimpleRenderer(lineSymbol);
crabLinesLayer.setRenderer(lineRenderer);

export { crabPointsLayer, crabLinesLayer };
