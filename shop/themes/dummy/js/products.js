// Shop :: Products Class
var Products = ( function($) {

    Products = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];
        that.$products = that.$wrapper.find(".s-product-wrapper");
        that.$sorting = that.$wrapper.find(".s-sorting-wrapper");
        that.$productList = that.$wrapper.find(".s-products-list");

        // VARS
        that.added_class = "is-added";
        that.compare = ( options['compare'] || false );

        // DYNAMIC VARS

        // INIT
        that.bindEvents();
    };

    Products.prototype.bindEvents = function() {
        var that = this,
            $wrapper = that.$wrapper;

        $wrapper.on("submit", "form.add-to-cart", function(event) {
            event.preventDefault();
            that.onSubmitProduct( $(this) );
        });

        $wrapper.on("click", ".s-add-button", function(event) {
            event.preventDefault();
            that.onAddProduct( $(this) );
        });

        $wrapper.on("click", ".s-compare-button", function(event) {
            event.preventDefault();
            that.onCompareProduct( $(this) );
        });

        $wrapper.on("click", ".set-table-view", function() {
            that.onChangeView( $(this), true );
            return false;
        });

        $wrapper.on("click", ".set-thumbs-view", function() {
            that.onChangeView( $(this), false );
            return false;
        });

        $wrapper.on("click", ".increase-volume", function () {
            that.increaseQuantity( true, $(this) );
        });

        $wrapper.on("click", ".decrease-volume", function() {
            that.increaseQuantity( false, $(this) );
        });

        $wrapper.find(".product-quantity-field").on("change", function() {
            that.changeQuantity( $(this) );
        });
    };

    // SORTING

    Products.prototype.onChangeView = function( $link, is_table ) {
        var that = this,
            $list = that.$productList,
            active_class = "is-active",
            table_class = "table-view",
            thumbs_class = "thumbs-view",
            is_active = $link.hasClass(active_class);

        if (!is_active) {

            if (is_table) {
                $list
                    .removeClass(thumbs_class)
                    .addClass(table_class);

            } else {
                $list
                    .removeClass(table_class)
                    .addClass(thumbs_class);
            }

            that.$sorting.find(".view-filters ." + active_class).removeClass(active_class);
            $link.addClass(active_class)
        }
    };

    // ADD PRODUCT

    Products.prototype.onSubmitProduct = function($form) {
        var that = this,
            $product = $form.closest(".s-product-wrapper"),
            product_href = $form.data("url");

        if (product_href) {
            $.post(product_href, function( html ) {
                var dialog = new Dialog({
                    html: html
                });

                var $dialog = dialog.$dialog;

                $dialog.on("addedToCart", function() {
                    that.maskProductAsAdded( $product );
                });
            });

        } else {
            $.post($form.attr('action') + '?html=1', $form.serialize(), function (response) {
                that.maskProductAsAdded( $product );

                // Update Cart at Header
                if (response["data"]) {
                    var count = response["data"]["count"],
                        text = response["data"]["total"];

                    if (text && count >= 0) {
                        updateHeaderCart({
                            text: text,
                            count: count
                        });
                    }
                }

            }, "json");
        }
    };

    Products.prototype.onAddProduct = function( $button ) {
        var that = this,
            is_active = $button.hasClass(that.added_class);

        if (!is_active) {
            var $form = $button.closest(".s-product-wrapper").find("form.add-to-cart");
            $form.submit();
        }
    };

    Products.prototype.maskProductAsAdded = function( $product ) {
        var that = this,
            $button = $product.find(".s-add-button"),
            added_text = $button.data("added-text");

        $button
            .addClass(that.added_class)
            .val(added_text);
    };

    Products.prototype.increaseQuantity = function( increase, $button ) {
        var that = this,
            $wrapper = $button.closest(".s-quantity-wrapper"),
            $quantity = $wrapper.find(".product-quantity-field"),
            value = parseInt( $quantity.val() ),
            new_value = 1;

        if (value && value > 0) {
            new_value = (increase) ? value + 1 : value - 1;
        }

        $quantity
            .val(new_value)
            .trigger("change");

    };

    Products.prototype.changeQuantity = function( $quantity ) {
        var that = this,
            input_max_data = parseInt( $quantity.data("max-quantity")),
            max_val = ( isNaN(input_max_data) || input_max_data === 0 ) ? Infinity : input_max_data,
            value = parseInt( $quantity.val() ),
            new_value = 1;

        if (value && value > 0) {
            new_value = (value >= max_val) ? max_val : value;
        }

        $quantity.val(new_value);
    };

    // COMPARE

    Products.prototype.onCompareProduct = function( $button ) {
        var that = this,
            active_class = "active",
            $icon = $button.find(".compare"),
            $product = $button.closest(".s-product-wrapper"),
            product_id = $product.data("product-id"),
            is_active = $icon.hasClass(active_class),
            is_disabled = ( $button.data("is_disabled") || false );

        var compare = $.cookie('shop_compare'); // Product Id's Array @string
        compare = (compare) ? compare.split(',') : [];

        if (is_active) {
            //
            $icon.removeClass(active_class);

            //
            var index = $.inArray( product_id + '', compare);
            if (index != -1) {
                compare.splice(index, 1)
            }
            if (compare.length > 0) {
                $.cookie('shop_compare', compare.join(','), { expires: 30, path: '/'});
            } else {
                $.cookie('shop_compare', null, {path: '/'});
            }

        } else {
            //
            $icon.addClass(active_class);

            //
            compare.push(product_id);
            $.cookie('shop_compare', compare.join(','), { expires: 30, path: '/'});
        }

        var compare_url = that.compare["url"];
        if (compare.length > 0) {
            compare_url = compare_url.replace(/compare\/.*$/, 'compare/' + compare.join(',') + '/');
        }

        //compare_url

        $("#s-compare-counter").trigger("checkCompare");
    };

    return Products;

})(jQuery);