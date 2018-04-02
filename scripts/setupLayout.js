/*global define, wsdot*/
define([
  "dojo/on",
  "dijit/registry",
  "dijit/layout/TabContainer",
  "dijit/layout/ContentPane",
  "dijit/layout/AccordionContainer",
  "dijit/layout/BorderContainer",
  "dijit/form/Button",

  "dojox/layout/ExpandoPane",

  "esri/dijit/Legend",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/layers/GraphicsLayer",

  "AirspaceCalculator/ArcGisUI",
  "RouteLocator/elc-ui/ArcGisElcUI",
  "BufferUI",
  "BufferUI/BufferUIHelper",
  "ArcGisPrintUI",

  "geoportal/extentSelect",
  "arcgis-rest-lrs-ui",
  "scripts/customLegend.js",
  "scripts/ais/faaFar77.js"
], function(
  on,
  registry,
  TabContainer,
  ContentPane,
  AccordionContainer,
  BorderContainer,
  Button,
  ExpandoPane,
  Legend,
  QueryTask,
  Query,
  GraphicsLayer,
  AirspaceCalculatorArcGisUI,
  ArcGisElcUI,
  BufferUI,
  BufferUIHelper,
  ArcGisPrintUI,
  createExtentSelect,
  arcgisRestLrsUI
) {
  function getLayerInfos() {
    var layerIds, layerInfos;
    // Filter out basemap layers
    layerIds = $.grep(wsdot.map.layerIds, isBasemap, true);

    // Add the graphics layers to the array of layer IDs.
    $.merge(layerIds, wsdot.map.graphicsLayerIds);

    // Create layer info objects from the layer IDs, to be used with the Legend constructor.
    layerInfos = $.map(layerIds, function(layerId) {
      var layer = wsdot.map.getLayer(layerId);
      return { layer: layer, title: layerId };
    });

    return layerInfos;
  }

  function isBasemap(layerId) {
    /// <summary>Examines a layer ID and determines if it is a basemap.</summary>
    var basemapLayerIdRe = /layer(?:(?:\d+)|(?:_osm)|(?:_bing))/i;
    return layerId.match(basemapLayerIdRe);
  }

  /**
   * Refreshes the legend using the layers currently in the map that are not basemap layers.
   * @param {Object} layerInfo - Layer info
   * @param {Layer} layerInfo.layer - layer
   * @param {Map} layerInfo.target - target
   */
  function refreshLegend(/*layerInfo*/) {
    var layerInfos, legend;
    legend = registry.byId("legend");
    layerInfos = getLayerInfos();
    legend.refresh(layerInfos);
  }

  /**
   * Creates the legend control.
   */
  function setupDefaultLegend() {
    var legend, layerInfos;

    layerInfos = getLayerInfos();

    legend = registry.byId("legend");

    // Create the legend dijit if it does not already exist.
    if (!legend) {
      legend = new Legend(
        {
          map: wsdot.map,
          layerInfos: layerInfos
        },
        "legend"
      );
      legend.startup();
    }

    // Set the legend to refresh when a new layer is added to the map.
    wsdot.map.on("layer-add-result", refreshLegend);
  }

  function setupLegend() {
    if (typeof wsdot.config.customLegend === "object") {
      var basemapGallery = registry.byId("basemapGallery");
      if (basemapGallery) {
        wsdot.config.customLegend.basemapGallery = basemapGallery;
      }
      $("#legend").customLegend(wsdot.config.customLegend);
    } else {
      setupDefaultLegend();
    }
  }
  function setupLayout() {
    var mainContainer,
      mapControlsPane,
      tabs,
      toolsTab,
      toolsAccordion,
      zoomControlsDiv;

    mainContainer = new BorderContainer(
      { design: "headline", gutters: false },
      "mainContainer"
    );
    mainContainer.addChild(new ContentPane({ region: "top" }, "headerPane"));
    mainContainer.addChild(
      new ContentPane({ region: "center" }, "mapContentPane")
    );

    mapControlsPane = new ExpandoPane(
      {
        region: "leading",
        splitter: true,
        title: "Map Controls"
      },
      "mapControlsPane"
    );
    tabs = new TabContainer(wsdot.config.tabContainerOptions || null, "tabs");

    function setupAirspaceCalculator() {
      wsdot.airspaceCalculator = new AirspaceCalculatorArcGisUI.default(
        "//data.wsdot.wa.gov/arcgis/rest/services/AirportMapApplication/AirspaceCalculatorSurface/ImageServer"
      );
      document
        .getElementById("airspaceCalculator")
        .appendChild(wsdot.airspaceCalculator.form);
    }

    function setupFaaFar77() {
      $("#faaFar77").faaFar77RunwaySelector({
        map: wsdot.map,
        // TODO: put this URL and layer ID in the app. options.
        identifyUrl:
          "//data.wsdot.wa.gov/ArcGIS/rest/services/AirportMapApplication/AirspaceFeatures/MapServer",
        identifyLayerId: 0,
        identifyComplete: function(event, data) {
          var identifyResults, noFeaturesDialog;
          identifyResults = data.identifyResults;
          if (identifyResults.length < 1) {
            noFeaturesDialog = $("#faaFar77NoRunwaysDialog");
            if (noFeaturesDialog.length < 1) {
              $("<div>")
                .text("No runway features were found in this vicinity.")
                .dialog({
                  title: "FAA FAR 77",
                  buttons: {
                    OK: function() {
                      $(this).dialog("close");
                    }
                  }
                });
            } else {
              noFeaturesDialog.dialog("open");
            }
          }
        },
        identifyError: function(event, data) {
          if (console !== undefined && console.error !== undefined) {
            console.error(data.error);
          }
        }
      });
    }

    (function(tabOrder) {
      var i, l, name, contentPane;

      /**
       * Gets the alternate title for this tab name from the config file.
       * If no alternative is available, the input string is returned.
       * @param {string} title - The tab title.
       * @returns {string} The alt title of the tab
       */
      function getTabTitle(title) {
        var output;
        if (
          wsdot.config &&
          wsdot.config.alternateTabTitles &&
          wsdot.config.alternateTabTitles.hasOwnProperty(title)
        ) {
          output = wsdot.config.alternateTabTitles[title];
        }
        return output || title;
      }

      function createAirspaceCalcDom() {
        var div = document.createElement("div");
        div.id = "airspaceCalculatorTab";
        div.innerHTML =
          "<section><h1>Airspace Calculator</h1><div id='airspaceCalculator'></div></section>";
        document.getElementById("tabs").appendChild(div);
      }

      function createFaaFar77Tab() {
        var tabDiv = document.createElement("div");
        tabDiv.id = "faaFar77Tab";
        var innerDiv = document.createElement("div");
        tabDiv.appendChild(innerDiv);
        document.getElementById("tabs").appendChild(tabDiv);
      }

      for (i = 0, l = tabOrder.length; i < l; i += 1) {
        name = tabOrder[i];
        if (/Layers/i.test(name)) {
          tabs.addChild(
            new ContentPane(
              { title: getTabTitle("Layers"), id: "layersTab" },
              "layersTab"
            )
          );
        } else if (/Legend/i.test(name)) {
          tabs.addChild(
            new ContentPane(
              { title: getTabTitle("Legend"), id: "legendTab" },
              "legendTab"
            )
          );
        } else if (/Basemap/i.test(name)) {
          tabs.addChild(
            new ContentPane(
              { title: getTabTitle("Basemap"), id: "basemapTab" },
              "basemapTab"
            )
          );
        } else if (/Tools/i.test(name)) {
          toolsTab = new ContentPane(
            { title: getTabTitle("Tools") },
            "toolsTab"
          );
          tabs.addChild(toolsTab);
        } else if (/Airspace\s*Calculator/i.test(name)) {
          // Add elements that will become the tab to the dom.
          createAirspaceCalcDom();
          contentPane = new ContentPane(
            {
              title: "Airspc. Calc.",
              tooltip: "Airspace Calculator (Prototype)",
              id: "airspaceCalculatorTab"
            },
            "airspaceCalculatorTab"
          );
          tabs.addChild(contentPane);
          setupAirspaceCalculator();
        } else if (/FAA\s*FAR\s*77/i.test(name)) {
          createFaaFar77Tab();
          contentPane = new ContentPane(
            {
              title: "FAA FAR 77",
              id: "faaFar77Tab"
            },
            "faaFar77Tab"
          );
          on.once(contentPane, "show", setupFaaFar77);
          tabs.addChild(contentPane);
        }
      }
    })(wsdot.config.tabOrder || ["Layers", "Legend", "Basemap", "Tools"]);

    toolsAccordion = new AccordionContainer(null, "toolsAccordion");

    function setupLrsControls() {
      // LRS Tools
      var div = document.createElement("div");
      div.id = "lrsTools";
      document.getElementById("toolsAccordion").appendChild(div);
      toolsAccordion.addChild(
        new ContentPane({ title: "State Route Milepost", id: "lrsTools" }, div)
      );
      on.once(registry.byId("lrsTools"), "show", function() {
        var elcUI = new ArcGisElcUI(div);
        elcUI.setMap(wsdot.map);

        elcUI.on("elc-results-not-found", function() {
          alert("No results found");
        });

        elcUI.on("non-geometry-results-returned", function(e) {
          console.log("non geometry results found", e);
          var elcResult = e.elcResults[0];
          var output = [];
          var properties = [
            "LocatingError",
            "ArmCalcReturnMessage",
            "ArmCalcEndReturnMessage"
          ];
          properties.forEach(function(name) {
            if (elcResult[name]) {
              output.push([name, elcResult[name]].join(": "));
            }
          });
          output = output.join("\n");
          alert(output);
        });

        elcUI.on("elc-results-found", function(e) {
          var point;
          if (e && e.graphics && e.graphics.length > 0) {
            point = e.graphics[0].geometry;
            if (point.getPoint) {
              point = point.getPoint(0, 0);
            }
            wsdot.map.infoWindow.show(point);
            wsdot.map.centerAt(point);
            wsdot.map.infoWindow.setFeatures(e.graphics);
          }
        });
      });
    }

    function setupZoomControls() {
      //var button;
      // Zoom tools
      var zoomControlsPaneDiv = document.createElement("div");
      zoomControlsPaneDiv.id = "zoomControlsPane";
      document
        .getElementById("toolsAccordion")
        .appendChild(zoomControlsPaneDiv);

      toolsAccordion.addChild(
        new ContentPane({ title: "Zoom to" }, "zoomControlsPane")
      );
      on.once(registry.byId("zoomControlsPane"), "show", function() {
        var extentTable;
        zoomControlsDiv = $("<div>")
          .attr({ id: "zoomControls" })
          .appendTo("#zoomControlsPane");

        $("<div class='tool-header'>Zoom to Long./Lat.</div>").appendTo(
          zoomControlsDiv
        );
        $("<div id='zoomToXY'>")
          .appendTo(zoomControlsDiv)
          .zoomToXY({
            map: wsdot.map,
            xLabel: "Long.",
            yLabel: "Lat."
          });

        extentTable = $("<table>").appendTo(zoomControlsDiv);

        /**
         * Creates a query task and query using settings from config.json.
         * @param {string} qtName - The name of a query task from config.json.
         * @returns {Object.<string, (QueryTask|Query)>} returns an object with the properties "task" and "query".
         */
        function createQueryTask(qtName) {
          var queryTaskSetting, qt, query, n;
          queryTaskSetting = wsdot.config.queryTasks[qtName];
          qt = new QueryTask(queryTaskSetting.url);
          query = new Query();

          for (n in queryTaskSetting.query) {
            if (queryTaskSetting.query.hasOwnProperty(n)) {
              query[n] = queryTaskSetting.query[n];
            }
          }
          return { task: qt, query: query };
        }

        // Set up the zoom select boxes.
        // Setup the zoom controls.

        /**
         * Creates the HTML elments that will later be used to create Dojo dijits.
         */
        function createZoomControls() {
          var body, data;

          function createZoomControl(qtName, data) {
            var row, cell, selectName, labelName, queryTask, label;
            row = $("<tr>").appendTo(body);
            cell = $("<td>").appendTo(row);
            selectName = qtName + "ZoomSelect";
            labelName = qtName + "ZoomLabel";
            //$("<label>").attr({ id: labelName }).text(data.label).appendTo(cell);
            label = document.createElement(label);
            label.id = labelName;
            label.textContent = data.label;
            cell[0].appendChild(label);
            cell = $("<td>").appendTo(row);
            if (data.url) {
              $("<progress>")
                .attr({
                  id: selectName,
                  src: "images/ajax-loader.gif",
                  alt: "Loading..."
                })
                .appendTo(cell);
              queryTask = createQueryTask(qtName);
              queryTask.task.execute(queryTask.query, function(featureSet) {
                createExtentSelect(
                  selectName,
                  featureSet,
                  wsdot.map,
                  data.levelOrFactor
                );
              });
            } else if (data.extents) {
              createExtentSelect(
                $("<div>")
                  .attr("id", selectName)
                  .appendTo(cell)[0],
                data.extents,
                wsdot.map
              );
              label.htmlFor = selectName;
            }
          }

          body = $("<tbody>").appendTo(extentTable);

          (function() {
            var qtName;
            for (qtName in wsdot.config.queryTasks) {
              if (wsdot.config.queryTasks.hasOwnProperty(qtName)) {
                data = wsdot.config.queryTasks[qtName];
                createZoomControl(qtName, data);
              }
            }
          })();
        }

        createZoomControls();
      });
    }

    function setupBuffer() {
      function removeUnits() {
        // Remove unwanted units
        var select = wsdot.bufferUI.root.querySelector("select[name=unit]");
        var unitOptions = select.querySelectorAll("option");
        var keepUnitsRe = /^((Meter)|(SurveyMile)|(SurveyFoot))$/i;
        var option, i, l;
        for (i = 0, l = unitOptions.length; i < l; i += 1) {
          option = unitOptions[i];
          if (!keepUnitsRe.test(option.dataset.name)) {
            option.parentElement.removeChild(option);
          }
        }
      }

      var div = document.createElement("div");
      div.id = "bufferPane";
      // Do not create the BufferUI unless dataset is supported.
      if (div.dataset) {
        wsdot.bufferUI = new BufferUI(div);
        removeUnits();
      } else {
        div.textContent = "Buffer tool not available in this browser.";
      }
      document.getElementById("toolsAccordion").appendChild(div);
      toolsAccordion.addChild(
        new ContentPane({ title: "Buffer", id: "bufferPane" }, div)
      );
    }

    function setupDraw() {
      var div = document.createElement("div");
      div.id = "drawPane";
      contentPane = new ContentPane({ title: "Draw", id: "drawPane" }, div);
      document.getElementById("toolsAccordion").appendChild(div);
      var drawUI = document.createElement("div");
      toolsAccordion.addChild(contentPane);
      drawUI.id = "drawUI";
      div.appendChild(drawUI);
    }

    /**
     * Creates the print UI if the configuration contains a printUrl property.
     * @returns {ArcGisPrintUI} - Returns the print UI, or null if there is no printUrl property in the configuration.
     */
    function setupPrintUI() {
      var div, printForm, printPane;

      function setupPrintButton() {
        var toolbar = document.getElementById("toolbar");
        var button = document.createElement("button");
        button.id = "openPrintPanelButton";
        button.title = "Opens the print tool pane.";
        button.type = "button";
        button.textContent = "Print";
        toolbar.appendChild(button);

        button = new Button(
          {
            label: "Print",
            showLabel: false,
            iconClass: "dijitEditorIcon dijitEditorIconPrint",
            onClick: function() {
              tabs.selectChild(toolsTab);
              toolsAccordion.selectChild(printPane);
            }
          },
          button
        ).startup();
      }

      if (wsdot.config.printUrl) {
        // Create the DOM element that will become the accordion pane which will contain the print form.
        div = document.createElement("div");
        div.id = "printPane";
        document.getElementById("toolsAccordion").appendChild(div);
        // Create the print form and append the form to the div.
        printForm = new ArcGisPrintUI(wsdot.config.printUrl);
        div.appendChild(printForm.form);
        // Create the content pane to the tools accordion.
        printPane = new ContentPane({ title: "Print", id: "printPane" }, div);
        toolsAccordion.addChild(printPane);
        // Create a variable in the wsdot namespace so that it can be accessed when the map is loaded.
        wsdot.printForm = printForm;

        setupPrintButton();
      }
      return printForm || null;
    }

    // Look in the configuration to determine which tools to add and in which order.
    (function(tools) {
      // Setup a default value for tools if it hasn't been specified.
      if (!tools) {
        tools = ["lrs", "zoom", "search", "buffer", "draw"];
      }
      for (tool of tools) {
        if (/zoom/i.test(tool)) {
          setupZoomControls();
        } else if (/lrs/i.test(tool)) {
          setupLrsControls();
        } else if (/airspace\s?Calculator/i.test(tool)) {
          setupAirspaceCalculator();
        } else if (/buffer/i.test(tool)) {
          setupBuffer();
        } else if (/draw/i.test(tool)) {
          setupDraw();
        } else if (/crab/i.test(tool)) {
          arcgisRestLrsUI.setupCrab(toolsAccordion);
        }
      }
    })(wsdot.config.tools);

    setupPrintUI();

    mapControlsPane.addChild(tabs);
    mainContainer.addChild(mapControlsPane);

    mainContainer.startup();
  }
  return {
    setupLayout: setupLayout,
    setupLegend: setupLegend
  };
});
