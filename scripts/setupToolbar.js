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

    // TODO: Make drop-down button instead of popping up a dialog.
    button = new Button(
      {
        label: "Export Graphics",
        showLabel: false,
        iconClass: "exportIcon",
        onClick: function() {
          var form,
            formatSelect,
            exportDialog = $("#exportDialog");

          // Create the export dialog if it does not already exist.
          if (exportDialog.length < 1) {
            exportDialog = $("<div>")
              .attr("id", "exportDialog")
              .dialog({
                autoOpen: false,
                title: "Save Graphics",
                modal: true,
                close: function() {
                  // Remove the value from the hidden input element named "graphics".
                  $("input[name=graphics]", this).attr("value", null);
                },
                open: function() {
                  // Show / hide the form and "no graphics" message based on the number of graphics in the map.
                  const graphicsLayers = wsdot.map.graphicsLayerIds
                    .map(id => wsdot.map.getLayer(id))
                    .filter(layer => layer.isInstanceOf(GraphicsLayer));
                  if (graphicsLayers.length < 1) {
                    $(".no-graphics-message", exportDialog).show();
                    $("form", exportDialog).hide();
                  } else {
                    let graphics = wsdot.map.getGraphicsAsJson();

                    // Set the hidden graphics element's value.
                    $("input[name=graphics]", exportDialog).attr(
                      "value",
                      JSON.stringify(graphics)
                    );

                    $(".no-graphics-message", exportDialog).hide();
                    $("form", exportDialog).show();
                  }
                }
              });
            // Create the message that will appear when this form is opened but the user has no graphics in their map.  This message will be hidden initially.
            $("<p>")
              .addClass("no-graphics-message")
              .text(
                "You do not currently have any graphics in your map to export."
              )
              .appendTo(exportDialog)
              .hide();
            // Create a form that will open its submit action in a new window.
            form = $("<form>")
              .attr("action", "GraphicExport.ashx")
              .attr("method", "post")
              .attr("target", "_blank")
              .appendTo(exportDialog);

            $("<label>")
              .attr("for", "graphic-export-format")
              .text("Select an export format:")
              .appendTo(form);
            formatSelect = $("<select>")
              .attr("name", "f")
              .attr("id", "graphic-export-format")
              .appendTo(form);

            // Populate the output format select element with options.
            $([["kml", "KML"], ["kmz", "KMZ"], ["json", "JSON"]]).each(function(
              index,
              element
            ) {
              $("<option>")
                .attr("value", element[0])
                .text(element[1])
                .appendTo(formatSelect);
            });

            // This hidden element will hold the graphics information while the dialog is opened.
            $("<input>")
              .attr("type", "hidden")
              .attr("name", "graphics")
              .appendTo(form);

            // Create the submit button and convert it to a jQueryUI button.
            $("<button>")
              .css("display", "block")
              .attr("type", "submit")
              .text("Export")
              .appendTo(form)
              .button();
          }

          // Show the export dialog
          exportDialog.dialog("open");

          if (window.gaTracker) {
            window.gaTracker.send(
              "event",
              "button",
              "click",
              "export graphics"
            );
          }
        }
      },
      "saveButton"
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
          if (window.gaTracker) {
            window.gaTracker.send("event", "button", "click", "layer sorter");
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
