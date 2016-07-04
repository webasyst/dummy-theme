// HUB :: Lazy Loading
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

// HUB :: Add Topic
var AddTopicForm = ( function($) {

    AddTopicForm = function(options) {
        var that = this;

        // DOM
        that.$form = options["$form"];
        that.$preview = that.$form.find(".h-topic-preview");
        that.$content = that.$form.find(".h-topic-content");
        that.$category = that.$form.find(".h-topic-category select");
        that.$type = that.$form.find(".h-topic-types");

        // VARS
        that.autocomplete_url = options["autocomplete_url"];

        // DYNAMIC VARS

        // INIT
        that.initClass();
    };

    AddTopicForm.prototype.initClass = function() {
        var that = this;
        //
        that.initEditor();
        //
        that.initPreview();
        //
        that.initChangeType();
        //
        that.initTags();
    };

    AddTopicForm.prototype.initPreview = function() {
        var that = this,
            $previewButton = that.$form.find(".h-show-preview");

        $previewButton.on("click", function () {
            showPreview( $(this) );
            return false;
        });

        function showPreview( $previewButton ) {
            var $preview = that.$preview,
                data = {
                    content: that.$content.val(),
                    _csrf: that.$form.find('input[name="_csrf"]').val()
                };

            $previewButton.after('<i class="icon16 loading"></i>').prop('disabled', true);

            $.post($preview.data('url'), data, function(response) {
                $previewButton
                    .prop('disabled', false)
                    .siblings('.loading').remove();

                $preview.html(response.data).show();
            }, 'json');
        }

    };

    AddTopicForm.prototype.initEditor = function() {
        var that = this;

        $.hub.initEditor( that.$content );
    };

    AddTopicForm.prototype.initChangeType = function() {
        var that = this,
            $type = that.$type,
            $activeLink = false,
            $category = that.$category,
            $categoryClone,
            is_category_has_types = $category.find("option[data-type]").length;

        // Event
        $type.on("click", "a", function() {
            setType( $(this) );
            return false;
        });

        // First init
        $type.find(".is-selected a").click();

        // Handler
        function setType( $link ) {
            var active_class = "is-selected",
                $wrapper = $link.closest("li"),
                type_id = $link.data('type');

            if ($activeLink) {
                $activeLink.removeClass(active_class);
            }

            $wrapper.addClass(active_class);

            $("input[name=\"data[type_id]\"]").val(type_id);

            if (is_category_has_types) {
                showCategories( type_id );
            }

            $activeLink = $wrapper;
        }

        function showCategories( type_id ) {
            var prev_selected_category = ($categoryClone || $category).val();

            if ($categoryClone) {
                $categoryClone.remove();
            }
            $categoryClone = $category.clone();

            $categoryClone.find('option[data-type]').each(function () {
                var $option = $(this);
                if ($option.data('type') != type_id) {
                    if ($option.attr('value') == prev_selected_category) {
                        prev_selected_category = null;
                    }
                    $option.remove();
                }
            });

            if (prev_selected_category) {
                $categoryClone.val(prev_selected_category);
            }

            $category.prop('disabled', true).hide();
            $categoryClone.prop('disabled', false).insertAfter($category).show();
        }
    };

    AddTopicForm.prototype.initTags = function() {
        var that = this,
            $form = that.$form,
            ti_widget,
            tags_input = $form.find('[name="data[tags]"]');

        tags_input.tagsInput({
            autocomplete_url: '',
            autocomplete: {
                source: function(request, response) {
                    $.getJSON(that.autocomplete_url + "?term=" + request.term, function (data) {
                        response(data.data);
                    });
                }
            },
            defaultText: "",
            height: "34px",
            width: (tags_input.parent().width() - 6) + 'px',
            onChange: function () {
                if (!ti_widget) {
                    return;
                }
                tags_input.val(
                    ti_widget.removeClass('error').find('.tag > span').map(
                        function () {
                            return $.trim($(this).text());
                        }
                    ).toArray().join(',')
                );
                tags_input.siblings('.errormsg').remove();
            }
        });

        ti_widget = tags_input.siblings('.tagsinput');

        var fake_input = ti_widget.find('input').css('min-width', '150px');
        fake_input.blur(function () {
            tags_input.addTag(fake_input.val(), {unique: true});
        });

        // Click on a popular tag adds it into the tag list
        $form.find('.popular-tags').on('click', 'a', function () {
            var tag = $.trim($(this).text());
            if (!tags_input.tagExist(tag)) {
                tags_input.addTag(tag, {unique: true});
                fake_input.removeClass('not_valid');
            }
            return false;
        });
    };

    return AddTopicForm;

})(jQuery);

