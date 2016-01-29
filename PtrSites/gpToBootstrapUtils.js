define(function () {
    return {
        /**
         * Converts an Esri job message type into corresponding bootstrap class
         * @param {string} esriType - GP message type
         * @param {string} [bsPrefix="list-group-item-"] - Prefix for bootstrap class.
         * @returns {string} Returns the corresponding bootstrap class name.
         */
        getBootstrapClassName: function (esriType, bsPrefix) {
            bsPrefix = bsPrefix || "list-group-item-";
            var warningRe = /Warning$/i;
            var dangerRe = /((Error)|(Failed))$/i;
            var successRe = /Succe(?:(?:eded)|(?:ss))$/
            if (!esriType) {
                return null;
            }
            var output = successRe.test(esriType) ? "success" :
                warningRe.test(esriType) ? "warning" :
                dangerRe.test(esriType) ? "danger" :
                "info";
            output = bsPrefix + output;
            return output;
            
        }
    }
});