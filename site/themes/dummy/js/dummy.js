// Site :: General Layout
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

// Site :: Fixed Layout
( function($) {
    $(document).ready( function() {
        var fixed_class = "is-fixed";

        // DOM
        var $headerWrapper = $(".s-header-wrapper"),
            $header = $("#s-fixed-header"),
            $window = $(window);

        // VARS
        var header_top = $header.offset().top,
            header_height = $header.outerHeight(),
            wrapper_bottom_padding = parseInt( $headerWrapper.css("padding-bottom") );

        // DINAMIC

        // EVENT
        $window.on("scroll", onScroll);

        // HANDLER
        function onScroll() {
            var current_scroll = $window.scrollTop();

            if (current_scroll > header_top) {
                setFixed();
            } else {
                unsetFixed();
            }
        }

        function setFixed() {
            $headerWrapper.css({
                paddingBottom: ( wrapper_bottom_padding + header_height ) + "px"
            });
            $header.addClass(fixed_class);
        }

        function unsetFixed() {
            $header.removeClass(fixed_class);
            $headerWrapper.removeAttr("style");
        }
    });
})(jQuery);

// Site :: Min space before footer
( function($) {

    function init() {
        var $window = $(window),
            $main = $("#s-content-block"),
            $footer = $(".s-footer-wrapper");

        setSpace();

        $window.on("resize", setSpace);

        window.addEventListener("orientationchange", setSpace);

        function setSpace() {
            var display_height = $window.height(),
                main_height = $main.closest(".s-content-wrapper").height(),
                footer_top = $footer.offset().top,
                footer_height = $footer.outerHeight(true);

            var delta = ( display_height - (footer_top + footer_height) );

            if ( delta > 0 ) {
                $main.height(main_height + delta);
            } else {
                $main.removeAttr("style");
            }
        }
    }

    $(document).ready( function () {
        init();
    });

})(jQuery);

// Site :: Profile :: Edit
var renderProfilePage = function(options) {

    var storage = {
        hiddenClass: "is-hidden",
        changeLink: false,          // Dynamic var
        deletePhotoLink: false,     // Dynamic var
        getWrapper: function () {
            return $("#wa-my-info-wrapper");
        },
        getForm: function () {
            return $("#wa-my-info-edit-wrapper");
        },
        getInfoBlock: function () {
            return $("#wa-my-info-read-wrapper");
        },
        getPassword: function () {
            return this.getWrapper().find(".wa-field-password");
        },
        getPhoto: function () {
            return this.getWrapper().find(".wa-field-photo");
        }
    };

    var initialize = function () {
        var $password = storage.getPassword(),
            $photo = storage.getPhoto();

        if ($password.length) {
            renderChangePasswordLink();
        }

        if ($photo.length) {
            renderPhoto();
        }

        // initialize bindEvents after Render
        bindEvents();
    };

    var bindEvents = function () {

        // show Edit Form
        $("#wa-my-info-edit").on("click", function () {
            showEditForm();
            return false;
        });

        // hide edit Form
        $("#wa-my-info-cancel").on("click", function () {
            hideEditForm();
            return false;
        });

        var $change_link = storage.changeLink;
        if ($change_link.length) {
            $change_link.on("click", function () {
                onChangePasswordClick( $(this) );
                return false;
            });
        }

        var $delete_photo_link = storage.deletePhotoLink;
        if ($delete_photo_link.length) {
            $delete_photo_link.on("click", function () {
                onDeletePhotoClick($(this));
                return false;
            });
        }
    };

    var renderPhoto = function () {
        var $photo = storage.getPhoto(),
            $delete_photo_link = $("<a class=\"general-button\" href=\"javascript:void(0);\">" + options["deletePhotoText"] + "</a>"),
            $user_photo = $photo.find('img:first'),
            $default_photo = $photo.find('img:last');

        if ($user_photo[0] != $default_photo[0]) {
            //
            $default_photo.hide();

            //
            $default_photo.after($delete_photo_link);

            // Save to storage
            storage.deletePhotoLink = $delete_photo_link;

        } else {
            $default_photo.show();
        }
    };

    var renderChangePasswordLink = function () {
        var $change_link = $("<a class=\"general-button\" href=\"javascript:void(0);\">" + options["changePasswordText"] + "</a>"),
            $password = storage.getPassword();

        // Hide Password Fields
        $password.find("p").addClass(storage.hiddenClass);

        // Render
        $password.find('.wa-value').prepend($change_link);

        // Save to storage
        storage.changeLink = $change_link;
    };

    var showEditForm = function () {
        var $form = storage.getForm(),
            $info = storage.getInfoBlock();

        $form.removeClass(storage.hiddenClass);
        $info.addClass(storage.hiddenClass);
    };

    var hideEditForm = function () {
        var $form = storage.getForm(),
            $info = storage.getInfoBlock();

        $form.addClass(storage.hiddenClass);
        $info.removeClass(storage.hiddenClass);
    };

    var onDeletePhotoClick = function ($delete_photo_link) {
        var $photo = storage.getPhoto(),
            $photo_input = $photo.find('[name="profile[photo]"]'),
            $user_photo = $photo.find('img:first'),
            $default_photo = $photo.find('img:last');

        // Show default photo
        $default_photo.show();

        // Show user photo
        $user_photo.hide();

        // Hide delete link
        $delete_photo_link.hide();

        // Clear input value
        $photo_input.val('');
    };

    var onChangePasswordClick = function($change_link) {
        // hide link
        $change_link.hide();

        // Show fields
        storage.getPassword().find("p").removeClass(storage.hiddenClass);
    };

    $(document).ready(function () {
        initialize();
    });
};