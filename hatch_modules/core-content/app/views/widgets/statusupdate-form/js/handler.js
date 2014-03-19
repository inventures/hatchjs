(function ($) {
	var widgetId = '<%- widget.id %>';
	var $widget = $('#' + widgetId + '.widget');
	var $textarea = $widget.find('textarea');

	$widget.find('a[rel=selectfile]').on('click', function () {
		window.hatch.upload.upload({}, function (err, data) {
			var url = data.media.url;
			if (url.indexOf('/') === 0) {
				url = window.location.protocol + '//' + window.location.host + url;
				$textarea.val(($textarea.val() + '\n' + url).replace(/^\s+|\s+$/g, ''));
			}
		});
		return false;
	});

	$widget.find('form').on('ajax:success', function () {
		$.noty({ text: '<i class="fa fa-check"></i> Post successful', type: 'success' });

		// refresh all widgets on the page
		$('.widget').each(function (i, widget) {
			var $widget = $(widget);
			var id = $widget.data('id');

			// only refresh content-list widgets
			if ($widget.data('type') === 'core-content/content-list') {
				window.hatch.widget.refresh(id);
			}
		});

		// clear the form text
		$widget.find('form textarea').val('');
	});

	$widget.find('form').on('ajax:error', function (xhr, res) {
		$.noty({ text: '<i class="fa fa-exclamation-triangle"></i> Please enter some text', type: 'error' });
	});
})($);