;(function ($) {
	/**
	 * Defines the widget controller.
	 */
	function WidgetController() {

	}

	/**
	 * Setup widget-related events
	 */
	WidgetController.prototype.init = function () {
		var self = this;

		// hide the widget settings form on successful save
        $(document).on('ajax:success', '.widget-settings-form', function (e, data) {
            $('#modal-settings').modal('hide');
            self.refresh(data.widget.id);
        });

        // refresh the widget on contrast mode change
        $(document).on('ajax:success', '.widget a.adjust', function (e, data) {
			self.refresh(data.widget.id);
        });

        // refresh the widget on contrast mode change
        $(document).on('ajax:success', '.widget a.delete', function (e, data) {
			$('#' + data.widget.id).remove();
			window.hatch.dragdrop.saveWidgets(true);
        });
	};

	/**
	 * Refresh the specified widget.
	 * 
	 * @param  {Number} id - id of the widget to refresh
	 */
	WidgetController.prototype.refresh = function (id) {
		window.hatch.ajax.sendToWidget(id, 'show', 'GET', {}, function (err, html) {
			$('#' + id).replaceWith(html);
		});
	};

	// EXPORTS
	window.WidgetController = WidgetController;
})($);