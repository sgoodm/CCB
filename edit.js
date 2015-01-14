 (function() {
	 
	var json = {};

	// function readJSON(file, callback) {
 //    return $.Deferred( function(){
	//     $.ajax({
	//       type: "GET",
	//       dataType: "json",
	//       url: file,
	//       async: false,
	//       success: function (request) {
	//         callback(request, "good", 0);
	//       },    
	//       error: function (request, status, error) {
	//         callback(request, status, error);
	//       }
	//     })
	//   })
	// };

	$(function() {

		// json.data = readJSON("toolbox1.json", function (request, status, error){
		//   if (error) {
		//     console.log(status);
		//     console.log(error);
		//     $('#message').append("Error Reading Data");
		//     return 1;
		//   } else {
		//   	return request
		//   }
		// })

		// json.schema = readJSON("schema.json", function (request, status, error){
		//   if (error) {
		//     console.log(status);
		//     console.log(error);
		//     $('#message').append("Error Reading Data");
		//     return 1;
		//   } else {
		//   	return request
		//   }
		// })

		$.when( $.getJSON("toolbox1.json"), $.getJSON("schema.json") ).done( function(data, schema){
			json.data = data[0]
			json.schema = schema[0]
			if (json.data != 1  && json.schema != 1) {
				var options = { schema:json.schema, data:json.data };
				var el = $("#editor");
				// var treema = el.treema(options); 
				var treema = TreemaNode.make(el, options);
				treema.build();
				console.log("treema built");
			} else {
				console.log("error loading data or schema json file");
			}
		})

		  // var html = ''
		  // for (var i=0, ix=_.size(json.categories); i<ix; i++) {
		  //   var cat = json.categories[_.keys(json.categories)[i]];
		  //   html += '<div class="category">' + cat.title;
		    
		  //   for (var j=0, jx=_.size(cat.layers); j< jx; j++) {
		  //     var layer = cat.layers[_.keys(cat.layers)[j]];
		  //     html += '<div class="layer">' + layer.title;
		  //     // console.log(layer);
		  //     var keys = _.keys(layer);
		  //     // console.log(keys.length)
  		//     for (var k=0, kx=keys.length; k< kx; k++) {
  		//     	var key = keys[k];
  		//     	var content = layer[key];
			 //      html += '<div class="layer_item">' + key + " : " + content + '</div>';

			 //    //   if (layer.filters) {
			 //    //     for (var k=0, kx=_.size(layer.filters); k<kx; k++) {
			 //    //       var filter = layer.filters[_.keys(layer.filters)[k]];
			 //    //       html += '<div class="filter_toggle" data-sql="'+filter.sql+'">' + filter.title +'</div>';
			 //    //     }
			 //    //   }

			 //  	}
		  //     html += '</div>';
		  //   }

		  //   html += '</div>';
		  // }
		  // // console.log(html);
		  // $('#editor').append(html);

	})


}).call(this);
