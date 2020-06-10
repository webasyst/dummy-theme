// Product Class
var Product = ( function($) {

    Product = function(options) {
        var that = this;

        // DOM
        that.$form = options["$form"];
        that.add2cart = that.$form.find(".add2cart");
        that.$button = that.add2cart.find("input[type=submit]");
        that.$price = that.add2cart.find(".price");
        that.$comparePrice = that.add2cart.find(".compare-at-price");
        that.$quantity = that.$form.find(".product-quantity-field");

        // VARS
        that.is_dialog = ( options["is_dialog"] || false );
        that.volume = 1;
        that.currency = options["currency"];
        that.services = options["services"];
        that.features = options["features"];
        that.skus = options["skus"];
        that.default_sku_features = options["default_sku_features"];

        // DYNAMIC VARS
        that.price = parseFloat( that.$price.data("price") );
        that.compare_price = parseFloat( that.$comparePrice.data("compare-price") );

        // INIT
        that.initProduct();
    };

    //
    Product.prototype.initProduct = function() {
        var that = this;

        //
        that.bindEvents();

        var $selected = that.$form.find(".inline-select .selected");
        if ($selected.length) {
            $selected.trigger("click");
        } else {
            initFirstSku();
        }

        function initFirstSku() {
            var $skuFeature = that.$form.find(".sku-feature:first"),
                is_buttons_view_type = $skuFeature.length;

            // for sku buttons type
            if (is_buttons_view_type) {
                initFirstButton( $skuFeature );

            // for sku radio type
            } else {
                var $radio = getRadioInput();
                if ($radio) {
                    $radio.click();
                }
            }

            function getRadioInput() {
                var $radios = that.$form.find(".skus input[type=radio]"),
                    result = false;

                $.each($radios, function() {
                    var $radio = $(this),
                        is_enabled = !( $radio.attr("disabled") && ($radio.attr("disabled") == "disabled") ),
                        is_checked = ( $radio.attr("checked") && ($radio.attr("checked") == "checked") );

                    if ( is_enabled && (!result || is_checked) ) {
                        result = $radio;
                    }
                });

                return result;
            }

            function initFirstButton( $skuFeature ) {
                var $wrapper = that.$form.find(".s-options-wrapper"),
                    is_select =  $wrapper.find("select").length;

                if (is_select) {
                    $skuFeature.change();

                } else {
                    var $groups = $wrapper.find(".inline-select"),
                        groups = getGroupsData( $groups ),
                        availableSku = getAvailableSku( groups );

                    if (availableSku) {
                        $.each(availableSku.$links, function() {
                            $(this).click();
                        });
                    }

                    function getGroupsData( $groups ) {
                        var result = [];

                        $.each($groups, function() {
                            var $group = $(this),
                                $links = $group.find("a"),
                                linkArray = [];

                            $.each($links, function() {
                                var $link = $(this),
                                    id = $link.data("sku-id");

                                linkArray.push({
                                    id: id,
                                    $link: $link
                                });
                            });

                            result.push(linkArray);
                        });

                        return result;
                    }

                    function getAvailableSku( groups ) {
                        function selectionIsGood(prefix) {
                            var skuData = getSkuData( prefix ),
                                sku = checkSku( skuData.id ),
                                result = false;

                            if (sku) {
                                result = {
                                    sku: sku,
                                    $links: skuData.$links
                                }
                            }
                            return result;
                        }

                        function getFirstWorking(groups, prefix) {
                            if (!groups.length) {
                                return selectionIsGood(prefix);
                            }

                            prefix = prefix || [];

                            var group = groups[0],
                                other_groups = groups.slice(1);

                            for (var i = 0; i < group.length; i++) {
                                var new_prefix = prefix.slice();
                                new_prefix.push(group[i]);
                                var result = getFirstWorking(other_groups, new_prefix);
                                if (result) {
                                    return result;
                                }
                            }

                            return null;
                        }

                        return getFirstWorking(groups);

                        function getSkuData( sku_array ) {
                            var id = [],
                                $links = [];

                            $.each(sku_array, function(index, item) {
                                id.push(item.id);
                                $links.push(item.$link);
                            });

                            return {
                                id: id.join(""),
                                $links: $links
                            };
                        }
                    }

                    function checkSku( skus_id ) {
                        var result = false;

                        if (that.features.hasOwnProperty(skus_id)) {
                            var sku = that.features[skus_id];
                            if (sku.available) {
                                result = sku;
                            }
                        }

                        return result;
                    }
                }
            }
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
        var that = this;

        // DOM
        var $form = that.$form,
            $button = that.$button;

        var key = getKey(),
            sku = that.features[key];

        var sku_id = null;

        if (sku) {

            //
            that.updateSkuServices(sku.id);

            sku_id = sku.id;

            //
            if (sku.image_id) {
                that.changeImage(sku.image_id);
            }

            //
            if (sku.available) {
                $button.removeAttr('disabled');

            } else {
                $form.find("div.s-stocks-wrapper div").hide();
                $form.find(".sku-no-stock").show();
                $button.attr('disabled', 'disabled');
            }

            //
            sku["compare_price"] = ( sku["compare_price"] ) ? sku["compare_price"] : 0 ;
            //
            that.updatePrice(sku["price"], sku["compare_price"]);

        } else {
            //
            $form.find("div.s-stocks-wrapper div").hide();
            //
            $form.find(".sku-no-stock").show();
            //
            $button.attr('disabled', 'disabled');
            //
            that.add2cart.find(".compare-at-price").hide();
            //
            that.$price.empty();
        }

        //
        that.cartButtonVisibility(true);

        that.$form.trigger("product_sku_changed", [sku_id, sku]);

        function getKey() {
            var result = "";

            $form.find(".sku-feature").each( function () {
                var $input = $(this);

                result += $input.data("feature-id") + ':' + $input.val() + ';';
            });

            return result;
        }
    };

    //
    Product.prototype.onSkusClick = function( $link ) {
        var that = this,
            sku_id = $link.val(),
            price = $link.data("price"),
            compare_price = $link.data("compare-price"),
            image_id = $link.data('image-id');

        var sku = (that.skus[sku_id] ? that.skus[sku_id] : null);
        if (!sku) { alert("SKU ERROR"); return false; }

        // DOM
        var $button = that.$button;

        if (image_id) {
            that.changeImage(image_id);
        }

        if ($link.data('disabled')) {
            $button.attr('disabled', 'disabled');
        } else {
            $button.removeAttr('disabled');
        }

        //
        that.updateSkuServices(sku_id);
        //
        that.cartButtonVisibility(true);
        //
        that.updatePrice(price, compare_price);
        //
        that.$form.trigger("product_sku_changed", [sku_id, sku]);
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
            $select = that.$form.find("select[name=\"service_variant[" + $input.val() + "]\"]");

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
            $quantity = that.$quantity,
            current_val = parseInt( $quantity.val() ),
            input_max_data = parseInt( $quantity.data("max-quantity")),
            max_val = ( isNaN(input_max_data) || input_max_data === 0 ) ? Infinity : input_max_data,
            new_val;

        if ( type > 0 && type !== that.volume ) {
            if (current_val <= 0) {
                if ( that.volume > 1 ) {
                    new_val = 1;
                }

            } else if (current_val >= max_val) {
                new_val = max_val;

            } else {
                new_val = current_val;
            }
        }

        // Set product data
        if (new_val) {
            that.volume = new_val;

            // Set new value
            $quantity.val(new_val);

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
            .data("max-quantity", sku_count)
            .trigger("change");

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

                if (typeof (v) === 'string' || typeof (v) === 'number') {
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
    Product.prototype.updatePrice = function(price, compare_price) {
        var that = this;

        var hidden_class = "is-hidden";

        // DOM
        var $form = that.$form,
            $price = that.$price,
            $compare = that.$comparePrice;

        // VARS
        var services_price = getServicePrice(),
            volume = that.volume,
            price_sum,
            compare_sum;

        //
        if (price) {
            that.price = price;
            $price.data("price", price);
        } else {
            price = that.price;
        }

        //
        if (compare_price >= 0) {
            that.compare_price = compare_price;
            $compare.data("price", compare_price);
        } else {
            compare_price = that.compare_price;
        }

        //
        price_sum = (price + services_price) * volume;
        compare_sum = (compare_price + services_price) * volume;

        // Render Price
        $price.html( that.currencyFormat(price_sum) );
        $compare.html( that.currencyFormat(compare_sum) );

        // Render Compare
        if (compare_price > 0) {
            $compare.removeClass(hidden_class);
        } else {
            $compare.addClass(hidden_class);
        }

        //
        function getServicePrice() {
            // DOM
            var $checkedServices = $form.find(".services input:checked");

            // DYNAMIC VARS
            var services_price = 0;

            $checkedServices.each( function () {
                var $service = $(this),
                    service_value = $service.val(),
                    service_price = 0;

                var $serviceVariants = $form.find(".service-" + service_value + " .service-variants");

                if ($serviceVariants.length) {
                    service_price = parseFloat( $serviceVariants.find(":selected").data("price") );
                } else {
                    service_price = parseFloat( $service.data("price") );
                }

                services_price += service_price;
            });

            return services_price;
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

    Product.prototype.changeImage = function( image_id ) {
        if (image_id) {
            var $imageLink = $("#s-image-" + image_id);
            if ($imageLink.length) {
                $imageLink.click();
            }
        }
    };

    return Product;

})(jQuery);

