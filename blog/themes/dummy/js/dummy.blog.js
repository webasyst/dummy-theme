// Blog :: CommentForm
var CommentForm = ( function($) {

    CommentForm = function(options) {
        var that = this;

        // DOM
        that.$formWrapper = options["$formWrapper"];
        that.$commentsWrapper = options["$commentsWrapper"];
        that.$form = that.$formWrapper.find("form");
        that.$guestAuth = that.$form.find(".b-guest-auth");
        that.$authProviders = that.$form.find(".b-auth-providers");
        that.$textarea = that.$formWrapper.find("textarea");
        that.$postWrapper = that.$form.closest(".b-post-wrapper");
        that.$post = that.$postWrapper.find(".b-post");


        // VARS
        that.selected_class = "is-selected";
        that.authorized = options["authorized"];
        that.auth_source = options["auth_source"];
        that.require_auth = options['$require_auth'];

        // DYNAMIC VARS
        that.is_locked = false;
        that.$activeProvider = false;

        // INIT
        that.bindEvents();
    };

    CommentForm.prototype.bindEvents = function() {
        var that = this;

        $(document).on("click", ".comment-reply", function () {
            that.onReply( $(this) );
            return false;
        });

        that.$form.on("click", ".b-cancel-button", function() {
            that.moveForm( that.$post, "", false);
            return false;
        });

        that.$form.on("submit", function() {
            if (!that.is_locked) {
                that.onSubmit();
            }
            return false;
        });

        that.$form.on("click", ".b-guest-provider a", function() {
            that.onProviderClick( $(this), true );
            return false;
        });

        that.$form.on("click", ".b-provider-link a", function() {
            that.onProviderClick( $(this) );
            return false;
        });
    };

    CommentForm.prototype.moveForm = function(target, id, set_focus) {
        var that = this;
        id = (id) ? id : "";

        $(".b-comment").removeClass("in-reply-to");

        // Refresh
        that.refreshForm( true );
        // Id
        that.$form.find("input[name=parent]").val( id );
        // Move
        that.$formWrapper.insertAfter(target);
        // Focus
        if (set_focus) {
            that.$textarea.focus();
        }
    };

    CommentForm.prototype.refreshForm = function(empty) {
        var that = this,
            $form = that.$form;

        $form.find(".errormsg").remove();
        $form.find(".error").removeClass("error");
        $form.find(".wa-captcha-refresh").click();

        if (empty) {
            $form[0].reset();
            $form.find("textarea").val("");
        }
    };

    CommentForm.prototype.onSubmit = function() {
        var that = this,
            $form = that.$form,
            href = $form.attr('action')+'?json=1',
            data = $form.serialize();

        that.is_locked = true;

        $.post(href, data, function(response){
            if ( response.status && response.status == 'ok' && response.data) {
                if (response.data.redirect) {
                    window.location.replace(response.data.redirect);
                    window.location.href = response.data.redirect;
                } else {
                    var $comment = $(response.data.template),
                        count_str = response.data["count_str"],
                        hidden_class = "is-hidden",
                        new_class = "is-new",
                        $target;

                    $target = that.$form.closest(".b-comment-wrapper");

                    // If first comment
                    if (!$target.length) {
                        that.$commentsWrapper.removeClass(hidden_class);
                        $target = that.$commentsWrapper.find(".b-comments");
                    }

                    // Render new comment
                    $target.append( $("<div class='b-comment-wrapper' />").append($comment) );

                    // marking
                    $comment.addClass(new_class);
                    setTimeout( function () {
                        $comment.removeClass(new_class);
                    }, 10000);

                    // scroll
                    $("html, body").animate({
                        scrollTop: $comment.offset().top - 100
                    }, 800);

                    // Reset comment form
                    that.refreshForm(true);
                    that.moveForm( that.$post, "", false);

                    // Change counter
                    $("#b-comments-count").html(count_str);

                    // Plugins
                    $comment.trigger("plugin.comment_add");
                }
            } else if ( response.status && response.status == 'fail' ) {
                // error
                that.refreshForm();

                var errors = response.errors;
                $(errors).each( function(){
                    var error = this;
                    for (var name in error) {
                        if (error.hasOwnProperty(name)) {
                            var elem = that.$form.find('[name='+name+']');
                            elem.after( $('<em class="errormsg"></em>').text(error[name]) ).addClass('error');
                        }
                    }
                });
            } else {
                that.refreshForm( false );
            }

            that.is_locked = false;

        }, "json").error(function(){
            that.refreshForm(false);
        });

    };

    CommentForm.prototype.onReply = function( $link ) {
        var that = this;

        var $comment = $link.closest(".b-comment"),
            comment_id = $comment.data("comment-id"),
            reply_class = "in-reply-to";

        that.moveForm( $link.closest(".b-actions"), comment_id, true);

        $(".b-comment").removeClass(reply_class);

        $comment.addClass(reply_class);
    };

    CommentForm.prototype.onProviderClick = function( $link, is_guest ) {
        var that = this,
            selected_class = that.selected_class,
            $li = $link.closest("li"),
            $captcha = that.$form.find(".wa-captcha"),
            $guestAuth = that.$guestAuth,
            $user = that.$form.find(".b-auth-user"),
            provider = $li.data("provider"),
            is_selected = $li.hasClass(selected_class);

        // Show window
        if (!is_selected && !is_guest &&  provider) {
            var width = 600,
                height = 400,
                left = (screen.width - width) / 2,
                top = (screen.height - height) / 2,
                href = (that.require_auth) ? $link.attr("href") + "&guest=1" : $link.attr("href");

            window.open(href,"oauth", "width=" + width + ",height=" + height + ",left="+left+",top="+top+",status=no,toolbar=no,menubar=no");
        }

        // Show captcha
        if (is_guest) {
            $guestAuth.show();
            $captcha.show();
            $user.hide();
        } else {
            $guestAuth.hide();
            $captcha.hide();
            $user.show();
        }

        // Render link
        if (that.$activeProvider) {
            that.$activeProvider.removeClass(selected_class);
        } else {
            that.$authProviders.find("." + selected_class).removeClass(selected_class);
        }
        $li.addClass(selected_class);
        that.$activeProvider = $li;

        // Set data
        that.$form.find("input[name=auth_provider]").val(provider);
    };

    return CommentForm;

})(jQuery);

