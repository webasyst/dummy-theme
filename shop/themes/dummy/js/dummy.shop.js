// Shop :: General Layout
( function($) {

    var bindEvents = function() {

        $(".auth-type-wrapper a").on("click", function() {
            onProviderClick( $(this) );
            return false;
        });

        $("#show-sidebar-link").on("click", function() {
            toggleSidebar();
        })

    };

    var onProviderClick = function( $link ) {
        var $li = $link.closest("li"),
            provider = $li.data("provider");

        if (provider != 'guest' && provider != 'signup') {
            var left = (screen.width-600)/ 2,
                top = (screen.height-400)/ 2,
                href = $link.attr("href");

            if ( ( typeof require_authorization !== "undefined" ) && !require_authorization) {
                href = href + "&guest=1";
            }

            openWindow(href, "oauth", "width=600,height=400,left="+left+",top="+top+",status=no,toolbar=no,menubar=no");
        }

    };

    var toggleSidebar = function() {
        var $wrapper = $(".site-wrapper"),
            activeClass = "sidebar-is-shown";

        $wrapper.toggleClass(activeClass);
    };

    var openWindow = function( href, win_name, params) {
        window.open(href, win_name, params);
    };

    $(document).ready( function() {
        bindEvents();
    });

})(jQuery);

// Captcha :: Refresh
( function($) {

    var bindEvents = function() {

        // Click on refresh button or image
        $(".wa-captcha").on("click", ".wa-captcha-refresh, .wa-captcha-img", function() {
            refreshCaptcha( $(this) );
            return false;
        });

    };

    // Refresh Captcha
    var refreshCaptcha = function( $target ) {
        var $wrapper = $target.closest(".wa-captcha"),
            captcha = $wrapper.find(".wa-captcha-img");

        if (captcha.length) {
            var newCaptchaHref = captcha.attr("src").replace( /\?.*$/,'?rid='+Math.random() );

            captcha.attr("src", newCaptchaHref);

            captcha.one("load", function() {
                $wrapper.find('.wa-captcha-input').focus();
            });
        }

        $wrapper.find("input").val("");
    };

    $(document).ready( function() {
        bindEvents();
    });

})(jQuery);

// Checkout Marking Active Options
( function($) {

    var storage = {
        activeStepClass: "is-selected",
        getCheckoutOptions: function() {
            return $(".checkout-options li");
        }
    };

    var initialize = function() {
        var $checkoutOptions = storage.getCheckoutOptions();

        $checkoutOptions.find("input[type=\"radio\"]").each( function() {
            var $input = $(this),
                is_active = ( $(this).attr("checked") === "checked" );

            if (is_active) {
                markOption( $input );
            }
        });
    };

    var bindEvents = function() {
        var $checkoutOptions = storage.getCheckoutOptions();

        $checkoutOptions.find("input[type=\"radio\"]").on("click", function() {
            markOption( $(this) );
        });

    };

    var markOption = function( $input ) {
        var $wrapper = $input.closest("li"),
            $checkoutOptions = storage.getCheckoutOptions();

        // Clear class for all
        $checkoutOptions.removeClass(storage.activeStepClass);

        // Mark this
        $wrapper.addClass(storage.activeStepClass);
    };

    $(document).ready( function() {
        //
        initialize();
        //
        bindEvents();
    });

})(jQuery);

// Shop :: Product Page :: Tabs
( function($) {
    var storage = {
        shown_class: "is-shown",
        active_class: "is-active",
        getWrapper: function() {
            return $("#s-product-info");
        },
        getTabWrapper: function() {
            return this.getWrapper().find(".s-tabs-wrapper");
        },
        getTabListItems: function() {
            return this.getTabWrapper().find(".s-tab-item");
        },
        getTabContentItems: function() {
            return this.getWrapper().find(".s-tabs-content .s-tab-content");
        }
    };

    var bindEvents = function() {
        var $tabItems = storage.getTabListItems();

        $tabItems.on("click", function() {
            var $tab = $(this),
                content_id = $tab.data("content-id");

            if (content_id) {
                showTabContent( $tab, content_id );
                return false;
            }
        });
    };

    var showTabContent = function($tab_link, content_id ) {
        var $content = $("#tab-content-"+content_id),
            $tabs = storage.getTabListItems(),
            $content_item = storage.getTabContentItems();

        // hide old content
        $content_item.removeClass(storage.shown_class);

        // show current content
        $content.addClass(storage.shown_class);

        // unmark old tab
        $tabs.removeClass(storage.active_class);

        // mark current tab
        $tab_link.addClass(storage.active_class);
    };

    $(document).ready( function() {
        bindEvents();
    });

})(jQuery);

