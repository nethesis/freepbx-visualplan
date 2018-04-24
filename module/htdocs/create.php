<?php

if (!@include_once(getenv('FREEPBX_CONF') ? getenv('FREEPBX_CONF') : '/etc/freepbx.conf')) {
	include_once('/etc/asterisk/freepbx.conf');
}

/*check auth*/
session_start();
if (!isset($_SESSION['AMP_user']) || !$_SESSION['AMP_user']->checkSection('visualplan')) {
    exit(1);
}

// bypass freepbx authentication
define('FREEPBX_IS_AUTH', 1);

// Include all installed modules class
if ($handle = opendir(__DIR__. '/../..')) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != "..") {
					$moduleClass = __DIR__. '/../../'. $entry. '/'. ucfirst($entry). '.class.php';
					$funcFile = __DIR__. '/../../'. $entry. '/functions.inc.php';

					// include main module class
					if (is_file($moduleClass)) {
						include_once($moduleClass);
					}

					// include functions.inc.php (deprecated but neeeded for some modules)
					if (is_file($funcFile)) {
						include_once($funcFile);
					}
        }
    }
    closedir($handle);
}

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
$currentVisited = array();
$returnedIdArray = array();

nethvplan_extraction($widgetArray, $connectionArray);

function nethvplan_extraction($dataArray, $connectionArray) {
	foreach ($dataArray as $key => $value) {
		// get type of widget
		$explodeId = explode("%", $value['id']);
		$wType = $explodeId[0];

		// create object
		nethvplan_switchCreate($wType, $value, $connectionArray);
	}
	system('/var/www/html/freepbx/rest/lib/retrieveHelper.sh > /dev/null &');
}

$returnedIdArray = array("success" => $returnedIdArray);
print_r(/*json_pretty(*/json_encode($returnedIdArray, true));

function nethvplan_randomPassword() {
	$length = 18;
	$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	$maxlength = strlen($chars);
	$plength = 0;
	$password = '';
	while ($plength < $length){
        $char=substr($chars,mt_rand(0, $maxlength - 1), 1);
	    $password .= $char;
	    $plength++;
	}
	return $password;
}

