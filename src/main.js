(function ($, undefined) {
	'use strict';

	var
		EVENTS = {
			PLANET_CHANGED : 'planet-selected',
			SELECT2_SELECT: 'select2:select',
			SELECT2_UNSELECT: 'select2:unselect'
		},

		scale_factor = 5,

		planets = [
			{id: 'sun', text: 'Sun'},
			{id: 'moon', text: 'Moon'},
			{id: 'mercury', text: 'Mercury'},
			{id: 'venus', text: 'Venus'},
			{id: 'mars', text: 'Mars'},
			{id: 'jupiter', text: 'Jupiter'},
			{id: 'staurn', text: 'Satrun'},
			{id: 'uranus', text: 'Uranus'},
			{id: 'neptuen', text: 'Neptune'},
			{id: 'pluto', text: 'Pluto'}
		],

		Polygon = Backbone.Model.extend({
			defaults: {
				planetoryHouseId: 0
			}
		}),

		WorkSpaceRoutes = Backbone.Router.extend({
			initialize: function () {
				this.navigate('build');
			},

			routes: {
				'build': 'buildChart',
				'confirm': 'confirmChart'
			},

			buildChart: function () {
			},

			confirmChart: function () {

			}
		}),

		PolygonC = Backbone.Collection.extend({
			model: Polygon,

			url: './src/data/polygon.json'
		}),

		polygonsC = new PolygonC(),

		AppView = Backbone.View.extend({
			el: '#app-wrapper',

			initialize: function () {
				this.modal = null;
				this.EventHandler = _.extend({}, Backbone.Events);
				this.svgContainer = d3.select(this.$el.find('#wrapper')[0])
															.append('svg')
															.attr('width', 750)
															.attr('height', 500);

				polygonsC.fetch();

				/**
				 * Bind Events
				 */
				this.listenTo(polygonsC, 'sync', this.populatePolygons);
				this.listenTo(polygonsC, 'sync', this.initializeModal);
				this.listenTo(
					this.EventHandler,
					EVENTS.PLANET_CHANGED,
					this.updateSelectablePlanets
				);
			},

			events: {
				'click #set-planets': 'selectPlanets'
			},

			initializeModal: function() {
				var elems;
				this.modal = $('#modal-template').html();
				this.modal = _.template(this.modal);
				this.modal = $(this.modal({
					planetoryHouse: polygonsC.toJSON()
				}));

				elems = this.modal.find('.planets');
				this.bindSelect2(elems, planets);
			},

			updateSelectablePlanets: function(data) {
				console.log(data);
			},

			selectPlanets: function  () {
				this.modal.modal('show');
			},

			bindSelect2 : function(elems, data) {
				var self;

				self = this;
				elems.each(function() {
						$(this).select2({
							multiple: true,
							width: '100%',
							data: data
						})
						.on(EVENTS.SELECT2_SELECT, function  (e) {
							console.log(e);
							self.EventHandler
								.trigger(EVENTS.PLANET_CHANGED, e.params.data);
						})
						.on(EVENTS.SELECT2_UNSELECT, function(e) {
							self.EventHandler
								.trigger(EVENTS.PLANET_CHANGED, e.params.data);
						});
					});
			},

			populatePolygons: function () {
				var polygons, texts
				polygons = this.svgContainer
							.selectAll('polygon')
							.data(polygonsC.toJSON())
							.enter()
							.append('polygon')
							.attr('fill', '#f0f0f0')
							.attr("stroke", "black")
						    .attr("stroke-width", 1.5);

				polygons.attr('points', this.mapPolygonPoints);

				texts = this.svgContainer
									.selectAll('text')
									.data(polygonsC.toJSON())
									.enter()
									.append('text');

				texts
					.attr('x', function (d) {
						return (d.text_cordinate[0] * scale_factor);
					})
					.attr('y', function (d) {
						return (d.text_cordinate[1] * scale_factor);
					})
					.text(function (d) {
						return d.id;
					});
			},

			mapPolygonPoints: function (polygon) {
				return polygon.points.map(function (point) {
					point = point.map(function (val) {
						return val * scale_factor;
					})
					return point.join(', ')
				}).join(' ');
			}
		});

	$(document).ready(function () {
		var appView, appRoutes;

		Backbone.history.start();
		appRoutes = new WorkSpaceRoutes();
		appView   = new AppView();
	});
})(jQuery);
