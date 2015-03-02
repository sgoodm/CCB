<?php

switch ($_POST['call']) {

	case 'tiles':

		$handle = fopen('/var/www/html/aiddata/test.txt','w');
		// BASED ON: http://trac.osgeo.org/openlayers/wiki/TileStitchingPrinting

		$width = $_POST['width'];
		$height = $_POST['height'];
		$tiles = json_decode($_POST['tiles']);

		$TEMP_DIR = '/var/www/html/aiddata/tmp';

		$random   = md5(microtime().mt_rand());
		$url      = sprintf("%s/tmp_%s.jpg", $TEMP_DIR, $random );


		// function imagecopymerge_alpha($dst_im, $src_im, $dst_x, $dst_y, $src_x, $src_y, $src_w, $src_h){
		// 	// $w = imagesx($src_im);
		// 	// $h = imagesy($src_im);
		// 	$cut = imagecreatetruecolor($src_w, $src_h);
		// 	imagecopymerge($dst_im, $cut, $dst_x, $dst_y, $src_x, $src_y, $src_w, $src_h, 50);

		// 	// $testar = $dst_im.' --- '.$cut.' --- '.$dst_x.' --- '.$dst_y.' --- '.$src_x.' --- '.$src_y.' --- '.$src_w.' --- '.$src_h;
		// 	// file_put_contents('/var/www/html/aiddata/test.txt', $testar);

		// }
	






		// lay down an image canvas
		$image = imagecreatetruecolor($width, $height);

		imagefill($image, 0, 0, imagecolorallocate($image,255,255,255,127) ); // fill with white

		imagesavealpha($image, true);
		imagealphablending($image, true);

		// loop through the tiles, blitting each one onto the canvas
		foreach ($tiles as $layer) {
			foreach ($layer as $tile) {


			   	$tileimage = imagecreatefrompng($tile->url);
				

				imagecopy($image, $tileimage, $tile->x, $tile->y, 0, 0, 256, 256);

			}
		}

		// save to disk and tell the client where they can pick it up
		header("Content-type: image/jpg");

		imagejpeg($image, $url, 100);
		print $url;



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
