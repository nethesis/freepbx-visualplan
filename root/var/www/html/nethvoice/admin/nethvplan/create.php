<?php

require('/etc/freepbx.conf');

$json = /*file_get_contents('./jsonText', true);*/$_GET['jsonData'];
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
				$extension = trim($partsNum[0]);
				$cidnum = trim($partsNum[1]);

				if($cidnum && substr($cidnum, -1) != ".") {
					$cidnum = $cidnum.".";
				}

				$destination = trim(getDestination($value['id'], $connectionArray));
				$description = trim($value['entities'][0]['text']);

				$exists = core_did_get($extension, $cidnum);

				if($exists) {
					core_did_del($extension, $cidnum);
					core_did_add(array(
						"extension" => $extension,
						"cidnum" => $cidnum,
						"description" => $description,
						"destination" => $destination
					), $destination);
				} else {
					core_did_add(array(
						"extension" => $extension,
						"cidnum" => $cidnum,
						"description" => $description,
						"destination" => $destination
					), $destination);
				}

			break;

			case "night":
				$name = trim($value['entities'][0]['text']);
				$state = trim($value['entities'][1]['text']);

				if (strcasecmp($state, "active") == 0) {
					$date = "attivo";
				} else if (strcasecmp($state, "not active") == 0) {
					$date = "inattivo";
				} else {
					$dateparts = explode("-", $state);
					$timebegin = trim($dateparts[0]);
					$timeend = trim($dateparts[1]);
				}

				$destination = trim(getDestination($value['id'], $connectionArray));

				nethnight_add(array(
					"description" => $name,
					"date" => $date,
					"timebegin" => $timebegin,
					"timeend" => $timeend,
					"destination" => $destination
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

