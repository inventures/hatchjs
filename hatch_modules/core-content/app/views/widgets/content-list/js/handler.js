(function ($) {
	var widgetId = '<%- widget.id %>';
	var $widget = $('#' + widgetId);
	var renderPath = '<%- pathTo.render("{0}") %>';
	var autoScroll = '<%- widget.settings.paging %>' === 'scroll';

	// don't double-bind events for this widget
	if (!window.hatch.checkBound('widget-' + widgetId)) {
		
		// handle likes click and refresh the post
		$(document).on('ajax:success', '#' + widgetId + ' a', function (e, data) {
			if (data.post) {
				window.hatch.ajax.render($('#post-' + data.post.id), renderPath.replace('{0}', data.post.id));
			}
		});

		// show the comment form when the comment link is clicked
		$(document).on('click', '[rel=add-comment]', function () {
			var id = $(this).attr('href');

			$(id).removeClass('hidden');
			$('textarea', id).focus();
			
			return false;
		});

		// refresh the post when a new comment is posted
		$(document).on('ajax:success', '#' + widgetId + ' form', function (e, data) {
			window.hatch.ajax.render($('#post-' + data.comment.contentId), renderPath.replace('{0}', data.comment.contentId));
		});
	}

	// setup autoscrolling to load when we are within 100px of screen bottom
	if (autoScroll) {
		$(window).scroll(function () {
			var pos = $(window).scrollTop();
			var height = $('body').height();
			var windowHeight = $(window).height();
			var delta = height - windowHeight - pos;

			if (delta <= 100) {
				$widget.find('.pager a').trigger('click');
			}
		});
	}
})($);