// Shop :: Compare Counter
( function($) {
    $(document).ready( function() {

        var $wrapper = $("#s-compare-counter"),
            empty_class = "is-empty";

        $wrapper.on("checkCompare", function() {
            checkCompare();
        });

        function checkCompare() {
            var compare = $.cookie('shop_compare'),
                count;

            compare = (compare) ? compare.split(',') : [];
            count = compare.length;

            if (count > 0) {
                $wrapper.find(".s-compare-count").text(count);
                $wrapper.removeClass(empty_class);
            } else {
                $wrapper.addClass(empty_class);
            }
        }

        checkCompare();
    });
})(jQuery);

// Shop :: Change Currency
( function($) {
    $(document).ready( function () {
        $("#currency").change( function () {
            var href = location.href,
                url = (href.indexOf('?') == -1) ? href += '?' : href += '&';

            location.href = url + 'currency=' + $(this).val();
        });
    });
})(jQuery);

// Shop :: Change Language
( function($) {
    $(document).ready( function () {
        $("#language").change(function () {
            var href = location.href,
                url = (href.indexOf('?') == -1) ? href += '?' : href += '&';
            location.href = url + 'locale=' + $(this).val();
        });
    });
})(jQuery);

// Shop :: Header Catalog List
var CatalogList = ( function($) {

    CatalogList = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];
        that.$button = that.$wrapper.find(".s-catalog-button");
        that.$list = that.$wrapper.find(".s-catalog-list");

        // VARS
        that.open_class = "is-opened";

        // DYNAMIC VARS
        that.is_opened = false;
        that.is_mobile = false;

        // INIT
        that.initClass();
    };

    CatalogList.prototype.initClass = function() {
        var that = this,
            button = that.$button[0];

        that.$button.on("mouseenter", onMouseEnter);
        that.$wrapper.on("mouseleave", onMouseLeave);

        button.addEventListener("touchstart", function () {
            if (!that.is_mobile) {
                that.$button.off("mouseenter", onMouseEnter);
                that.$wrapper.off("mouseleave", onMouseLeave);
                that.is_mobile = true;
            }
            that.toggleView();
        });

        function onMouseEnter() {
            that.toggleView("show");
        }

        function onMouseLeave() {
            that.toggleView("hide");
        }
    };

    CatalogList.prototype.toggleView = function( show ) {
        var that = this,
            show_list;

        if (show) {
            if (show == "show") {
                show_list = true;
            } else if (show == "hide") {
                show_list = false;
            }
        } else {
            show_list = !that.is_opened;
        }

        if (show_list) {
            that.$wrapper.addClass(that.open_class);
            that.is_opened = true;
        } else {
            that.$wrapper.removeClass(that.open_class);
            that.is_opened = false;
        }
    };

    return CatalogList;

})(jQuery);

// Shop :: Header Cart Counter
var updateHeaderCart = ( function($) {

    $(document).ready( function() {
        var $cart = $("#s-cart-wrapper"),
            $counter = $cart.find(".s-cart-count"),
            $price = $cart.find(".s-text-wrapper .s-text"),
            empty_class = "is-empty";

        updateHeaderCart = function(options) {
            var text = options["text"],
                count = options["count"];

            if (count > 0) {
                $cart.removeClass(empty_class);
                $price.html(text);
                $counter.html(count);

            } else {
                $cart.addClass(empty_class);
            }
        };

        return updateHeaderCart;

    });

})(jQuery);

