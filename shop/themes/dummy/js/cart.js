var Cart = ( function($) {

    Cart = function(options) {
        var that = this;

        // DOM
        that.$wrapper = ( options["$wrapper"] || false );

        // VARS

        // INIT
        this.bindEvents();
    };

    // Selectors and Options Storage
    Cart.prototype.storage = {
        hasErrorClass: "has-error",
        getWrapper: function() {
            return $(".s-cart-page");
        },
        getProduct: function() {
            return this.getWrapper().find(".s-cart-product");
        },
        getProductQuantityInput: function( $product ) {
            return $product.find(".s-product-quantity");
        },
        getProductServices: function() {
            return this.getProduct().find(".s-product-services");
        },
        getProductService: function( $target ) {
            return $target.closest(".s-service");
        },
        getProductTotal: function( $product ) {
            return $product.find(".s-product-total");
        },
        getCartTotal: function() {
            return $("#cart-total");
        },
        getCartDiscountWrapper: function() {
            return $("#cart-discount-wrapper");
        },
        getCartDiscount: function() {
            return $("#s-cart-discount");
        },
        getCartAffiliateHint: function() {
            return $("#affiliate-hint-wrapper");
        }
    };

    // Events
    Cart.prototype.bindEvents = function() {
        var that = this,
            $wrapper = that.storage.getWrapper(),
            $product = that.storage.getProduct(),
            $productServices = that.storage.getProductServices();

        $product.on("click", ".increase-volume", function() {
            var $currentProduct = $(this).closest(".s-cart-product");
            that.changeProductQuantity( that, "positive", $currentProduct);
            return false;
        });

        $product.on("click", ".decrease-volume", function() {
            var $currentProduct = $(this).closest(".s-cart-product");
            that.changeProductQuantity( that, "negative", $currentProduct);
            return false;
        });

        $product.on("change", ".s-product-quantity", function() {
            var $currentProduct = $(this).closest(".s-cart-product");
            that.onChangeProductQuantity( that, $(this), $currentProduct );
            return false;
        });

        $product.on("click", ".delete-product", function() {
            var $currentProduct = $(this).closest(".s-cart-product");
            that.deleteProduct(that, $currentProduct);
            return false;
        });

        $productServices.on("change", "select", function() {
            var $select = $(this),
                $currentProduct = $select.closest(".s-cart-product");
            that.onServiceChange(that, $select, $currentProduct);
            return false;
        });

        $productServices.on("change", "input[type=\"checkbox\"]", function() {
            var $currentProduct = $(this).closest(".s-cart-product");
            that.onServiceCheck(that, $(this), $currentProduct);
            return false;
        });

        $("#cancel-affiliate").on("click", function () {
            that.cancelAffiliate( that, $(this) );
            return false;
        });

        $("#use-coupon").on("click", function () {
            that.useCoupon( that, $(this) );
            return false;
        });

        $wrapper.on("click", ".add-to-cart-link", function() {
            that.onAddToCart(that, $(this));
            return false;
        });
    };

    Cart.prototype.onAddToCart = function(that, $target) {
        var $deferred = $.Deferred(),
            request_href = $target.data("request-href"),
            request_data = {
                html: 1,
                product_id: $target.data("product_id")
            };

        $.post(request_href, request_data, function (response) {
            $deferred.resolve(response);
        }, 'json');

        $deferred.done( function(response) {
            if (response.status == 'ok') {
                location.reload();
            }
        });
    };

    Cart.prototype.onServiceCheck = function(that, $input, $product) {
        var $deferred = $.Deferred(),
            product_id = $product.data("id"),
            is_checked = $input.is(":checked"),
            input_val = $input.val(),
            $innerSelect = $('select[name="service_variant[' + product_id + '][' + input_val + ']"]'),
            $service = that.storage.getProductService( $input),
            request_data = {};

        // Toggle service <select>
        if ($innerSelect.length) {
            if (is_checked) {
                $innerSelect.removeAttr('disabled');
            } else {
                $innerSelect.attr('disabled', 'disabled');
            }
        }

        if (is_checked) {
            request_data = {
                html: 1,
                parent_id: product_id,
                service_id: input_val
            };

            // If variants exits, adding to request_data
            var variants = $("select[name=\"service_variant[" + product_id + "][" + input_val + "]\"]");
            if (variants.length) {
                request_data["service_variant_id"] = variants.val();
            }

            $.post('add/', request_data, function(response) {
                $deferred.resolve(response);
            }, "json");

            $deferred.done( function(response) {
                // Set ID
                $service.data("id", response.data.id);

                // Set Product Total
                var $productTotal = that.storage.getProductTotal( $product );
                $productTotal.html(response.data.item_total);

                // Update Cart Total
                that.updateCart(that, $product, response.data);
            });

        } else {

            request_data = {
                html: 1,
                id: $service.data('id')
            };

            $.post('delete/', request_data, function (response) {
                $deferred.resolve(response);
            }, "json");

            $deferred.done( function(response) {
                // Set ID
                $service.data('id', null);

                // Set Product Total
                var $productTotal = that.storage.getProductTotal( $product );
                $productTotal.html(response.data.item_total);

                // Update Cart Total
                that.updateCart(that, $product, response.data);
            });
        }

    };

    Cart.prototype.useCoupon = function(that, $target ) {
        var $discountWrapper = that.storage.getCartDiscountWrapper();

        // Hide link
        $target.hide();

        // Render Discount
        $discountWrapper.show();

        // Render Coupon Field
        $("#apply-coupon-code").show();
    };

    Cart.prototype.cancelAffiliate = function(that, $link) {
        var $form = $link.closest('form');

        // Adding Affiliate Field
        $form.append("<input type=\"hidden\" name=\"use_affiliate\" value=\"0\">");

        // Submit
        $form.submit();
    };

    Cart.prototype.onServiceChange = function(that, $select, $product) {
        var $deferred = $.Deferred(),
            $service = that.storage.getProductService( $select ),
            request_data = {
                html: 1,
                id: $service.data("id"),
                service_variant_id: $select.val()
            };

        $.post("save/", request_data, function (response) {
            $deferred.resolve(response);
        }, "json");

        $deferred.done( function(response) {

            // Render Product Total
            $product.find('.s-product-total').html(response.data.item_total);

            // Render Cart Total
            that.updateCart(that, $product, response.data);
        });
    };

    Cart.prototype.updateCart = function(that, $product, data ) {
        var $cartTotal = that.storage.getCartTotal(),
            $cartDiscountWrapper = that.storage.getCartDiscountWrapper(),
            $cartAffiliateBonus = that.storage.getCartAffiliateHint(),
            $cartDiscount = that.storage.getCartDiscount(),
            text = data["total"],
            count = data["count"];

        // Render Total
        $cartTotal.html(text);

        // Update Cart at Header
        if (text && count >= 0) {
            updateHeaderCart({
                text: text,
                count: count
            });
        }

        // Render Discount
        if (data.discount_numeric) {
            $cartDiscountWrapper.show();
            $cartDiscount.html('&minus; ' + data.discount);
        } else {
            $cartDiscountWrapper.hide();
        }

        // Render Affiliate Bonus
        if (data.add_affiliate_bonus) {
            $cartAffiliateBonus
                .show()
                .html(data.add_affiliate_bonus);
        } else {
            $cartAffiliateBonus
                .hide();
        }
    };

    Cart.prototype.changeProductQuantity = function( that, type, $product ) {
        var $quantityInput = that.storage.getProductQuantityInput( $product ),
            current_val = parseInt( $quantityInput.val() ),
            is_disabled = ( $quantityInput.attr("disabled") === "disabled"),
            disable_time = 800,
            new_val;

        if (type === "positive") {
            new_val = current_val + 1;
        } else if (type === "negative") {
            new_val = current_val - 1;
        }

        // Set new value
        if (!is_disabled) {

            if ( new_val > 0 ) {
                $quantityInput.attr("disabled","disabled");

                $quantityInput.val(new_val);

                // Recalculate Price
                $quantityInput.change();

                setTimeout( function() {
                    $quantityInput.attr("disabled", false)
                }, disable_time);

                // If volume is zero => remove item from basket
            } else {

                this.deleteProduct(that, $product );
            }
        }
    };

    Cart.prototype.onChangeProductQuantity = function( that, $input, $product ) {
        var $deferred = $.Deferred(),
            $sum_wrapper = that.storage.getProductTotal($product),
            product_quantity = parseInt( $input.val() ),
            request_data;

        // Check for STRING Data at Quantity Field
        if ( isNaN( product_quantity ) ) {
            product_quantity = 1;
        }
        $input.val( product_quantity );

        // Data for Request
        request_data  = {
            html: 1,
            id: $product.data('id'),
            quantity: product_quantity
        };

        // If Quantity 1 or more
        if (product_quantity > 0) {

            $.post("save/", request_data, function (response) {
                $deferred.resolve(response);
            }, "json");

            $deferred.done( function(response) {
                $sum_wrapper.html( response.data.item_total );

                if (response.data.q) {
                    $input.val( response.data.q );
                }

                if (response.data.error) {
                    $input.addClass(that.storage.hasErrorClass);

                    // at Future make it better ( renderErrors(errors) )
                    alert(response.data.error);

                } else {

                    $input.removeClass(that.storage.hasErrorClass);

                }

                that.updateCart(that, $product, response.data);
            });

        // Delete Product
        } else if (product_quantity == 0) {
            that.deleteProduct(that, $product );
        }
    };

    Cart.prototype.deleteProduct = function(that, $product ) {
        var $deferred = $.Deferred(),
            request_data = {
                html: 1,
                id: $product.data('id')
            };

        $.post("delete/", request_data, function (response) {
            $deferred.resolve(response);
        }, "json");

        $deferred.done( function(response) {
            if (response.data.count == 0) {
                location.reload();
            } else {
                $product.remove();
                that.updateCart(that, $product, response.data);
            }
        });

    };

    // Initialize
    return Cart;

})(jQuery);