// HUB :: Vote Class
var Vote = ( function($) {

    function getCSRT() {
        var $csrt = $("input[name=_csrf]:first"),
            result = false;

        if ($csrt.length) {
            result = $csrt.val();
        }

        return result;
    }

    Vote = function(options) {
        var that = this;

        // DOM
        that.$vote = options["$vote"];
        that.$value = that.$vote.find(".h-vote-value");

        // VARS
        that.id = options["id"];
        that.type = options["type"];
        that.user_id = options["user_id"];
        that.vote_url = options["vote_url"];
        that.login_url = options["login_url"];
        that.csrf = options["csrf"];

        // VARS
        that.active_class = "is-active";
        that.positive_class = "is-positive";
        that.negative_class = "is-negative";

        // INIT
        that.initClass();
    };

    Vote.prototype.initClass = function() {
        var that = this;

        that.$vote.on("click", ".h-vote-button", function() {
            if (that.user_id) {
                that.onButtonClick( $(this) );
            } else {
                that.goToLogin();
            }
            return false;
        });
    };

    Vote.prototype.onButtonClick = function($button) {
        var that = this,
            active_class = that.active_class;

        var is_up = $button.hasClass("is-up"),
            is_down = $button.hasClass("is-down"),
            is_active = $button.hasClass(active_class);

        if (!is_active) {
            // Render buttons
            that.$vote.find("." + active_class).removeClass(active_class);
            $button.addClass(active_class);

            if (is_up) {
                that.setVote(true);
            }
            if (is_down) {
                that.setVote(false);
            }
        }
    };

    Vote.prototype.setVote = function( is_up ) {
        var that = this,
            positive_class = that.positive_class,
            negative_class = that.negative_class,
            $value = that.$value;

        that.csrf = (that.csrf) ? that.csrf : getCSRT();

        if (that.csrf) {
            var href = that.vote_url,
                data = {
                    id: that.id,
                    type: that.type,
                    vote: (is_up) ? 1 : -1,
                    _csrf: that.csrf
                };

            $.post(href, data, function(response) {
                if ( response && response.data && response.data.hasOwnProperty("votes_sum") ) {
                    // Set sum
                    var vote_value = parseInt(response.data.votes_sum);
                    if (vote_value > 0) {
                        $value
                            .removeClass(negative_class)
                            .addClass(positive_class);

                    } else if (vote_value < 0) {
                        $value
                            .removeClass(positive_class)
                            .addClass(negative_class);
                    } else {
                        $value
                            .removeClass(positive_class)
                            .removeClass(negative_class);
                    }
                    $value.text(vote_value);
                }
            }, 'json');
        }
    };

    Vote.prototype.goToLogin = function() {
        var that = this;
        window.location = that.login_url;
    };

    return Vote;

})(jQuery);

