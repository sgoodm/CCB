(function() {

  // init
  var active_layers, afterPrint, beforePrint, close_toolbox, control, do_open_hashtag, init_map, 
      layer_colors, map, mediaQueryList, open_hashtag, open_toolbox, refresh_layers, sql, toggle_filter, 
      toggle_layer, drawnItems;

  map = void 0;

  active_layers = {};

  layer_colors = {};

  sql = new cartodb.SQL({
    user: 'sgoodm'
  });

  // initialize map
  init_map = function (id) {

    var OpenStreetMap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'//,
      // zIndex: 0
    });
    
    var MapQuestOpen_Aerial = L.tileLayer('http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
      attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
      subdomains: '1234'//,
      // zIndex: 0
    });

    var baseMaps = {
      "OpenStreetMap":OpenStreetMap,
      "MapQuestOpen_Aerial":MapQuestOpen_Aerial
    };

    var overlayMaps = {};

    map = new L.map('map', {
      measureControl: true, // measure distance tool
      center: [37.27, -76.70],
      zoom: 8,
      layers: [OpenStreetMap]
    });

    control = L.control.layers(baseMaps, overlayMaps);
    control.addTo(map);

    map.on('baselayerchange',function(e){
      map._layers[_.keys(map._layers)[0]].bringToBack();
    });

    // handle map drawing tools
    drawnItems = L.featureGroup().addTo(map);

    map.addControl(new L.Control.Draw({
      edit: { featureGroup: drawnItems }
    }));

    map.on('draw:created', function(event) {
      var layer = event.layer;
      drawnItems.addLayer(layer);
    });

    var legend_button = L.easyButton('fa-exchange', 
      function (){
        $('.cartodb-legend-stack').each(function(){
          $(this).toggle();
        })
      },
      'Toggle the legend display',
      map
    )

    var url_button = L.easyButton('fa-external-link', 
      function (){
        var url_search = {
                            layers:["eagles","bird's (stuff)"],
                            filters:[],
                            zoom:map.getZoom(), 
                            lat:map.getCenter().lat, 
                            lng:map.getCenter().lng
                          }
        var url_new = URI(document.URL).addSearch(url_search)
        window.location.hash = url_new.query()

      },
      'Generate url link to current map view',
      map
    )

  };


  // refresh map by searching toolbox for loaded layer
  refresh_layers = function () {
    $(".layer_toggle").each(function() {
      var layer, t;
      t = $(this);
      if (t.data("loaded")) {
        layer = active_layers[t.data("key")];
        layer.invalidate();
      }
    });
  };

  // open toolbox up from minimized state
  open_toolbox = function () {
    var mdiv, tb;
    tb = $("#toolbox");
    mdiv = $("#map");
    tb.animate({
      left: 0
    });
    mdiv.animate({
      left: 250
    });
    tb.data("collapsed", false);
  };

  // minimize toolbox to left of screen
  close_toolbox = function () {
    var mdiv, tb;
    tb = $("#toolbox");
    mdiv = $("#map");
    tb.animate({
      left: -220
    });
    mdiv.animate({
      left: 30
    }, function() {
      google.maps.event.trigger(map, 'resize');
    });
    tb.data("collapsed", true);
  };

  function addCursorInteraction(layer) {
    var hovers = [];

    layer.bind('featureOver', function (e, latlon, pxPos, data, layer) {
      hovers[layer] = 1;
      if(_.any(hovers)) {
        $('#map').css('cursor', 'pointer');
      }
    });

    layer.bind('featureOut', function (m, layer) {
      hovers[layer] = 0;
      if(!_.any(hovers)) {
        $('#map').css('cursor', 'auto');
      }
    });
  }

  // filter layer using toolbox (sub list) as selector
  toggle_filter = function (f) {
    var filter, key, sublayer, t, tn;

    $(".cartodb-tooltip").hide()
    $(".cartodb-infowindow").hide()
    
    $(".filter_sign").removeClass("active_layer_sign");
    $(f).find(".filter_sign").addClass("active_layer_sign");
    t = f.parent().find('.layer_toggle');
    filter = "common_nam='" + $(f).data('sql') + "'";
    key = $(t).data('key');
    sublayer = active_layers[key].getSubLayer(0);
    tn = sublayer.get('layer_name');
    sql = "SELECT * from " + tn + " where " + filter;
    console.log(sql)
    sublayer.setSQL(sql);
  };

  // toggle map layer using toolbox as selector
  toggle_layer = function (t, force) {
    var layerUrl, needs_load;
    if (force == null) {
      force = false;
    }
    needs_load = force || !t.hasClass("active_layer");

    // manage previously active layer in toolbox
    $(".layer_sign").css("background-color", "");
    $(".layer_sign").css("background-color", "");
    $(".layer_sign").removeClass("active_layer_sign");
    $(".filter_sign").removeClass("active_layer_sign");
    $(".active_layer").each(function() {
      var layer;
      layer = active_layers[$(this).data("key")];
      layer.hide();
      layer.remove();
      // layer.clear();
      delete active_layers[$(this).data("key")];
      $(this).removeClass("active_layer");
      $(this).parent().find('.layer_description').slideUp();
      $(this).parent().find('.layer_info').slideUp();
      $(this).parent().find('.filter_toggle').slideUp();
      _gaq.push(['_trackEvent', 'Layers', 'Hide', $(this).data("key")]);
    });

    // popup cleanup
    $(".cartodb-tooltip").hide()
    $(".cartodb-infowindow").hide()

    // TEMP legend cleanup
    $('.cartodb-legend-stack').remove()

    // manage new layer
    if (needs_load) {

      map.spin(true)

      // update page title for new layer
      window.document.title = t.html();

      // create layer
      layerUrl = "http://sgoodm.cartodb.com/api/v2/viz/" + t.data("key") + "/viz.json";
      var newLayer = cartodb.createLayer(map, layerUrl)

      newLayer.on("done", function (layer) {
        console.log("layerUrl")
        active_layers[t.data("key")] = layer;
        addCursorInteraction(layer);
        t.parent().find(".layer_sign").addClass("active_layer_sign");
        // if ( t.data("hashtag") ) {
        //   window.location.hash = t.data("hashtag");
        // }
        map.spin(false)
      });

      console.log(L.latLngBounds(newLayer))
      // control.addOverlay(newLayer, t.html())
      // map.addLayer(newLayer)
      newLayer.addTo(map)
      map._layers[_.keys(map._layers)[0]].bringToBack()

      // update toolbox for new layer
      t.addClass("active_layer");
      t.parent().find('.layer_description').slideDown();
      t.parent().find('.layer_info').slideDown();
      t.parent().find('.filter_toggle').slideDown();
      _gaq.push(['_trackEvent', 'Layers', 'Show', t.data("key")]);
    }
  };

  // attempt toggle_layer call with hashtag as id
  do_open_hashtag = function () {

    var url = document.URL.replace("#", "?")

    var url_query = URI(url).query(true)

    console.log(url_query)

    
    if (url_query.layers && url_query.zoom && url_query.lat && url_query.lng){
      console.log("new #")
      map.setView([url_query.lat, url_query.lng], url_query.zoom);
    } else {
      console.log("old #")
      // old hash filter
      var h;
      h = window.location.hash.substring(1);
      console.log(window.location.hash +" "+ h)
      $(".layer_toggle").each(function() {
        if ($(this).data('hashtag') === h) {
          toggle_layer($(this), true);
        }
      });

    }
  };

  // check hashtag (called on page load or on hashtag change)
  open_hashtag = function () {
    if (window.location.hash !== '') {
      setTimeout(do_open_hashtag, 200);
    }
  };

  function readJSON(file, callback) {
    $.ajax({
      type: "GET",
      dataType: "json",
      url: file,
      async: false,
      success: function (request) {
        callback(request, "good", 0)
      },    
      error: function (request, status, error) {
        callback(request, status, error);
      }
    }) 
  };


  // on document ready
  $(function() {

    // build toolbox html
    readJSON("toolbox.json", function (request, status, error){
      var json = request
      if (error) {
        console.log(status)
        console.log(error)
        $('#toolbox .body').append("Error Reading Data")
        return 1
      }

      var html = ''
      for (var i=0, ix=_.size(json.categories); i<ix; i++) {
        var cat = json.categories[_.keys(json.categories)[i]]
        html += '<div class="category">' + cat.title
        for (var j=0, jx=_.size(cat.layers); j< jx; j++) {
          var layer = cat.layers[_.keys(cat.layers)[j]]
          html += '<div class="layer">' 
          html += '<div class="layer_toggle" data-hashtag="'+layer.hashtag+'" data-key="'+layer.key+'">' + layer.title + '</div>'
          html += '<div class="layer_description">' + layer.description + '</div>'
          html += '<div class="layer_info"><a href="'+layer.link+'" target="_blank">More info</a></div>'
          if (layer.filters) {
            for (var k=0, kx=_.size(layer.filters); k<kx; k++) {
              var filter = layer.filters[_.keys(layer.filters)[k]]
              html += '<div class="filter_toggle" data-sql="'+filter.sql+'">' + filter.title +'</div>'
            }
          }
          html += '</div>'
        }
        html += '</div>'
      }
      $('#toolbox .body').append(html)

    })

    // init layer signs
    $(".layer").each(function() {
      $(this).prepend("<div class='layer_sign'></div>");
    });

    // init filter signs
    $(".filter_toggle").each(function() {
      $(this).prepend("<div class='filter_sign'></div>");
    });

    // show / hide toolbox
    $("#toolbox .title").click(function() {
      var collapsed;
      collapsed = $('#toolbox').data("collapsed");
      if (collapsed) {
        open_toolbox();
      } else {
        close_toolbox();
      }
    });

    // layer click
    $(".layer_toggle").click(function() {
      toggle_layer($(this));
    });

    // sub layer filter click
    $(".filter_toggle").click(function() {
      toggle_filter($(this));
    });

    // init toolbox
    $("#toolbox").each(function() {
      var pos, tb;
      tb = $(this);
      if (tb.data('layers') === 'active') {
        $(".layer_toggle").each(function() {
          toggle_layer($(this));
        });
      }
      if (tb.data('snap')) {
        $("#toolbox").css('position', 'absolute');
        pos = $("#map").position();
        $("#toolbox").css('left', pos.left + 10);
        $("#toolbox").css('top', pos.top + 10);
        $("#toolbox").css('height', $("#map").height() / 2);
        close_toolbox();
      }
    });

    // init map
    $("#map").each(function() {
      init_map($(this).attr('id'));
    });

    // manage search box display
    $("#search-box").hide();
    $("#search-link").on("click", function() {
      $("#search-box").toggle();
    });

    // marker for search result (lat / long or address)
    var geocode_result;

    geocode_result = function (position) {
      var position = _.values(position);

      if (window.marker === void 0) {

        window.marker = new L.marker(position, {draggable:'true'});

        window.marker.on('dragend', function(event){
          $("#search_lat").val(window.marker.getLatLng().lat)
          $("#search_long").val(window.marker.getLatLng().lng)
          $("#search_address").val("");
          
        });

        map.addLayer(window.marker);

      }

      window.marker.setLatLng(position);
      map.setView(position, 8);
    };

    // update map for search address
    $("#search_address").on("change", function() {
      var geocoder, v;
      geocoder = new google.maps.Geocoder();
      v = $("#search_address").val();
      console.log("geocode " + v);
      geocoder.geocode({
        'address': v
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          console.log('got result');
          $("#search_lat").val(results[0].geometry.location.lat());
          $("#search_long").val(results[0].geometry.location.lng());
          console.log('sending result');
          geocode_result(results[0].geometry.location);
          console.log('done result');
        }
      });
    });
    
    // update map for lat / long search
    $("#search_lat").on("change", function() {
      $("#search_address").val("");
      geocode_result(new google.maps.LatLng($("#search_lat").val(), $("#search_long").val()));
    });
    $("#search_long").on("change", function() {
      $("#search_address").val("");
      geocode_result(new google.maps.LatLng($("#search_lat").val(), $("#search_long").val()));
    });

    // clear search box
    $("#search-clear").on("click", function() {
      $("#search_address").val("");
      $("#search_long").val("");
      $("#search_lat").val("");
      map.setView([37.27, -76.70], 8);
      if (window.marker !== void 0) {
        map.removeLayer(window.marker)
      }
      window.marker = void 0;
    });

    // check hashtag on page load or on change
    open_hashtag();
    $(window).on('hashchange', open_hashtag);

    $("#search-clear").click();
  });


  // tracking - print
  afterPrint = function () {
    _gaq.push(['_trackEvent', 'Layers', 'Print']);
  };

  beforePrint = function () {};

  if (window.matchMedia) {
    mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
      if (mql.matches) {
        afterPrint();
      } else {
        beforePrint();
      }
    });
  }

  window.onafterprint = afterPrint;


}).call(this);