// Blog :: Lazy Loading
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
            });
        }
    };

    return LazyLoading;

})(jQuery);

// Blog :: Post
var Post = ( function($) {

    Post = function(options) {
        var that = this;

        // DOM
        that.$wrapper = options["$wrapper"];

        // VARS
        that.search_query = ( options["search_query"] || false );
        that.is_review = ( options["is_review"] || false );
        that.use_retina = ( options["use_retina"] || false );

        // DYNAMIC VARS

        // INIT
        that.initClass();
    };

    Post.prototype.initClass = function() {
        var that = this;

        if (that.use_retina) {
            that.useRetina();
        }

        if (that.search_query) {
            that.highlightSearch( that.search_query );
        }
    };

    Post.prototype.useRetina = function() {
        var that = this,
            $images = that.$wrapper.find("img.retinify");

        if ($images.length && $.fn.retina) {
            $images.retina();
        }
    };

    Post.prototype.highlightSearch = function( query ) {
        var that = this,
            $nodes = that.$wrapper.find(".b-post-name, .b-content"),
            highlighted_class = "highlighted";

        $nodes.each(function() {
            var $node = $(this),
                html = $node.html(),
                replaced_html;

            replaced_html = html.replace( new RegExp("(" + query + ")", "i"), "<span class=" + highlighted_class + ">$1</span>");

            $node.html(replaced_html);
        });
    };

    return Post;

})(jQuery);