// HUB :: Comment Class
var Comment = ( function($) {

    Comment = function(options) {
        var that = this;

        // DOM
        that.$comment = options["$comment"];
        that.$editForm = that.$comment.find(".h-edit-form");

        // VARS
        that.comment_id = that.$comment.data("id");
        that.csrf = that.$comment.find("input[name=_csrf]:first").val();

        // VARS FOR SOLUTION
        that.is_solution = options["is_solution"];
        that.can_set_solution = options["can_set_solution"];

        // VARS FOR VOTES
        that.user_id = options["user_id"];
        that.login_url = options["login_url"];
        that.vote_url = options["vote_url"];

        // DYNAMIC VARS

        // INIT
        that.initClass();
    };

    Comment.prototype.initClass = function() {
        var that = this;
        //
        that.initEdit();
        //
        that.initDelete();
        //
        if (that.can_set_solution) {
            that.initSolution();
        }
        //
        that.initVotes();
    };

    Comment.prototype.initEdit = function() {
        var that = this,
            $editForm = that.$editForm,
            $textarea = $editForm.find("textarea"),
            $text = that.$comment.find(".h-comment-text .h-text"),
            $editButton = that.$comment.find(".h-edit-comment"),
            edit_href = $editButton.data("url");

        // DYNAMIC VARS;
        var is_textarea_inited = false;

        // EVENTS
        $editButton.on("click", function() {
            showEditForm();
            return false;
        });

        $editForm.on("click", ".h-save-edit", function () {
            saveEdit();
            return false;
        });

        $editForm.on("click", ".h-cancel-edit", function () {
            hideEditForm();
            return false;
        });

        //

        function showEditForm() {
            var text = $text.html();
            $textarea.val(text);

            if (!is_textarea_inited) {
                $.hub.initEditor($textarea, { minHeight: 70 });
                is_textarea_inited = true;
            }

            $editForm.show();
        }

        function hideEditForm() {
            $editForm.hide()
                .find(".h-error").remove();
        }

        function saveEdit() {
            var new_text = $.trim( $textarea.val() ),
                data = {
                    id: that.comment_id,
                    text: new_text,
                    _csrf: that.csrf
                };

            $.post(edit_href, data, function(response) {
                if (response.status == "ok") {
                    $text.html(new_text);
                } else if (response.errors) {
                    $.each(r.errors, function(key, value) {
                        var $error = $("<span class='h-error' style='color: red;'>" + value + "</span>");
                        $error.insertAfter($textarea);
                    });
                }
                hideEditForm();
            }, 'json');

        }
    };

    Comment.prototype.initDelete = function() {
        var that = this;

        // EVENT
        that.$comment.on("click", ".h-delete-comment", function() {
            deleteComment( $(this) );
            return false;
        });

        function deleteComment( $link ) {
            var confirm_text = $link.data("confirm"),
                do_delete = confirm( confirm_text );

            if (do_delete) {
                var href = $link.data('url'),
                    data = {
                        id: that.comment_id,
                        _csrf: that.csrf
                    };

                $.post(href, data, function() {
                    // Remove DOM
                    $link.closest('.h-comment-wrapper').remove();
                });
            }
        }
    };

    Comment.prototype.initSolution = function() {
        var that = this;

        // DOM
        var $solution = that.$comment.find(".h-solution-badge"),
            comment_solution_class = "is-solution",
            wait_class = "is-waiting";

        // DYNAMIC VARS
        var is_locked = false;

        // EVENT
        that.$comment.on("click", ".h-solution-button", function() {
            if (!is_locked) {
                setSolution( $(this) );
            }
            return false;
        });

        function setSolution( $button ) {
            var new_state = (that.is_solution) ? 0 : 1,
                href = "comments/solution/",
                data = {
                    id: that.comment_id,
                    solution: new_state,
                    _csrf: that.csrf
                };

            // Set lock
            is_locked = true;
            $button.addClass(wait_class);

            $.post(href, data, function(response) {
                // Unset lock
                is_locked = false;
                $button.removeClass(wait_class);

                if (response.status == 'ok') {
                    if (new_state) {
                        $solution.show();
                        $button.text( $button.data("cancel") );
                        that.$comment.addClass(comment_solution_class);
                        that.is_solution = true;
                    } else {
                        $solution.hide();
                        $button.text( $button.data("solution") );
                        that.$comment.removeClass(comment_solution_class);
                        that.is_solution = false;
                    }
                }
            }, 'json');
        }

    };

    Comment.prototype.initVotes = function() {
        var that = this;

        new Vote({
            $vote: that.$comment.find(".h-vote-block"),
            id: that.comment_id,
            type: "comment",
            user_id: that.user_id,
            vote_url: that.vote_url,
            login_url: that.login_url,
            csrf: that.csrf
        })
    };

    return Comment;

})(jQuery);

