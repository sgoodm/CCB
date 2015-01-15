<?php

switch ($_POST['call']) {

	case 'json':
		$json = json_encode( json_decode($_POST["json"]), JSON_PRETTY_PRINT ); 
		file_put_contents( "toolboxz.json", $json );
		echo json_encode("good");
		break;

	case 'url':

		$url = $_POST['url'];
		$file = file_get_contents( $url , true );
		$json = json_decode($file);
		echo json_encode($json);
		break;
}

?>