function nethvplan_switchCreate($wType, $value, $connectionArray) {
	$idReturn = "";
	global $currentCreated;
	global $returnedIdArray;

	switch($wType) {
		case "incoming":
			$partsNum = explode("(", $value['entities'][0]['text']);
			$extensionParts = explode("/", $partsNum[0]);
			$extension = trim($extensionParts[0]);
			$cidnum = trim($extensionParts[1]);
			$descriptionParts = explode(")", $partsNum[1]);
			$description = trim($descriptionParts[0]);

			$destinations = nethvplan_getDestination($value, $connectionArray);
			$destination = trim($destinations["output_".$value['entities'][0]['id']]);

			$exists = core_did_get($extension, $cidnum);

			// check night service
			$did = $extension."/".$cidnum;

			if($exists) {
				core_did_del($extension, $cidnum);
				core_did_add(array(
					"extension" => $extension,
					"cidnum" => $cidnum,
					"alertinfo" => "<http://www.notused >\;info=ring2",
					"description" => $description,
					"destination" => $destination,
					"mohclass" => "default"
				), $destination);
			} else {
				core_did_add(array(
					"extension" => $extension,
					"cidnum" => $cidnum,
					"alertinfo" => "<http://www.notused >\;info=ring2",
					"description" => $description,
					"destination" => $destination,
					"mohclass" => "default"
				), $destination);
			}
		break;

		case "night":
			$nameParts = explode("-", $value['entities'][0]['text']);
			$name = trim($nameParts[0]);
			$id = trim($nameParts[1]);
			$state = trim($value['entities'][1]['text']);

			if (strcasecmp($state, "active") == 0 || strcasecmp($state, "attivo") == 0) {
				$date = "attivo";
			} else if (strcasecmp($state, "not active") == 0 || strcasecmp($state, "non attivo") == 0) {
				$date = "inattivo";
			} else {
				$dateparts = explode("-", $state);

				$offset = nethvplan_timeZoneOffset();

				$timebegin = trim($dateparts[0]);
				$timestampBeg = strtotime(str_replace('/', '-', $timebegin)) + $offset;
				$timestampBeg = $timestampBeg - $offset;

				$timebegin = date("Y-m-d H:i:s", $timestampBeg);

				$timeend = trim($dateparts[1]);
				$timestampEnd = strtotime(str_replace('/', '-', $timeend)) + $offset;
				$timestampEnd = $timestampEnd - $offset;

				$timeend = date("Y-m-d H:i:s", $timestampEnd);
				$date = 'custom';
			}

			$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][2]['id']]);

			$exists = nethnight_get($id);
			if(empty($exists)) {
				$nethNightId = nethnight_add(array(
					"description" => $name,
					"date" => $date,
					"tsbegin" => $timebegin,
					"tsend" => $timeend,
					"goto0" => "dest",
					"dest0" => $destination,
					"enabled" => ""
				));
				$idReturn = $nethNightId;
			} else {
				nethnight_edit($id, array(
					"description" => $name,
					"date" => $date,
					"tsbegin" => $timebegin,
					"tsend" => $timeend,
					"goto0" => "dest",
					"dest0" => $destination,
					"enabled" => ""
				));
				$idReturn = $id;
			}

			nethvplan_nightGetSource($value['id'], $connectionArray, $idReturn);
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
					"name" => $name,
					"password" => nethvplan_randomPassword()
				));
				$_REQUEST['secret'] = nethvplan_randomPassword();
	            core_devices_add(
					$extension,
					"sip",
					"",
					"fixed",
					$extension,
					$name,
					""
	            );
			} else {
				core_users_edit($extension, array(
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
			} else {
				conferences_del($extension);
				conferences_add($extension, $name, $exists['userpin'], $exists['adminpin'], $exists['options'], $exists['joinmsg_id'], $exists['music'], $exists['users']);
			}
		break;
		case "ext-group":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$extension = trim($extParts[0]);
      $list = preg_replace('/\s+/', '-',$value['entities'][2]['text']);
			$ringStrategy = explode("(", $value['entities'][3]['text']);
			$tmpStrategy = explode(")", $ringStrategy[1]);
			$strategy = trim($tmpStrategy[0]);
			$time = explode("(", $value['entities'][4]['text']);
			$tmpTime = explode(")", $time[1]);
			$grpTime = (int)trim($tmpTime[0]);
			$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][5]['id']]);
			$exists = ringgroups_get($extension);

			if(count($exists) <= 5 ) {
				ringgroups_add($extension, $strategy, $grpTime, $list, $destination, $name,'','','','','','','','','','','','','','','');
			} else {
				ringgroups_del($extension);
				ringgroups_add($extension, $strategy, $grpTime, $list, $destination, $name,
                $exists['grppre'],$exists['annmsg_id'],$exists['alertinfo'],$exists['needsconf'],$exists['remotealert_id'],$exists['toolate_id'],$exists['ringing'],$exists['cwignore'],$exists['cfignore'],$exists['changecid'],$exists['fixedcid'],$exists['cpickup'],$exists['recording'],'','');
			}
		break;
		case "ext-queues":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$extension = trim($extParts[0]);

			$listStaticArr = explode("\n", $value['entities'][2]['text']);
			$listStatic = [];
			if(count($listStaticArr) > 0 && $listStaticArr[0] !== "") {
				foreach ($listStaticArr as $k => $v) {
                                        $tmp = explode(",",$v);
                                        if (!isset($tmp[1])) {
                                            $tmp[1] = "0";
                                        }
					$listStatic[$k] = "Local/".$tmp[0]."@from-queue/n,".$tmp[1];
				}
			}

			$listDynamic = explode("\n", $value['entities'][4]['text']);

			$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
			$destination = trim($destinations["output_".$value['entities'][5]['id']]);
			$exists = queues_get($extension);
			if(empty($exists)) {
				queues_add($extension, $name, "", "", $destination, "", $listStatic, "","","","","","","0", $listDynamic, "","","","","","", "", "", "");
			} else {
				queues_del($extension);
                $_REQUEST['maxlen'] = $exists['maxlen'];
                $_REQUEST['joinempty'] = $exists['joinempty'];
                $_REQUEST['leavewhenempty'] = $exists['leavewhenempty'];
                $_REQUEST['strategy'] = $exists['strategy'];
                $_REQUEST['timeout'] = $exists['timeout'];
                $_REQUEST['autopause'] = $exists['autopause'];
                $_REQUEST['retry'] = $exists['retry'];
                $_REQUEST['wrapuptime'] = $exists['wrapuptime'];
                $_REQUEST['announcefreq'] = $exists['announce-frequency'];
                $_REQUEST['announceholdtime'] = $exists['announce-holdtime'];
                $_REQUEST['announceposition'] = $exists['announce-position'];
                $_REQUEST['queue-youarenext'] = $exists['queue-youarenext'];
                $_REQUEST['queue-thereare'] = $exists['queue-thereare'];
                $_REQUEST['queue-callswaiting'] = $exists['queue-callswaiting'];
                $_REQUEST['queue-thankyou'] = $exists['queue-thankyou'];
                $_REQUEST['pannouncefreq'] = $exists['periodic-announce-frequency'];
                $_REQUEST['monitor-format'] = $exists['monitor-format'];
                $_REQUEST['monitor-join'] = $exists['monitor-join'];
                $_REQUEST['eventwhencalled'] = $exists['eventwhencalled'];
                $_REQUEST['eventmemberstatus'] = $exists['eventmemberstatus'];
                $_REQUEST['music'] = $exists['music'];
                $_REQUEST['weight'] = $exists['weight'];
                $_REQUEST['autofill'] = $exists['autofill'];
                $_REQUEST['ringinuse'] = $exists['ringinuse'];
                $_REQUEST['reportholdtime'] = $exists['reportholdtime'];
                $_REQUEST['servicelevel'] = $exists['servicelevel'];
                $_REQUEST['memberdelay'] = $exists['memberdelay'];
                $_REQUEST['timeoutrestart'] = $exists['timeoutrestart'];
				queues_add($extension, $name, $exists['password'], $exists['prefix'], $destination, $exists['agentannounce_id'], $listStatic, $exists['joinannounce_id'], $exists['maxwait'], $exists['alertinfo'], $exists['cwignore'], $exists['qregex'], $exists['queuewait'], $exists['use_queue_context'], $listDynamic, $exists['dynmemberonly'],$exists['togglehint'],$exists['qnoanswer'],$exists['callconfirm'],$exists['callconfirm_id'],$exists['monitor_type'], $exists['monitor_heard'], $exists['monitor_spoken'], $exists['answered_elsewhere']);
			}
		break;
		case "app-announcement":
			$nameParts = explode("-", $value['entities'][0]['text']);
			$name = trim($nameParts[0]);
			$id = trim($nameParts[1]);

			$parts = explode("(", $value['entities'][1]['text']);
			$extParts = explode(")", $parts[1]);
			$rec_id = trim($extParts[0]);

			if(!array_key_exists($value['id'], $currentCreated)) {

				if(empty($id)) {
					$idAnn = announcement_add($name, $rec_id, "", $destination, null, null, null);
					$idReturn = $idAnn;
					$currentCreated[$value['id']] = $idReturn;
					$destinations = nethvplan_getDestination($value, $connectionArray);
					$destination = trim($destinations["output_".$value['entities'][2]['id']]);
					announcement_edit($idReturn, $name, $rec_id, "", $destination, null, null, null);
				} else {
					$currentCreated[$value['id']] = $id;
					$destinations = nethvplan_getDestination($value, $connectionArray);
					$destination = trim($destinations["output_".$value['entities'][2]['id']]);
                    $exists = announcement_get($id);
					announcement_edit($id, $name, $rec_id, $exists['allow_skip'], $destination, $exists['return_ivr'], $exists['noanswer'], $exists['repeat_msg']);
					$idReturn = $id;
				}

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


				if(empty($invDest)) $invDest = "";
				if(empty($timeDest)) $timeDest = "";

				if(empty($id)) {
					$idIVR = ivr_save_details(array(
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,

						"directdial" => 0,
						"invalid_loops" => 0,
						"invalid_retry_recording" => 0,

						"invalid_destination" => $invDest,

						"invalid_recording" => 0,
						"retvm" => 0,
						"timeout_time" => 10,
						"timeout_recording" => 0,
						"timeout_retry_recording" => 0,

						"timeout_destination" => $timeDest,

						"timeout_loops" => 0,
						"timeout_append_announce" => 0,
						"invalid_append_announce" => 0,
					));
					$idReturn = $idIVR;
					$currentCreated[$value['id']] = $idIVR;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
					$invDest = trim($destinations["output_".$value['entities'][2]['id']]);
					$timeDest = trim($destinations["output_".$value['entities'][3]['id']]);
					$idIVR = ivr_save_details(array(
						"id" => $idIVR,
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,

						"directdial" => 0,
						"invalid_loops" => 0,
						"invalid_retry_recording" => 0,

						"invalid_destination" => $invDest,

						"invalid_recording" => 0,
						"retvm" => 0,
						"timeout_time" => 10,
						"timeout_recording" => 0,
						"timeout_retry_recording" => 0,

						"timeout_destination" => $timeDest,

						"timeout_loops" => 0,
						"timeout_append_announce" => 0,
						"invalid_append_announce" => 0,
					));
				} else {
                    $exists = ivr_get_details($id);
					$idIVR = ivr_save_details(array(
						"id" => $id,
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,

						"directdial" => $exists['directdial'],
						"invalid_loops" => $exists['invalid_loops'],
						"invalid_retry_recording" => $exists['invalid_retry_recording'],

						"invalid_destination" => $invDest,

						"invalid_recording" => $exists['invalid_recording'],
						"retvm" => $exists['retvm'],
						"timeout_time" => $exists['timeout_time'],
						"timeout_recording" => $exists['timeout_recording'],
						"timeout_retry_recording" => $exists['timeout_retry_recording'],

						"timeout_destination" => $timeDest,

						"timeout_loops" => $exists['timeout_loops'],
						"timeout_append_announce" => $exists['timeout_append_announce'],
						"invalid_append_announce" => $exists['invalid_append_announce'],
					));
					$currentCreated[$value['id']] = $idIVR;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
					$invDest = trim($destinations["output_".$value['entities'][2]['id']]);
					$timeDest = trim($destinations["output_".$value['entities'][3]['id']]);
					$idIVR = ivr_save_details(array(
						"id" => $idIVR,
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,

                        "directdial" => $exists['directdial'],
						"invalid_loops" => $exists['invalid_loops'],
						"invalid_retry_recording" => $exists['invalid_retry_recording'],

						"invalid_destination" => $invDest,

                        "invalid_recording" => $exists['invalid_recording'],
						"retvm" => $exists['retvm'],
						"timeout_time" => $exists['timeout_time'],
						"timeout_recording" => $exists['timeout_recording'],
						"timeout_retry_recording" => $exists['timeout_retry_recording'],

						"timeout_destination" => $timeDest,

                        "timeout_loops" => $exists['timeout_loops'],
						"timeout_append_announce" => $exists['timeout_append_announce'],
						"invalid_append_announce" => $exists['invalid_append_announce'],
					));
					$idReturn = $idIVR;
				}

				$ivrArray = array();
				$ivrArray['ivr_ret'] = array();

				foreach($value['entities'] as $k => $v) {
					if ($k < 4) continue;
					$ext[] = $v['text'];
					$goto[] = trim($destinations["output_".$v['id']]);
				}
				$ivrArray['ext'] = $ext;
				$ivrArray['goto'] = $goto;
				ivr_save_entries($idIVR, $ivrArray);
			}
		break;

		case "cqr":

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

				if(empty($defDest)) $defDest = "";

				if(empty($id)) {

			 		$idCQR = nethcqr_save_details(array(
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,
						"use_code" => "on",
						"use_workphone" => "on",
						"manual_code" => "on",
						"cod_cli_announcement" => "",
						"err_announcement" => "",
						"code_length" => 5,
						"code_retries" => 3,
						"default_destination" => $defDest,
						"db_type" => "mysql",
						"db_url" => "localhost",
						"db_name" => "",
						"db_user" => "",
						"db_pass" => "",
						"query" => "",
						"cc_db_type" => "mysql",
						"cc_db_url" => "localhost",
						"cc_db_name" => "",
						"cc_db_user" => "",
						"cc_db_pass" => "",
						"cc_query" => "",
						"ccc_query" => ""
					));

				 	$idReturn = $idCQR;

					$currentCreated[$value['id']] = $idCQR;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);

					$defDest = trim($destinations["output_".$value['entities'][2]['id']]);
				 	$idCQR = nethcqr_save_details(array(
				   	"id_cqr" => $idReturn,
				 		"name" => $name,
						"description" => $description,
						"announcement" => $announcement,
						"use_code" => "on",
						"use_workphone" => "on",
						"manual_code" => "on",
						"cod_cli_announcement" => "",
						"err_announcement" => "",
						"code_length" => 5,
						"code_retries" => 3,
            "default_destination" => $defDest,
            "db_type" => "mysql",
						"db_url" => "localhost",
						"db_name" => "",
						"db_user" => "",
						"db_pass" => "",
						"query" => "",
						"cc_db_type" => "mysql",
						"cc_db_url" => "localhost",
						"cc_db_name" => "",
						"cc_db_user" => "",
						"cc_db_pass" => "",
						"cc_query" => "",
						"ccc_query" => ""
					));

			 } else {

					$exists = nethcqr_get_details($id);
					if($exists[0]["use_code"]==1) $exists[0]["use_code"] = 'on';
					if($exists[0]["use_workphone"]==1) $exists[0]["use_workphone"] = 'on';
					if($exists[0]["manual_code"]==1) $exists[0]["manual_code"] = 'on';

					$idCQR = nethcqr_save_details(array(
						"id_cqr" => $id,
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,
						"use_code" => $exists[0]['use_code'],
						"use_workphone" => $exists[0]['use_workphone'],
						"manual_code" => $exists[0]['manual_code'],
						"cod_cli_announcement" => $exists[0]['cod_cli_announcement'],
						"err_announcement" => $exists[0]['err_announcement'],
						"code_length" => $exists[0]['code_length'],
						"code_retries" => $exists[0]['code_retries'],
						"default_destination" => $defDest,
						"db_type" => $exists[0]['db_type'],
						"db_url" => $exists[0]['db_url'],
						"db_name" => $exists[0]['db_name'],
						"db_user" => $exists[0]['db_user'],
						"db_pass" => $exists[0]['db_pass'],
						"query" => $exists[0]['query'],
						"cc_db_type" => $exists[0]['cc_db_type'],
						"cc_db_url" => $exists[0]['cc_db_url'],
						"cc_db_name" => $exists[0]['cc_db_name'],
						"cc_db_user" => $exists[0]['cc_db_user'],
						"cc_db_pass" => $exists[0]['cc_db_pass'],
						"cc_query" => $exists[0]['cc_query'],
						"ccc_query" => $exists[0]['ccc_query']
					));

					$currentCreated[$value['id']] = $idCQR;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);

					$defDest = trim($destinations["output_".$value['entities'][2]['id']]);
					$idCQR = nethcqr_save_details(array(
						"id_cqr" => $idCQR,
						"name" => $name,
						"description" => $description,
						"announcement" => $announcement,
						"use_code" => $exists[0]['use_code'],
						"use_workphone" => $exists[0]['use_workphone'],
						"manual_code" => $exists[0]['manual_code'],
						"cod_cli_announcement" => $exists[0]['cod_cli_announcement'],
						"err_announcement" => $exists[0]['err_announcement'],
						"code_length" => $exists[0]['code_length'],
						"code_retries" => $exists[0]['code_retries'],
						"default_destination" => $defDest,
						"db_type" => $exists[0]['db_type'],
						"db_url" => $exists[0]['db_url'],
						"db_name" => $exists[0]['db_name'],
						"db_user" => $exists[0]['db_user'],
						"db_pass" => $exists[0]['db_pass'],
						"query" => $exists[0]['query'],
						"cc_db_type" => $exists[0]['cc_db_type'],
						"cc_db_url" => $exists[0]['cc_db_url'],
						"cc_db_name" => $exists[0]['cc_db_name'],
						"cc_db_user" => $exists[0]['cc_db_user'],
						"cc_db_pass" => $exists[0]['cc_db_pass'],
						"cc_query" => $exists[0]['cc_query'],
						"ccc_query" => $exists[0]['ccc_query']
					));
					$idReturn = $idCQR;

			 	}

				$cqrArray = array();

				$position = 1;
				foreach($value['entities'] as $k => $v) {
					if ($k > 3) {
						$pos[] = $position;
						$position += 1;
						$cond[] = $v['text'];
						$goto[] = trim($destinations["output_".$v['id']]);
					}
				}
			 	$cqrArray['position'] = $pos;
			 	$cqrArray['condition'] = $cond;
			 	$cqrArray['goto'] = $goto;

			 	nethcqr_save_entries($idCQR, $cqrArray);
			}
		break;

		case "timeconditions":
			$nameParts = explode("-", $value['entities'][0]['text']);
			$name = trim($nameParts[0]);
			$id = trim($nameParts[1]);

			$parts = explode("(", $value['entities'][1]['text']);
			$extParts = explode(")", $parts[1]);
			$time = trim($extParts[0]);

			if(!array_key_exists($value['id'], $currentCreated)) {
				if(empty($id)) {
					$idTime = timeconditions_add(array(
						"displayname" => $name,
						"time" => $time,
						"goto1" => "truegoto",
						"goto0" => "falsegoto",
						"mode" => "time-group",
						"truegoto1" => trim($destinations["output_".$value['entities'][3]['id']]),
						"falsegoto0" => trim($destinations["output_".$value['entities'][2]['id']]),
						"deptname" => ""
					));
					$idReturn = $idTime;
					$currentCreated[$value['id']] = $idReturn;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
					timeconditions_edit($idReturn, array(
						"displayname" => $name,
						"time" => $time,
						"goto1" => "truegoto",
						"goto0" => "falsegoto",
						"mode" => "time-group",
						"truegoto1" => trim($destinations["output_".$value['entities'][3]['id']]),
						"falsegoto0" => trim($destinations["output_".$value['entities'][2]['id']]),
						"deptname" => ""
					));
				} else {
					$currentCreated[$value['id']] = $id;
					$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
                    $exists = timeconditions_get($id);
					timeconditions_edit($id, array(
						"displayname" => $name,
						"time" => $time,
						"goto1" => "truegoto",
						"goto0" => "falsegoto",
						"mode" => $exists['mode'],
						"truegoto1" => trim($destinations["output_".$value['entities'][3]['id']]),
						"falsegoto0" => trim($destinations["output_".$value['entities'][2]['id']]),
						"deptname" => $exists['deptname'],
                        "generate_hint" => $exists['generate_hint'],
                        "override_fc" => strlen($exists['tccode']) > 0 ? '1' : '0'
					));
					$idReturn = $id;
				}
			}
		break;
		case "app-daynight":
			$parts = explode("(", $value['entities'][0]['text']);
			$name = trim($parts[0]);
			$extParts = explode(")", $parts[1]);
			$controlCode = substr(trim($extParts[0]), -1);

			$destinations = nethvplan_getDestination($value, $connectionArray, $currentCreated, $wType);
            $exists = daynight_get_obj($controlCode);
			daynight_edit(array(
				"day_recording_id" => $exists['day_recording_id'],
				"night_recording_id" => $exists['night_recording_id'],
				"state" => strlen($exists['state']) > 0 ? $exists['state'] : 'DAY',
				"fc_description" => $name,
				"goto1" => "truegoto",
				"goto0" => "falsegoto",
				"truegoto1" => trim($destinations["output_".$value['entities'][2]['id']]),
				"falsegoto0" => trim($destinations["output_".$value['entities'][1]['id']]),
			), $controlCode);
		break;
	}

	if($idReturn) {
		$returnedIdArray[$value['id']] = array("idElem" => $value['id'], "idObj" => $idReturn);
	}
	return $idReturn;
}

