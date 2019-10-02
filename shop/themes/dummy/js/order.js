( function($) { "use strict";

    var ShopOrderPage = ( function($) {

        ShopOrderPage = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];

            // DYNAMIC VARS

            // INIT
            that.init();
        };

        ShopOrderPage.prototype.init = function() {
            var that = this;
        };

        return ShopOrderPage;

    })(jQuery);

    window.ShopOrderPage = ShopOrderPage;

})(jQuery);