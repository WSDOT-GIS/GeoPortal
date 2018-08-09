/*global define, wsdot*/
define([
  "dijit/registry",
  "dijit/form/Button",
  "esri/request",
  "esri/dijit/Measurement",
  "esri/layers/GraphicsLayer"
], function(registry, Button, esriRequest, Measurement, GraphicsLayer) {
  function setupToolbar() {
    var button;
    button = new Button(
      {
        iconClass: "helpIcon",
        showLabel: false,
        onClick: function() {
          window.open(wsdot.config.helpUrl);

          if (window.gaTracker) {
            window.gaTracker.send("event", "button", "click", "help");
          }
        }
      },
      "helpButton"
    );

    button = new Button(
      {
        label: "Arrange Layers",
        showLabel: false,
        iconClass: "sortIcon",
        onClick: function() {
          var layerSorter = $("#layerSorter");
          // Create the layer sorter dialog if it does not already exist.
          if (layerSorter.length < 1) {
            layerSorter = $("<div id='layerSorter'>")
              .layerSorter({ map: wsdot.map })
              .dialog({
                title: "Arrange Layers",
                autoOpen: false
              });
          }
          layerSorter.dialog("open");
          if (window.ga) {
            ga((tracker) => {
              tracker.send("event", "button", "click", "layer sorter");
            })
          }
        }
      },
      "sortButton"
    );

    button = new Button(
      {
        label: "\uD83D\uDCD0", // Unicode triangle ruler.
        showLabel: true,
        onClick: function() {
          // Disable the identify popups while the measure dialog is active.
          wsdot.map.disablePopups();
          var measureDialog = $("#measureWidgetContainer"),
            titleBar;

          function hideMeasureWidget() {
            // Hide the dialog and disable all of the tools.
            var measureWidget = registry.byId("measureWidget");
            measureWidget.clearResult();
            ["area", "distance", "location"].forEach(function(toolName) {
              measureWidget.setTool(toolName, false);
            });
            measureDialog.hide();
            $("#measureWidgetContainer").hide();
            // Re-enable the identify popups.
            wsdot.map.enablePopups();
          }

          // Create the measure dialog if it does not already exist.
          if (!measureDialog || measureDialog.length < 1) {
            (function() {
              var measurement;
              // Create the dialog.
              measureDialog = $("<div>")
                .attr("id", "measureWidgetContainer")
                .appendTo($("#mapContentPane"))
                .addClass("ui-widget")
                .addClass("ui-dialog ui-widget ui-widget-content ui-corner");
              titleBar = $("<div>")
                .attr(
                  "class",
                  "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"
                )
                .appendTo(measureDialog);
              measureDialog.draggable({
                handle: titleBar
              });
              $("<span>")
                .attr("id", "ui-dialog-title-dialog")
                .addClass("ui-dialog-title")
                .text("Measure")
                .appendTo(titleBar);
              $("<a>")
                .addClass("ui-dialog-titlebar-close ui-corner-all")
                .attr("href", "#")
                .append(
                  $("<span>")
                    .addClass("ui-icon ui-icon-closethick")
                    .text("close")
                )
                .appendTo(titleBar)
                .click(hideMeasureWidget);
              $("<div>")
                .attr("id", "measureWidget")
                .appendTo(measureDialog);
              // Create the widget.
              measurement = new Measurement(
                {
                  map: wsdot.map
                },
                document.getElementById("measureWidget")
              );
              measurement.startup();

              // Setup Google Analytics tracking of measurement tool.
              if (window.gaTracker) {
                measurement.on("measure-end", function(measureEvent) {
                  window.gaTracker.send(
                    "event",
                    "measure",
                    measureEvent.toolName,
                    measureEvent.unitName
                  );
                });
              }
            })();
          } else {
            // If the dialog already exists, toggle its visibility.
            measureDialog = $("#measureWidgetContainer:visible");

            if (measureDialog && measureDialog.length > 0) {
              hideMeasureWidget();
            } else {
              // Show the dialog.
              $("#measureWidgetContainer").show();
            }
          }

          return false;
        }
      },
      "measureButton"
    );
  }

  return setupToolbar;
});
