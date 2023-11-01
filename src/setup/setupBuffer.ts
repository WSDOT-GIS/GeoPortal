import type esriMap from "esri/map";
import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v3";
import ContentPane from "dijit/layout/ContentPane";

function removeUnits(bufferUI: BufferUI) {
  // Remove unwanted units
  const select = bufferUI.root.querySelector("select[name=unit]");
  if (!select) {
    console.error("Could not find 'unit' select.");
    return;
  }
  const keepUnitsRe = /^((Meter)|(SurveyMile)|(SurveyFoot))$/i;
  const unitOptions = [...select.querySelectorAll("option")].filter(
    (option) => option.dataset.name && keepUnitsRe.test(option.dataset.name)
  );
  unitOptions.forEach((option) => {
    option.remove();
  });
}

function setupBuffer(map: esriMap) {
  const div = document.createElement("div");
  div.id = "bufferPane";
  const bufferUI = new BufferUI(div);
  const bufferLayer = attachBufferUIToMap(map, bufferUI);

  removeUnits(bufferUI);
  const toolsAccordion = document.getElementById("toolsAccordion");
  if (toolsAccordion) {
    toolsAccordion.appendChild(div);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toolsAccordion as any).addChild(
      new ContentPane({ title: "Buffer", id: "bufferPane" }, div)
    );
  }
  return {bufferUI, bufferLayer};
}

export default setupBuffer;
