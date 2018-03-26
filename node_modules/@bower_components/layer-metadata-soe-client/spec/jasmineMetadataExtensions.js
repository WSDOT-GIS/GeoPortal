require([
    "MetadataClient/metadataExtensions",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer"
], function (
    metadataExtensions,
    ArcGISDynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer
) {
    describe("metadata extensions", function () {
        describe("with service that supports layer metadata SOE", function () {
            var layer = new ArcGISDynamicMapServiceLayer("http://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer");
            it("should support metadata test", function (done) {
                layer.supportsMetadata().then(function (isSupported) {
                    expect(isSupported).toBe(true);
                    done();
                }, function (error) {
                    done.fail(error);
                });
            });

            it("should support getting layer list", function (done) {
                layer.getIdsOfLayersWithMetadata().then(function (layerIds) {
                    expect(layerIds).not.toBe(null);
                    done();
                }, function (error) {
                    done.fail(error);
                });
            });
        });
        describe("with service that does not support layer metadata SOE", function () {
            var layer = new ArcGISTiledMapServiceLayer("http://data.wsdot.wa.gov/arcgis/rest/services/Shared/WebBaseMapWebMercator/MapServer");
            it("should be able to call test for metadata without failing and return correct result (false).", function (done) {
                layer.supportsMetadata().then(function (isSupported) {
                    expect(isSupported).toBe(false);
                    done();
                }, function (error) {
                    done.fail(error);
                });
            });

            it("should support call to get layer list without exception", function (done) {
                layer.getIdsOfLayersWithMetadata().then(function (layerIds) {
                    expect(layerIds).toBe(null);
                    done();
                }, function (error) {
                    done.fail(error);
                });
            });
        });
    });
});