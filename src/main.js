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

    PLANETS = [
      {id: 'sun', text: 'Sun', abbr: 'Su'},
      {id: 'moon', text: 'Moon', abbr: 'Mo'},
      {id: 'mercury', text: 'Mercury', abbr: 'Mer'},
      {id: 'venus', text: 'Venus', abbr: 'Ve'},
      {id: 'mars', text: 'Mars', abbr: 'Ma'},
      {id: 'jupiter', text: 'Jupiter', abbr: 'Ju'},
      {id: 'staurn', text: 'Satrun', abbr: 'Sa'},
      {id: 'uranus', text: 'Uranus', abbr: 'Ur'},
      {id: 'neptuen', text: 'Neptune', abbr: 'Nep'},
      {id: 'pluto', text: 'Pluto', abbr: 'Pl'}
    ],

    PolygonM = Backbone.Model.extend({
      defaults: {
        planets: [],
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
      mapPolygonPoints: function (scale, polygon) {
        return polygon.points.map(function (point) {
          point = point.map(function (val) {
            return val * scale;
          })
          return point.join(', ')
        }).join(' ');
      }
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

        polygonC.fetch({
          reset: true
        });

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

        new_data = PLANETS.map(function(planet) {
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
          self.bindSelect2($(elem), PLANETS);
        });

        this.modal.find('#save-chart')
            .on('click', $.proxy(this.saveChart, this));
      },

      saveChart: function() {
        var planetDump = {}, startinPlanet, houseId, tempPolygon;

        $(this.modal.find('form').serializeArray())
            .each(function(index, val) {
              if (val.name == 'set-start') {
                startinPlanet = val.value;
                return;
              }

              if (planetDump[val.name]) {
                planetDump[val.name].push(val.value);
              } else {
                planetDump[val.name] = [val.value];
              }
            });

        polygonC.forEach(function(polygon) {
          var polygonId;

          polygonId = polygon.get('id');

          if (planetDump[polygonId]) {
            polygon.set('planets', planetDump[polygonId]);
          }
        });

        houseId = 1;
        tempPolygon = polygonC.findWhere({id: startinPlanet});
        tempPolygon.set('planetoryHouseId', houseId);

        while (houseId < 12) {
          houseId++;
          tempPolygon = polygonC.findWhere({
            id: tempPolygon.get('next')
          });
          tempPolygon.set('planetoryHouseId', houseId);
        }

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
        var polygons, texts;
        polygons = this.svgContainer
              .selectAll('polygon')
              .data(polygonC.toJSON())
              .enter()
              .append('polygon')
              .attr('fill', '#f0f0f0')
              .attr("stroke", "black")
              .attr("stroke-width", 1.5);

        polygons.attr('points', _.partial(this.mapPolygonPoints, SCALE));

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

      render: function() {
        return this;
      }
    }),

    FinalChartView = BaseChartView.extend({
      initialize: function() {
        var baseTemplate = _.template(
          $('#confirmation-template').html()
        );

        this.$el = $(baseTemplate());
        this.svgContainer = d3.select(this.$el.find('.svg-container')[0])
                              .append('svg')
                              .attr("version", 1.1)
                              .attr("xmlns", "http://www.w3.org/2000/svg")
                              .attr('width', 500)
                              .attr('height', 500);

        this.$el.find('button#export-to-png')
            .on('click', $.proxy(this.exportSVGToPng, this));
      },

      render: function() {
        this.populatePolygons();

        return this;
      },

      exportSVGToPng: function() {
        var html, canvas, context, DOMURL, image, pngimg, canvasdata, svg,
            url;

        html = new XMLSerializer().serializeToString(this.svgContainer.node());

        canvas = document.createElement('canvas');
        canvas.width  = 500;
        canvas.height = 500;
        context = canvas.getContext("2d");
        DOMURL = URL || webkitURL;
        svg = new Blob([html], {type: "image/svg+xml;charset=utf-8"});
        url = DOMURL.createObjectURL(svg);

        image = new Image;
        image.src = url;
        image.onload = function() {
          var a;

          context.drawImage(image, 0, 0);
          canvasdata = canvas.toDataURL("image/png");
          pngimg = '<img src="'+canvasdata+'">';

          a = document.createElement("a");
          a.href = canvasdata;
          a.download = "sample.png";
          a.click();
        };
      },

      populatePolygons: function() {
        var groups, style;

        style = document.createElement('style');
        style.innerHTML = "/* <![CDATA[ */text {font-size: 14px;color: black; overflow: auto;}/* ]]> */";

        this.svgContainer.node()
            .insertBefore(style, this.svgContainer.node().firstChild);

        groups = this.svgContainer
              .selectAll('g')
              .data(polygonC.toJSON())
              .enter()
              .append('g');

        groups.append('polygon')
              .attr('fill', '#f0f0f0')
              .attr("stroke", "black")
              .attr("stroke-width", 1.5)
              .attr('points', _.partial(this.mapPolygonPoints, SCALE));
        groups.append('text')
              .attr('x', function (d) {
                return (d.planetory_house_coordinate[0] * SCALE);
              })
              .attr('y', function (d) {
                return (d.planetory_house_coordinate[1] * SCALE);
              })
              .attr("dy", ".35em")
              .text(function (d) {
                return d.planetoryHouseId;
              });

        var planetGroup = groups.append('g');

        var ptext1 = planetGroup.selectAll('text')
            .data(function(d) {
              var _planets, planetGroup = [], temp, accumulator, text_cordinate;

              _planets = _.filter(PLANETS, function(planet) {
                return _.contains(this.planets, planet.id);
              }, d);
              _planets = _.pluck(_planets, 'abbr');

              accumulator = (_planets.length > 2) ? -5 : 0;

              while (_planets.length > 0) {
                temp = _planets.splice(2);
                planetGroup.push({
                  text_cordinate: [d.text_cordinate[0] - 5, (d.text_cordinate[1] + accumulator)],
                  planets: _planets
                });
                _planets = temp;
                accumulator += 5;
              }

              return planetGroup;
            })
            .enter()
            .append('text');

          ptext1
            .attr('x', function (d) {
              return (d.text_cordinate[0] * SCALE);
            })
            .attr('y', function (d) {
              return (d.text_cordinate[1] * SCALE);
            })
            .attr("dy", ".35em")
            .text(function (d) {
              return d.planets.join(', ');
            });
      }
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