import Deferred = require("dojo/Deferred");
import InfoTemplate = require("esri/InfoTemplate");
import esriRequest = require("esri/request");

import Graphic = require("esri/graphic");

interface IGetAttributeDataResponse {
  attachmentsUrl: string;
  attachmentInfos: IAttachmentInfo[];
}

interface IErrorResponse {
  error: Error;
}

interface IAttachmentInfo {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

const galleryUrl =
  "http://wsdot-gis.github.io/arcgis-server-attachment-gallery/";

function createGalleryLink(featureUrl: string) {
  const a = document.createElement("a");
  const qs = [
    ["url", encodeURIComponent(featureUrl)].join("="),
    ["fields", encodeURIComponent(attributeOrder.join(","))].join("=")
  ].join("&");
  a.href = [galleryUrl, qs].join("?");
  a.textContent = "View attached images in carousel";
  a.target = "_blank";
  return a;
}

function getAttributeData(featureUrl: string) {
  const deferred = new Deferred();
  const attributesUrl = [featureUrl, "attachments"].join("/");
  esriRequest({
    url: attributesUrl,
    content: {
      f: "json"
    }
  }).then(
    (response: IGetAttributeDataResponse & IErrorResponse) => {
      if (response) {
        response.attachmentsUrl = attributesUrl;
        if (response.attachmentInfos) {
          deferred.resolve(response);
        } else if (response.error) {
          deferred.reject(response.error);
        }
      } else {
        deferred.reject(response);
      }
    },
    (error: Error) => {
      deferred.reject(error);
    }
  );
  return deferred;
}

function createImageLinkList(
  getAttributeDataResponse: IGetAttributeDataResponse
) {
  const attachmentsUrl = getAttributeDataResponse.attachmentsUrl;
  const attachmentInfos = getAttributeDataResponse.attachmentInfos;

  const ul = document.createElement("ul");
  const imageTypeRe = /^image\//i;
  ul.classList.add("attachment-link-list");
  for (let i = 0, l = attachmentInfos.length; i < l; i += 1) {
    const attInfo = attachmentInfos[i];
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = [attachmentsUrl, attInfo.id].join("/");
    a.target = "_blank";
    a.textContent = attInfo.name;
    if (a.dataset) {
      a.dataset.size = `${attInfo.size}` || "";
      a.dataset.contentType = attInfo.contentType;
    }

    if (imageTypeRe.test(attInfo.contentType)) {
      li.classList.add("image-link-item");
    }

    li.appendChild(a);
    ul.appendChild(li);
  }
  return ul;
}

const attributeOrder = [
  "Structure ID",
  "Location Name",
  "Fence ID",
  "Feature Name",
  "State Route ID",
  "Milepost",
  "Beginning Milepost",
  "Ending Milepost",
  "State Route Direction",
  "Fence Height",
  "Fence Material",
  "Post Material",
  "Structure Type",
  "Structure Subtype",
  "Structure Design Function",
  "I-4 Program",
  "Permeability Ranked",
  "Bridge Structure ID",
  "Bridge Number"
];

function createTable(graphic: any) {
  const displayFieldName = graphic.result.displayFieldName;
  const attr = graphic.attributes;
  const ignoreRe = /^((O(BJECT)?ID(_\d+)?)|(Shape(\.STLength\(\))))$/i;
  const table = document.createElement("table");

  const caption = document.createElement("caption");
  caption.textContent = attr[displayFieldName];

  table.appendChild(caption);
  table.classList.add("habitat-connectivity");

  const featureUrl = [
    graphic.layer.url,
    graphic.result.layerId,
    attr.OBJECTID
  ].join("/");

  let row = document.createElement("tr");
  table.appendChild(row);
  let cell = document.createElement("th");
  cell.colSpan = 2;

  const linkCell = cell;
  const linkProgress = document.createElement("progress");
  linkProgress.textContent = "Loading attachment data...";
  linkCell.appendChild(linkProgress);

  // Query the attributes endpoint to see if the feature has attachments.
  getAttributeData(featureUrl).then(
    (response: IGetAttributeDataResponse) => {
      linkCell.removeChild(linkProgress);
      if (
        response &&
        response.attachmentInfos &&
        response.attachmentInfos.length > 0
      ) {
        const link = createGalleryLink(featureUrl);
        link.classList.add("gallery-link");
        linkCell.appendChild(link);

        const list = createImageLinkList(response);
        linkCell.appendChild(list);
      } else {
        linkCell.textContent = "No attachments detected";
      }
    },
    (attributesError: Error) => {
      linkCell.removeChild(linkProgress);
      // tslint:disable-next-line:no-console
      console.error("attributes error", attributesError);
    }
  );

  row.appendChild(cell);

  for (let i = 0, l = attributeOrder.length; i < l; i++) {
    const name = attributeOrder[i];
    if (
      attr.hasOwnProperty(name) &&
      !ignoreRe.test(name) &&
      name !== displayFieldName
    ) {
      const value = attr[name];
      row = table.insertRow(-1);

      cell = document.createElement("th");
      cell.textContent = name;
      row.appendChild(cell);

      cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
      table.appendChild(row);
    }
  }

  return table;
}

function createContent(graphic: Graphic) {
  const table = createTable(graphic);
  return table;
}

export = new InfoTemplate({
  content: createContent
});