// HUB :: Vote Class for Page Topic
var PageVote = ( function($) {

    function getCSRT() {
        var $csrt = $("input[name=_csrf]:first"),
            result = false;

        if ($csrt.length) {
            result = $csrt.val();
        }

        return result;
    }

    PageVote = function(options) {
        var that = this;

        // DOM
        that.$vote = options["$vote"];
        that.$question = that.$vote.find(".vote-form-question");
        that.$success = that.$vote.find(".vote-form-yes");
        that.$noForm = that.$vote.find(".vote-form-no");

        // VARS
        that.id = options["id"];
        that.type = "topic";

        // DYNAMIC VARS
        that.csrt = null;

        // INIT
        that.initClass();
    };

    PageVote.prototype.initClass = function() {
        var that = this;

        that.$vote.on("click", ".h-vote-button.is-true", function() {
            onYes();
            return false;
        });

        that.$vote.on("click", ".h-vote-button.is-false", function() {
            onNo();
            return false;
        });

        that.$vote.on("click", ".h-submit-false", function() {
            onNoSubmit();
            return false;
        });

        function onYes() {
            that.csrt = (that.csrt) ? that.csrt : getCSRT();

            if (that.csrt) {
                var href = that.vote_url,
                    data = {
                        type: that.type,
                        id: that.id,
                        vote: +1,
                        _csrf: that.csrt
                    };

                $.post(href, data, function() {
                    that.$question.hide();
                    that.$success.show();
                });
            }
        }

        function onNo() {
            that.$question.hide();
            that.$noForm.show();
        }

        function onNoSubmit() {
            that.csrt = (that.csrt) ? that.csrt : getCSRT();

            if (that.csrt) {
                var href = that.vote_url,
                    data = {
                        type: that.type,
                        id: that.id,
                        vote: -1,
                        comment: that.$vote.find("textarea").val(),
                        _csrf: that.csrt
                    };

                $.post(href, data, function() {
                    that.$noForm.hide();
                    that.$success.show();
                });
            }
        }
    };

    return PageVote;

})(jQuery);

// HUB :: Topic Class
var Topic = ( function($) {

    function getCSRT() {
        var $csrt = $("input[name=_csrf]:first"),
            result = false;

        if ($csrt.length) {
            result = $csrt.val();
        }

        return result;
    }

    Topic = function(options) {
        var that = this;

        // DOM
        that.$topic = options["$topic"];

        // VARS
        that.topic_id = options["topic_id"];

        // DYNAMIC VARS

        // INIT
        that.initClass();
    };

    Topic.prototype.initClass = function() {
        var that = this;

        that.$topic.on("click", ".h-delete-topic", function() {
            that.deleteTopic( $(this) );
            return false;
        });
    };

    Topic.prototype.deleteTopic = function( $link ) {
        var that = this,
            do_delete = confirm( $link.data("confirm") );

        if (do_delete) {
            var csrf = getCSRT(),
                href = $link.data("delete-url");

            if (csrf) {
                $.post(href, { _csrf: csrf }, function(response) {
                    if (response.status == 'ok') {
                        window.location = r.data;
                    }
                }, 'json');
            }
        }
    };

    return Topic;

})(jQuery);

