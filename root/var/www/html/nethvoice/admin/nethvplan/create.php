<?php

require('/etc/freepbx.conf');

$json = $_POST['jsonData'];
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

$currentCreated = array();

extraction($widgetArray, $connectionArray);

function extraction($dataArray, $connectionArray) {
	foreach ($dataArray as $key => $value) {
		// get type of widget
		$explodeId = explode("%", $value['id']);
		$wType = $explodeId[0];

		// create object
		switchCreate($wType, $value, $connectionArray);
	}
}

function switchCreate($wType, $value, $connectionArray) {
	$idReturn = "";
	global $currentCreated;
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

			$destinations = getDestination($value, $connectionArray);
			$destination = trim($destinations["output_".$value['entities'][0]['id']]);

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
				$timestampBeg = strtotime(str_replace('/', '-', $timebegin));
				$timebegin = date("Y-m-d H:i:s", $timestampBeg);

				$timeend = trim($dateparts[1]);
				$timestampEnd = strtotime(str_replace('/', '-', $timeend));
				$timeend = date("Y-m-d H:i:s", $timestampEnd);
				$date = 'custom';
			}

			$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][2]['id']]);

			$nethNightId = nethnight_add(array(
				"description" => $name,
				"date" => $date,
				"tsbegin" => $timebegin,
				"tsend" => $timeend,
				"goto0" => "dest",
				"dest0" => $destination,
				"enabled" => ""
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
					"action" => "add",
					"hardware" => "generic",
					"tech" => "sip",
					"vmcontext" => "default",
					"extension" => $extension,
					"name" => $name,
					"vmx_option_0_system_default" => "checked",
					"attach" => "attach=yes",
					"saycid" => "saycid=yes",
					"envelope" => "envelope=yes",
					"delete" => "delete=no"
				));
				$user = core_users_get($extension);
				core_users_del($extension);
				core_users_add($user);
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

			$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][3]['id']]);
			$exists = ringgroups_get($extension);
			if(count($exists) <= 2 ) {
				ringgroups_add($extension, "ringall", "300", $list, $destination, $name);
			} else {
				ringgroups_del($extension);
				ringgroups_add($extension, "ringall", "300", $list, $destination, $name);
			}
		break;
		case "ext-queues":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$extension = trim($extParts[0]);
			$listStatic = explode(',', $value['entities'][2]['text']);
			foreach ($listStatic as $k => $v) {
				$listStatic[$k] = "Local/".$v."@from-queue/n,0";
			}
			$listDynamic = explode(',', $value['entities'][4]['text']);

			$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][5]['id']]);
			$exists = queues_get($extension);
			if(empty($exists)) {
				queues_add($extension, $name, "", "", $destination, "", $listStatic, "","","","","","","0", $listDynamic, "","","","","","", "", "", "");
			} else {
				queues_del($extension);
				queues_add($extension, $name, "", "", $destination, "", $listStatic, "","","","","","","0", $listDynamic, "","","","","","", "", "", "");
			}
		break;
		case "app-announcement":
			$name = trim($value['entities'][0]['text']);
			$parts = explode("(", $value['entities'][1]['text']);
			$extParts = explode(")", $parts[1]);
			$rec_id = trim($extParts[0]);

			if(!array_key_exists($value['id'], $currentCreated)) {
				$destinations = getDestination($value, $connectionArray);
				$destination = trim($destinations["output_".$value['entities'][2]['id']]);
				announcement_add($name, $rec_id, "", $destination);
				$result = announcement_list();
				usort($result, "cmpAnnun");
				$idAnn = $result[count($result)-1]['announcement_id'];
				$idReturn = $idAnn;
			}
		break;

		case "ivr":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$description = trim($extParts[0]);

			$idParts = explode("-", $value['entities'][0]['text']);
			$id = trim($idParts[1]);

			$annParts = explode("(", $value['entities'][1]['text']);
			$annExParts = explode(")", $annParts[1]);
			$announcement = trim($annExParts[0]);

			if(!array_key_exists($value['id'], $currentCreated)) {
				$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);

				$invDest = trim($destinations["output_".$value['entities'][2]['id']]);
				$timeDest = trim($destinations["output_".$value['entities'][3]['id']]);

				if(empty($invDest)) $invDest = "";
				if(empty($timeDest)) $timeDest = "";

				$idIVR = ivr_save_details(array(
					"id" => $id,
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

				foreach($value['entities'] as $k => $v) {
					if ($k < 4) continue;
					$ext[$v['text']] = $v['text'];
					$goto[$v['text']] = trim($destinations["output_".$v['id']]);
				}
				$ivrArray['ext'] = $ext;
				$ivrArray['goto'] = $goto;

				ivr_save_entries($idIVR, $ivrArray);
				$idReturn = $idIVR;
			}
		break;
		case "timeconditions":
			$name = $value['entities'][0]['text'];
			$parts = explode("(", $value['entities'][1]['text']);
			$extParts = explode(")", $parts[1]);
			$time = trim($extParts[0]);

			if(!array_key_exists($value['id'], $currentCreated)) {
				$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);

				timeconditions_add(array(
					"displayname" => $name,
					"time" => $time,
					"goto1" => "truegoto",
					"goto0" => "falsegoto",
					"truegoto1" => trim($destinations["output_".$value['entities'][3]['id']]),
					"falsegoto0" => trim($destinations["output_".$value['entities'][2]['id']]),
					"deptname" => ""
				));
				$result = timeconditions_list();
				usort($result, "cmpTime");
				$idTime = $result[count($result)-1]['timeconditions_id'];
				$idReturn = $idTime;
			}
		break;
		case "app-daynight":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$controlCode = substr(trim($extParts[0]), -1);

			$destinations = getDestination($value, $connectionArray, $currentCreated, $wType);

			daynight_edit(array(
				"day_recording_id" => "0",
				"night_recording_id" => "0",
				"state" => "DAY",
				"fc_description" => $name,
				"goto1" => "truegoto",
				"goto0" => "falsegoto",
				"truegoto1" => trim($destinations["output_".$value['entities'][1]['id']]),
				"falsegoto0" => trim($destinations["output_".$value['entities'][2]['id']]),
			), $controlCode);
		break;
	}
	return $idReturn;
}

