<?php

$root_dir = dirname(__FILE__);

/* gets the data from a URL */
// http://davidwalsh.name/curl-download
function get_data($url) {
	$ch = curl_init();
	$timeout = 5;
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}


switch ($_POST['call']) {

	// check cartodb link before loading layer
	case 'url':
		$url = $_POST['url'];

		$file = file_get_contents( $url , true );

		if ($file == NULL || $file == FALSE) {
			$file = get_data($url);
		}

		$json = json_decode($file);
		echo json_encode($json);
		break;

	// simple password check for json editor
	case 'pass':
		$out = false;
		if ($_POST['pass'] == "ccbtoolboxpass") {
			$out = true;
		}
		echo json_encode($out);
		break;

	// update json based on changes made in json editor
	case 'json':
		$json = $_POST["json"]; 

		if (version_compare(phpversion(), '5.4.0', '>=')) {
			$json = json_encode(json_decode($_POST["json"]), JSON_PRETTY_PRINT); 
		}

		$file = $root_dir."/toolbox.json";
		file_put_contents($file, $json);
		echo $json;
		break;

	case 'tiles':

		// BUILD IMAGE FROM TILES
		// based on: http://trac.osgeo.org/openlayers/wiki/TileStitchingPrinting

		$random = md5(microtime().mt_rand());

		$TEMP_DIR = $root_dir .'/tmp';

		if (!file_exists($TEMP_DIR) && !is_dir($TEMP_DIR)) {
			$old_mask = umask(0);
			mkdir($TEMP_DIR, 0775, true);
		}

		$TEMP_URL = sprintf("tmp_%s", $random );

		$image_url = sprintf("%s/tmp_%s.jpg", $TEMP_DIR, $random );
		$report_url = sprintf("%s/tmp_%s.pdf", $TEMP_DIR, $random );

		$width = $_POST['width'];
		$height = $_POST['height'];
		$tiles = json_decode($_POST['tiles']);

		$image = imagecreatetruecolor($width, $height);

		imagefill($image, 0, 0, imagecolorallocate($image,0,0,0) );

		imagesavealpha($image, true);
		imagealphablending($image, true);

		foreach ($tiles as $layer) {
			foreach ($layer as $tile) {

				$tile_url = get_data($tile->url);
				// $tile_url = $tile->url;

				// list($tilewidth,$tileheight,$tileformat) = @getimagesize($tile_url);

			 //    if (!$tileformat) continue;

			 //    // load the tempfile's image, and blit it onto the canvas
			 //    switch ($tileformat) {
			 //        case IMAGETYPE_GIF:
			 //           $tileimage = imagecreatefromgif($tile_url);
			 //           break;
			 //        case IMAGETYPE_JPEG:
			 //           $tileimage = imagecreatefromjpeg($tile_url);
			 //           break;
			 //        case IMAGETYPE_PNG:
			 //           $tileimage = imagecreatefrompng($tile_url);
			 //           break;
			 //    }

				$tileimage = imagecreatefromstring($tile_url);

				imagecopy($image, $tileimage, $tile->x, $tile->y, 0, 0, 256, 256);

			}
		}

		imagejpeg($image, $TEMP_DIR.'/'.$TEMP_URL.'.jpg', 100);


		// BUILD REPORT

		$license_text = '<p>The Center for Conservation Biology (CCB) provides certain data online as a free service to the public and the
						regulatory sector. CCB encourages the use of its data sets in wildlife conservation and management applications. 
						These data are protected by intellectual property laws. All users are reminded to view the 
						<a href="http://www.ccbbirds.org/resources/data-use-agreement/">Data Use Agreement</a> to 
						ensure compliance with our data use policies. For additional data access questions, view our 
						<a href="http://www.ccbbirds.org/resources/data-distribution-policy/">Data Distribution Policy</a>, 
						or contact our Data Manager, Marie Pitts, at mlpitts@wm.edu or 757-221-7503.</p>';


		$footer_text = '<p>Report generated by <a href="http://www.ccbbirds.org/maps/">The Center for Conservation Biology Mapping Portal</a>.</p>
					  	<p>To learn more about CCB visit <a href="http://www.ccbbirds.org">ccbbirds.org</a> or contact us at info@ccbbirds.org</p>';

		// build raw string
		$raw = '';
		$raw .= '<style> 
					#header {
						width: 100%;
						border-bottom: 1px solid black;
						margin-bottom: 20px;
					}
					#header_logo {
						position: fixed;
						top: 0px;
						left: 5px;
						width:50px;
						height:50px;
					}
					#header_title {
						width:100%;
						text-align: center;
						font-size: 30px;
					}
					#map {
						margin-bottom: 20px;
					}

					#map, #map img {
						text-align: center;
					}
					
					#layers {
						font-size: 10px;
						display:inline;
					}


					#legend {
						font-size: 10px;
					}

					.field {
						font-size: 12px;
						margin: 20px;
					}
					
					#license, #license p, #license p a {
						font-size: 8px
					}
					
					#footer {
						border-top: 1px solid black;
						margin-top:20px;
						padding: 10px;
						text-align: center;
						font-size: 10px;
					}
				</style>';

		// add header
		$raw .= '<div id="header">
					<div id="header_logo"><img src="http://labs.aiddata.org/aiddata/imgs/ccblogo_square_notext.jpg"></div>
					<div id="header_title">CCB Mapping Portal</div>
				</div>';

		// add map image
		$raw .= '<div id="map"><img height="500px" src="'.$TEMP_DIR.'/'.$TEMP_URL.'.jpg'.'"/></div>';




		// add legend if it exists
		// if ( count($_POST['legend']) > 0 ) {
		// 	$raw .= '<div id="legend"><b>Active Legend ('.$_POST['active'].'): </b>';
		// 		$raw .= '<ul>';
		// 		foreach ($_POST['legend'] as $legend_item) {
		// 			$raw .= '<li style="color:'.$legend_item[1].'">'.$legend_item[0].'</li>';
		// 		}
		// 		$raw .= '</ul>';
		// 	$raw .= '</div>';
		// }


		// add active layers
		$raw .= '<div class="field"><b>Layers: </b>';
			$c = 0;
			foreach ($_POST['layers'] as $active_layer) {
				if ($c != 0) {
					$raw .= ', ';
				}
				$raw .= $active_layer;
				$c+=1;
			}
		$raw .= '</div>';


		// add center coordinates
		$raw .= '<div class="field"><b>Map Center: </b>['.$_POST['centerlng'].', '.$_POST['centerlat'].']</div>';

		// add link
		$raw .= '<div class="field"><b>Map Link: </b><a href="'.$_POST['link'].'">'.$_POST['link'].'</a></div>';

		// add export date
		$raw .= '<div class="field"><b>Report Generated On: </b>'.date('m/d/Y').'</div>';




		// add license info
		$raw .= '<div id="license">'.$license_text.'</div>';

		// add footer
		$raw .= '<div id="footer">'.$footer_text.'</div>';

		
		// convert markdownextra to html
		require_once $root_dir . '/libs/Michelf/MarkdownExtra.inc.php';

		// use \Michelf\MarkdownExtra;
		// $parser = new MarkdownExtra();
		// $html = $parser->transform($raw);

		$html = \Michelf\MarkdownExtra::defaultTransform($raw);

		// file_put_contents($TEMP_DIR.'/'.$TEMP_URL.'.html', $html);

		// convert html to pdf
		include $root_dir . '/libs/mpdf/mpdf.php';
		$mpdf = new mPDF();
		$mpdf->WriteHTML($html);
		$mpdf->Output($TEMP_DIR.'/'.$TEMP_URL.'.pdf', "F");

		// delete temp jpg of map
		unlink($TEMP_DIR.'/'.$TEMP_URL.'.jpg');

		print $TEMP_URL.'.pdf';

		break;
}

?>
