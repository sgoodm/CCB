 (function() {
	 
	var json = {}, treema;


	$(function() {

		$.when( $.getJSON("toolbox.json"), $.getJSON("schema.json") ).done( function(data, schema){
			
			json.data = data[0]
			json.schema = schema[0]

			if (data[1] == "success"  && schema[1] == "success") {
				var options = { schema:json.schema, data:json.data };
				var el = $("#data");
				// var treema = el.treema(options); 
				treema = TreemaNode.make(el, options);
				treema.build();
				console.log(treema.data);
				console.log("treema built");
			} else {
				console.log("error loading data or schema json file");
			}
		})

	})

	$('#submit button').click(function(){
		console.log("click");

		// check json isValid()
		var valid1= treema.isValid();
		console.log(valid1)

		var valid2 = tv4.validate(treema.data, json.schema)
		console.log(valid2)

		console.log(treema.data)
		
		// var confirm = confirm("Confirm update")
		// console.log(confirm)

	})


}).call(this);
