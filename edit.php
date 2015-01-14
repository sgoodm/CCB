<?php

$json = json_encode( json_decode($_POST["json"]), JSON_PRETTY_PRINT ); 
file_put_contents( "toolboxz.json", $json );
echo json_encode("good");

?>
