(function ($, undefined) {
	'use strict';

	var
		AppView = Backbone.View.extend({
			el: '#wrapper',

			initialize: function () {
			}
		}),

		PlanetoryHouse = Backbone.View.extend({
			tagName: 'polygon',

			initialize: function () {
			}
		});

	$(document).ready(function () {
		var appView;

		appView = new AppView();
	});
})(jQuery);
