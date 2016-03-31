/// <reference path="../bower_components/promise-polyfill/Promise.js" />
/// <reference path="../bower_components/fetch/fetch.js" />

self.importScripts("../bower_components/promise-polyfill/Promise.js");
self.importScripts("../bower_components/fetch/fetch.js");

function testUrl(url) {
    fetch(url, {
        method: "HEAD"
    }).then(function (response) {
        self.postMessage({
            status: response.status,
            statusText: response.statusText
        });
        if (response.ok) {
            self.postMessage("OK");
            self.close();
        } else {
            testUrl(url);
        }
    });
}

self.addEventListener("message", function (e) {
    console.debug(e);
    var url = e.data.url;
    testUrl(url);
});
