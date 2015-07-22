(function($, undefined) {
  'use strict';

  var
    EventHandler = _.extend({}, Backbone.Events),

    EVENTS = {
      PLANET_CHANGED: 'planet-selected',
      SELECT2_SELECT: 'select2:select',
      SELECT2_UNSELECT: 'select2:unselect',
      SET_CHART_BUILDER_VIEW: 'set-chart-builder-view',
      SET_FINAL_CHART_VIEW: 'set-final-chart-view',
    },

    SCALE = 5,

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



    PolygonM = Backbone.Model.extend({
      defaults: {
        planetoryHouseId: 0
      }
    }),

    PolygonC = Backbone.Collection.extend({
      model: PolygonM,

      url: './src/data/polygon.json'
    }),

    polygonC = new PolygonC();

  var
    AppRoutes = Backbone.Router.extend({
      initialize: function() {
      },

      routes: {
        'builder': 'loadBuildView',
        'confirm': 'loadConfirmationView'
      },

      loadBuildView: function() {
        EventHandler.trigger(EVENTS.SET_CHART_BUILDER_VIEW);
      },

      loadConfirmationView: function() {
        EventHandler.trigger(EVENTS.SET_FINAL_CHART_VIEW);
      }
    }),

    appRoutes = new AppRoutes();

  var
    BaseChartView = Backbone.View.extend({
    }),

    ChartBuilderView = BaseChartView.extend({
      initialize: function() {
        var baseTemplate = _.template(
          $('#builder-template').html()
        );

        this.$el          = $(baseTemplate());
        this.modal        = null;
        this.svgContainer = d3.select(this.$el.find('.svg-container')[0])
                              .append('svg')
                              .attr('width', 500)
                              .attr('height', 500);

        polygonC.fetch();

        this.listenTo(
          EventHandler,
          EVENTS.PLANET_CHANGED,
          this.updateSelectablePlanets
        );
        this.listenTo(polygonC, 'sync', this.postPolygonSyncHandler);
        this.$el.find('#btn-set-planets')
              .on('click', $.proxy(this.selectPlanets, this));
      },

      updateSelectablePlanets: function(data) {
        var select2s, new_data, selectedPlanets = [];

        select2s = this.modal.find('.planets');
        select2s.each(function() {
          var val = $(this).select2('val');
          if (val) {
            selectedPlanets = selectedPlanets.concat(val);
          }
        });

        new_data = planets.map(function(planet) {
          planet = (_.contains(selectedPlanets, planet.id)) ? _.extend({disabled: true}, planet) :
                  planet;
          return planet;
        });

        select2s.each(function() {
          var val, data;

          val = $(this).select2('val');
          data = $(this).select2('data');

          $(this).empty()
          .select2({
            data: new_data.concat(data)
          });
        });
      },

      selectPlanets: function () {
        this.modal.modal('show');
      },

      postPolygonSyncHandler: function() {
        this.populatePolygons();
        this.initializeModal();
      },

      initializeModal: function() {
        var elems, self;

        self       = this;
        this.modal = $('#modal-template').html();
        this.modal = _.template(this.modal);
        this.modal = $(this.modal({
          planetoryHouse: polygonC.toJSON()
        }));

        elems = this.modal.find('.planets');
        elems.each(function(index, elem) {
          self.bindSelect2($(elem), planets);
        });

        this.modal.find('#save-chart')
            .on('click', $.proxy(this.saveChart, this));
      },

      saveChart: function() {
        this.modal.modal('hide');
        appRoutes.navigate('confirm', {trigger: true});
      },

      bindSelect2 : function(elem, data) {
        var self = this;

        elem.select2({
          width: '100%',
          data: data
        })
        .on(EVENTS.SELECT2_SELECT, function  (e) {
          EventHandler
            .trigger(EVENTS.PLANET_CHANGED, e.params.data);
        })
        .on(EVENTS.SELECT2_UNSELECT, function(e) {
          EventHandler
            .trigger(EVENTS.PLANET_CHANGED, e.params.data);
        });
      },

      populatePolygons: function () {
        var polygons, texts
        polygons = this.svgContainer
              .selectAll('polygon')
              .data(polygonC.toJSON())
              .enter()
              .append('polygon')
              .attr('fill', '#f0f0f0')
              .attr("stroke", "black")
              .attr("stroke-width", 1.5);

        polygons.attr('points', this.mapPolygonPoints);

        texts = this.svgContainer
                  .selectAll('text')
                  .data(polygonC.toJSON())
                  .enter()
                  .append('text');

        texts
          .attr('x', function (d) {
            return (d.text_cordinate[0] * SCALE);
          })
          .attr('y', function (d) {
            return (d.text_cordinate[1] * SCALE);
          })
          .text(function (d) {
            return d.id;
          });
      },

      mapPolygonPoints: function (polygon) {
        return polygon.points.map(function (point) {
          point = point.map(function (val) {
            return val * SCALE;
          })
          return point.join(', ')
        }).join(' ');
      },

      render: function() {
        return this;
      }
    }),

    FinalChartView = BaseChartView.extend({
    }),

    AppView = Backbone.View.extend({
      el: '#app-wrapper',

      initialize: function() {
        this.activeView = null;

        this.listenTo(
          EventHandler,
          EVENTS.SET_CHART_BUILDER_VIEW,
          this.setCharBuilderView
        );
        this.listenTo(
          EventHandler,
          EVENTS.SET_FINAL_CHART_VIEW,
          this.setFinalChartView
        );
      },

      setCharBuilderView: function() {
        var
          view = new ChartBuilderView();

        this.setView(view)
            .render();
      },

      setFinalChartView: function() {
        var view;

        view = new FinalChartView();

        this.setView(view)
            .render();
      },

      setView: function(view) {
        this.activeView = view;

        return this;
      },

      render: function() {
        if (this.activeView) {
          this.$el.empty();

          this.activeView
              .render()
              .$el
              .appendTo(this.$el);
        }
      },
    });

  $(document).ready(function() {
    var appView;
    appView = new AppView();
    Backbone.history.start();


    appRoutes.navigate("builder", {
      trigger: true
    });
  });
})(jQuery);