// HUB :: CommentForm
var CommentForm = ( function($) {

    CommentForm = function(options) {
        var that = this;

        // DOM
        that.$formWrapper = options["$formWrapper"];
        that.$form = that.$formWrapper.find("form");
        that.$textarea = that.$formWrapper.find("textarea");
        that.$topicWrapper = that.$form.closest(".h-topic-wrapper");
        that.$topic = that.$form.closest(".h-topic-wrapper");
        that.$commentsWrapper = that.$topicWrapper.find(".h-comments-wrapper");

        // VARS
        that.selected_class = "is-selected";
        that.reply_class = "in-reply-to";
        that.new_class = "is-new";

        // DYNAMIC VARS
        that.is_locked = false;

        // INIT
        that.initClass();
        // that.bindEvents();
    };

    CommentForm.prototype.initClass = function() {
        var that = this;

        // Init Editor
        $.hub.initEditor(that.$textarea, {minHeight: 150});

        that.bindEvents();
    };

    CommentForm.prototype.bindEvents = function() {
        var that = this;

        that.$commentsWrapper.on("click", ".h-reply-comment", function () {
            var $link = $(this),
                $comment = $link.closest(".h-comment");
            that.onReply( $comment );
            return false;
        });

        that.$form.on("click", ".h-cancel-button", function() {
            that.moveForm( that.$commentsWrapper, "");
            return false;
        });

        that.$form.on("submit", function() {
            if (!that.is_locked) {
                that.onSubmit();
            }
            return false;
        });
    };

    CommentForm.prototype.moveForm = function($target, id) {
        var that = this;
        id = (id) ? id : "";

        $(".h-comment." + that.reply_class).removeClass(that.reply_class);

        // Refresh
        that.refreshForm( true );
        // Id
        that.$form.find("input[name=parent_id]").val( id );
        // Move
        that.$formWrapper.insertAfter($target);
    };

    CommentForm.prototype.refreshForm = function(empty) {
        var that = this,
            $form = that.$form;

        $form.find(".errormsg").remove();
        $form.find(".error").removeClass("error");

        if (empty) {
            $form[0].reset();
        }
    };

    CommentForm.prototype.onSubmit = function() {
        var that = this,
            $form = that.$form,
            href = location.href.replace(/\/#\/[^#]*|\/#|\/$/g, '') + '/comments/add/',
            data = $form.serialize();

        that.is_locked = true;

        $.post(href, data, function(response){
            if ( response.status && response.status == 'ok' && response.data) {

                // Counter
                var comments_header = response.data.comment_count_str;
                if (comments_header) {
                    that.$commentsWrapper.find(".h-comments-header").text(comments_header);
                }

                var $comment = $(response.data.html),
                    parent_id = response.data.parent_id,
                    $target = that.$commentsWrapper.find(".h-comment-list ul");

                that.$commentsWrapper.show();

                if (parent_id) {
                    var $parentComment = that.$form.closest(".h-comment-wrapper"),
                        ul = $parentComment.find("> ul");

                    if (ul.length) {
                        $target = ul;
                    } else {
                        ul = $("<ul />");
                        $parentComment.append(ul);
                        $target = ul;
                    }
                }

                $target.append($comment);

                // marking
                var $commentBody = $comment.find("> .h-comment");
                $commentBody.addClass(that.new_class);
                setTimeout( function () {
                    $commentBody.removeClass(that.new_class);
                }, 10000);

                // // Reset comment form
                that.refreshForm(true);
                that.moveForm( that.$commentsWrapper, "");
                //

            } else if ( response.status && response.status == 'fail' ) {
                // error
                that.refreshForm();

                var errors = response.errors;
                $.each(errors, function(){
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

    CommentForm.prototype.onReply = function( $comment ) {
        var that = this;

        var comment_id = $comment.data("id"),
            $place = $comment.find(".h-actions-content-wrapper"),
            reply_class = "in-reply-to";

        that.moveForm($place, comment_id);

        $(".h-comment." + reply_class).removeClass(reply_class);

        $comment.addClass(reply_class);
    };

    return CommentForm;

})(jQuery);

$.hub = $.hub || {};

/** Adds handlers for topic and post votes on topic page */
$.hub.initTopicVotes = function(options) {
    new Vote(options);
};

$.hub.initEditor = function (el, options) {
    options = $.extend({
        minHeight: 300,
        buttonSource: false,
        paragraphy: false,
        convertDivs: false,
        imageUpload: el.data('upload-url'),
        buttons: ['bold', 'italic', 'underline', 'deleted', 'unorderedlist', 'orderedlist',
            'image', 'video', 'link', '|', 'codeblock', 'blockquote'],
        plugins: ['video', 'codeblock', 'blockquote'],
        uploadImageFields: {
            _csrf: el.closest('form').find('input[name="_csrf"]').val()
        },
        imageUploadErrorCallback: function(json) {
            alert(json.error);
        }
    }, options || {});

    if (!options.lang) {
        for (var lang in $.Redactor.opts.langs) {
            if (lang != 'en') {
                options.lang = lang;
                break;
            }
        }
    }

    el.redactor(options);
};

/** Controller for follow/unfollow buttons */
$.hub.initFollowingButton = function(follow_url, topic_id) {

    // DOM
    var $followButton = $("#button-follow"),
        $unfollowButton = $("#button-unfollow"),
        $wrapper = $followButton.closest(".h-follow-wrapper");

    // VARS
    var active_class = "following",
        inactive_class = "not-following",
        csrf = $('input[name=_csrf]:first').val();

    // EVENTS

    $followButton.on("click", function() {
        showLoading( $(this) );
        followTopic()
    });

    $unfollowButton.click(function() {
        showLoading( $(this) );
        unfollowTopic();
    });

    // FUNCTIONS

    function unfollowTopic() {
        $.post(follow_url, { topic_id: topic_id, follow: 0, _csrf: csrf }, function() {
            $wrapper
                .addClass(inactive_class)
                .removeClass(active_class)
                .find(".loading")
                .remove();
        });
    }

    function followTopic() {
        $.post(follow_url, { topic_id: topic_id, follow: 1, _csrf: csrf }, function() {
            $wrapper
                .addClass(active_class)
                .removeClass(inactive_class)
                    .find(".loading")
                        .remove();
        });
    }

    function showLoading( $link ) {
        $link.parent().append('<i class="icon16 loading"></i>');
    }

};

/** Comments ordering: 'popular' or 'newest' */
$.hub.initCommentsSorting = function(options) {

    // VARS
    var active_class = "is-selected",
        topic_id = options["topic_id"];

    // DOM
    var $comments = options["$comments"];
    var $sorting = options["$sorting"];

    // DYNAMIC VARS
    var $activeLink = null;

    // EVENTS

    if (topic_id) {
        $sorting.on("click", "a", function() {
            changeSorting( $(this) );
            return false;
        });
    }

    function changeSorting( $link ) {
        var order = $link.data('order');

        if (!$link.hasClass(active_class)) {

            // RENDER
            if ($activeLink) {
                $activeLink.removeClass(active_class);
            } else {
                $sorting.find("." + active_class).removeClass(active_class);
            }
            $link.addClass(active_class);

            // LOAD
            orderComments(topic_id, order);

            // SAVE DATA
            $activeLink = $link;
        }
    }

    function orderComments(topic_id, order) {
        var href = location.href.replace(/\/#\/[^#]*|\/#|\/$/g, '') + '/comments/order/',
            data = {
                topic_id: topic_id,
                order: order
            };

        $.post(href,data, function(r) {
            if (r.status == 'fail') {
                console && console.log(r);
                return;
            }
            if (r.status != 'ok') {
                console && console.log('Error occured');
                return;
            }
            if (r.data.comment_ids && $.isArray(r.data.comment_ids) && r.data.comment_ids.length) {
                renderComments(r.data.comment_ids);
            }
        }, 'json');

        function renderComments( comments ) {
            var $list = $(".h-comment-list > ul");
            for (var i = 0; i < comments.length; i++) {
                var $comment = $("#h-comment-wrapper-" + comments[i]);
                if ($comment.length) {
                    $list.append($comment);
                }
            }
        }
    }
};

/** Controller for topic creation form. */
$.hub.initAddTopicForm = function(options) {
    new AddTopicForm(options);
};

/**  Actions at comment: edit/delete */
$.hub.initComment = function(options) {
    new Comment(options);
};

$.hub.initPageVotes = function(options) {
    new PageVote(options);
};

$.hub.initTopic = function(options) {
    new Topic(options);
};

/** Controller for new comment form */
$.hub.initCommentForm = function(options) {
    new CommentForm(options);
};

/** Localization helper */
$.hub.locale = $.hub.locale || {};
$.hub.$_ = window.$_ = function(p1) {
    return $.hub.locale[p1] || p1;
};

/** jQuery tags input */
( function(a){var b=new Array;var c=new Array;a.fn.doAutosize=function(b){var c=a(this).data("minwidth"),d=a(this).data("maxwidth"),e="",f=a(this),g=a("#"+a(this).data("tester_id"));if(e===(e=f.val())){return;}var h=e.replace(/&/g,"&").replace(/\s/g," ").replace(/</g,"<").replace(/>/g,">");g.html(h);var i=g.width(),j=i+b.comfortZone>=c?i+b.comfortZone:c,k=f.width(),l=j<k&&j>=c||j>c&&j<d;if(l){f.width(j);}};a.fn.resetAutosize=function(b){var c=a(this).data("minwidth")||b.minInputWidth||a(this).width(),d=a(this).data("maxwidth")||b.maxInputWidth||a(this).closest(".tagsinput").width()-b.inputPadding,f=a(this),g=a("<tester/>").css({position:"absolute",top:-9999,left:-9999,width:"auto",fontSize:f.css("fontSize"),fontFamily:f.css("fontFamily"),fontWeight:f.css("fontWeight"),letterSpacing:f.css("letterSpacing"),whiteSpace:"nowrap"}),h=a(this).attr("id")+"_autosize_tester";if(!a("#"+h).length>0){g.attr("id",h);g.appendTo("body");}f.data("minwidth",c);f.data("maxwidth",d);f.data("tester_id",h);f.css("width",c);};a.fn.addTag=function(d,e){e=jQuery.extend({focus:false,callback:true},e);this.each(function(){var f=a(this).attr("id");var g=a(this).val().split(b[f]);if(g[0]==""){g=new Array;}d=jQuery.trim(d);var h;if(e.unique){h=a(g).tagExist(d);if(h==true){a("#"+f+"_tag").addClass("not_valid");}}else{h=false;}if(d!=""&&h!=true){a("<span>").addClass("tag").append(a("<span>").text(d).append("  "),a("<a>",{href:"#",title:"Removing tag",text:"x"}).click(function(){return a("#"+f).removeTag(escape(d));})).insertBefore("#"+f+"_addTag");g.push(d);a("#"+f+"_tag").val("");if(e.focus){a("#"+f+"_tag").focus();}else{a("#"+f+"_tag").blur();}a.fn.tagsInput.updateTagsField(this,g);if(e.callback&&c[f]&&c[f]["onAddTag"]){var i=c[f]["onAddTag"];i.call(this,d);}if(c[f]&&c[f]["onChange"]){var j=g.length;var i=c[f]["onChange"];i.call(this,a(this),g[j-1]);}}});return false;};a.fn.removeTag=function(d){d=unescape(d);this.each(function(){var e=a(this).attr("id");var f=a(this).val().split(b[e]);a("#"+e+"_tagsinput .tag").remove();str="";for(var i=0;i<f.length;i++){if(f[i]!=d){str=str+b[e]+f[i];}}a.fn.tagsInput.importTags(this,str);if(c[e]&&c[e]["onRemoveTag"]){var g=c[e]["onRemoveTag"];g.call(this,d);}});return false;};a.fn.tagExist=function(b){return jQuery.inArray(b,a(this))>=0;};a.fn.importTags=function(b){id=a(this).attr("id");a("#"+id+"_tagsinput .tag").remove();a.fn.tagsInput.importTags(this,b);};a.fn.tagsInput=function(d){var e=jQuery.extend({interactive:true,defaultText:"add a tag",minChars:0,width:"300px",height:"100px",autocomplete:{selectFirst:false},hide:true,delimiter:",",unique:true,removeWithBackspace:true,placeholderColor:"#666666",autosize:true,comfortZone:20,inputPadding:6*2},d);this.each(function(){if(e.hide){a(this).hide();}var d=a(this).attr("id");var f=jQuery.extend({pid:d,real_input:"#"+d,holder:"#"+d+"_tagsinput",input_wrapper:"#"+d+"_addTag",fake_input:"#"+d+"_tag"},e);b[d]=f.delimiter;if(e.onAddTag||e.onRemoveTag||e.onChange){c[d]=new Array;c[d]["onAddTag"]=e.onAddTag;c[d]["onRemoveTag"]=e.onRemoveTag;c[d]["onChange"]=e.onChange;}var g='<div id="'+d+'_tagsinput" class="tagsinput"><div id="'+d+'_addTag">';if(e.interactive){g=g+'<input id="'+d+'_tag" value="" data-default="'+e.defaultText+'" />';}g=g+'</div><div class="tags_clear"></div></div>';a(g).insertAfter(this);a(f.holder).css("width",e.width);a(f.holder).css("height",e.height);if(a(f.real_input).val()!=""){a.fn.tagsInput.importTags(a(f.real_input),a(f.real_input).val());}if(e.interactive){a(f.fake_input).val(a(f.fake_input).attr("data-default"));a(f.fake_input).css("color",e.placeholderColor);a(f.fake_input).resetAutosize(e);a(f.holder).bind("click",f,function(b){a(b.data.fake_input).focus();});a(f.fake_input).bind("focus",f,function(b){if(a(b.data.fake_input).val()==a(b.data.fake_input).attr("data-default")){a(b.data.fake_input).val("");}a(b.data.fake_input).css("color","#000000");});if(e.autocomplete_url!=undefined){autocomplete_options={source:e.autocomplete_url};for(attrname in e.autocomplete){autocomplete_options[attrname]=e.autocomplete[attrname];}if(jQuery.Autocompleter!==undefined){a(f.fake_input).autocomplete(e.autocomplete_url,e.autocomplete);a(f.fake_input).bind("result",f,function(b,c,f){if(c){a("#"+d).addTag(c[0]+"",{focus:true,unique:e.unique});}});}else if(jQuery.ui.autocomplete!==undefined){a(f.fake_input).autocomplete(autocomplete_options);a(f.fake_input).bind("autocompleteselect",f,function(b,c){a(b.data.real_input).addTag(c.item.value,{focus:true,unique:e.unique});return false;});}}else{a(f.fake_input).bind("blur",f,function(b){var c=a(this).attr("data-default");if(a(b.data.fake_input).val()!=""&&a(b.data.fake_input).val()!=c){if(b.data.minChars<=a(b.data.fake_input).val().length&&(!b.data.maxChars||b.data.maxChars>=a(b.data.fake_input).val().length)){a(b.data.real_input).addTag(a(b.data.fake_input).val(),{focus:true,unique:e.unique});}}else{a(b.data.fake_input).val(a(b.data.fake_input).attr("data-default"));a(b.data.fake_input).css("color",e.placeholderColor);}return false;});}a(f.fake_input).bind("keypress",f,function(b){if(b.which==b.data.delimiter.charCodeAt(0)||b.which==13){b.preventDefault();if(b.data.minChars<=a(b.data.fake_input).val().length&&(!b.data.maxChars||b.data.maxChars>=a(b.data.fake_input).val().length)){a(b.data.real_input).addTag(a(b.data.fake_input).val(),{focus:true,unique:e.unique});}a(b.data.fake_input).resetAutosize(e);return false;}else if(b.data.autosize){a(b.data.fake_input).doAutosize(e);}});f.removeWithBackspace&&a(f.fake_input).bind("keydown",function(b){if(b.keyCode==8&&a(this).val()==""){b.preventDefault();var c=a(this).closest(".tagsinput").find(".tag:last").text();var d=a(this).attr("id").replace(/_tag$/,"");c=c.replace(/[\s]+x$/,"");a("#"+d).removeTag(escape(c));a(this).trigger("focus");}});a(f.fake_input).blur();if(f.unique){a(f.fake_input).keydown(function(b){if(b.keyCode==8||String.fromCharCode(b.which).match(/\w+|[áéíóúÁÉÍÓÚñÑ,\/]+/)){a(this).removeClass("not_valid");}});}}return false;});return this;};a.fn.tagsInput.updateTagsField=function(c,d){var e=a(c).attr("id");a(c).val(d.join(b[e]));};a.fn.tagsInput.importTags=function(d,e){a(d).val("");var f=a(d).attr("id");var g=e.split(b[f]);for(var i=0;i<g.length;i++){a(d).addTag(g[i],{focus:false,callback:false});}if(c[f]&&c[f]["onChange"]){var h=c[f]["onChange"];h.call(d,d,g[i]);}};})(jQuery);