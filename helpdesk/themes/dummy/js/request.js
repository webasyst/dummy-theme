var RequestPage = ( function($) {

    RequestPage = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];
        that.$request = that.$wrapper.find(".h-request-block");

        // VARS
        that.form_url = options["form_url"];

        // DYNAMIC VARS

        // INIT
        that.initClass();
    };

    RequestPage.prototype.initClass = function() {
        var that = this;

        that.bindEvents();
    };

    RequestPage.prototype.bindEvents = function() {
        var that = this;

        // action buttons click handler
        that.$wrapper.on("click", ".h-request-actions input", function() {
            that.onActionClick( $(this) );
            return false;
        });

        that.$request.on("click", ".request-params-changed-link", function() {
            that.$request.find(".request-changed-params").toggle();
        });
    };

    RequestPage.prototype.onActionClick = function( $input ) {
        var that = this,
            $loading = $('<i class="icon16 loading"></i>'),
            href = that.form_url.replace("%ACTION_ID%", $input.attr('name') );

        $input.after($loading);

        $.get(href, function(response) {
            //
            $loading.remove();
            //
            $('.ticket-buttons').hide();
            //
            $("#h-action-content").html(response).show();
        });
    };

    return RequestPage;

})(jQuery);