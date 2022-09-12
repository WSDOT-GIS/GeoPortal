/*global require */
/*jslint nomen: true, white: true, browser: true */

require([
  "dojo/promise/all",
  "dojo/Deferred",
  "dojo/_base/lang",
  "esri/request",
  "esri/InfoTemplate",
  "esri/map",
  "esri/layers/LayerInfo",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/FeatureLayer",
  "esri/tasks/IdentifyTask",
  "esri/tasks/IdentifyParameters",
  "esri/geometry/jsonUtils",
  "esri/geometry/geometryEngineAsync",
  "esri/geometry/webMercatorUtils",
  "geoportal/InfoTemplates/HabitatConnectivityInfoTemplate",
  "geoportal/InfoTemplates/CrabTemplate"
], function (
  all,
  Deferred,
  lang,
  esriRequest,
  InfoTemplate,
  Map,
  LayerInfo,
  ArcGISDynamicMapServiceLayer,
  ArcGISTiledMapServiceLayer,
  FeatureLayer,
  IdentifyTask,
  IdentifyParameters,
  jsonUtils,
  geometryEngineAsync,
  webMercatorUtils,
  HabitatConnectivityInfoTemplate,
  CrmpTemplate
) {
  "use strict";

  /**
   * @external Graphic
   * @see {@link https://developers.arcgis.com/javascript/jsapi/graphic-amd.html Graphic}
   */

  /**
   * @external IdentifyResult
   * @see {@link https://developers.arcgis.com/javascript/jsapi/identifyresult-amd.html IdentifyResult}
   */

  var detectHtmlPopups;

  /**
   * Determines if an array contains a given value.
   * @param {Array} array - An array.
   * @param {*} value - The value to search the array for.
   * @returns {Boolean} Returns true if the array contains the value, false otherwise.
   */
  function arrayContains(array, value) {
    if (!Array.isArray(array)) {
      throw new TypeError("The array parameter must be an Array.");
    }
    var output = false;
    for (var i = 0; i < array.length; i++) {
      if (array[i] === value) {
        output = true;
        break;
      }
    }
    return output;
  }

  /**
   * Gets the WDFW ID from a table.
   * @param {Node} node - An HTML Table node.
   * @returns {(string|null)} WDFW ID
   */
  function getWdfwId(node) {
    var headers,
      wdfwId = null,
      current,
      re = /^WDFW\s?ID$/i;
    if (node.querySelectorAll) {
      headers = node.querySelectorAll("tr>:first-child");
      for (var i = 0, l = headers.length; i < l; i += 1) {
        current = headers[i];
        if (current.textContent && re.test(current.textContent)) {
          wdfwId = current.parentNode.querySelector(":last-child").textContent;
          break;
        }
      }
    }
    return wdfwId;
  }

  /**
   * Gets the URL for a WDFW Image with the given ID.
   * @param {string} wdfwId - WDFW ID
   * @param {string} [imageViewerUrl] - Image viewer URL
   * @param {string} [type] - "photos" or "monitoringReports"
   * @returns {string} Image URL
   */
  function getWdfwImageUrl(wdfwId, imageViewerUrl, type = "photos") {
    var output = null;
    if (wdfwId) {
      if (!imageViewerUrl) {
        imageViewerUrl =
          `https://www.wsdot.wa.gov/Environmental/Biology/FishPassage/${type}`;
      }
      output = [imageViewerUrl, "?id=", wdfwId].join("");
    }
    return output;
  }

  /** For all <a> children of the input node where the href is the same as the text content,
   * the text content is replaced with the word "link".
   * @param {Node} node - An HTML element cointaining <a> elements.
   */
  function shortenAnchorText(node) {
    var anchors, a, i, l;
    if (node.querySelectorAll) {
      anchors = node.querySelectorAll("a");
      for (i = 0, l = anchors.length; i < l; i += 1) {
        a = anchors[i];
        if (a.href === a.textContent) {
          a.textContent = "link";
        }
      }
    }
  }

  /** Tests to see if an object has an htmlPopupType property that is either HTML Text or a URL.
   * @param {Object} layerInfo - A layer info object
   * @returns {Boolean} Returns true if the HTML popup type is HTML Text or URL, false otherwise.
   */
  function htmlPopupTypeIsHtmlTextOrUrl(layerInfo) {
    return (
      layerInfo.htmlPopupType !== undefined &&
      layerInfo.htmlPopupType !== null &&
      /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(
        layerInfo.htmlPopupType
      )
    );
  }

  /**
   * Gets the IDs of the layers that have HTML popups.
   * @param {(ArcGISDynamicMapServiceLayer|ArcGISTiledMapServiceLayer)} mapServiceLayer - a map service layer
   * @param {boolean} [returnUrls=undefined] - If truthy, an array of map service URLs will be returned. Otherwise, and array of ID integers will be returned.
   * @returns {(number[]|string[])} Returns either an array of ID numbers, or URLs, depending on the returnUrls parameter.
   */
  function getIdsOfLayersWithHtmlPopups(mapServiceLayer, returnUrls) {
    var ids = [],
      layerInfo,
      i,
      l,
      layerId;
    if (mapServiceLayer.layerInfos === undefined) {
      throw new Error(
        'Map service layer does not have a defined "layerInfos" property.'
      );
    }

    if (mapServiceLayer.visibleLayers !== undefined) {
      // Loop through all of the visibleLayers.  Each element is a layer ID integer.
      for (i = 0, l = mapServiceLayer.visibleLayers.length; i < l; i += 1) {
        // Get the current layer ID.
        layerId = mapServiceLayer.visibleLayers[i];
        if (layerId === -1) {
          break;
        }
        // Get the layerInfo corresponding to the current layer ID.
        layerInfo = mapServiceLayer.layerInfos[layerId];

        // Add to the output array the ID of any sublayer that has an html popup defined
        // (and in the case of layers with a visibleLayers property, the sublayer is currently visible).
        if (htmlPopupTypeIsHtmlTextOrUrl(layerInfo)) {
          //if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
          if (returnUrls) {
            ids.push(mapServiceLayer.url + "/" + String(layerId));
          } else {
            ids.push(layerId);
          }
        }
      }
    } else {
      for (i = 0, l = mapServiceLayer.layerInfos.length; i < l; i += 1) {
        layerInfo = mapServiceLayer.layerInfos[i];
        // Add to the output array the ID of any sublayer that has an html popup defined
        // (and in the case of layers with a visibleLayers property, the sublayer is currently visible).
        if (htmlPopupTypeIsHtmlTextOrUrl(layerInfo)) {
          //if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
          if (
            layerInfo.visibleLayers === undefined ||
            layerInfo.visibleLayers.indexOf(layerInfo.id) >= 0
          ) {
            if (returnUrls) {
              ids.push(mapServiceLayer.url + "/" + String(layerInfo.id));
            } else {
              ids.push(layerInfo.id);
            }
          }
        }
      }
    }

    return ids;
  }
  lang.extend(LayerInfo, {
    htmlPopupType: null
  });

  /**
   * @typedef {Object} HtmlPopupDetectResponse
   * @property {Layer} mapService - map service
   * @property {LayerInfo} layerInfo - info about the map service sublayer.
   * @property {string} layerUrl - layer's URL.
   * @property {Object} layerResponse - Response for the layer HTTP query, which contains the HTML popup type.
   */

  /**
   * Query the map service to see if any of the layers have HTML popups and store this data in the LayerInfos.
   * This will add an "htmlPopupType" property to each LayerInfo object in the map service's layerInfos property.
   * @param {Function} [htmlPopupLayerFoundAction] - Optional.  A function that will be called whenever an HTML popup is found.
   * @returns {dojo/Deferred.<HtmlPopupDetectResponse[]>} - Deferred object with {@link HtmlPopupDetectResponse} objects.
   */
  detectHtmlPopups = function (htmlPopupLayerFoundAction) {
    let layerInfo,
      layerUrl,
      i,
      l,
      deferred,
      completedRequestCount = 0,
      responses = [];

    deferred = new Deferred();

    // Query the map service to get the list of layers.

    const handleHtmlPopupResponse = function(layerResponse) {
      completedRequestCount += 1;
      const layerInfo = this.layerInfos[layerResponse.id];
      // If the map supports HTML popups, add the layer to the list.  (Do not add any annotation layers, though.)
      if (
        layerResponse.htmlPopupType !== undefined &&
        /As(?:(?:HTMLText)|(?:URL))$/i.test(layerResponse.htmlPopupType) &&
        layerResponse.type !== undefined &&
        !/Annotation/gi.test(layerResponse.type)
      ) {
        // Add this URL to the list of URLs that supports HTML popups.
        layerInfo.htmlPopupType = layerResponse.htmlPopupType;
        const progressObject = {
          mapService: this,
          layerInfo,
          layerUrl,
          layerResponse
        };
        responses.push(progressObject);
        // Update deferred progress
        deferred.progress({
          current: completedRequestCount,
          total: l,
          data: progressObject
        });
        if (typeof htmlPopupLayerFoundAction === "function") {
          htmlPopupLayerFoundAction(
            this,
            layerInfo,
            layerUrl,
            layerResponse
          );
        }
      } else {
        // Update deferred progress
        deferred.progress({
          current: completedRequestCount,
          total: l
        });
      }
      if (completedRequestCount >= l) {
        deferred.resolve(responses);
      }
    }

    for (i = 0, l = this.layerInfos.length; i < l; i += 1) {
      layerInfo = this.layerInfos[i];
      layerUrl = [this.url, String(layerInfo.id)].join("/");

      // Query the layers to see if they support html Popups
      esriRequest({
        url: layerUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      }).then(handleHtmlPopupResponse);
    }

    return deferred;
  };

  // Extend each of the types in the array with the same properties and methods.
  [ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer].forEach(function (
    ctor
  ) {
    lang.extend(ctor, {
      detectHtmlPopups: detectHtmlPopups,
      getIdsOfLayersWithHtmlPopups: function () {
        return getIdsOfLayersWithHtmlPopups(this);
      },
      getUrlsOfLayersWithHtmlPopups: function () {
        return getIdsOfLayersWithHtmlPopups(this, true);
      }
    });
  });

  lang.extend(Map, {
    _ignoredLayerRE: null,
    /**
     * @property {boolean} Determines if detectHtmlPopups has been run.
     */
    detectHtmlPopupsHasRun: false,
    /**
     * Queries all of the map service layers in a map determines which of the layers' sublayers have an HTML Popup defined.
     * @param {Function} [htmlPopupLayerFoundAction] - Function that will be called for each layer once it has been determined if it supports HTML popups.
     * @returns {dojo/Deferred} - Indicates progress of operation with currently completed count and total count.
     */
    detectHtmlPopups: function (htmlPopupLayerFoundAction) {
      var deferred = new Deferred();

      var layerIdCount = this.layerIds.length;
      var completedCount = 0;

      function onComplete() {
        completedCount += 1;
        if (completedCount >= layerIdCount) {
          deferred.resolve("completed");
        } else {
          deferred.progress({ current: completedCount, total: layerIdCount });
        }
      }

      // Loop through each of the map service layers.
      this.layerIds.forEach(function (id) {
        var mapService;

        // Skip layers with an ID that matches the ignore regex.
        if (this._ignoredLayerRE.test(id)) {
          return;
        }

        mapService = this.getLayer(id);

        if (mapService.loaded) {
          if (typeof mapService.detectHtmlPopups === "function") {
            mapService
              .detectHtmlPopups(htmlPopupLayerFoundAction)
              .then(onComplete);
          }
        } else {
          mapService.on("load", function (/*layer*/) {
            if (typeof mapService.detectHtmlPopups === "function") {
              mapService
                .detectHtmlPopups(htmlPopupLayerFoundAction)
                .then(onComplete);
            }
          });
        }
      });

      this.detectHtmlPopupsHasRun = true;

      return deferred;
    },
    /**
     * Runs an identify task for each map service that has HTML Popup sublayers.
     * @param {esri.geometry.Geometry} geometry
     * @param {Object} options - Use this parameter to override the default identify task options: layerOption, tolerance, and maxAllowableOffset.
     * @returns {dojo/promise/Promise}
     */
    identify: function (geometry, options) {
      // Detect which layers have HTML popups.
      if (!this.detectHtmlPopupsHasRun) {
        this.detectHtmlPopups();
      }

      if (!options) {
        options = {};
      }

      if (!geometry) {
        throw new Error("Geometry not specified.");
      }

      var deferreds = {};

      // Loop through all of the this services.
      this.layerIds.forEach(function (layerId) {
        var layer, sublayerIds, idTask, idParams, deferred;

        // Skip any layers that match the ignored layers regular expression (if one has been specified).
        if (this._ignoredLayerRE && this._ignoredLayerRE.test(layerId)) {
          return;
        }
        layer = this.getLayer(layerId);
        if (layer.visible) {
          if (typeof layer.getIdsOfLayersWithHtmlPopups === "function") {
            //sublayerIds = layer.getIdsOfLayersWithHtmlPopups();
            sublayerIds = [];
            layer.layerInfos.forEach(function (layerInfo) {
              if (
                !(layerInfo.sublayerIds && layerInfo.sublayerIds.length > 0) &&
                arrayContains(layer.visibleLayers, layerInfo.id)
              ) {
                sublayerIds.push(layerInfo.id);
              }
            });
            // If there are sublayers defined, run an identify task.
            if (sublayerIds && sublayerIds.length > 0) {
              idTask = new IdentifyTask(layer.url);
              idParams = new IdentifyParameters();
              idParams.geometry = geometry;
              idParams.layerIds = sublayerIds;
              idParams.mapExtent = this.extent;
              idParams.width = this.width;
              idParams.height = this.height;
              // The following settings are configurable via the 'options' parameter.
              idParams.returnGeometry = options.returnGeometry || true;
              idParams.layerOption =
                options.layerOption || IdentifyParameters.LAYER_OPTION_ALL;
              idParams.tolerance = options.tolerance || 5;
              idParams.maxAllowableOffset = options.maxAllowableOffset || 5;

              // Execute the identify task
              deferred = idTask.execute(idParams);

              deferreds[layerId] = deferred;
            }
          }
        }
      });

      // Tests a graphic to see if it is <= 50 ft from where the user clicked.
      // Results of the async distance test are added to the graphicsTestResults
      // array.
      const testGraphic = function(graphic) {
        var g = graphic.geometry;
        g = webMercatorUtils.project(g, this);
        var promise = new Deferred();
        geometryEngineAsync.distance(geometry, g, "feet").then(
          function (distance) {
            if (distance <= 50) {
              promise.resolve({
                distance: distance,
                graphic: graphic
              });
            } else {
              promise.resolve(null);
            }
          },
          function (err) {
            // console.error("distance error", err);
          }
        );
        graphicsTestResults.push(promise);
      }

      // Loop through all graphics layers' graphics to see if the clicked point
      // intersects.
      const graphicsTestResults = [];

      this.graphicsLayerIds.forEach(function (layerId) {
        var layer;

        layer = this.getLayer(layerId);

        layer.graphics.forEach(testGraphic);
      });

      if (graphicsTestResults && graphicsTestResults.length) {
        deferreds.from_graphics_layers = new Deferred();
        all(graphicsTestResults).then(function (results) {
          var features = [];
          // Loop through all of the test results.
          // If the test was false, the result will be null.
          // Otherwise the result will be a graphic.
          // Push the non-null graphics to the features array.

          // Sort the results by distance.
          results.sort(function (a, b) {
            if (!a && !b) {
              return 0;
            } else if (!a) {
              return 1;
            } else if (!b) {
              return -1;
            } else if (a.distance === b.distance) {
              return 0;
            } else if (a.distance > b.distance) {
              return -1;
            } else {
              return 1;
            }
          });

          results.forEach(function (result) {
            if (result) {
              features.push(result.graphic);
            }
          });
          // Resolve the deferred with the matching features.
          deferreds.from_graphics_layers.resolve({
            features: features
          });
        });
      }

      return all(deferreds);
    },

    popupsEnabled: null,
    enablePopups: function () {
      this.popupsEnabled = true;
    },
    disablePopups: function () {
      this.popupsEnabled = false;
    },
    /**
     * @param {Object} options - Defines options for setting up identify popups.
     * @param {RegExp} options.ignoredLayerRE - A regular expression.  Any layer with an ID that matches this expression will be ignored by the identify tool.
     */
    setupIdentifyPopups: function (options) {
      this.popupsEnabled = true;

      if (options.ignoredLayerRE) {
        this._ignoredLayerRE = options.ignoredLayerRE;
      }

      // Load the HTML Popup data from each of the layers.
      this.detectHtmlPopups();

      // Set up an event handler that will update the HTML popup data when a new layer is added.
      this.on("layer-add-result", function (event) {
        // If there was an error loading the layer, there is nothing to do here.
        if (event.error) {
          return;
        }

        if (this._ignoredLayerRE.test(event.layer.id)) {
          return;
        }

        if (
          event.layer &&
          event.layer.isInstanceOf !== undefined &&
          (event.layer.isInstanceOf(ArcGISDynamicMapServiceLayer) ||
            event.layer.isInstanceOf(ArcGISTiledMapServiceLayer))
        ) {
          event.layer.detectHtmlPopups();
        }
      });

      this.on("click", function (event) {
        /**
         * Gets the name of the object ID field from a feature.
         * @param {esri/Graphic} feature - a graphic
         * @returns {string} The name of the object ID field.
         */
        function getOid(feature) {
          let output = null;
          const re = /O(BJECT)ID/i; // cspell:disable-line
          if (feature && feature.attributes) {
            if (feature.attributes.OBJECTID) {
              output = feature.attributes.OBJECTID;
            } else {
              for (var propName in feature.attributes) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    feature.attributes, propName) &&
                  re.test(propName)
                ) {
                  output = feature.attributes[propName];
                  break;
                }
              }
            }
          }

          return output;
        }

        // If popups are disabled, exit instead of showing the popup.
        if (!this.popupsEnabled) {
          return;
        }

        /**
         * Create a table to display attributes if no HTML popup is defined.
         * @param {esri/Graphic} feature - a graphic
         * @param {esri/tasks/IdentifyResult} result - an identify result
         * @returns {HTMLTableElement} An HTML table of results.
         */
        function createDefaultTable(feature, result) {
          var table,
            name,
            value,
            ignoredAttributes = /^(?:(?:SHAPE(\.STLength\(\))?)|(?:O(?:BJECT)?ID))$/i, // cspell:disable-line
            title,
            caption,
            tr;

          table = document.createElement("table");
          table.setAttribute("class", "default-html-popup");

          // Add a caption if the result has a display field name.
          title = result.displayFieldName
            ? feature.attributes[result.displayFieldName]
            : null;
          if (title) {
            caption = document.createElement("caption");
            caption.innerText = title;
            table.appendChild(caption);
          }

          for (name in feature.attributes) {
            if (
              !ignoredAttributes.test(name) &&
              Object.prototype.hasOwnProperty.call(feature.attributes, name)
            ) {
              value = feature.attributes[name];
              tr = document.createElement("tr");
              tr.innerHTML = ["<th>", name, "</th><td>", value, "</td>"].join(
                ""
              );
              table.appendChild(tr);
            }
          }

          return table;
        }

        /**
         * Creates InfoWindow content.
         * @param {external:Graphic} feature - a graphic
         * @returns {(HTMLElement|string|function)} - the content for the info window
         */
        function loadContent(feature) {
          var div, layer, result, url, oid, sublayerInfo;
          div = null;

          /**
           * If a WA Dept. of Fish and Wildlife (WDFW) ID is detected in the feature attributes,
           * links for related *photos* and *monitoring reports* will be added to the popup content.
           */
          function addWdfwId() {
            var wdfwId = getWdfwId(div);
            if (wdfwId) {
              // Create list for list items that will contain links.
              const list = document.createElement("ul");
              list.classList.add("wdfw-link-list");
              // Only add "monitoring reports" link for Corrected Barriers Statewide layer.
              const layerNameRe = /\bCorrectedBarriersStatewide/i;
              console.debug("feature", feature)
              const linkTypes = ["photos"];
              if (feature && feature.layer && feature.layer.url && layerNameRe.test(feature.layer.url)) {
                linkTypes.push("monitoringReports");
              }

              for (let linkType of linkTypes) {
                const classPart = linkType === "monitoringReports" ? "monitoring-reports" : linkType;
                const wdfwLinkContainer = document.createElement("li");
                wdfwLinkContainer.setAttribute(
                  "class",
                  `wdfw-${classPart} wdfw-${classPart}-link-container`
                );
                const url = getWdfwImageUrl(wdfwId, undefined, linkType);
                const a = document.createElement("a");
                a.setAttribute("class", `wdfw-${classPart} wdfw-${classPart}-link`);
                a.href = url;
                a.target = "_blank";
                const linkText = linkType === "monitoringReports" ? "Monitoring Reports" : "Photos"
                a.appendChild(document.createTextNode(linkText));
                wdfwLinkContainer.appendChild(a);

                list.appendChild(wdfwLinkContainer);
              }

              div.insertBefore(list, div.firstChild);
            }
          }

          layer = feature.layer;
          result = feature.result;
          sublayerInfo = layer.layerInfos[result.layerId];
          console.debug("htmlPopupType", sublayerInfo.htmlPopupType);

          // Load the HTML popup content if it has not already been loaded.
          if (
            sublayerInfo.htmlPopupType &&
            !/None$/i.test(sublayerInfo.htmlPopupType)
          ) {
            //div === null) {

            div = document.createElement("div");

            oid = getOid(feature);

            // If there is an object ID field, load the HTML popup.
            // TODO: Get the layer's ObjectID field setting instead of using hard-coded "OBJECTID". Sometimes the ObjectID field has a different name.
            if (oid !== null) {
              // Get the this service url.
              url = layer.url;
              // Append the layer ID (except for feature layers, which have the layer id as part of the url).
              if (!layer.isInstanceOf(FeatureLayer)) {
                url += "/" + String(result.layerId);
              }
              // Complete the htmlPopup URL.
              url += "/" + oid + "/htmlPopup";

              // Request the HTML Popup
              esriRequest({
                url: url,
                content: { f: "json" },
                handleAs: "json",
                callbackParamName: "callback"
              }).then(
                function (data) {
                  var domParser, htmlPopup, docFrag, bodyChildren, node, table;
                  if (!data.content) {
                    table = createDefaultTable(feature, result);
                    table.classList.add("html-popup-was-blank");
                    if (table) {
                      div.appendChild(table);
                    }
                  } else if (/HTMLText$/i.test(data.htmlPopupType)) {
                    domParser = new DOMParser();
                    htmlPopup = domParser.parseFromString(
                      data.content,
                      "text/html"
                    );
                    docFrag = document.createDocumentFragment();
                    bodyChildren = htmlPopup.querySelectorAll(
                      "body > *:not(script)"
                    );

                    for (var i = 0, l = bodyChildren.length; i < l; i += 1) {
                      node = bodyChildren[i];
                      if (node) {
                        docFrag.appendChild(node);
                      }
                    }

                    shortenAnchorText(docFrag);

                    div.appendChild(docFrag);
                  } else if (/URL$/i.test(data.htmlPopupType)) {
                    node = document.createElement("a");
                    node.href = data.content;
                    node.target = "_blank";
                    div.appendChild(node);
                  }

                  addWdfwId(div);
                },
                function (error) {
                  var p;
                  p = document.createElement("p");
                  p.appendChild(document.createTextNode(error));
                  div.appendChild(p);
                }
              );
            } else {
              div.appendChild(createDefaultTable(feature, result));
            }
            //feature.content = div;
          } else {
            // No HTML popup or Popup type is None...
            div = document.createElement("div");
            div.appendChild(createDefaultTable(feature, result));
            addWdfwId(div);
          }

          return div;
        }

        this.infoWindow.clearFeatures();

        this
          .identify(event.mapPoint, {
            tolerance: 5
            /**
             *
             * @param {Object.<string, IdentifyResult[]>} idResults - The property names correspond to this layer IDs. Each of these properties is an array of identify results associated with that this layer.
             */
          })
          .then(
            function (idResults) {
              //console.debug(idResults);
              var results,
                features = [];
              var infoTemplate = new InfoTemplate({ content: loadContent });

              /**
               * Adds a feature the the array of features.
               * Intended for use with Array.prototype.forEach().
               * @param {Graphic} feature - a graphic
               */
              function pushFeature(feature) {
                features.push(feature);
              }

              /**
               * Gets a Graphic from an Identify result and adds it to the array of features.
               * Intended for use with Array.prototype.forEach().
               * @param {IdentifyResult} result - An identify result
               */
              function pushResult(result) {
                var feature = result.feature;
                feature.layer = this.getLayer(layerId);
                feature.result = result;
                if (
                  /Habitat_Connectivity/.test(layerId) && result.layerId !== 2
                ) {
                  feature.setInfoTemplate(HabitatConnectivityInfoTemplate);
                } else if (/CRAB_Routes/.test(layerId)) {
                  feature.setInfoTemplate(CrmpTemplate);
                } else {
                  feature.setInfoTemplate(infoTemplate);
                }
                features.push(feature);
              }

              for (var layerId in idResults) {
                if (Object.prototype.hasOwnProperty.call(idResults, layerId)) {
                  results = idResults[layerId];

                  if (results.features) {
                    // Feature class query result.
                    results.features.forEach(pushFeature);
                  } else {
                    // identify results.
                    results.forEach(pushResult);
                  }
                }
              }

              // Add the features to the InfoWindow.
              this.infoWindow.setFeatures(features);
              this.infoWindow.show(event.mapPoint, {
                closetFirst: true
              });
            },
            function (error) {
              console.error(error);
            }
          );
      });
    }
  });
});
