/// <reference path="../bower_components/polyfills/url.js" />

/**
 * @external MapServiceLayerQueryResult
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Map_Service_Layer/02r3000000p1000000/|Query (Map Service\Layer)}
 */

require([
    "esri/config",
    "esri/tasks/Geoprocessor",
    "ptrSites/JobListItem",
    "ptrSites/gpToBootstrapUtils"
], function (esriConfig, Geoprocessor, JobListItem, gpToBootstrapUtils) {
    "use strict";

    /**
     * Tests a link and returns a promise that will resolve when the URL is accessible.
     * @param {string} url - URL to be tested.
     * @returns {Promise}
     */
    function testLink(url) {
        return new Promise(function (resolve, reject) {
            var worker = new Worker("IsFileReadyWorker.js");
            worker.addEventListener("message", function (e) {
                if (e.data && e.data.status === "OK") {
                    resolve("OK");
                }
            });
            worker.addEventListener("error", function (e) {
                reject(e);
            });
            worker.postMessage({ url: url });
        });
    }

    var gpUrl = "http://data.wsdot.wa.gov/arcgis/rest/services/Traffic/ExportFilteredCsv/GPServer/Export%20Filtered%20CSV";
    esriConfig.defaults.io.corsEnabledServers.push("data.wsdot.wa.gov");

    // Create a URL object for accessing the URL's search parameters.
    var url = new URL(window.location.href);

    // Populate the form with the values from the URL search.
    var form = document.forms[0];
    // Set max year to current year.
    (function () {
        var now = new Date();
        var year = now.getFullYear();
        [form.Start_Year, form.End_Year].forEach(function (input) {
            input.setAttribute("max", year);
        });
    }());

    // Populate the form values with corresponding search parameters.
    Array.from(url.searchParams).forEach(function (searchParam) {
        var paramName = searchParam[0];
        var paramValue = searchParam[1];

        var element = form[paramName];

        if (element) {
            form[paramName].value = paramValue;
        } else {
            console.warn("Couldn't find matching control for parameter.", searchParam);
        }
    });

    /**
     * @typedef {Object} GPMessage
     * @property {string} description - Message
     * @property {string} type - Message type
     */

    /**
     * @typedef {Object} JobInfo
     * @property {string} jobId - Job ID
     * @property {string} jobStatus - Job Status
     * @property {GPMessage[]} messages
     */

    /**
     * @typedef JobStatus
     * @property {JobInfo} jobInfo - Job Info
     * @property {Geoprocessor} target - The Geoprocessor that is executing the task.
     */

    // Create the Geoprocessor
    var gp = new Geoprocessor(gpUrl);

    gp.on("job-cancel", function (e) {
        console.debug("job-cancel", e);
        if (window.gaTracker) {
            gaTracker.send('event', 'job', 'cancel', e && e.jobId ? e.jobId : null);
        }
    });

    function validateSiteIdIsInList() {
        var siteIdBox = document.getElementById("siteIdBox");
        var siteIdList = document.getElementById("siteIdList");
        var selectedOption;
        var descBox = document.getElementById("siteDescriptionPlaceholder");
        // Clear custom errors
        siteIdBox.setCustomValidity("");

        // Force site ID value to be uppercase.
        if (siteIdBox.value) {
            siteIdBox.value = siteIdBox.value.toUpperCase().trim();
        }
        // Check to make sure the entered value matches one of the valid site ID values from
        // the dataset options.
        if (siteIdBox.value) {
            selectedOption = siteIdList.querySelector("option[value=" + siteIdBox.value + "]");
            if (!selectedOption) {
                siteIdBox.setCustomValidity("Please select one of the site IDs from the list");
                descBox.textContent = "";
            } else {
                descBox.textContent = selectedOption.textContent;
            }
        } else {
            descBox.textContent = "";
        }
    }

    // Client-side date validation disabled due to buggyness.

    ////// Performs custom validation on date controls.
    ////function validateDates(e) {

    ////    /**
    ////     * Gets the date selected by the user from month and year controls.
    ////     * @param {HTMLInputElement} yearBox - The year control.
    ////     * @param {HTMLSelectElement} monthSelect - The month control.
    ////     * @returns {?Date} Returns the date specified in the boxes, or null if not all controls have values selected.
    ////     */
    ////    function getDateFromControls(yearBox, monthSelect) {
    ////        var y, m, d;
    ////        if (yearBox.validity.valid && monthSelect.validity.valid) {
    ////            y = parseInt(yearBox.value, 10);
    ////            m = parseInt(monthSelect.value, 10) - 1;
    ////            d = new Date(y, m);
    ////        }
    ////        return d || null;
    ////    }

    ////    // Get the currently selected start and end dates from the year and month controls.
    ////    var startDate = getDateFromControls(form.startYearBox, form.startMonthSelect);
    ////    var endDate = getDateFromControls(form.endYearBox, form.endMonthSelect);

    ////    // Clear custom validity messages from the date controls.
    ////    [form.startYearBox, form.startMonthSelect, form.endYearBox, form.endMonthSelect].forEach(function (ctrl) {
    ////        ctrl.setCustomValidity("");
    ////    });

    ////    var setDateRangeMessge = function (ctrl) {
    ////        function formatDate(date) {
    ////            return [date.getUTCFullYear().toString(), date.getUTCMonth() + 1].join("-");
    ////        }
    ////        if (validDates) {
    ////            ctrl.setCustomValidity(["Please enter a date between", formatDate(validDates[0]), "and", formatDate(validDates[1])].join(" "));
    ////        }
    ////    };

    ////    // Set custom errors for the following conditions.
    ////    // * End date is before or equal to start date
    ////    // * Either start date or end date is out of the valid range of dates
    ////    //   covered by the data. (If the valid dates have been loaded.)
    ////    if (startDate && endDate && startDate > endDate) {
    ////        [form.endYearBox, form.endMonthSelect].forEach(function (ctrl) {
    ////            ctrl.setCustomValidity("End date must occur after start date");
    ////        });
    ////    } else if (validDates) {
    ////        if (startDate && !(startDate >= validDates[0] && startDate <= validDates[1])) {
    ////            [form.startYearBox, form.startMonthSelect].forEach(setDateRangeMessge);
    ////        }
    ////        if (endDate && !(endDate >= validDates[0] && endDate <= validDates[1])) {
    ////            [form.endYearBox, form.endMonthSelect].forEach(setDateRangeMessge);
    ////        }
    ////    }

    ////}

    ////// Setup validation
    ////function setupDateRangeValidation() {
    ////    ["startMonthSelect", "startYearBox", "endMonthSelect", "endYearBox"].forEach(function (id) {
    ////        var element = document.getElementById(id);
    ////        element.addEventListener("input", validateDates);
    ////    });
    ////}

    function submitJob() {
        // Create parameters object and update the URL search parameters.
        var paramNames = ["Input_Tables", "Site_ID", "Start_Year", "Start_Month", "End_Year", "End_Month"];
        var params = {};

        function GetSelectedTables() {
            var checkedOptions = form.Input_Tables.querySelectorAll("option:checked");
            var option;
            var output = [];
            for (var i = 0; i < checkedOptions.length; i++) {
                option = checkedOptions[i];
                output.push(option.value);
            }
            return output;
        }

        paramNames.forEach(function (pName) {
            if (pName === "Input_Tables") {
                // Get the selected tables as a JSON string[].
                params.Input_Tables = GetSelectedTables();
            } else {
                params[pName] = form[pName].value;
            }
            url.searchParams.set(pName, params[pName]);
            // Convert parameter values (except Site_ID) to numbers.
            if (pName !== "Site_ID" && typeof params[pName] === "string") {
                params[pName] = parseInt(params[pName], 10);
            }
        });
        console.debug(params);
        // Update the URL search parameters.
        window.history.replaceState(params, null, url.toString());

        // Add a list item for this GP job.
        var li = new JobListItem(params);
        document.getElementById("jobsList").appendChild(li.listItem);

        // Submit the job
        return gp.submitJob(params).then(function (e) {
            var jobId = e.jobId;
            // Once the job has successfully completed, get the URL
            // to the output ZIP file.
            gp.getResultData(jobId, "Output_ZIP").then(function (dataEvent) {
                // Update the link with the ZIP file URL.
                var zipUrl = dataEvent.value.url;
                li.link = zipUrl;
                testLink(zipUrl).then(function () {
                    li.updateDownloadAttribute();
                    li.listItem.classList.add("list-group-item-success");
                });
            }, function (statusEvent) {
                // Status update event handler for getting the ZIP URL.
                // Currently just logs to the console.
                console.debug("zip file status update", statusEvent);
            }, function (error) {
                // If there's an error getting the ZIP file's URL
                // change the status of the list item by modifying
                // the class attribute.
                li.error = error;
                li.listItem.classList.add("list-group-item-danger");
                console.error(error);
            });
        }, function (errorEvent) {
            // If the GP Job results in an error, update the CSS class
            // and add an error list item.
            console.error("GP error", errorEvent);
            li.addMessages({ type: "error", description: errorEvent.messages });
            li.status = "error";
        }, function (statusEvent) {
            // Upon status GP Job status updates,
            // update the message list and status class.
            li.addMessages(statusEvent.messages);
            li.status = statusEvent.jobStatus;
        });
    }

    form.onsubmit = function () {
        submitJob();
        return false;
    };

    // Clear the URL search parameters when the form is reset.
    form.onreset = function () {
        history.replaceState(null, null, "./");
        document.getElementById("siteDescriptionPlaceholder").textContent = "";
    };

    // Create variable for holding valid start and end dates that the user can select.
    var validDates = null;

    // Start a background thread that queries the map service for valid
    // site IDs and date range.
    if (window.Worker) {
        var worker = new Worker("worker.js");
        worker.onmessage = function (e) {

            /**
             * Populates the data list of site IDs.
             * @param {Object.<string, string>} siteIds - An object with property names
             * corresponding to site IDs. The values of these properties are the
             * descriptions of the corresponding site
             */
            function createSiteIdsDataList(siteIds) {
                var frag = document.createDocumentFragment();
                var option;
                var siteIdList = document.getElementById("siteIdList");
                for (var siteId in siteIds) {
                    option = document.createElement("option");
                    option.value = siteId;
                    option.textContent = [siteId, siteIds[siteId]].join(": ");
                    frag.appendChild(option);
                }
                siteIdList.appendChild(frag);
            }

            var data = e.data;
            if (data.siteIds) {
                // Create the list of site IDs.
                createSiteIdsDataList(e.data.siteIds);
                // Set up custom validation to make sure user-entered site ID is in the list.
                ["input", "blur"].forEach(function (event) {
                    this.addEventListener(event, validateSiteIdIsInList);
                }, document.getElementById("siteIdBox"));
                validateSiteIdIsInList();
            } else if (data.dates) {
                // Sets the valid date range variables
                validDates = data.dates;
                // Sets min and max values for year selectors.
                [form.Start_Year, form.End_Year].forEach(function (input) {
                    input.setAttribute("min", validDates[0].getUTCFullYear());
                    input.setAttribute("max", validDates[1].getUTCFullYear());
                });
                setupDateRangeValidation();
            } else if (data.dateRanges) {
                console.debug("date ranges", data.dateRanges);
            } else if (data.error) {
                console.error(data.error);
            } else if (data.message) {
                if (data.message === "worker closed") {
                    (function () {
                        Array.from(form.querySelectorAll("button:disabled"), function (btn) {
                            btn.removeAttribute("disabled");
                        });
                        var progress = form.querySelector(".form-restriction-progress");
                        progress.parentElement.removeChild(progress);
                    }());
                }
            }
        };
    } else {
        console.warn("This browser does not support web workers.");
    }

    if (form.checkValidity()) {
        submitJob();
    }

});