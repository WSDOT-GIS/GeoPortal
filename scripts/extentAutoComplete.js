/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.2"/>
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.js"/>
/// <reference path="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.10/jquery-ui.js"/>

(function ($) {

    /** 
    * Sets up a jQueryUI autocomplete box that allows a user to select an extent.  Selecting an extent will then zoom the map to that extent.
    * @param featureSet Either an esri.tasks.FeatureSet or an array of data for a jQuery autocomplete, with each object in the array containing a label property (string) and extent property (esri.geometry.Extent).
    * @param {esri.Map} mapToZoom The map that will be have its extent set when an item is selected from the autocomplete dropdown.
    * @param {string} nameAttribute The name of the feature attribute that will be used to label items in the autocomplete dropdown. This parameter is ignored if featureSet is not an esri.tasks.Featureset, and can be omitted in this case. If featureSet is an esri.tasks.FeatureSet and this parameter is omitted, the featureSet's displayFieldName property will be used.
    * @return returns the input control.
    */
    $.fn.extentAutoComplete = function (featureSet, mapToZoom, nameAttribute) {
        return this.each(function () {
            var graphic;
            var name;
            var option
            var extents = [];

            if (featureSet.declaredClass === "esri.tasks.FeatureSet") {
                if (!nameAttribute) {
                    nameAttribute = featureSet.displayFieldName;
                }
                for (var i = 0, l = featureSet.features.length; i < l; i++) {
                    graphic = featureSet.features[i];
                    name = graphic.attributes[nameAttribute];
                    extents.push({ label: name, extent: graphic.geometry.getExtent() });
                }
            }
            else {
                extents = featureSet;
            }

            // Sort the array of extents by label.
            extents.sort(function (a, b) { return (a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0; });
            $(this).autocomplete({
                source: extents,
                disabled: false,
                select: function (event, ui) {
                    mapToZoom.setExtent(ui.item.extent);
                    $(this).val('');
                    return false;
                }

            }).removeAttr('disabled');
        });

    };
})(jQuery);






