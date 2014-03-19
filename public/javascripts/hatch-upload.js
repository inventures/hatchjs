;(function($) {
	'use strict';

	function UploadController() {
		
	}

	/**
	 * Initialise the uploader. Adds the hidden form and iframe to allow uploads.
	 */
	UploadController.prototype.init = function () {
		var self = this;

		// add the HTML elements to the <body> and hide them all
		this.$iframe = $('<iframe id="hatch-upload-iframe" class="hidden"></iframe>').appendTo($('body'));
		this.$form = $('<form action="/do/upload/file" enctype="multipart/form-data" method="post" target="hatch-upload-iframe" class="hidden"></form>').appendTo($('body'));
		this.$input = $('<input type="file" name="file">').appendTo(this.$form);
		this.$overlay = $('<div style="height: 100%; width: 100%; position: fixed; left: 0; top: 0; background: rgba(0, 0, 0, 0.5); z-index: 10000; color: #fff; text-align: center; padding-top: ' + ($(window).height()/2.5) + 'px"><i class="fa fa-spinner fa-spin fa-5x"></i><p>Uploading. Please wait ...</p></div>').appendTo($('body')).hide();

		// setup the callback handler on the iframe
		this.$iframe.on('load', function () { self.processCallback(); });
	};

	/**
	 * Upload a file and return the file upload object to the callback function.
	 * 
	 * @param  {Object}   params   - params - e.g. { allowed: '*.jpg' }
	 * @param  {Function} callback - callback function
	 */
	UploadController.prototype.upload = function (params, callback) {
		if (typeof params === 'function' && !callback) {
			callback = params;
			params = null;
		}

		var self = this;

		this.$input.on('change', function () { self.uploadToServer(); });
		this.$input.trigger('click');
		this.callback = callback;

		// return false for use as an event handler
		return false;
	};

	/**
	 * Show the file select dialog and trigger the upload.
	 */
	UploadController.prototype.uploadToServer = function() {
		this.$form[0].submit();
		this.$overlay.show();
	};

	/**
	 * Process the upload result and fire the callback function.
	 */
	UploadController.prototype.processCallback = function() {
		if (!this.callback) {
			return;
		}

		this.$overlay.hide();
		
		// load the response from the iframe
		var rawData = this.$iframe.contents().find('body').text();

		try {
			var data = JSON.parse(rawData);
			this.callback(null, data);
		} catch (err) {
			this.callback(err);
		}
	};

	// EXPORTS
	window.UploadController = UploadController;
})($);