// Shop :: Product Page :: Product Photos Class
var ProductPhotos = ( function($) {

    function getImageArray($links) {
        var imageArray = [];

        $links.each( function() {
            var image_src = $(this).attr("href");
            if (image_src) {
                imageArray.push(image_src);
            }
        });

        return imageArray;
    }

    ProductPhotos = function() {
        var that = this;

        that.$mainLink = $("#s-photo-main");
        that.$thumbs = $("#s-photos-list");
        that.$thumbsLinks = that.$thumbs.find("a");

        // VARS
        that.active_class = "is-selected";
        that.imageArray = getImageArray( that.$thumbsLinks );

        // DYNAMIC VARS
        that.active_index = 0;
        that.$activeLink = false;

        // INIT
        that.bindEvents();
    };

    ProductPhotos.prototype.bindEvents = function() {
        var that = this;

        // EVENTS
        that.$thumbs.on("click", "a", function() {
            that.setPhoto( $(this) );
            return false;
        });

        that.$mainLink.on("click", function() {
            that.showSwipeBox();
            return false;
        });
    };

    ProductPhotos.prototype.setPhoto = function( $link ) {
        var that = this,
            big_photo_src = $link.attr("href"),
            index = $link.data("index"),
            active_class = that.active_class;

        // Marking
        if (that.$activeLink) {
            that.$activeLink.removeClass(active_class)
        } else {
            that.$thumbs.find("." + active_class).removeClass(active_class);
        }
        $link.addClass(active_class);

        // Change main photo
        that.$mainLink.attr("href", big_photo_src)
            .find("img").attr("src", big_photo_src);

        // Save data
        that.active_index = index;
        that.$activeLink = $link;
    };

    ProductPhotos.prototype.showSwipeBox = function() {
        var that = this,
            before = [],
            after = [],
            images;

        $.each(that.imageArray, function(index, image_src) {
            var image = {
                href: image_src,
                index: index
            };

            if (index >= that.active_index) {
                before.push(image);
            } else {
                after.push(image);
            }
        });

        images = before.concat(after);

        $.swipebox( images, {
            hideBarsDelay: false
        });

        // Close on scroll
        $(window).one("scroll", function() {
            var $swipebox = $.swipebox;
            if ($swipebox.isOpen) {
                $swipebox.close();
            }
        });
    };

    return ProductPhotos;

})(jQuery);

// Shop :: Dialog Class
var Dialog = ( function($) { "use strict";

    Dialog = function(options) {
        var that = this;

        // LOAD
        that.html = ( options['html'] || false );
        that.$body = $("body");
        that.loadContent();

        // DOM
        that.$dialog = $("#s-dialog-wrapper");
        that.$content = $("#s-dialog-content");
        that.$closeLink = that.$dialog.find(".s-close-dialog");

        // VARS
        that.onClose = ( options['onClose'] || false );
        that.onCancel = ( options['onClose'] || false );
        that.dialog_shown = "dialog-is-show";

        // DYNAMIC VARS

        // INIT
        that.initDialog();

        return that;
    };

    Dialog.prototype.initDialog = function() {
        var that = this;

        that.showDialog();

        that.bindEvents();
    };

    Dialog.prototype.bindEvents = function() {
        var that = this,
            $dialog = that.$dialog,
            $content = that.$content,
            $closeLink = that.$closeLink;

        $dialog.on("click", function() {
            $dialog.trigger("closeDialog");
            $dialog.trigger("onCancel");
        });

        $closeLink.on("click", function() {
            $dialog.trigger("closeDialog");
            return false;
        });

        $content.on("click", function(event) {
            event.stopPropagation();
        });

        // Custom events

        $dialog.on("closeDialog", function() {
            that.closeDialog();
        });

        $dialog.on("onClose", function() {
            if (that.onClose && (typeof that.onClose == "function") ) {
                that.onClose();
            }
        });

        $dialog.on("onCancel", function() {
            if (that.onCancel && (typeof that.onCancel == "function") ) {
                that.onCancel();
            }
        });
    };

    Dialog.prototype.loadContent = function() {
        var that = this,
            html = that.html,
            $dialog;

        $dialog = $('<div class="s-dialog-wrapper" id="s-dialog-wrapper"><div class="s-dialog-content" id="s-dialog-content">' + html +'</div></div>');

        $("#s-dialog-wrapper").remove();

        that.$body.append($dialog);
    };

    Dialog.prototype.showDialog = function() {
        var that = this;

        that.$body
            .addClass(that.dialog_shown)
            .append( that.$dialog );
    };

    Dialog.prototype.closeDialog = function() {
        var that = this;

        that.$dialog.trigger("onClose");

        that.$dialog.remove();

        that.$body.removeClass(that.dialog_shown);
    };

    return Dialog;

})(jQuery);

