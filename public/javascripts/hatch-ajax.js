;(function ($) {
	'use strict';

	/**
	 * AjaxController is a broker for ajax-powered links and forms.
	 */
	function AjaxController() {
		
	}

	/**
	 * Initialise event handlers for ajax links and forms
	 */
	AjaxController.prototype.init = function () {
		var self = this;

		// setup ajax link handlers
		$(document).on('click', 'a[rel~=ajax], a[data-remote=true]', function (e) {
			self.handleLinkClick(this, e);
			return false;
		});

		// setup ajax form handlers
		$(document).on('submit', 'form[rel~=ajax], form[data-remote=true]', function (e) {
			self.handleFormSubmit(this, e);
			return false;
		});
	};

	/**
	 * Handle a click event on an ajax link.
	 * 
	 * @param  {HTMLElement} el - link being clicked
	 * @param  {event}       e  - event args
	 */
	AjaxController.prototype.handleLinkClick = function (el) {
		var href = $(el).attr('href');
		var method = $(el).data('method') || $(el).attr('method') || 'GET';

		$.ajax(href, { type: method })
			.done(function (xhr, status, res) {
				// check for redirect
				if (xhr.code === 304) {
					window.location = xhr.location;
					return;
				}
				
				if (res.responseJSON) {
					handleJsonResponse(el, res.responseJSON);
				} else {
					handleHtmlResponse(el, res.responseText);
				}
			})
			.fail(function (xhr, status, err) {
				displayError(el, xhr, status, err);
			});
	};

	/**
	 * Handle a submit event on an ajax form.
	 * 
	 * @param  {HTMLElement} el - form being submitted
	 * @param  {event}       e  - event args
	 */
	AjaxController.prototype.handleFormSubmit = function (el) {
		var href = $(el).attr('action');
		var method = $(el).attr('method') || 'GET';
		var params = $(el).serialize();

		$.ajax(href, { type: method, data: params })
			.done(function (xhr, status, res) {
				// check for redirect
				if (xhr.code === 304) {
					window.location = xhr.location;
					return;
				}

				// fix non-JSON json
				if (res.responseText && res.responseText.indexOf('{') === 0) {
					try {
						res.responseJSON = JSON.parse(res.responseText);
					} catch (err) { 
						// do nothing
					}
				}

				if (res.responseJSON) {
					handleJsonResponse(el, res.responseJSON);
				} else {
					handleHtmlResponse(el, res.responseText);
				}
			})
			.fail(function (xhr, status, err) {
				displayError(el, xhr, status, err);
			});

		return false;
	};

	/**
	 * Make an AJAX request for the specified action.
	 * 
	 * @param  {String}   action   - name of the action
	 * @param  {String}   method   - (GET), POST, PUT, DEL
	 * @param  {Object}   data     - additional request parameters
	 * @param  {Function} callback - callback function
	 */
	AjaxController.prototype.send = function (action, method, data, callback) {
		var params = { 
			method: method || 'POST',
			data: data 
		};

		var href = action.indexOf('/do/') > -1 ? action : window.hatch.pathTo(action);

		$.ajax(href, params)
			.done(function (xhr, status, res) {
				var json = res.responseJSON;

				// show a noty if we find a message string
				if (json && json.message) {
					$.noty({ type: json.status, text: '<i class="fa fa-' + json.icon + '"></i> ' + json.message });
				}

				callback(null, res.responseJSON || res.responseText);
			})
			.fail(function (xhr, status, err) {
				displayError(null, xhr, status, err);
			});
	};

	/**
	 * Send an AJAX request to the specified widget.
	 * 
	 * @param  {Number}   widgetId - ID of the widget
	 * @param  {String}   action   - action to perform
	 * @param  {String}   method   - (GET), POST, PUT, DEL
	 * @param  {Object}   data     - additional request parameters
	 * @param  {Function} callback - callback function
	 */
	AjaxController.prototype.sendToWidget = function (widgetId, action, method, data, callback) {
		var href = window.location.pathname + '/do/core-widgets/widget' +
			(widgetId ? ('/' + widgetId) : '') +
			(action ? ('/' + action) : '');

		// replace double //
		href = href.replace('//', '/');

		this.send(href, method, data, callback);
	};

	/**
	 * Trigger an ajax request for the specified element and handle the response.
	 * 
	 * @param  {HTMLElement} el   - element to trigger for
	 * @param  {String}      href - REST endpoint to call
	 */
	AjaxController.prototype.render = function (el, href) {
		$.ajax(href)
			.done(function (xhr, status, res) {
				if (res.responseJSON) {
					handleJsonResponse(el, res.responseJSON);
				} else {
					handleHtmlResponse(el, res.responseText, el);
				}
			})
			.fail(function (xhr, status, err) {
				displayError(el, xhr, status, err);
			});

		return false;
	};

	// replace the html of the parent remote panel for a successful ajax request
	function handleHtmlResponse (el, html, panel) {
		var $el = $(el);

		// find the target remote panel element and replace the contents
		var $panel = panel && $(panel) || $el.parent('[rel=panel]:first');

		if ($el.attr('target')) {
			$panel = $($el.attr('target'));
		}
		
		if ($panel.length === 1) {
			$panel.html(html);
		}

		// emit an event with the response so it can be handled elsewhere
		$(el).trigger('ajax:success', html);
	}

	// emit a success response for a successful ajax request
	function handleJsonResponse (el, json) {
		// show a noty if we find a message string
		if (json.message) {
			$.noty({ type: json.status, text: '<i class="fa fa-' + json.icon + '"></i> ' + json.message });
		}

		// detech redirects
		if (json.redirect) {
			window.location = json.redirect;
		}

		// emit an event with the response so it can be handled elsewhere
		$(el).trigger('ajax:success', json);
	}

	// show an error message for a failed ajax request
	function displayError (el, xhr) {
		// get the JSON formatted response
		var data = xhr.responseJSON;
		var errorMessage = '';

		// build the error message
		if (data.error) {
			if (typeof data.error === 'string') {
				errorMessage = data.error;
			} else {
				Object.keys(data.error).forEach(function (key) {
					// highlight each field
					var $input = $(el).find('#' + key);
					var $formGroup = $input.parent('.form-group:first');

					$formGroup.addClass('has-error');
					$input.on('focus', function () {
						$formGroup.removeClass('has-error');
					});

					data.error[key].forEach(function (msg) {
						errorMessage += '<i class="fa fa-exclamation-triangle"></i> ' + msg + '<br>';
					});
				});
			}
		}

		// show a noty with the error message
		$.noty({
            type: data.status || 'error',
            text: '<i class="icon-warning-sign"></i> ' + (errorMessage || 'An error has occurred')
        });
	}

	// EXPORTS
	window.AjaxController = AjaxController;
})($);