function cmpAnnun($a, $b) {
    if ($a['announcement_id'] == $b['announcement_id']) {
        return 0;
    }
    return ($a['announcement_id'] < $b['announcement_id']) ? -1 : 1;
}
function cmpTime($a, $b) {
    if ($a['timeconditions_id'] == $b['timeconditions_id']) {
        return 0;
    }
    return ($a['timeconditions_id'] < $b['timeconditions_id']) ? -1 : 1;
}

function checkDestination($destination, $type, $value, $connectionArray) {
	global $widgetArray;
	global $currentCreated;
	$currentVals = array();

	foreach ($widgetArray as $k => $v) {
		if($v['id'] == $destination) {
			$currentVals = $widgetArray[$k];
		}
	}
	if(!array_key_exists($destination, $currentCreated)) {//if(!in_array($destination, $currentCreated)) {
		$result = switchCreate($type, $currentVals, $connectionArray);
		$currentCreated[$destination] = $result;
		return $result;
	} else {
		$id = $currentCreated[$destination];
		return $id;
	}
}

function getDestination($values, $connectionArray) {
	$id = $values['id'];
	foreach ($connectionArray as $key => $value) {
		if($value['source']['node'] == $id) {
			$destination = $value['target']['node'];
			$parts = explode("%", $destination);

			if($parts[0] === "app-announcement" || $parts[0] === "ivr" || $parts[0] === "timeconditions") {
				$result = checkDestination($destination, $parts[0], $values, $connectionArray);			
			}

			switch ($parts[0]) {
				case "app-blackhole":
					$destAsterisk[$value['source']['port']] = "app-blackhole,hangup,1";
				break;
				case "from-did-direct":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "night":
					$destAsterisk[$value['source']['port']] = trim($parts[1]);//$parts[0].",8".$parts[1]."0,1";
				break;
				case "ext-local":
					$d = $value['target']['port'];
					$p = explode("%", $d);
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($p[1]).",1";
				break;
				case "ext-meetme":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "ext-group":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "ext-queues":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "app-announcement":
					$destAsterisk[$value['source']['port']] = trim($parts[0])."-".trim($result).",s,1";
				break;
				case "ivr":
					$destAsterisk[$value['source']['port']] = trim($parts[0])."-".trim($result).",s,1";
				break;
				case "timeconditions":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($result).",1";
				break;
				case "app-daynight":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
			}
		}
	}
	//print_r($destAsterisk);
	return $destAsterisk;
}

function nightGetSource($id, $connectionArray, $nightId) {
	foreach ($connectionArray as $key => $value) {
		if($value['target']['node'] == $id) {
			$parts = explode("%", $value['source']['node']);
			$incomingId = str_replace(' ', '', $parts[1]);
			nethnigh_set_destination($incomingId, $nightId);
		}
	}
}
