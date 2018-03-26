/*jslint devel: true, browser: true, white: true */
/*globals jQuery, QUnit, Route, routeUtils, RouteLocator, RouteLocation */

/**
* Make a copy of this file called unittest.js and modify the URLs to match those of the web service you will be testing with.
*/

(function ($) {
    "use strict";

    var routeLocator;
    var elcUrl = window.location.search.replace(/\??url=(.+)/i, "$1") || undefined; //"//data.wsdot.wa.gov/arcgis/rest/services/Shared/ElcRestSOE/MapServer/exts/ElcRestSoe";
    routeLocator = new RouteLocator(elcUrl);

    function onDocumentReady() {
        var clientSupportsCors = $.support.cors, messageList, testCount = 0;

        function writeMessage(message, level) {
            var li = $("<li>").html(message).appendTo(messageList);
            if (level) {
                if (/warn/i.QUnit.test(level)) {
                    li.addClass("warning");
                } else if (/error/i.QUnit.test(level)) {
                    li.addClass("error");
                }
            }
        }

        ////function isNullOrEmpty(input, message) {
        ////	var t = typeof input;
        ////	assert.ok(t === "undefined" || input === null || t === "string" && input.length === 0, message);
        ////}

        ////function testResponseForError(data, message) {
        ////	if (typeof message === "undefined" || message === null) {
        ////		message = "Response should not have an \"error\" property.";
        ////	}
        ////	assert.ok(data !== null && typeof data.error === "undefined", message);
        ////}

        /**
         * Starts the QUnit tests for the ELC REST SOE.
         * @param {Boolean} useCors Specifies whether queries to the server will be "json" (true) or "jsonp" (false).
         */
        function performTests(useCors) {
            QUnit.module("Find Route Locations operation");

            (function (testCount) {
                QUnit.test("Find Route Locaitons, minimum required parameters specified.", function (assert) {
                    var rl, dateString, params;
                    dateString = "12/31/2011";
                    var done = assert.async();

                    rl = new RouteLocation({
                        Route: "005",
                        Arm: 0,
                        ReferenceDate: new Date(dateString)
                    });

                    params = {
                        useCors: useCors,
                        locations: [rl]
                    };

                    routeLocator.findRouteLocations(params).then(function (data) {
                        console.log(testCount, { input: [rl], output: data });
                        assert.ok(true, "Success");
                        done();
                    }, function (error) {
                        console.log(testCount, { input: [rl], error: error });
                        assert.ok(false, error.error);
                        done();
                    });
                });
            }(testCount));

            testCount += 1;

            (function (testCount) {
                QUnit.test("Find Route Locaitons, global reference date specified.", function (assert) {
                    var rl, dateString, params;
                    dateString = "12/31/2011";
                    var done = assert.async();

                    rl = new RouteLocation({
                        Route: "005",
                        Arm: 0
                    });

                    params = {
                        useCors: useCors,
                        locations: [rl],
                        referenceDate: dateString
                    };

                    routeLocator.findRouteLocations(params).then(function (data) {
                        console.log(testCount, { input: [rl], output: data });
                        assert.ok(true, "Success");
                        done();
                    }, function (error) {
                        console.log(testCount, { input: [rl], error: error });
                        assert.ok(false, error.error);
                        done();
                    });
                });
            }(testCount));

            testCount += 1;

            QUnit.module("Find Nearest Route Locations operation");

            (function (testId) {
                QUnit.test("Find Nearest Route Locations test", function (assert) {
                    var params;
                    var done = assert.async();

                    params = {
                        useCors: useCors,
                        coordinates: [1083893.182, 111526.885],
                        referenceDate: new Date("12/31/2011"),
                        searchRadius: 1,
                        inSR: 2927
                    };

                    routeLocator.findNearestRouteLocations(params).then(function (data) {
                        console.log(testId, { input: params, output: data });
                        assert.ok(true, "Success");
                        done();
                    }, function (error) {
                        console.error(testId, error);
                        assert.ok(false, error);
                        done();
                    });
                });
            }(testCount));

            testCount += 1;

            QUnit.module("Get \"routes\" resource");

            (function (testId) {
                QUnit.test("Get \"routes\" test", function (assert) {
                    var done = assert.async();
                    routeLocator.getRouteList(useCors).then(function (routeList) {
                        console.log(testId, routeList);
                        assert.ok(true, "Route list retrieved");
                        assert.ok(allYearsContainAtLeastOneMainline(routeList), "All route arrays must contain at least one mainline.");
                        done();
                    }, function (error) {
                        console.error(testId, error);
                        assert.ok(false, error);
                        done();
                    });
                });
            }(testCount));

            testCount += 1;

            (function (testId) {

                QUnit.test("Parse route info test", function (assert) {
                    var done = assert.async();
                    var request = new XMLHttpRequest();
                    request.open("get", "Route Info.json");
                    request.onloadend = function () {
                        var routeInfos;
                        if (this.status === 200) {
                            routeInfos = Route.parseRoutes(this.response);
                            console.log(testId, routeInfos);
                            assert.ok(true, "Route infos retrieved and parsed");
                            assert.ok(allYearsContainAtLeastOneMainline(routeInfos), "All route arrays must contain at least one mainline.");
                            done();
                        } else {
                            console.error(this.statusText + ": Error in test #" + testId, this.response);
                            assert.ok(false, this.status);
                            done();
                        }
                    };
                    request.send();
                });

            }(testCount));
        }

        function allYearsContainAtLeastOneMainline(/**{Object.<string, Route[]>}*/ routeList) {
            var output = true;

            if (routeList) {
                for (var year in routeList) {
                    if (routeList.hasOwnProperty(year)) {
                        if (!routeArrayContainsMainlines(routeList[year])) {
                            output = false;
                            break;
                        }
                    }
                }
            }
            return output;
        }

        function routeArrayContainsMainlines(/**{Route[]}*/ routes) {
            var output = false;
            var i, l, route;
            if (routes && Array.isArray(routes)) {
                for (i = 0, l = routes.length; i < l; i += 1) {
                    route = routes[i];
                    if (route.isMainline) {
                        output = true;
                        break;
                    }
                }
            }
            return output;
        }

        /**
         * Attempts to query mapServerUrl using CORS.
         * @param {Function} testCompleteHandler A function that takes a single boolean argument.  True will be passed to this method if the server supports CORS, false will be passed in otherwise.
         */
        function testServerForCorsSupport(testCompleteHandler) {
            var progress;
            if (clientSupportsCors) {
                // If the client supports CORS, we'll send a query to the ArcGIS Server to see if it does as well.
                // We will not do anything with the returned data; we just want to know if the query was successful or not.

                progress = $("<div id='corsTestProgress'>").text("Testing map server for CORS support...").appendTo("body");
                $("<progress>").appendTo(progress);
                try {
                    $.ajax({
                        type: "HEAD",
                        url: /(.+)\/exts\/ElcRestSoe\/?/.exec(routeLocator.url)[1],
                        data: {
                            f: "json"
                        },
                        cache: true,
                        dataType: "json",
                        success: function (/*data, textStatus, jqXHR*/) {
                            progress.remove();
                            // The server supports CORS.
                            writeMessage("<a href='" + routeLocator.url + "'>Map server</a>" + " supports CORS.");
                            if (typeof testCompleteHandler === "function") {
                                testCompleteHandler(true);
                            }
                        },
                        error: function (/*jqXHR, textStatus, errorThrown*/) {
                            progress.remove();
                            // The server does not support CORS.
                            writeMessage("<a href='" + routeLocator.url + "'>Map Server</a>" + " does not support CORS.");
                            if (typeof testCompleteHandler === "function") {
                                testCompleteHandler(false);
                            }
                        }
                    });
                } catch (err) {
                    progress.remove();
                    // The server does not support CORS.
                    console.error(err);
                    writeMessage("<a href='" + routeLocator.url + "'>Map Server</a>" + " does not support CORS.");
                    if (typeof testCompleteHandler === "function") {
                        testCompleteHandler(false);
                    }
                }
            } else {
                // If the browser does not support CORS, then we don't care if the server supports it, since we can't use it anyway.
                if (typeof testCompleteHandler === "function") {
                    testCompleteHandler(false);
                }
            }
        }

        $("<p>Note: Query inputs and outputs appear in the browser's console window (usually accessed by pressing F12).</p>").appendTo("body");
        messageList = $("<ul id='messageList'>").appendTo("body");

        // Create a dummy console variable if the browser does not support it. (I.e., IE versions < 9).
        // JSLint will complain about the "redefinition of console", but we are only giving it a value if it is not already defined.
        if (typeof window.console === "undefined") {
            window.console = {
                log: function () { },
                warn: function () { },
                error: function () { }
            };
        }

        if (!clientSupportsCors) {
            writeMessage("This browser does not support <a href='http://enable-cors.org/'><abbr title='Cross-Origin Resource Sharing'>CORS</abbr></a>.  All requests will be sent via JSONP method.", "warning");
        } else {
            writeMessage("Good, this browser supports <a href='http://enable-cors.org/'><abbr title='Cross-Origin Resource Sharing'>CORS</abbr></a>!  If the server also supports CORS, requests will be sent as JSON instead of JSONP.");
        }

        // Perform client-only tests.
        testCount = 1;
        QUnit.module("flatten array");

        QUnit.test("routeUtils.flattenArray test", function (assert) {
            var flattened, array = [
                [1, 2],
                [3, 4]
            ];
            flattened = routeUtils.flattenArray(array);

            assert.equal(flattened.length, 4, "flattened array should have four elements.");
        });

        testCount += 1;

        QUnit.test("routeUtils.flattenArray on array that doesn't need it", function (assert) {
            var input = [1, 2, 3, 4], output = routeUtils.flattenArray(input);

            assert.equal(input.length, output.length, "input and output arrays should have the same number of elements.");
            assert.ok(input[0] === output[0] && input[1] === output[1] && input[2] === output[2] && input[3] === output[3], "Each element in input array should match element at corresponding index in output array.");

        });

        testCount += 1;

        QUnit.module("RouteLocation class");

        QUnit.test("RouteLocation.toJSON test", function (assert) {
            var rl, json, dateString;
            dateString = "12/31/2011";

            rl = new RouteLocation({
                Route: "005",
                Arm: 0,
                ReferenceDate: new Date(dateString)
            });

            json = rl.toJSON();
            assert.equal(json.ReferenceDate, dateString, "The reference date in the output object should be \"" + dateString + "\".");
            assert.equal(json.Route, rl.Route, "The \"Route\" properties should be equal.");
            assert.equal(json.Arm, rl.Arm, "The \"Arm\" properties should be equal.");
        });

        testCount += 1;

        // Start the test to see if the server supports CORS.  When this test is completed, the QUnit tests will start.
        testServerForCorsSupport(performTests);
    }

    $(document).ready(onDocumentReady);

}(jQuery));