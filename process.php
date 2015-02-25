<?php

switch ($_POST['call']) {

	case 'tiles':

		

		break;

	// check cartodb link before loading layer
	case 'url':
		$url = $_POST['url'];
		$file = file_get_contents( $url , true );
		$json = json_decode($file);
		echo json_encode($json);
		break;

	// simple password check for json editor
	case 'pass':
		$out = false;
		if ($_POST['pass'] == "toolboxpass") {
			$out = true;
		}
		echo json_encode($out);
		break;
	// update json based on changes made in json editor
	case 'json':
		$json = json_encode( json_decode($_POST["json"]), JSON_PRETTY_PRINT ); 
		file_put_contents( "toolbox.json", $json );
		echo json_encode("good");
		break;
}

?>
