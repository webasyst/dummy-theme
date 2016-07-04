var Checkout = ( function($) {

    Checkout = function(options) {
        var that = this;

        // DOM
        that.$wrapper = ( options["$wrapper"] || false);

        // VARS

        // DYNAMIC VARS

        // INIT
        that.initCheckout();
    };

    Checkout.prototype.initCheckout = function() {
        var that = this;

        that.bindEvents();
    };

    Checkout.prototype.bindEvents = function() {
        var that = this;

    };

    return Checkout;

})(jQuery);