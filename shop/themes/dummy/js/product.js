// Product Class
var Product = ( function($) {

    Product = function($form, options) {
        var that = this;

        // DOM
        that.$form = $form;
        that.add2cart = that.$form.find(".add2cart");
        that.button = that.add2cart.find("input[type=submit]");
        that.$price = that.add2cart.find(".price");
        that.$quantity = that.$form.find("#product-quantity-field");

        // VARS
        that.is_dialog = ( options["is_dialog"] || false );
        that.volume = 1;
        that.price = parseFloat( that.$price.data("price") );

        // OPTIONS
        for (var k in options) {
            if (options.hasOwnProperty(k)) {
                that[k] = options[k];
            }
        }

        that.initProduct();
    };

    //
    Product.prototype.initProduct = function() {
        var that = this;

        //
        that.bindEvents();

        //
        $("#product-skus input[type=radio]:checked").click();

        that.$form.find(".sku-feature:first").change();

        if (!that.$form.find(".skus input:radio:checked").length) {
            that.$form.find(".skus input:radio:enabled:first").attr('checked', 'checked');
        }

    };

    //
    Product.prototype.bindEvents = function() {
        var that = this;

        // add to cart block: services
        that.$form.find(".services input[type=checkbox]").on("click", function () {
            that.onServiceClick( $(this) );
        });

        that.$form.find(".services .service-variants").on("change", function () {
            //
            that.cartButtonVisibility(true);
            //
            that.updatePrice();
        });

        that.$form.find('.inline-select a').on("click", function () {
            that.onSelectClick( $(this) );
            return false;
        });

        that.$form.find(".skus input[type=radio]").on("click", function () {
            that.onSkusClick( $(this) );
        });

        that.$form.find(".sku-feature").change( function () {
            that.onSkusChange( $(this) );
        });

        that.$form.on("submit", function () {
            that.onFormSubmit( $(this) );
            return false;
        });

        // END ----------------------------

        // Click on "+" button
        that.$form.find(".quantity-wrapper .increase-volume").on("click", function() {
            that.increaseVolume( true );
            return false;
        });

        // Click on "-" button
        that.$form.find(".quantity-wrapper .decrease-volume").on("click", function() {
            that.increaseVolume( false );
            return false;
        });

        // Change volume field
        that.$quantity.on("change", function() {
            that.prepareChangeVolume( $(this) );
            return false;
        });

    };

    //
    Product.prototype.onFormSubmit = function( $form ) {
        var that = this,
            href = $form.attr('action') + '?html=1',
            dataArray = $form.serialize();

        $.post(href, dataArray, function (response) {

            if (response.status == 'ok') {
                //
                that.cartButtonVisibility(false);

                if (that.is_dialog) {
                    $("#s-dialog-wrapper").trigger("addedToCart");
                }

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

                if (response.data.error) {
                    alert(response.data.error);
                }

            } else if (response.status == 'fail') {
                alert(response.errors);
            }

        }, "json");
    };

    //
    Product.prototype.onSkusChange = function() {
        var that = this,
            key = "",
            sku;

        that.$form.find(".sku-feature").each( function () {
            var $input = $(this);

            key += $input.data("feature-id") + ':' + $input.val() + ';';
        });

        sku = that.features[key];

        if (sku) {

            //
            that.updateSkuServices(sku.id);

            //
            if (sku.available) {
                that.button.removeAttr('disabled');

            } else {
                that.$form.find("div.s-stocks-wrapper div").hide();
                that.$form.find(".sku-no-stock").show();
                that.button.attr('disabled', 'disabled');
            }

            //
            that.$price.data('price', sku.price);

            //
            that.updatePrice(sku.price, sku.compare_price);

        } else {
            //
            that.$form.find("div.s-stocks-wrapper div").hide();
            //
            that.$form.find(".sku-no-stock").show();
            //
            that.button.attr('disabled', 'disabled');
            //
            that.add2cart.find(".compare-at-price").hide();
            //
            that.$price.empty();
        }

        //
        that.cartButtonVisibility(true);
    };

    //
    Product.prototype.onSkusClick = function( $link ) {
        var that = this,
            sku_id = $link.val();

        if ($link.data('image-id')) {
            //$("#product-image-" + $(this).data('image-id')).click();
        }

        if ($link.data('disabled')) {
            that.button.attr('disabled', 'disabled');
        } else {
            that.button.removeAttr('disabled');
        }

        //
        that.updateSkuServices(sku_id);
        //
        that.cartButtonVisibility(true);
        //
        that.updatePrice();
    };

    //
    Product.prototype.onSelectClick = function( $link ) {
        var $select = $link.closest('.inline-select'),
            data = $link.data("value");

        //
        $select.find('a.selected').removeClass('selected');
        //
        $link.addClass('selected');
        //
        $select.find('.sku-feature')
            .val(data)
            .change();
    };

    //
    Product.prototype.onServiceClick = function( $input ) {
        var that = this,
            $select = $("select[name=\"service_variant[" + $input.val() + "]\"]");

        if ($select.length) {
            if ( $input.is(":checked") ) {
                $select.removeAttr("disabled");

            } else {
                $select.attr("disabled", "disabled");
            }
        }

        //
        that.cartButtonVisibility(true);
        //
        that.updatePrice();
    };

    // Preparing to change volume
    Product.prototype.prepareChangeVolume = function( $input ) {
        var that = this,
            new_volume = parseFloat( $input.val() );

        // AntiWord at Field
        if (new_volume) {
            $input.val( new_volume );
            that.changeVolume( new_volume );

        } else {
            $input.val( that.volume );
        }
    };

    // Change Volume
    Product.prototype.changeVolume = function( type ) {
        var that = this,
            $volume_input = $("#product-quantity-field"),
            current_val = parseInt( $volume_input.val() ),
            input_max_data = parseInt($volume_input.data("max-quantity")),
            max_val = ( isNaN(input_max_data) || input_max_data === 0 ) ? Infinity : input_max_data,
            new_val;

        if ( type > 0 && type !== that.volume ) {
            if (current_val <= 0) {
                if ( that.volume > 1 ) {
                    new_val = 1;
                }

            } else if (current_val > max_val) {
                if ( that.volume != max_val ) {
                    new_val = max_val;
                }

            } else {
                new_val = current_val;
            }
        }

        // Set product data
        if (new_val) {
            that.volume = new_val;

            // Set new value
            $volume_input.val(new_val);

            // Update Price
            that.updatePrice();
        }
    };

    Product.prototype.increaseVolume = function( type ) {
        var that = this,
            new_val;

        // If click "+" button
        if ( type ) {
            new_val = that.volume + 1;

        } else {
            new_val = that.volume - 1;
        }

        that.$quantity
            .val(new_val)
            .trigger("change");

    };

    // Replace price to site format
    Product.prototype.currencyFormat = function (number, no_html) {
        // Format a number with grouped thousands
        //
        // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +	 bugfix by: Michael White (http://crestidg.com)

        var that = this;
        var i, j, kw, kd, km;
        var decimals = that.currency.frac_digits;
        var dec_point = that.currency.decimal_point;
        var thousands_sep = that.currency.thousands_sep;

        // input sanitation & defaults
        if( isNaN(decimals = Math.abs(decimals)) ){
            decimals = 2;
        }
        if( dec_point == undefined ){
            dec_point = ",";
        }
        if( thousands_sep == undefined ){
            thousands_sep = ".";
        }

        i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

        if( (j = i.length) > 3 ){
            j = j % 3;
        } else{
            j = 0;
        }

        km = (j ? i.substr(0, j) + thousands_sep : "");
        kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
        //kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).slice(2) : "");
        kd = (decimals && (number - i) ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");

        number = km + kw + kd;
        var s = no_html ? that.currency.sign : that.currency.sign_html;
        if (!that.currency.sign_position) {
            return s + that.currency.sign_delim + number;
        } else {
            return number + that.currency.sign_delim + s;
        }
    };

    //
    Product.prototype.serviceVariantHtml= function (id, name, price) {
        var that = this;
        return $('<option data-price="' + price + '" value="' + id + '"></option>').text(name + ' (+' + that.currencyFormat(price, 1) + ')');
    };

    //
    Product.prototype.updateSkuServices = function(sku_id) {
        var that = this,
            $form = that.$form,
            $skuStock = $form.find(".sku-" + sku_id + "-stock"),
            sku_count = $skuStock.data("sku-count");

        if ( !(sku_count && sku_count > 0) ) {
            sku_count = null;
        }

        // Hide others
        $form.find("div.s-stocks-wrapper div").hide();

        // Show
        $skuStock.show();

        that.volume = 1;

        that.$quantity
            .val(that.volume)
            .trigger("change")
            .data("max-quantity", sku_count);

        for (var service_id in that.services[sku_id]) {

            var v = that.services[sku_id][service_id];

            if (v === false) {
                $form.find(".service-" + service_id).hide().find('input,select').attr('disabled', 'disabled').removeAttr('checked');

            } else {
                $form
                    .find(".service-" + service_id)
                        .show()
                        .find('input')
                            .removeAttr('disabled');

                if (typeof (v) == 'string') {
                    $form.find(".service-" + service_id + ' .service-price').html( that.currencyFormat(v) );
                    $form.find(".service-" + service_id + ' input').data('price', v);

                } else {

                    var select = $form.find(".service-" + service_id + ' .service-variants');
                    var selected_variant_id = select.val();

                    for (var variant_id in v) {
                        var obj = select.find('option[value=' + variant_id + ']');

                        if (v[variant_id] === false) {
                            obj.hide();

                            if (obj.attr('value') == selected_variant_id) {
                                selected_variant_id = false;
                            }

                        } else {

                            if (!selected_variant_id) {
                                selected_variant_id = variant_id;
                            }

                            obj.replaceWith(that.serviceVariantHtml(variant_id, v[variant_id][0], v[variant_id][1]));
                        }
                    }

                    $form.find(".service-" + service_id + ' .service-variants').val(selected_variant_id);
                }
            }
        }
    };

    // Update Price
    Product.prototype.updatePrice = function (price, compare_price) {
        var that = this,
            $compare = that.add2cart.find(".compare-at-price");

        // Price for One item
        if (price === undefined) {
            var input_checked = that.$form.find(".skus input:radio:checked");

            if (input_checked.length) {
                price = parseFloat(input_checked.data('price'));
            } else {
                price = that.price;
            }

        } else {
            that.price = price;
        }

        // Increase price * volume
        price = price * that.volume;

        // Compare Price
        if ($compare.length) {
            compare_price = $compare.data("compare-price") * that.volume;
        }

        // Adding price for service
        that.$form.find(".services input:checked").each(function () {
            var s = $(this).val(),
                service_price;

            if (that.$form.find('.service-' + s + '  .service-variants').length) {
                service_price = parseFloat( that.$form.find('.service-' + s + '  .service-variants :selected').data('price') );
            } else {
                service_price = parseFloat( $(this).data('price') );
            }

            price += service_price * that.volume;

            if ($compare.length) {
                compare_price += service_price;
            }
        });

        // Render Price
        that.$price.html( that.currencyFormat(price) );

        if ($compare.length) {
            $compare.html(that.currencyFormat(compare_price));
        }
    };

    // toggles "Add to cart" / "%s is now in your shopping cart" visibility status
    Product.prototype.cartButtonVisibility = function(visible) {
        var that = this,
            $formButton = that.add2cart.find(".add-form-wrapper"),
            $addedInfo = that.add2cart.find('.added2cart');

        if (visible) {
            $formButton.show();
            $addedInfo.hide();
        } else {
            $formButton.hide();
            $addedInfo.show();
        }
    };

    return Product

})(jQuery);

