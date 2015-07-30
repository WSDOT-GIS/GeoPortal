/*global define, wsdot*/
define([
    "dijit/registry",
    "dijit/form/Button",
    "esri/request",
    "esri/dijit/Measurement",
    "scripts/printer.js"
], function (registry, Button, esriRequest, Measurement) {
    function setupToolbar(map) {
        var button;
        button = new Button({
            iconClass: "helpIcon",
            showLabel: false,
            onClick: function () {
                window.open(wsdot.config.helpUrl);

                if (window.gaTracker) {
                    window.gaTracker.send("event", "button", "click", "help");
                }
            }
        }, "helpButton");

        // TODO: Make drop-down button instead of popping up a dialog.
        button = new Button({
            label: "Export Graphics",
            showLabel: false,
            iconClass: "exportIcon",
            onClick: function () {
                var form, formatSelect, exportDialog = $("#exportDialog");

                // Create the export dialog if it does not already exist.
                if (exportDialog.length < 1) {
                    exportDialog = $("<div>").attr("id", "exportDialog").dialog({
                        autoOpen: false,
                        title: "Save Graphics",
                        modal: true,
                        close: function () {
                            // Remove the value from the hidden input element named "graphics".
                            $("input[name=graphics]", this).attr("value", null);
                        },
                        open: function () {
                            var graphics;
                            // Show / hide the form and "no graphics" message based on the number of graphics in the map.
                            if (map.getGraphicsCount() < 1) {
                                $(".no-graphics-message", exportDialog).show();
                                $("form", exportDialog).hide();
                            } else {
                                graphics = map.getGraphicsAsJson();

                                // Set the hidden graphics element's value.
                                $("input[name=graphics]", exportDialog).attr("value", JSON.stringify(graphics));

                                $(".no-graphics-message", exportDialog).hide();
                                $("form", exportDialog).show();
                            }

                        }
                    });
                    // Create the message that will appear when this form is opened but the user has no graphics in their map.  This message will be hidden initially.
                    $("<p>").addClass("no-graphics-message").text("You do not currently have any graphics in your map to export.").appendTo(exportDialog).hide();
                    // Create a form that will open its submit action in a new window.
                    form = $("<form>").attr("action", "GraphicExport.ashx").attr("method", "post").attr("target", "_blank").appendTo(exportDialog);

                    $("<label>").attr("for", "graphic-export-format").text("Select an export format:").appendTo(form);
                    formatSelect = $("<select>").attr("name", 'f').attr("id", 'graphic-export-format').appendTo(form);

                    // Populate the output format select element with options.
                    $([["kml", "KML"], ["kmz", "KMZ"], ["json", "JSON"]]).each(function (index, element) {
                        $("<option>").attr("value", element[0]).text(element[1]).appendTo(formatSelect);
                    });

                    // This hidden element will hold the graphics information while the dialog is opened.
                    $("<input>").attr("type", "hidden").attr("name", "graphics").appendTo(form);

                    // Create the submit button and convert it to a jQueryUI button.
                    $("<button>").css("display", "block").attr("type", "submit").text("Export").appendTo(form).button();
                }

                // Show the export dialog
                exportDialog.dialog("open");

                if (window.gaTracker) {
                    window.gaTracker.send("event", "button", "click", "export graphics");
                }
            }
        }, "saveButton");

        button = new Button({
            label: "Arrange Layers",
            showLabel: false,
            iconClass: "sortIcon",
            onClick: function () {
                var layerSorter = $("#layerSorter");
                // Create the layer sorter dialog if it does not already exist.
                if (layerSorter.length < 1) {
                    layerSorter = $("<div id='layerSorter'>").layerSorter({ map: map }).dialog({
                        title: "Arrange Layers",
                        autoOpen: false
                    });
                }
                layerSorter.dialog("open");
                if (window.gaTracker) {
                    window.gaTracker.send("event", "button", "click", "layer sorter");
                }
            }
        }, "sortButton");

        button = new Button({
            label: "\uD83D\uDCD0", // Unicode triangle ruler.
            showLabel: true,
            onClick: function () {
                // Disable the identify popups while the measure dialog is active.
                map.disablePopups();
                var measureDialog = $("#measureWidgetContainer"),
                titleBar;

                function hideMeasureWidget() {
                    // Hide the dialog and disable all of the tools.
                    var measureWidget = registry.byId("measureWidget");
                    measureWidget.clearResult();
                    ["area", "distance", "location"].forEach(function (toolName) {
                        measureWidget.setTool(toolName, false);
                    });
                    measureDialog.hide();
                    $("#measureWidgetContainer").hide();
                    // Re-enable the identify popups.
                    map.enablePopups();
                }

                // Create the measure dialog if it does not already exist.
                if (!measureDialog || measureDialog.length < 1) {
                    (function () {
                        var measurement;
                        // Create the dialog.
                        measureDialog = $("<div>").attr("id", "measureWidgetContainer").appendTo($("#mapContentPane")).addClass("ui-widget").addClass("ui-dialog ui-widget ui-widget-content ui-corner");
                        titleBar = $("<div>").attr("class", "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").appendTo(measureDialog);
                        measureDialog.draggable({
                            handle: titleBar
                        });
                        $("<span>").attr("id", "ui-dialog-title-dialog").addClass("ui-dialog-title").text("Measure").appendTo(titleBar);
                        $("<a>").addClass("ui-dialog-titlebar-close ui-corner-all").attr("href", "#").append($('<span>').addClass("ui-icon ui-icon-closethick").text("close")).appendTo(titleBar).click(hideMeasureWidget);
                        $("<div>").attr("id", "measureWidget").appendTo(measureDialog);
                        // Create the widget.
                        measurement = new Measurement({
                            map: map
                        }, document.getElementById("measureWidget"));
                        measurement.startup();

                        // Setup Google Analytics tracking of measurement tool.
                        if (window.gaTracker) {
                            measurement.on("measure-end", function (measureEvent) {
                                window.gaTracker.send("event", "measure", measureEvent.toolName, measureEvent.unitName);
                            });
                        }
                    }());
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
        }, "measureButton");

        function setupPrinter(resp) {
            var printButton, printDialog, templateNames, pdfList;

            function getTemplateNames() {
                var layoutTemplateParam = resp.parameters.filter(function (param /*, idx*/) {
                    return param.name === "Layout_Template";
                });

                if (layoutTemplateParam.length === 0) {
                    console.log("print service parameters name for templates must be \"Layout_Template\"");
                    return;
                }
                return layoutTemplateParam[0].choiceList;
            }

            function getExtraParameters() {
                return resp.parameters.filter(function (param /*, idx*/) {
                    return param.name !== "Web_Map_as_JSON" && param.name !== "Format" && param.name !== "Output_File" && param.name !== "Layout_Template";
                });
            }

            templateNames = getTemplateNames();

            printButton = document.getElementById("printButton");
            pdfList = $("<ol class='printouts-list'>").appendTo("#toolbar").hide();

            printButton = new Button({
                label: "Print",
                iconClass: "dijitIconPrint",
                showLabel: false,
                onClick: function () {
                    // Create the print dialog if it does not already exist.
                    if (!printDialog) {
                        printDialog = $("<div>").dialog({
                            modal: true,
                            title: "Print"
                        }).printer({
                            map: map,
                            templates: templateNames,
                            url: wsdot.config.printUrl,
                            extraParameters: getExtraParameters(),
                            async: resp.executionType === "esriExecutionTypeAsynchronous",
                            printSubmit: function (/*e, data*/) {
                                ////var parameters = data.parameters;
                                printDialog.dialog("close");
                                printButton.set({
                                    disabled: true,
                                    iconClass: "dijitIconBusy"
                                });
                                if (window.gaTracker) {
                                    window.gaTracker.send("event", "print", "submit", wsdot.config.printUrl);
                                }
                            },
                            printComplete: function (e, data) {
                                var result = data.result, li;
                                printButton.set({
                                    disabled: false,
                                    iconClass: "dijitIconPrint"
                                });
                                pdfList.show("fade");
                                li = $("<li>").appendTo(pdfList).hide();
                                $("<a>").attr({
                                    href: result.url,
                                    target: "_blank"
                                }).text("Printout").appendTo(li);
                                li.show("fade");

                                if (window.gaTracker) {
                                    window.gaTracker.send("event", "print", "complete", result.url);
                                }
                            },
                            printError: function (e, data) {
                                var error = data.error, message;
                                printButton.set({
                                    disabled: false,
                                    iconClass: "dijitIconPrint"
                                });
                                message = error.dojoType === "timeout" ? "The print service is taking too long to respond." : error.message || "Unknown Error";
                                $("<div>").text(message).dialog({
                                    title: "Print Error",
                                    modal: true,
                                    close: function () {
                                        $(this).dialog("destroy").remove();
                                    },
                                    buttons: {
                                        OK: function () {
                                            $(this).dialog("close");
                                        }
                                    }
                                });
                                if (window.gaTracker) {
                                    window.gaTracker.send("event", "print", "error", [message, wsdot.config.printUrl].join("\n"));
                                }
                            }
                        });
                    } else {
                        printDialog.dialog("open");
                    }
                }
            }, printButton);
        }

        // If a print URL has been specified, add the print widget.
        if (wsdot.config.printUrl) {
            // get print templates from the export web map task
            var printInfo = esriRequest({
                "url": wsdot.config.printUrl,
                "content": { "f": "json" }
            });
            printInfo.then(setupPrinter, function (error) {
                if (console) {
                    if (console.error) {
                        console.error("Failed to load print service URL.", error);
                    }
                }
            });
        } else {
            (function (printButton) {
                var parent = printButton.parentElement;
                parent.removeChild(printButton);
            }(document.getElementById("printButton")));
        }
    }

    return setupToolbar;
});