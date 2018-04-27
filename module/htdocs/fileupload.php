<?php

$name = pathinfo($_POST['name'], PATHINFO_FILENAME);
$ext = pathinfo($_POST['name'], PATHINFO_EXTENSION);
$filename = $name."-".time().".".$ext;
$filepath = "/var/spool/asterisk/tmp/".$name."-".time().".".$ext;
file_put_contents($filepath, base64_decode($_POST['content']));
echo $filename;
