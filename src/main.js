(function ($) {
	var createNatalChart = function	(options) {
		if (! options.el) {
			throw ("hello");
		}

		var
			el = options.el,
			initializeSVGContainer = function () {
				return d3.select(el).append('svg')
						.attr('width', 750)
						.attr('height', 750);
			},

			initializePolygons = function (svgContainer) {
				var getPolyPoints = $.ajax({
					url: './src/data/polygon.json',
					dataType: 'JSON'
				});

				getPolyPoints.done(function (resp) {
					var polygons = svgContainer.selectAll('polygon')
												.data(resp)
												.enter()
												.append('polygon')
												.attr('points', function (points) {
													return points.map(function (point) {
														point = point.map(function (val) {
															return val * 5;
														})
														return point.join(',')
													}).join(' ');
												})
												.attr('fill', 'purple')
												.attr("stroke","black")
											    .attr("stroke-width",2);
				});
			},

			initializePolygon = function () {
			},

			initialize = function () {
				var svgContainer, planatoryHouse;

				svgContainer = initializeSVGContainer();
				planatoryHouse = initializePolygons(svgContainer);
			};

		return {
			initialize: initialize
		}
	};

	$(function () {
		var natalChart, appContainer;

		appContainer = document.getElementById('wrapper');
		natalChart   = createNatalChart({
			el: appContainer
		});

		/*
			Initialize App
		 */
		natalChart.initialize();
	});
})(jQuery);