// Shop :: Lazy Loading
var LazyLoading = ( function($) {

    var onScroll;

    LazyLoading = function(options) {
        var that = this;

        // VARS
        that.list_name = options["names"]["list"];
        that.items_name = options["names"]["items"];
        that.pagind_name = options["names"]["paging"];
        that.load_class = "is-loading";

        // DOM
        that.$wrapper = ( options["$wrapper"] || false );
        that.$list = that.$wrapper.find(that.list_name);
        that.$window = $(window);

        // DYNAMIC VARS
        that.$paging = that.$wrapper.find(that.pagind_name);

        // INIT
        that.initLazyLoading();
    };

    LazyLoading.prototype.initLazyLoading = function() {
        var that = this;

        that.addWatcher();
    };

    LazyLoading.prototype.addWatcher = function() {
        var that = this;

        onScroll = function() {
            that.onScroll();
        };

        that.$window.on("scroll", onScroll);
    };

    LazyLoading.prototype.stopWatcher = function() {
        var that = this;

        if (typeof onScroll == "function") {
            that.$window.off("scroll", onScroll);
        }
    };

    LazyLoading.prototype.onScroll = function() {
        var that = this,
            $window = that.$window,
            scroll_top = $window.scrollTop(),
            display_height = $window.height(),
            paging_top = that.$paging.offset().top;

        // If we see paging, stop watcher and run load
        if (scroll_top + display_height >= paging_top) {
            that.stopWatcher();
            that.loadNextPage();
        }
    };

    LazyLoading.prototype.loadNextPage = function() {
        var that = this,
            next_page_url = getNextUrl(),
            $paging = that.$paging;

        function getNextUrl() {
            var $nextPage = that.$paging.find(".selected").next(),
                result = false;

            if ($nextPage.length) {
                result = $nextPage.find("a").attr("href");
            }

            return result;
        }

        function showLoad() {
            var $loading = '<div class="s-loading-wrapper"><i class="icon16 loading"></i>&nbsp;' + $paging.data("loading-text") + '</div>';

            $paging
                .addClass(that.load_class)
                .append($loading);
        }

        if (next_page_url) {

            showLoad();

            $.get(next_page_url, function(response) {
                var $category = $(response),
                    $newItems = $category.find(that.list_name + " " + that.items_name),
                    $newPaging = $category.find(that.pagind_name);

                that.$list.append($newItems);

                $paging.after($newPaging);

                $paging.remove();

                that.$paging = $newPaging;

                that.addWatcher();
            });
        }
    };

    return LazyLoading;

})(jQuery);

// Shop :: Promo CountDown
var CountDown = ( function($) {

    CountDown = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];

        // VARS
        that.start = options["start"];
        that.end = options["end"];
        that.format = "%days%:%hours%:%minutes%:%seconds%";

        // DYNAMIC VARS
        that.period = that.getPeriod();
        that.time_period = null;
        that.timer = 0;

        // INIT
        that.run();
    };

    CountDown.prototype.getPeriod = function() {
        var that = this,
            start_date = new Date( that.start ),
            end_date = new Date( that.end );

        return (end_date > start_date) ? (end_date - start_date) : 0;
    };

    CountDown.prototype.getData = function() {
        var that = this,
            period = that.period;

        var second = 1000,
            minute = second * 60,
            hour = minute * 60,
            day = hour * 24,
            residue;

        var days = Math.floor(period/day);
        residue = ( period - days * day );

        var hours = Math.floor(residue/hour);
        residue = ( residue - hours * hour );

        var minutes = Math.floor(residue/minute);
        residue = ( residue - minutes * minute );

        var seconds = Math.floor(residue/second);

        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        }
    };

    CountDown.prototype.getTime = function() {
        var that = this,
            data = that.getData(),
            result = that.format;

        return result
            .replace("%days%", (data.days < 10) ? "0" + data.days : data.days)
            .replace("%hours%", (data.hours < 10) ? "0" + data.hours : data.hours)
            .replace("%minutes%", (data.minutes < 10) ? "0" + data.minutes : data.minutes)
            .replace("%seconds%", (data.seconds < 10) ? "0" + data.seconds : data.seconds);
    };

    CountDown.prototype.run = function() {
        var that = this,
            timer = 1000;

        if (that.period > 0) {
            var time = that.getTime();

            that.$wrapper.html(time);

            that.period -= timer;

            if (that.period > 0) {
                that.timer = setTimeout( function () {
                    that.run();
                }, timer);
            }

        } else {
            that.destroy();
        }
    };

    CountDown.prototype.destroy = function() {
        var that = this;

        that.$wrapper.remove();
    };

    return CountDown;

})(jQuery);
