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
  "setup",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/layers/GraphicsLayer",

  "AirspaceCalculator/ArcGisUI",
  "RouteLocator/elc-ui/ArcGisElcUI",
  "BufferUI",
  "BufferUI/BufferUIHelper",
  "ArcGisPrintUI",

  "arcgis-rest-lrs-ui",
  "scripts/customLegend.js"
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
  setup,
  QueryTask,
  Query,
  GraphicsLayer,
  AirspaceCalculatorArcGisUI,
  ArcGisElcUI,
  BufferUI,
  BufferUIHelper,
  ArcGisPrintUI,
  arcgisRestLrsUI
) {
  function getLayerInfos() {
    var layerIds, layerInfos;
    // Filter out basemap layers
    layerIds = wsdot.map.layerIds.filter(layerId => !isBasemap(layerId));

    // Add the graphics layers to the array of layer IDs.
    layerIds.concat(wsdot.map.graphicsLayerIds);

    // Create layer info objects from the layer IDs, to be used with the Legend constructor.
    layerInfos = layerIds.map(layerId => {
      const layer = wsdot.map.getLayer(layerId);
      return {layer: layer, title: layerId};
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
      toolsAccordion;

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
        var elcUI = new ArcGisElcUI(div, {
          url: wsdot.config.routeLocatorUrl
        });
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

    function setupFeatureSelects() {
      const container = document.createElement("div");
      container.id = "zoomToContainer"
      document.getElementById("toolsAccordion").appendChild(container);
      const contentPane = new ContentPane({title: "Zoom To", id: "zoomToContainer"}, container);
      toolsAccordion.addChild(contentPane);

      if (wsdot.map) {
        setup.setupFeatureSelects(wsdot.map, wsdot.config, container);
      } else {
        window.addEventListener("mapload", (evt) => {
          setup.setupFeatureSelects(evt.detail, wsdot.config, container);
        });
      }
    }

    // Look in the configuration to determine which tools to add and in which order.
    (function(tools) {
      // Setup a default value for tools if it hasn't been specified.
      if (!tools) {
        tools = ["lrs", "search", "buffer", "draw"];
      }
      for (tool of tools) {
        if (/lrs/i.test(tool)) {
          setupLrsControls();
        } else if (/search/i.test(tool)) {
          setupFeatureSelects();
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
