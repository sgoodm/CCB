 (function() {
	 
	var json = {}, treema;

	var message = {
		"intro":"Welcome to the Mapping Portal Toolbox Editor",
		"load":"JSON has been successfully loaded",
		"load_error":"Error loading data or schema json file",
		"submit":"JSON has been successfully updated",
		"submit_error":"Error updating JSON"

	}

	$('#message').html(message.intro);


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
				$('#message').html(message.load);
			} else {
				console.log("error loading data or schema json file");
				$('#message').html(message.load_error);
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

		$.ajax ({
	      	url: "process.php",
	      	data: {call: "json", json: JSON.stringify(treema.data)},
	      	dataType: "json",
	      	type: "post",
	      	async: false,
	      	success: function (result) {
		    	console.log("done");
				$('#message').html(message.submit);
			},
			error: function (result) {
		    	console.log("error");
		    	console.log(result);
				$('#message').html(message.submit_error);				
			}
    	})
	

	})


}).call(this);
