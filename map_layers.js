$(function() {

  // --------------------------------------------------  
  // browser check

  var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
  var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
  // At least Safari 3+: "[object HTMLElementConstructor]"
  var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
  var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

  // --------------------------------------------------
  // var init
  
  var active_layers, afterPrint, beforePrint, close_toolbox, control, 
      do_open_hashtag, drawnItems, filter_list, group, hash_change, 
      init_map, layer_colors, layer_list, map, map_defaultzoommax, mediaQueryList, 
      open_hashtag, open_toolbox, refresh_layers, sql, toggle_filter, 
      toggle_layer, validate, zoom_limit;

  var temp_key, temp_title;

  active_layers = {};
  layer_list = [];
  filter_list = [];
  group = {};
  hash_change = 1;
  layer_colors = {};
  map = void 0;
  sql = new cartodb.SQL({
    user: 'sgoodm'
  });
  validate = {};
  zoom_limit = {};

  // --------------------------------------------------
  // initialize map

  var baseMaps = {
    "OpenStreetMap":        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
                              attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
                            }),
    "MapQuest_OpenAerial":  L.tileLayer('http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
                              attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
                              subdomains: '1234'
                            }),
    "MapQuest_OSM":         L.tileLayer('http://oatile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
                              attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
                              subdomains: '1234'
                            }),
    "Hiking":               L.tileLayer("http://toolserver.org/tiles/hikebike/{z}/{x}/{y}.png")

  };

  var overlayMaps = {};

  map = new L.map('map', {
    measureControl: true, // measure distance tool
    center: [37.27, -76.70],
    zoom: 8,
    layers: [baseMaps["OpenStreetMap"]]
  });

  map.options.minZoom = 3;
  map_defaultzoommax = 20;

  $('.leaflet-control-attribution').hide();

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

  // --------------------------------------------------
  // map buttons

  var mb_html = 
  mb_html += '<div id="map_buttons">';
  mb_html += '<div id="mb_link" class="map_button">Generate Link</div>';
  mb_html += '<div id="mb_print" class="map_button">Print Report</div>';
  mb_html += '<div id="mb_tools" class="map_button">Toggle Map Tools</div>';
  mb_html += '</div>';
  $('#map').append(mb_html);


  $('#mb_link').on('click', function () {
    var url_search = {
                        layer: layer_list,
                        filters: filter_list,
                        zoom: map.getZoom(), 
                        lat: map.getCenter().lat, 
                        lng: map.getCenter().lng
                      }

    var keys = _.keys(baseMaps);
    for ( var i=0, ix=keys.length; i<ix; i++ ) {
      if ( map.hasLayer(baseMaps[ keys[i] ]) ) {
        url_search.base = keys[i];      
      }
    }

    var url_new = URI(document.URL).addSearch(url_search)
    hash_change = 0;
    window.location.hash = url_new.query()
    
  })

  $('#mb_print').on('click', function () {
    console.log("print")

    // return

    // console.log("running printer")
    // console.log(map)

    alert("Generating report. This may take a moment...");

    // generate tile data

    // go through all layers, and collect a list of objects

    var offsetX = parseInt(map._container.offsetLeft);
    var offsetY = parseInt(map._container.offsetTop);

    var size  = map.getSize();
    var tiles = [];

    var te = {
      x: {
        min:null,
        max:null
      }, 
      y: {
        min:null,
        max:null
      },
      diff: {
        x: null,
        y: null
      },
      min: {
        x: null,
        y: null
      }
    };

    $('.leaflet-layer').each ( function () {

      var tile_layer = false; 

      var tmp_tiles = [];

      var t0 = 1;

      $(this).find('.leaflet-tile-container').each( function () {
        
        if ( $(this).children().length > 0 && tile_layer == false ) {
          
          tile_layer = true;

          $(this).find('img').each( function () {

            var tileposraw = $(this)[0].style.transform.replace(/translate|\)|\(| |px/g,'').split(',');

            if ( t0 == 1 && parseInt(tileposraw[0]) -256 && parseInt(tileposraw[1]) > -256 ) {

              var ti = [null,null,null]
              ti[2] = $(this)[0].src.lastIndexOf('.');
              ti[1] = $(this)[0].src.lastIndexOf('/');

              ti[0] = $(this)[0].src.lastIndexOf('/', ti[1]-1);

              var tx = parseInt($(this)[0].src.substr( ti[0]+1, ti[1]-ti[0]-1 ));
              var ty = parseInt($(this)[0].src.substr( ti[1]+1, ti[2]-ti[1]-1 ));

              te.x.min = tx < te.x.min || te.x.min == null ? tx : te.x.min;
              te.x.max = tx > te.x.max || te.x.max == null ? tx : te.x.max;
              te.y.min = ty < te.y.min || te.y.min == null ? ty : te.y.min;
              te.y.max = ty > te.y.max || te.y.max == null ? ty : te.y.max;

              te.min.x = tileposraw[0] < te.min.x || te.min.x == null ? tileposraw[0] : te.min.x;
              te.min.y = tileposraw[1] < te.min.y || te.min.y == null ? tileposraw[1] : te.min.y;

            }

          })

          $(this).find('img').each( function () {

            var tileposraw = $(this)[0].style.transform.replace(/translate|\)|\(| |px/g,'').split(',');

            if ( parseInt(tileposraw[0]) > -256 && parseInt(tileposraw[1]) > -256) {
              tmp_tiles.push({
                url: $(this)[0].src,
                x: parseInt(tileposraw[0]) - te.min.x,
                y: parseInt(tileposraw[1]) - te.min.y
              })
            }

          })

          if ( t0 == 1 ) {
            te.diff.x = te.x.max - te.x.min + 1;
            te.diff.y = te.y.max - te.y.min + 1
          }
          t0 = 0;

          tiles.push(tmp_tiles)
          console.log(te)

        }
      })
    })

    // console.log( tiles )


    // hand off the list to our server-side script, which will do the heavy lifting
    var tiles_json = JSON.stringify(tiles);

    // var tileData = { call: "tiles", width: size.x, height: size.y, tiles: tiles_json };
    var tileData = { call: "tiles", width: te.diff.x * 256, height: te.diff.y * 256, tiles: tiles_json };

    console.log(tileData);  

    // pass tile data to php
    $.ajax ({
      url: "process.php",
      data: tileData,
      type: "post",
      async: false,
      success: function (result) {
        console.log("Tiles Done");
        console.log(result);

        // give user report download link
        // window.open(result);

      },
      error: function (request, status, error) {
        console.log("Tiles Error");
        console.log(error);

      }
    })
   
  })

  $('#mb_tools').on('click', function () {

    $('.leaflet-draw').each( function () {
      $(this).toggle()
    })

    $('.leaflet-control-measure').each( function () {
      $(this).toggle()
    })

  })

  // --------------------------------------------------
  // hash change

  // check hashtag on page load or on change
  open_hashtag();
  $(window).on('hashchange', open_hashtag);

  // --------------------------------------------------
  // toolbox json validation / html builder

  validate.json = function(json) {
    for (var i=0, ix=json.categories.length; i<ix; i++) {
      var cat = json.categories[i];
      validate.cat(cat);
    }
  }

  validate.cat = function(cat) {
    // CATEGORY VALIDATION
    if ( cat == "" || cat.layers.length == 0 ) {
      return 1;
    }
    // CHECK FIRST LAYER
    var zlayer = cat.layers[0];
    if ( zlayer.title == "" || zlayer.group == "" || zlayer.type == "" || zlayer.key == "" ) {
      return 2;
    }

    validate.cat_html += '<div class="category">' + cat.title;
    for (var j=0, jx=cat.layers.length; j< jx; j++) {
      var layer = cat.layers[j];
      validate.layer(layer);
    }
    validate.cat_html += '</div>';
  }

  validate.layer = function(layer) {
    // LAYER SPECIFIC VALIDATION
    if (  layer.title == "" || layer.group == "" || layer.type == "" || layer.key == "" ) {
      return 1
    }

    validate.cat_html += '<div class="layer">';

    validate.cat_html += '<div class="layer_toggle"'
    validate.cat_html += 'data-hashtag="'+layer.hashtag+'"';
    validate.cat_html += 'data-key="'+layer.key+'"';
    validate.cat_html += 'data-group="'+layer.group+'"';
    validate.cat_html += 'data-type="'+layer.type+'"';
    validate.cat_html += 'data-title="'+layer.title+'"';

    if (layer.centerlon && layer.centerlat && layer.zoom) {
      validate.cat_html += 'data-centerlon="'+layer.centerlon+'"';
      validate.cat_html += 'data-centerlat="'+layer.centerlat+'"' ;
      validate.cat_html += 'data-zoom="'+layer.zoom+'"';
    }

    if (layer.maxzoom) {
      validate.cat_html += 'data-maxzoom="'+layer.maxzoom+'"';
    } else {
      validate.cat_html += 'data-maxzoom="'+map_defaultzoommax+'"';
    }

    validate.cat_html += '>' + layer.title + '</div>';

    // validate.cat_html += '<div class="layer_content">';


    if (layer.centerlon && layer.centerlat && layer.zoom) {
    
      validate.cat_html += '<div class="layer_extent">Zoom to Extents</div>';

    }

    validate.cat_html += (layer.description ? '<div class="layer_description">' + layer.description + '</div>' : '');
    validate.cat_html += (layer.link ? '<div class="layer_info"><a href="'+layer.link+'" target="_blank">More info</a></div>' : '');

    // validate.cat_html += '</div>';

    if (layer.filters && layer.filters.length > 0) {
      for (var k=0, kx=layer.filters.length; k<kx; k++) {
        var filter = layer.filters[k];
        validate.filter(filter);
      }
    }

    validate.cat_html += '</div>';
  }

  validate.filter = function(filter) {

    if ( filter.sql == "" || filter.title == "" ) {
      return 1
    }

    // FILTER SPECIFIC VALIDATION HERE
    validate.cat_html += '<div class="filter_toggle" data-sql="'+filter.sql+'">' + filter.title +'</div>';
  }

  // build toolbox html
  readJSON("toolbox.json", function (request, status, error){
    // var json = request
    if (error) {
      console.log(status);
      console.log(error);
      $('#toolbox .body').append("Error Reading Data");
      return 1;
    }

    validate.cat_html = ''
    validate.json(request)

    $('#layers').append(validate.cat_html);
  })


  // --------------------------------------------------
  // search box

  // marker for search result (lat / long or address)
  var geocode_result;

  // manage search box display
  $("#search-box").hide();

  $("#search-link").on("click", function() {
    $("#search-box").toggle();
  });

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
      map.removeLayer(window.marker);
    }
    window.marker = void 0;
  });

  $("#search-clear").click();

  function geocode_result(position) {
    var position = _.values(position);

    if (window.marker === void 0) {

      window.marker = new L.marker(position, {draggable:'true'});

      window.marker.on('dragend', function(event){
        $("#search_lat").val(window.marker.getLatLng().lat);
        $("#search_long").val(window.marker.getLatLng().lng);
        $("#search_address").val("");
        
      });

      map.addLayer(window.marker);

    }

    window.marker.setLatLng(position);
    map.setView(position, 8);
  };

  // --------------------------------------------------
  // manage toolbox interactions

  // init layer signs
  $(".layer").each(function() {
    $(this).prepend("<div class='layer_sign'></div>");
  });

  // init toolbox
  $("#toolbox").each(function () {
    var pos, tb;
    tb = $(this);
    if (tb.data('layers') === 'active') {
      $(".layer_toggle").each(function () {
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

  // init filter signs
  $(".filter_toggle").each(function() {
    $(this).prepend("<div class='filter_sign'></div>");
  });

  // show / hide toolbox
  // $("#toolbox .title").click(function() {
  $('#toolbox_toggle').click(function(){

    var collapsed = $('#toolbox').data("collapsed");
    if (collapsed) {
      open_toolbox();
    } else {
      close_toolbox();
    }

  });

  // layer click
  $(".layer_toggle").click(function() {
    if ( !$(this).hasClass("layer_animation") ){
      toggle_layer($(this));
    } else {
      // toggle_animation($(this));
    }
  });

  // sub layer filter click
  $(".filter_toggle").click(function() {

    $(this).find(".filter_sign").toggleClass("active_layer_sign");
    if ( $(this).find(".filter_sign").hasClass("active_layer_sign") ) {
      // add to filter list
      filter_list.push($(this).data('sql'));
    } else {
      // remove from filter list
      var filter_index = filter_list.indexOf( $(this).data('sql') );
      if (filter_index > -1) {
        filter_list.splice(filter_index, 1);
      }
    }
    toggle_filter($(this));
  });

  $('.layer_extent').click( function () {
    var new_lat = $(this).prev().data('centerlat'),
        new_lon = $(this).prev().data('centerlon'),
        new_zoom = $(this).prev().data('zoom');

    console.log( new_lat, new_lon, new_zoom)
    if ( new_lat && new_lon && new_zoom ) {
      map.setView([new_lat, new_lon], new_zoom);
    }

  })


  $('#legend_tabs').on('click', '.legend_tab', function () {

    $('.cartodb-legend-stack').each(function(){
      $(this).hide();
    });

    $('#'+$(this).attr('id').replace('tab_', '')).show();
      
    $('.legend_tab').each(function(){
      $(this).removeClass('legend_tab_active');
    });

    $(this).addClass('legend_tab_active');
  })

  $('#map').on('DOMNodeInserted', function(e) {
      if ( $(e.target).is('.cartodb-legend-stack') && temp_key && $(e.target)[0].style.display != 'none') {
        // console.log($(e.target)[0].style.display)
        // console.log($(e.target)[0])
        $(e.target)[0].id = 'legend_'+temp_key 
        $('#legend_tabs').prepend('<div id="legend_tab_'+ temp_key +'" class="legend_tab" title="'+ temp_title +'">'+ temp_title +'</div>')
        $('#legend_tab_'+ temp_key).click();
      }
  });

  // open toolbox up from minimized state
  function open_toolbox() {
    var pan = map.getCenter();

    var mdiv, tb;
    $('#toolbox_toggle').removeClass('fa-chevron-right')
    $('#toolbox_toggle').addClass('fa-chevron-left')
    tb = $("#toolbox");
    mdiv = $("#map");
    tb.animate({
      left: 0
    });
    mdiv.animate({
      left: 250
    }, function () {
      map.invalidateSize();
      map.panTo(pan, {animate:true, duration:1.0});
    });
    tb.data("collapsed", false);
  };

  // minimize toolbox to left of screen
  function close_toolbox() {
    var pan = map.getCenter();

    var mdiv, tb;
    $('#toolbox_toggle').removeClass('fa-chevron-left')
    $('#toolbox_toggle').addClass('fa-chevron-right')
    tb = $("#toolbox");
    mdiv = $("#map");
    tb.animate({
      left: -220
    });
    mdiv.animate({
      left: 30
    }, function () {
      map.invalidateSize();
      map.panTo(pan, {animate:true, duration:1.0});
    });
    tb.data("collapsed", true);
  };


  // filter layer using toolbox (sub list) as selector
  function toggle_filter(f) {

    var filter, key, sublayer, t, tn;

    $(".cartodb-tooltip").hide();
    $(".cartodb-infowindow").hide();
    $(".cartodb-popup").remove();

    t = f.parent().find('.layer_toggle');

    key = $(t).data('key');
    sublayer = active_layers[key].getSubLayer(0);
    tn = sublayer.get('layer_name');

    filter = ""
    
    if (filter_list.length == 0) {
      sql = "SELECT * from " + tn;
    } else {
      for (var i=0, ix=filter_list.length; i<ix; i++) {
        filter += ( i == 0 ? "" : " OR ");
        filter += filter_list[i];
      }
      sql = "SELECT * from " + tn + " where " + filter;
    }
    sublayer.setSQL(sql);

  };

  // toggle map layer using toolbox as selector
  function toggle_layer(t, force, callback) {

    var sublayer = ( t.data('type') == "sublayer" );
    var animation =  ( t.data('type') == "animation" );

    temp_key = t.data("key");
    temp_title = t.data("title");

    zoom_limit[t.data("key")] = map_defaultzoommax;

    group.old = group.new;
    group.new = t.data('group');
    // clear filter list on layer change
    filter_list = [];

    // force when layer is from hashtag link data  
    force = ( force == null ? false : force);

    // true when opening (from hash or toolbox), false when closing
    var needs_load = force || !t.hasClass("active_layer");

    if ( animation && needs_load) {
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      $(".leaflet-left").css("visibility", "hidden");
      $('.cartodb-legend-stack').remove();
      $('#map_buttons').hide();

    } else {
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      $(".leaflet-left").css("visibility", "visible");
      $('#map_buttons').show();

    }


    // remove layer legend and tab (manually close layer)
    if ( $('#legend_'+t.data("key")).length > 0 ) {
      $('#legend_'+t.data("key")).remove();
      $('#legend_tab_'+t.data("key")).remove();
    }

    // $('.cartodb-legend-stack').each(function(){
    //   $(this).hide();
    // });
    

    // manage removing layer from current group
    if ( sublayer && t.hasClass("active_layer") ) {
      var undefined;
      var layer = active_layers[t.data("key")];
      if (layer != undefined) {
        layer.hide();
        layer.remove();
        delete active_layers[t.data("key")];
      }
      layer_list.splice( layer_list.indexOf(t.data('title')), 1 );
      t.removeClass("active_layer");
      t.parent().find(".layer_sign").removeClass("active_layer_sign");
      // t.parent().find('.layer_content').slideUp();
      t.parent().find('.layer_extent').slideUp();
      t.parent().find('.layer_description').slideUp();
      t.parent().find('.layer_info').slideUp();
      t.parent().find('.filter_toggle').slideUp();
      _gaq.push(['_trackEvent', 'Layers', 'Hide', $(this).data("key")]);
    }


    // manage previously active layer when switching layer groups
    $(".filter_sign").removeClass("active_layer_sign");

    if ( !sublayer || group.new != group.old) {
      $('#legend_tabs').empty();
      layer_list = [];
      $(".layer_sign").removeClass("active_layer_sign");
      $(".active_layer").each(function() {
        var undefined;
        var layer = active_layers[$(this).data("key")];
        if (layer != undefined) {
          layer.hide();
          layer.remove();
          delete active_layers[$(this).data("key")];
        }
        active_hashtag = undefined;
        $(this).removeClass("active_layer");
        // t.parent().find('.layer_content').slideUp();
        $(this).parent().find('.layer_extent').slideUp();
        $(this).parent().find('.layer_description').slideUp();
        $(this).parent().find('.layer_info').slideUp();
        $(this).parent().find('.filter_toggle').slideUp();
        _gaq.push(['_trackEvent', 'Layers', 'Hide', $(this).data("key")]);
      });

    }

    // general map cleanup
    $(".cartodb-tooltip").hide();
    $(".cartodb-infowindow").hide();
    $(".cartodb-popup").remove();
    $(".cartodb-timeslider").remove();

    var layerUrl = "http://sgoodm.cartodb.com/api/v2/viz/" + t.data("key") + "/viz.json";

    // check link before loading
    validate.url = 0;
    $.ajax ({
      url: "process.php",
      data: {call: "url", url: layerUrl},
      dataType: "json",
      type: "post",
      async: false,
      success: function (result) {
        // console.log("done");
        // console.log(result);
        if ( result != null ) {
          validate.url = 1;
        } else {
          console.log("invalid url");    
        }

      },
      error: function (result) {
        console.log("error checking url");
        // console.log(result);
      }
    })
    
    // manage loading a layer
    if (needs_load && validate.url) {

      zoom_limit[t.data("key")] = t.data("maxzoom");

      t.parent().find(".layer_sign").addClass("active_layer_sign");

      layer_list.push( $(t).data('title') );

      // update page title for new layer
      // window.document.title = ( $(t).data('group') != "layer" ? $(t).data('group') : t.html() );
      window.document.title = $(t).data('group') ;

      map.spin(true);

      // create layer
      var newLayer = cartodb.createLayer(map, layerUrl);

      newLayer.on("done", function (layer) {
        active_layers[t.data("key")] = layer;
        addCursorInteraction(layer);

        if ( $(t).data('hashtag') ) {
          active_hashtag = $(t).data('hashtag');
        }

        map.spin(false);

        // callback is for managing filters from hashtag links only 
        if (callback) {
          callback();
        }
      });

      newLayer.addTo(map);
      map._layers[_.keys(map._layers)[0]].bringToBack();

      // update toolbox for new layer
      t.addClass("active_layer");
      // t.parent().find('.layer_content').slideDown();
      t.parent().find('.layer_extent').slideDown();
      t.parent().find('.layer_description').slideDown();
      t.parent().find('.layer_info').slideDown();
      t.parent().find('.filter_toggle').slideDown();
      _gaq.push(['_trackEvent', 'Layers', 'Show', t.data("key")]);

    }

    map.options.maxZoom = Math.min.apply(Math, _.values(zoom_limit));
    map.setZoom(map.getZoom());

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

  // refresh map by searching toolbox for loaded layer
  function refresh_layers() {
    $(".layer_toggle").each(function() {
      var layer, t;
      t = $(this);
      if (t.data("loaded")) {
        layer = active_layers[t.data("key")];
        layer.invalidate();
      }
    });
  };

  // --------------------------------------------------
  // manage hashtag data links

  function do_open_hashtag() {

    var url = document.URL.replace("#", "?"),
        url_query = URI(url).query(true),
        h;

    if (url_query.base) {
      // console.log(url_query.base)
      // console.log(baseMaps)
      var keys = _.keys(baseMaps);
      for ( var i=0, ix=keys.length; i<ix; i++ ) {
        if ( map.hasLayer(baseMaps[ keys[i] ]) ) {
          map.removeLayer( baseMaps[ keys[i] ] );      
        }
      }
      map.addLayer( baseMaps[url_query.base] )
    }

    if (url_query.layer){
      h = url_query.layer;
    } else {
      // old hash filter
      h = window.location.hash.substring(1);
    }

    var hash_layer_info = {
      layer: false
    };

    $(".layer_toggle").each(function() {
      
      if ($(this).data('hashtag') === h || $(this).data('title') === h || h.indexOf( $(this).data('title') ) > -1 ) {
        var $layer = $(this);

        if ( $(this).data('hashtag') === h && $(this).data('centerlon') && $(this).data('centerlat') && $(this).data('zoom') ) {
          hash_layer_info.layer = true;
          hash_layer_info.centerlat = $(this).data('centerlat');
          hash_layer_info.centerlon = $(this).data('centerlon');
          hash_layer_info.zoom = $(this).data('zoom');
        } 

        // manage layers, filters, sublayers
        toggle_layer($layer, true, function(){
          
          if ( active_layers[$layer.data("key")] && url_query.filters && url_query.filters.length > 0 ) {

            $layer.parent().find('.filter_toggle').each(function () {
              if ( url_query.filters.indexOf( $(this).data('sql') ) > -1 ) {
                $(this).click();
              }
            });
          }
        });

        if ( hash_layer_info.layer ) {
          map.setView([ hash_layer_info.centerlat,  hash_layer_info.centerlon],  hash_layer_info.zoom);
        } else if (url_query.zoom && url_query.lat && url_query.lng) {
          map.setView([url_query.lat, url_query.lng], url_query.zoom);
        }

      }
    });


  };

  // check hashtag (called on page load or on hashtag change)
  function open_hashtag() {
    // check for hash_change variable to avoid reloads when hash change was generate by page
    if (window.location.hash !== '' && hash_change == 1) {
      setTimeout(do_open_hashtag, 200);
    }
    hash_change = 1;
  };

  // --------------------------------------------------
  // general functions  

  function readJSON(file, callback) {
    $.ajax({
      type: "GET",
      dataType: "json",
      url: file,
      async: false,
      success: function (request) {
        callback(request, "good", 0);
      },    
      error: function (request, status, error) {
        callback(request, status, error);
      }
    }) 
  };

  // --------------------------------------------------
  // printing
  
  function afterPrint() {
    _gaq.push(['_trackEvent', 'Layers', 'Print']);
  };

  function beforePrint() {};

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

})
