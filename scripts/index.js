/* eslint-env amd */
/* global gaTracker */

var wsdot;

(() => {

  if (window.localStorage.getItem("doNotShowDeprecationDialog") === "true") {
    return;
  }

  const dialog = document.getElementById("deprecationDialog");
  if (!dialog || !(dialog instanceof HTMLDialogElement)) {
    console.error("The dialog element could not be found.", dialog ?? "null");
    return;
  }

  dialog.addEventListener("close", () => {
    const doNotShowAgain = dialog.querySelector("#doNotShowAgain");
    if (doNotShowAgain.checked) {
      window.localStorage.setItem("doNotShowDeprecationDialog", "true");
    }
  });

  dialog.showModal();

})();

require([
  "dojo/ready",
  "dojo/on",
  "dijit/registry",
  "utils",
  "geoportal/setupToolbar",
  "geoportal/setupLayout",
  "esri/config",
  "esri/map",
  "esri/geometry/jsonUtils",
  "esri/geometry/Extent",
  "esri/tasks/GeometryService",
  "esri/toolbars/navigation",
  "esri/dijit/HomeButton",
  "dijit/form/Button",
  "esri/dijit/Scalebar",
  "esri/SpatialReference",
  "setup",

  "dijit/form/RadioButton",
  "dijit/form/Select",
  "dijit/form/FilteringSelect",
  "dojo/data/ItemFileReadStore",
  "dijit/form/NumberSpinner",
  "dijit/form/DateTextBox",
  "dojo/parser",
  "esri/dijit/Attribution",
  "esri/map",
  "esri/arcgis/utils",
  "esri/dijit/Scalebar",
  "esri/tasks/geometry",
  "esri/tasks/query",
  "esri/toolbars/navigation",
  "esri/toolbars/draw",
  "esri/tasks/gp",
  "esri/layers/FeatureLayer",
  "esri/IdentityManager",
  "esri/dijit/Popup",
  "extensions/esriApiExtensions",
  "extensions/htmlPopupExtensions",
  "MetadataClient/metadataExtensions",
  "extensions/graphicsLayer",
  "controls/layerSorter"
], function(
  ready,
  on,
  registry,
  utils,
  setupToolbar,
  setupLayout,
  esriConfig,
  Map,
  jsonUtils,
  Extent,
  GeometryService,
  Navigation,
  HomeButton,
  Button,
  Scalebar,
  SpatialReference,
  setup
) {
  "use strict";

  var extents = null,
    navToolbar,
    qsManager;
  wsdot = { config: {} };
  wsdot.map = null;

  // Sanitize URL of old style parameters
  (function() {
    if (!(window.URL && window.URLSearchParams && window.history)) {
      return;
    }
    const url = new URL(location.href);
    const sp = url.searchParams;
    ["layers", "center", "zoom"].forEach(function(s) {
      if (sp.has(s)) {
        sp.delete(s);
      }
    });
    history.replaceState(null, window.title, url.toString());
  })();

  // Setup other geoportals links
  (function(form) {
    var select = form.querySelector("select[name=config]");

    /**
     * When a "config" query string parameter has been specified,
     * set the default selected option to match.
     */
    function syncSelectedWithQSSetting() {
      const searchParams = new URLSearchParams(location.search);
      
      // Test for presence of "config" URL param.
      if (searchParams.has("config")) {
        // Get the current "config" param from URL
        let currentConfig = searchParams.get("config");

        // Get the option element with a value matching the
        // current config param.
        const configOption = select.querySelector(
          `option[value='${currentConfig}']`
        );

       if (configOption) {
          // If the option has a data-url attribute, redirect
          // to that URL.
          if (configOption.dataset.url) {
            window.stop();
            open(configOption.dataset.url, "_top");
          }
  
          // Get the currently selected option.
          const selectedOption = select.querySelector("option[selected]");
          // Remove the "selected" attribute.
          if (selectedOption) {
            selectedOption.removeAttribute("selected");
          }
          // Set the "selected" attribute for the option
          // matching the config specified in the URL
          // parameter.
          if (configOption) {
            configOption.setAttribute("selected", "selected");
          }
       }
      }
    }

    syncSelectedWithQSSetting();

    // If config/internal-rmec.json cannot be reached, remove internal options.
    var request = new XMLHttpRequest();
    request.open("head", "config/internal-rmec.json");
    request.onloadend = function(e) {
      var internalGroup;
      if (e.target.status !== 200) {
        internalGroup = select.querySelector("optgroup[label='internal']");
        select.removeChild(internalGroup);
      }
    };
    request.send();

    select.addEventListener("change", function (e) {
      let option = form.config.selectedOptions[0];
      if (option.dataset.url) {
        open(option.dataset.url, "_top");
        e.preventDefault();
      } else {
        form.submit();
      }
    });
  })(document.getElementById("otherGeoportalsForm"));

  function doPostConfig(config) {
    wsdot.config = config;
    var button;

    // Add a method to the Date object that will return a short date string.
    if (Date.toShortDateString === undefined) {
      /**
       * Returns a string representation of the date in the format Month-Date-Year.
       * @returns {string} Short date representation of the date.
       */
      Date.prototype.toShortDateString = function() {
        return (
          String(this.getMonth() + 1) +
          "-" +
          String(this.getDate()) +
          "-" +
          String(this.getFullYear())
        );
      };
    }

    document.getElementById("mainContainer").style.display = "";

    // If a title is specified in the config file, replace the page title.
    if (wsdot.config.pageTitle) {
      document.querySelector(".page-title").innerHTML = wsdot.config.pageTitle;
      document.title = wsdot.config.pageTitle;
    }

    function init() {
      var gaTrackEvent,
        initBasemap = null;

      if (
        wsdot.config.additionalStylesheets &&
        wsdot.config.additionalStylesheets.length > 0
      ) {
        wsdot.config.additionalStylesheets.forEach(function(path) {
          var link = document.createElement("link");
          link.href = path;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        });
      }

      // esriConfig.defaults.io.proxyUrl = "proxy.ashx";

      // Specify list of CORS enabled servers.
      (function(servers) {
        if (wsdot.config.corsEnabledServers) {
          servers = servers.concat(wsdot.config.corsEnabledServers);
        }
        for (var i = 0; i < servers.length; i++) {
          esriConfig.defaults.io.corsEnabledServers.push(servers[i]);
        }
      })(["www.wsdot.wa.gov", "data.wsdot.wa.gov"]);
      esriConfig.defaults.geometryService = new GeometryService(
        wsdot.config.geometryServer
      );

      /**
       * Adds a Google Analytics tracking event for the addition of a layer to the map.
       * @param {Event} e - layer add event.
       * @param {Layer} e.layer - layer that was added
       * @param {Layer} e.error - Error that occurred when trying to add layer.
       */
      gaTrackEvent = function(e) {
        var label,
          basemapIdRe = /^layer\d+$/i,
          layer,
          error,
          action;

        layer = e.layer;
        error = e.error;

        label = basemapIdRe.exec(layer.id)
          ? "Basemap: " + layer.url
          : layer.id + ": " + layer.url;
        action = error ? "Add - Fail" : "Add";

        gaTracker.send("event", "Layers", action, label);
      };

      /**
       * Updates the scale level.
       * @param {number} level - the new scale level.
       */
      function setScaleLabel(level) {
        // Set the scale.
        var scale = wsdot.map.getScale(level);
        var scaleNode = document.getElementById("scaleText");
        var nFormat =
          window.Intl && window.Intl.NumberFormat
            ? new window.Intl.NumberFormat()
            : null;
        var value = nFormat ? nFormat.format(scale) : scale;
        scaleNode.textContent = scale ? ["1", value].join(":") : "";
      }

      setupLayout.setupLayout();

      function setupExtents() {
        var extentSpatialReference = new SpatialReference({ wkid: 102100 });
        // Define zoom extents for menu.
        extents = {
          fullExtent: new Extent({
            xmin: -14058520.2360666,
            ymin: 5539437.0343901999,
            ymax: 6499798.1008670302,
            xmax: -12822768.6769759,
            spatialReference: extentSpatialReference
          })
        };
      }

      setupExtents();

      // Create the map, using options defined in the query string (if available).
      if (wsdot.config.mapOptions.extent) {
        // Convert the extent definition in the options into an Extent object.
        wsdot.config.mapOptions.extent = new jsonUtils.fromJson(
          wsdot.config.mapOptions.extent
        );
      }

      wsdot.map = new Map("map", wsdot.config.mapOptions);

      // Create the layer list once the map has loaded.
      wsdot.map.on("load", function () {
        const layerList = setup.setupLayerList(document.getElementById("layerList"), wsdot.map, wsdot.config.layers);
        layerList.startup();
        setup.createLayerLink(layerList);
      });


      // Add event to page that other scripts can listen for
      // so they can know when the map has loaded.
      wsdot.map.on("load", () => {
        const customEvent = new CustomEvent("mapload", {
          detail: wsdot.map
        });
        window.dispatchEvent(customEvent);
      });

      setupLayout.setupLegend();

      // Setup the basemap gallery
      setup.setupBasemapGallery(wsdot.map, wsdot.config);

      new HomeButton({ map: wsdot.map }, "homeButton").startup();

      // Setup Zoom Button
      wsdot.map.on("load", function() {
        setup.setupSearchControls(wsdot.map, config.queryTasks);

        // Set the scale.
        setScaleLabel();

        utils.addGoogleStreetViewLink(wsdot.map.infoWindow);
        utils.makeDraggable(wsdot.map.infoWindow);
        utils.addPrintLink(wsdot.map.infoWindow, "blank.html");

        // Show the disclaimer if one has been defined.
        utils.showDisclaimer(wsdot.config.disclaimer, wsdot.config.alwaysShowDisclaimer);

        setupToolbar();

        Scalebar({ map: wsdot.map, attachTo: "bottom-left" });

        // Setup Google Analytics tracking of the layers that are added to the map.
        if (window.gaTracker) {
          on(wsdot.map, "layer-add-result", gaTrackEvent);
        }

        wsdot.map.setupIdentifyPopups({
          ignoredLayerRE: wsdot.config.noPopupLayerRe
            ? new RegExp(wsdot.config.noPopupLayerRe, "i")
            : /^layer\d+$/i
        });

        setup.setupDrawUI(wsdot.map);

        // qsManager = new QueryStringManager(wsdot.map);

        // Attach the map to the print form (if config contains print URL).
        if (wsdot.printForm) {
          wsdot.printForm.map = wsdot.map;
        }

        setup.setupExportButton(wsdot.map);
      });

      /**
       * @param {esri.geometry.ScreenPoint} zoomArgs.anchor
       * @param {esri.geometry.Extent} zoomArgs.extent
       * @param {number} zoomArgs.level
       * @param {esri.Map} zoomArgs.target
       * @param {number} zoomArgs.zoomFactor
       */
      on(wsdot.map, "zoom-end", function(zoomArgs) {
        setScaleLabel(zoomArgs.level);
      });

      // Setup the navigation toolbar.
      navToolbar = new Navigation(wsdot.map);
      navToolbar.on("extent-history-change", function() {
        registry
          .byId("previousExtentButton")
          .attr("disabled", navToolbar.isFirstExtent());
        registry
          .byId("nextExtentButton")
          .attr("disabled", navToolbar.isLastExtent());
      });

      button = new Button(
        {
          iconClass: "zoomprevIcon",
          showLabel: false,
          onClick: function() {
            navToolbar.zoomToPrevExtent();
          }
        },
        "previousExtentButton"
      );

      button = new Button(
        {
          iconClass: "zoomnextIcon",
          showLabel: false,
          onClick: function() {
            navToolbar.zoomToNextExtent();
          }
        },
        "nextExtentButton"
      );
    }

    //show map on load
    ready(init);
  }

  (async () => {
    try {
      const config = await utils.getConfig();
      doPostConfig(config);
    } catch (error) {
      console.error(error.message || error);
    }
  })();

});
