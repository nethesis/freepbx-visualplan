<?php

require('/etc/freepbx.conf');

$json = /*file_get_contents('./jsonText', true);*/$_POST['jsonData'];
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
				$partsNum = explode("(", $value['entities'][0]['text']);
				$extensionParts = explode("/", $partsNum[0]);
				$extension = trim($extensionParts[0]);
				$cidnum = trim($extensionParts[1]);
				$descriptionParts = explode(")", $partsNum[1]);
				$description = trim($descriptionParts[0]);

				if($cidnum && substr($cidnum, -1) != ".") {
					$cidnum = $cidnum.".";
				}

				// foreach ($value['entities'] as $key => $row) {
				// 	$destAsm = "output_".$row['id'];
				// 	$destination[] = trim(getDestination($destAsm, $connectionArray));
				// }
				$destinations = trim(getDestination($value['id'], $connectionArray));
				$destination = $destinations[0];
				$exists = core_did_get($extension, $cidnum);

				if($exists) {
					core_did_del($extension, $cidnum);
					core_did_add(array(
						"extension" => $extension,
						"cidnum" => $cidnum,
						"description" => $description,
						"destination" => $$destination
					), $destination);
				} else {
					core_did_add(array(
						"extension" => $extension,
						"cidnum" => $cidnum,
						"description" => $description,
						"destination" => $$destination
					), $destination);
				}

				// if($destination[1]) {
				// 	nethnigh_set_destination($extension."/".$cidnum, $destination[1]);
				// } else {
				// 	nethnigh_set_destination($extension."/".$cidnum, "-1");
				// }
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
					$timestampBeg = strtotime(str_replace('/', '-', $timebegin));
					$timebegin = date("Y-m-d H:i:s", $timestampBeg);

					$timeend = trim($dateparts[1]);
					$timestampEnd = strtotime(str_replace('/', '-', $timeend));
					$timeend = date("Y-m-d H:i:s", $timestampEnd);
				}

				$destination = trim(getDestination($value['id'], $connectionArray));

				$nethNightId = nethnight_add(array(
					"description" => $name,
					"date" => $date,
					"timebegin" => $timebegin,
					"timeend" => $timeend,
					"destination" => $destination
				));

				nightGetSource($value['id'], $connectionArray, $nethNightId);
			break;

			case "from-did-direct":
				$parts = explode("(", $value['entities'][0]['text']);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$extension = trim($extParts[0]);

				$exists = core_users_get($extension);
				if(empty($exists)) {
					core_users_add(array(
						"extension" => $extension,
						"name" => $name
					));
				}
			break;
			case "ext-local":
				$parts = explode("-", $value['entities'][0]['text']);
				$parts = explode("(", $parts[0]);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$extension = trim($extParts[0]);

				$exists = voicemail_mailbox_get($extension);
				if(empty($exists)) {
					voicemail_mailbox_add($extension, array(
						"vm" => "enabled",
						"vmcontext" => "default",
						"extension" => $extension,
						"name" => $name,
						"attach" => "attach=yes",
						"saycid" => "saycid=yes",
						"envelope" => "envelope=yes",
						"delete" => "delete=no"
					));
				}
			break;
			case "ext-meetme":
				$parts = explode("(", $value['entities'][0]['text']);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$extension = trim($extParts[0]);

				$exists = conferences_get($extension);
				if(empty($exists)) {
					conferences_add($extension, $name);
				}
			break;
			case "ext-group":
				$parts = explode("(", $value['entities'][0]['text']);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$extension = trim($extParts[0]);
				$list = str_replace(',', '-', $value['entities'][2]['text']);

				$destinations = trim(getDestination($value['id'], $connectionArray));
				$destination = $destinations[0];
				$exists = ringgroups_get($extension);
				if(count($exists) <= 2 ) {
					ringgroups_add($extension, "ringall", "300", $list, $destination, $name);
				}
			break;
			case "ext-queues":
				$parts = explode("(", $value['entities'][0]['text']);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$extension = trim($extParts[0]);
				$listStatic = explode(',', $value['entities'][2]['text']);
				print_r($listStatic);
				$listDynamic = explode(',', $value['entities'][4]['text']);

				$destinations = trim(getDestination($value['id'], $connectionArray));
				$destination = $destinations[0];
				$exists = queues_get($extension);
				if(empty($exists)) {
					queues_add($extension, $name, "", "", $destination, "", $listStatic, "","","","","","","", $listDynamic);
				}
			break;
			case "ivr":
				$parts = explode("(", $value['entities'][0]['text']);
				$name = trim($parts[0]);
				$extParts = explode(")", $parts[1]);
				$description = trim($extParts[0]);

				$annParts = explode("(", $value['entities'][1]['text']);
				$annExParts = explode(")", $annParts[1]);
				$announcement = trim($annExParts[0]);

				$destinations = getDestination($value['id'], $connectionArray);
				$invDest = trim($destinations[0]);
				$timeDest = trim($destinations[1]);

				$id = ivr_save_details(array(
					"id" => "",
					"name" => $name,
					"description" => $description,
					"announcement" => $announcement,

					"directdial" => 0,
					"invalid_loops" => 0,
					"invalid_retry_recording" => 0,

					"invalid_destination" => $invDest,

					"invalid_recording" => 0,
					"retvm" => 0,
					"timeout_time" => 0,
					"timeout_recording" => 0,
					"timeout_retry_recording" => 0,

					"timeout_destination" => $timeDest,

					"timeout_loops" => 0,
					"timeout_append_announce" => 0,
					"invalid_append_announce" => 0,
				));

				$ivrArray = array();
				$ivrArray['ivr_ret'] = 0;
				print_r($destinations);
				foreach($value['entities'] as $k => $v) {
					if ($k < 4) continue;
					$ext[$v['text']] = $v['text'];
					$goto[$v['text']] = $destinations[$k-3];
				}
				$ivrArray['ext'] = $ext;
				$ivrArray['goto'] = $goto;
				
				//print_r($ivrArray);

				//ivr_save_entries($id, $ivrArray);
			break;
		}
	}
}

function nightGetSource($id, $connectionArray, $nightId) {
	// iterate
	// find id in target node
	// nethnigh_set_destination($extension."/".$cidnum, $nightId);
}

function checkOutputPort($entities) {
	foreach ($entities as $key => $value) {
		$id = $value['id'];
	}
}

function getDestination($id, $connectionArray) {
	foreach ($connectionArray as $key => $value) {
		echo $key;
		if($value['source']['node'] == $id) {
			$destination = $value['target']['node'];
			$parts = explode("%", $destination);

			switch ($parts[0]) {
				case "app-blackhole":
					$destAsterisk[] = "app-blackhole,hangup,1";
				break;
				case 'from-did-direct':
					$destAsterisk[] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case 'night':
					$destAsterisk[] = trim($parts[1]);//$parts[0].",8".$parts[1]."0,1";
				break;
				case "ext-local":
					$d = $value['target']['port'];
					$p = explode("%", $d);
					$destAsterisk[] = trim($parts[0]).",".trim($p[1]).",1";
				break;
				case "ext-meetme":
					$destAsterisk[] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "ext-group":
					$destAsterisk[] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "ext-queues":
					$destAsterisk[] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "ivr":
				break;
			}
		} else {
			$destAsterisk[] = "none";
		}
	}
	//print_r($destAsterisk);
	return $destAsterisk;
}

