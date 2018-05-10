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

if ($_POST['jsonData']) {
    $json = $_POST['jsonData'];
}

if ($json) {
    $json = base64_decode($json);
    $jsonArray = json_decode($json, true);
    $type = $jsonArray['type'];
    $rest = $jsonArray['rest'];

    switch ($type) {
        case 'timegroup':

            if ($rest == "get") {

                $select = FreePBX::Timeconditions()->getTimeGroup($jsonArray['id']);
                $dbh = FreePBX::Database();
                $sql = "SELECT * FROM timegroups_details WHERE timegroupid = ".$jsonArray['id'];
                $final = $dbh->sql($sql, 'getRow', \PDO::FETCH_ASSOC);

                if ($final) {
                    $explode = explode("|", $final["time"]);

                    $times = explode("-", $explode[0]);
                    $wdays = explode("-", $explode[1]);
                    $mdays = explode("-", $explode[2]);
                    $months = explode("-", $explode[3]);
                    
                    $times_start = explode(":", $times[0]);

                    $final["hour_start"] = trim($times_start[0], " ");
                    $spliths = str_split($final["hour_start"]); 
                    if ($spliths[0] == "0") {
                        $final["hour_start"] = $spliths[1];
                    }
                    
                    $final["minute_start"] = trim($times_start[1], " ");
                    $splitms = str_split($final["minute_start"]); 
                    if ($splitms[0] == "0") {
                        $final["minute_start"] = $splitms[1];
                    }

                    if ($times[1]) {
                        $times_finish = explode(":", $times[1]);
                        $final["hour_finish"] = trim($times_finish[0], " ");
                        $final["minute_finish"] = trim($times_finish[1], " ");
                    } else {
                        $final["hour_finish"] = trim($times_start[0], " ");
                        $final["minute_finish"] = trim($times_start[1], " ");
                    }

                    $splithf = str_split($final["hour_finish"]); 
                    if ($splithf[0] == "0") {
                        $final["hour_finish"] = $splithf[1];
                    }
                    $splitmf = str_split($final["minute_finish"]); 
                    if ($splitmf[0] == "0") {
                        $final["minute_finish"] = $splitmf[1];
                    }

                    $final["wday_start"] = trim($wdays[0], " ");
                    if ($wdays[1]) {
                        $final["wday_finish"] = trim($wdays[1], " ");
                    } else {
                        $final["wday_finish"] = trim($wdays[0], " ");
                    }

                    $final["mday_start"] = trim($mdays[0], " ");
                    if ($wdays[1]) {
                        $final["mday_finish"] = trim($mdays[1], " ");
                    } else {
                        $final["mday_finish"] = trim($mdays[0], " ");
                    }

                    $final["month_start"] = trim($months[0], " ");
                    if ($wdays[1]) {
                        $final["month_finish"] = trim($months[1], " ");
                    } else {
                        $final["month_finish"] = trim($months[0], " ");
                    }
                }

                echo json_encode($final);

            } else if ($rest == "set") {

                $time = FreePBX::Timeconditions()->buildTime( $jsonArray['hour_start'], $jsonArray['minute_start'], $jsonArray['hour_finish'], $jsonArray['minute_finish'], $jsonArray['wday_start'], $jsonArray['wday_finish'], $jsonArray['mday_start'], $jsonArray['mday_finish'], $jsonArray['month_start'], $jsonArray['month_finish']);
                $addTime = FreePBX::Timeconditions()->addTimeGroup($jsonArray['name'], array($jsonArray));
                echo json_encode($addTime);

            } else if ($rest == "update") {

                $updateName = FreePBX::Timeconditions()->editTimeGroup( $jsonArray['id'], $jsonArray['name'] );
                $updateTime = FreePBX::Timeconditions()->editTimes( $jsonArray['id'], array($jsonArray) );
                echo json_encode($updateName);

            }

            break;
        
        default:
            # code...
            break;
    }
    
} else {
    $name = pathinfo($_POST['name'], PATHINFO_FILENAME);
    $ext = pathinfo($_POST['name'], PATHINFO_EXTENSION);
    $filename = $name."-".time().".".$ext;
    $filepath = "/var/spool/asterisk/tmp/".$name."-".time().".".$ext;
    file_put_contents($filepath, base64_decode($_POST['content']));
    echo $filename;
}