function nethvplan_checkDestination($destination, $type, $value, $connectionArray) {
	global $widgetArray;
	global $currentCreated;
	global $currentVisited;
	$currentVals = array();

	foreach ($widgetArray as $k => $v) {
		if($v['id'] == $destination) {
			$currentVals = $widgetArray[$k];
		}
	}

	if(!array_key_exists($destination, $currentCreated)) {
		$result = nethvplan_switchCreate($type, $currentVals, $connectionArray);
		$currentCreated[$destination] = $result;
		return $result;
	} else {
		$id = $currentCreated[$destination];
		return $id;
	}
}

function nethvplan_getDestination($values, $connectionArray) {

	$id = $values['id'];
	foreach ($connectionArray as $key => $value) {
		if($value['source']['node'] == $id) {
			$destination = $value['target']['node'];

			$parts = explode("%", $destination);

			if($parts[0] === "app-announcement" || $parts[0] === "ivr" || $parts[0] === "cqr" || $parts[0] === "timeconditions") {
				$result = nethvplan_checkDestination($destination, $parts[0], $values, $connectionArray);
			}

			switch ($parts[0]) {
				case "app-blackhole":
					$destAsterisk[$value['source']['port']] = "app-blackhole,hangup,1";
				break;
				case "from-did-direct":
					$destAsterisk[$value['source']['port']] = trim($parts[0]).",".trim($parts[1]).",1";
				break;
				case "night":
					$destAsterisk[$value['source']['port']] = trim($parts[1]);
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
				case "cqr":
					$destAsterisk[$value['source']['port']] = "nethcqr,".$result.",1";
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
	return $destAsterisk;
}

function nethvplan_nightGetSource($id, $connectionArray, $nightId) {
	foreach ($connectionArray as $key => $value) {
		if($value['target']['node'] == $id) {
			$parts = explode("%", $value['source']['node']);
			$incomingId = str_replace(' ', '', $parts[1]);
			nethnigh_set_destination($incomingId, $nightId);
		}
	}
}

function nethvplan_timeZoneOffset() {
	global $amp_conf;
	try {
	    $tz = $amp_conf['timezone'];
	    $dtz = new DateTimeZone($tz);
	    $dt = new DateTime("now", $dtz);
	} catch (Exception $e){
	    $tz = date_default_timezone_get();
	    $dtz = new DateTimeZone($tz);
	    $dt = new DateTime("now", $dtz);
	}
	$utc_dtz = new DateTimeZone("UTC");
	$utc_dt = new DateTime("now", $utc_dtz);
	$offset = $dtz->getOffset($dt) - $utc_dtz->getOffset($utc_dt);
	$now = time() + $offset;

	return $offset;
}
