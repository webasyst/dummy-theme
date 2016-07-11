// Photos :: Lazy Loading
var LazyLoading = ( function($) {

    var onScroll;

    LazyLoading = function(options) {
        var that = this;

        // VARS
        that.list_name = options["names"]["list"];
        that.items_name = options["names"]["items"];
        that.pagind_name = options["names"]["paging"];
        that.load_class = "is-loading";

        //
        that.onLoad = (options.onLoad || false);

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
            is_paging_exist = ( $.contains(document, that.$paging[0]) );

        if (is_paging_exist) {

            var $window = that.$window,
                scroll_top = $window.scrollTop(),
                display_height = $window.height(),
                paging_top = that.$paging.offset().top;

            // If we see paging, stop watcher and run load
            if (scroll_top + display_height >= paging_top) {
                that.stopWatcher();
                that.loadNextPage();
            }

        } else {
            that.stopWatcher();
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

                if (that.onLoad && typeof that.onLoad == "function") {
                    that.onLoad();
                }
            });
        }
    };

    return LazyLoading;

})(jQuery);

// Photos :: Photo List
var PhotoList = ( function($) {

    PhotoList = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];

        // VARS
        that.useLazy = options.useLazy;
        that.useWookmark = ( options.useWookmark || false );

        // DYNAMIC VARS
        that.wookmark = false;

        // INIT
        that.initClass();
    };

    PhotoList.prototype.initClass = function() {
        var that = this;

        if (that.useWookmark) {
            that.initWookmark();
        }

        if (that.useLazy) {
            new LazyLoading({
                $wrapper: that.$wrapper,
                names: {
                    list: ".p-photo-list",
                    items: ".p-photo-item",
                    paging: ".p-paging-wrapper"
                },
                onLoad: function() {
                    if (that.useWookmark) {
                        that.updateWookmark();
                    }
                }
            });
        }
    };

    PhotoList.prototype.initWookmark = function() {
        var that = this,
            options = {
                offset: 0,
                resizeDelay: 0
            };

        that.wookmark = new Wookmark(that.$wrapper.find(".p-photo-list")[0], options);

        that.useImageWatcher();
    };

    PhotoList.prototype.updateWookmark = function() {
        var that = this;

        that.wookmark.clear();
        that.initWookmark();
    };

    PhotoList.prototype.useImageWatcher = function() {
        var that = this,
            load_class = "is-image-loading",
            watch_class = "use-watcher",
            $photos = that.$wrapper.find(".p-photo-item." + load_class);

        $photos.each( function() {
            var $photo = $(this);

            if ( !$photo.hasClass(watch_class) ) {

                $photo.addClass(watch_class);

                var photo_url = $photo.find("img").attr("src");

                var $image = $("<img />");
                $image.on("load", function() {
                    $photo
                        .removeClass(load_class)
                        .removeClass(watch_class);
                    that.wookmark.updateOptions();
                });
                $image.attr("src", photo_url);
            }

        });
    };

    return PhotoList;

})(jQuery);