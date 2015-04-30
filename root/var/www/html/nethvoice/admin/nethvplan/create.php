<?php

require('/etc/freepbx.conf');

$json = file_get_contents('./jsonText', true);//$_GET['jsonData'];
$json = base64_decode($json);

$jsonArray = json_decode($json, true);

$widgetArray = array_filter(
    $jsonArray,
    function ($w) {
        return $w['type'] == "Base";
    }
);

$connectionArray = array_filter(
    $jsonArray,
    function ($w) {
        return $w['type'] == "MyConnection";
    }
);

extraction($widgetArray, $connectionArray);

function extraction($dataArray, $connectionArray) {
	foreach ($dataArray as $key => $value) {
		// get type of widget
		$explodeId = explode("%", $value['id']);
		$wType = $explodeId[0];

		switch($wType) {
			case "incoming":
				$partsNum = explode("/", $value['entities'][1]['text']);
				$extension = $partsNum[0];
				$cidnum = $partsNum[1];

				if($cidnum && substr($cidnum, -1) != ".") {
					$cidnum = $cidnum.".";
				}

				$destination = getDestination($value['id'], $connectionArray);
				core_did_create_update(array(
					"extension" => $extension,
					"cidnum" => $cidnum,
					"description" => $value['entities'][0]['text'],
					"destination" => $destination,
				));
			break;
		}
	}
}

function getDestination($id, $connectionArray) {
	foreach ($connectionArray as $key => $value) {
		if($value['source']['node'] == $id) {

			$destination = $value['target']['node'];
			$parts = explode("%", $destination);

			switch ($parts[0]) {
				case 'from-did-direct':
					$destAsterisk = $parts[0].",".$parts[1].",1";
				break;
			}
		}
	}

	return $destAsterisk;
}

