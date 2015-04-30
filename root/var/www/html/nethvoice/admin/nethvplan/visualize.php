<?php

require('/etc/freepbx.conf');

// night service - night,810,1
$get_data = nethnight_list();
foreach ($get_data as $key => $row) {
	$data['night'][$row['night_id']] = array(	"name" => $row['displayname'],
												"id" => $row['night_id'],
												"dest" => $row['didaction'],
												"timebegin" => $row['timebegin'],
												"timeend" => $row['timeend']
										);
}

// incoming data
$get_data = core_did_list();
foreach ($get_data as $key => $row) {
	
	if($row['cidnum'] != "") {
		$data['incoming'][$row['extension']." / ".$row['cidnum']]['destination'] = $row['destination'];
		$data['incoming'][$row['extension']." / ".$row['cidnum']]['description'] = $row['description'];

		$night_service = nethnight_get_fromdid($row['extension']."/".$row['cidnum']);
		if($night_service) {
			$data['incoming'][$row['extension']." / ".$row['cidnum']]['night'] = $data['night'][$night_service['night_id']];
		}
	} else {
		$data['incoming'][$row['extension']]['destination'] = $row['destination'];
		$data['incoming'][$row['extension']]['description'] = $row['description'];

		$night_service = nethnight_get_fromdid($row['extension']."/");
		if($night_service) {
			$data['incoming'][$row['extension']]['night'] = $data['night'][$night_service['night_id']];
		}
	}
}

// internal data - from-did-direct,id,1
$get_data = core_users_list();
foreach ($get_data as $key => $row) {
	$data['from-did-direct'][$row[0]] = array("name" => $row[1],
											  "voicemail" => $row[2]
											 );
}

// voicemail - ext-local,vms201,1


// ivr - ivr-id,s,1
$get_data = ivr_get_details();
foreach ($get_data as $key => $row) {
	$data['ivr'][$row['id']]["name"] = $row['name'];
	$data['ivr'][$row['id']]["description"] = $row['description'];
	$data['ivr'][$row['id']]["announcement"] = $row['announcement'];
	$data['ivr'][$row['id']]["invalid_destination"] = $row['invalid_destination'];
	$data['ivr'][$row['id']]["timeout_destination"] = $row['timeout_destination'];

	$selection_data = ivr_get_entries($row['id']);
	foreach ($selection_data as $key => $value) {
		$data['ivr'][$row['id']]['selections'][$value['selection']] = array( "selection" => $value['selection'],
														 			   		 "dest" => $value['dest']
																	 );
	}
	
}

// timeconditions - timeconditions,id,1
$get_data = timeconditions_list();
foreach ($get_data as $key => $row) {
	$data['timeconditions'][$row['timeconditions_id']] = array(	"displayname" => $row['displayname'],
																"time" => $row['time'],
																"truegoto" => $row['truegoto'],
																"falsegoto" => $row['falsegoto']
																);
}

// announcement - app-announcement-1,s,1
$get_data = announcement_list();
foreach ($get_data as $key => $row) {
	$rec_details = recordings_get($row['recording_id']);
	$data['announcement'][$row['announcement_id']] = array(	"description" => $row['description'],
															"postdest" => $row['post_dest'],
															"rec_name" => $rec_details['displayname']
														  );
}

// call group - ext-group,id,1
$get_data = ringgroups_list();
foreach ($get_data as $key => $row) {
	$group_details = ringgroups_get($row['grpnum']);
	$data['ext-group'][$row['grpnum']] = array(	"num" => $row['grpnum'],
												"description" => $group_details['description'],
												"grplist" => $group_details['grplist'],
												"postdest" => $group_details['postdest']
											);
}

// conference - ext-meetme,id,1
$get_data = conferences_list();
foreach ($get_data as $key => $row) {
	$data['ext-meetme'][$row[0]] = array( "description" => $row[1],
										  "id"=> $row[0]
										);
}

// queues - ext-queues,id,1
$get_data = queues_list();
foreach ($get_data as $key => $row) {
	$queues_details = queues_get($row[0]);
	$data['ext-queues'][$row[0]] = array( "num" => $row[0],
										  "descr" => $queues_details['name'],
										  "dest" => $queues_details['goto'],
										  "members" => $queues_details['member'],
										  "dynmembers" => $queues_details['dynmembers']
										);
}

// flow call control - app-daynight,0,1
$get_data = daynight_list();
foreach ($get_data as $key => $row) {
	$daynight_obj = daynight_get_obj($row['ext']);
	$data['app-daynight'][$row['ext']] = array( "name"=> $daynight_obj['fc_description'],
												"control_code"=> "*28".$row['ext'],
												"green_flow"=> $daynight_obj['day'],
												"red_flow"=> $daynight_obj['night']
											  );
}

$widgets = array();
$connections = array();
$destArray = array();

$xPos = 10;
$yPos = 10;

$widgetTemplate = array(
	"userData"=> array(),
	"bgColor"=> "#95a5a6",
	"radius"=> "20"
 );
$connectionTemplate = array(
	"type"=> "MyConnection",
	"userData"=> array(),
	"cssClass"=> "draw2d_Connection",
	"stroke"=> 2,
	"color"=> "#4caf50",
	"outlineStroke"=> 1,
	"router"=> "draw2d.layout.connection.SplineConnectionRouter",
	"source"=> array(
		"node"=> "",
		"port"=> ""
	),
	"target"=> array(
		"node"=> "",
		"port"=> ""
	)
 );

// start elaboration
$id = $_GET["id"];
$destination = $data['incoming'][$id]['destination'];
$description = $data['incoming'][$id]['description'];

if($id != "") {
	$widget = $widgetTemplate;
	$widget['type'] = "Base";
	$widget['id'] = "incoming%".$id;
	$widget['radius'] = "20";
	$widget['bgColor'] = "#87d37c";
	$widget['x'] = $xPos;
	$widget['y'] = $yPos;
	$widget['name'] = "Incoming route";
	if($description) {
		$widget['entities'][] = array(
			"text"=> $description,
			"id"=> "description-incoming%".$id,
			"type"=> "text",
			"editable"=> "true"
		);
	}
	$widget['entities'][] = array(
		"text"=> $id,
		"id"=> "route_num-incoming%".$id,
		"type"=> "output",
		"editable"=> "true"
	);

	// get destination field and id
	$res = getDestination($destination);
	$dest = $res[0];
	$idDest = $res[1];

	$connection = $connectionTemplate;
	$connection['id'] = "incoming%".$id."=".$destination;
	$connection['source'] = array(
		"node"=> "incoming%".$id,
		"port"=> "output_route_num-incoming%".$id
	);
	$connection['target'] = array(
		"node"=> $dest."%".$idDest,
		"port"=> "input_".$dest."%".$idDest,
		"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
	);

	// add connection
	array_push($connections, $connection);

	// start exploring of connections
	explore($data, $destination, $destArray);

	if($data['incoming'][$id]['night']) {
		$widget['entities'][] = array(
			"text"=> "Night service",
			"id"=> "night_service%".$id,
			"type"=> "output",
			"editable"=> "false"
		);

		// get destination field and id
		$res = getDestination("night,8".$data['incoming'][$id]['night']['id']."0,1");
		$dest = $res[0];
		$idDest = $res[1];

		$connection = $connectionTemplate;
		$connection['id'] = "incoming%".$id."="."night,8".$data['incoming'][$id]['night']['id']."0,1";
		$connection['source'] = array(
			"node"=> "incoming%".$id,
			"port"=> "output_night_service%".$id
		);
		$connection['target'] = array(
			"node"=> $dest."%".$idDest,
			"port"=> "input_".$dest."%".$idDest,
			"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
		);

		// add connection
		array_push($connections, $connection);

		// start exploring of connections
		explore($data, "night,8".$data['incoming'][$id]['night']['id']."0,1", $destArray);
	}

	// add widget
	array_push($widgets, $widget);
}

// print output
$merged = array_merge($widgets, $connections);
$result = array();
foreach ($merged as $place) {
    if (!array_key_exists($place['id'], $result)) {
        $result[$place['id']] = $place;
    }
}
$merged = $result;
//print "var jsonDocument = ";
print_r(json_pretty(json_encode($merged, true)));

function getDestination($destination) {
	if(preg_match('/ivr-*/', $destination)) {
		$values = explode(",", $destination);
		$dests = explode("-", $values[0]);
		$dest = $dests[0];
		$id = $dests[1];
	} else if(preg_match('/app-announcement-*/', $destination)) {
		$values = explode(",", $destination);
		$dests = explode("-", $values[0]);
		$dest = $dests[0];
		$id = $dests[1];
	} else if(preg_match('/^night/', $destination)) {
		$values = explode(",", $destination);
		$idlong = $values[1];
		$dest = $values[0];
		$ids = str_split($idlong);
		$id = $ids[1];
	} else {
		$values = explode(",", $destination);
		$dest = $values[0];
		$id = $values[1];
	}

	return array($dest, $id);
}

// searching connections function
function explore($data, $destination, $destArray) {

	global $xPos;
	global $xOffset;
	global $yPos;
	global $matrixPos;

	global $widgets;
	global $connections;
	global $widgetTemplate;
	global $connectionTemplate;

	if(!in_array($destination, $destArray)) {
		// insert elem in array
		array_push($destArray, $destination);

		// get destination field and id
		$res = getDestination($destination);
		$dest = $res[0];
		$id = $res[1];

		// choose correct destination and 
		// add widget and connections
		switch($dest) {
			case "from-did-direct":
				//print "INTERNO: ".$data[$dest][$id]['name']."\n";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "20";
				$widget['bgColor'] = "#27ae60";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Internal number";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['name']." ( ".$id." )",
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);

				// add widget
				array_push($widgets, $widget);
			break;
			case "ext-meetme":
				//print "CONFERENZA: ".$data[$dest][$id]['description']."\n";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "20";
				$widget['bgColor'] = "#65c6bb";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Conference";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['description']." ( ".$data[$dest][$id]['id']." )",
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				
				// add widget
				array_push($widgets, $widget);
			break;
			case "app-blackhole":
				//print "HANGUP\n";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "20";
				$widget['bgColor'] = "#e74c3c";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Hangup";
				$widget['entities'][] = array(
					"text"=> "Hangup",
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "false"
				);
				
				// add widget
				array_push($widgets, $widget);
			break;
			case "ext-local":
				$state = substr($id, 0, 3);
				$idUsers = substr($id, -3);

				$text = "";
				switch($state) {
					case "vmu":
						$text = "Unavailable";
					break;
					case "vmb":
						$text = "Busy";
					break;
					case "vms":
						$text = "Unavailable";
					break;
				}

				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "20";
				$widget['bgColor'] = "#16a085";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Voice Mail";
				$widget['entities'][] = array(
					"text"=> $data['from-did-direct'][$idUsers]['name']." ( ".$idUsers." ) - ".$text,
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				
				// add widget
				array_push($widgets, $widget);
			break;

			case "night":
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#34495e";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Night service";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['name'],
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);

				$year = date('Y', strtotime($data[$dest][$id]['timeend']));
				$content = "Period: ".date('d/m/Y', strtotime($data[$dest][$id]['timebegin']))." - ".date('d/m/Y', strtotime($data[$dest][$id]['timeend']));
				if($year == 2030) {
					$content = "Active";
				}

				if($year == 1970) {
					$content = "Not Active";
				}

				$widget['entities'][] = array(
					"text"=> $content,
					"id"=> $dest."%".$id,
					"type"=> "text",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Destination",
					"id"=> "nightdest-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
				
				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['dest']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['dest'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_nightdest-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['dest'], $destArray);
			break;

			case "app-announcement":
				//print "MISC DEST: ".$data[$dest][$id]['description']."\n";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#f4b350";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Announcement";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['description'],
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['rec_name'],
					"id"=> $dest."%".$id,
					"type"=> "text",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Destination",
					"id"=> "postdest-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
				
				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['postdest']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['postdest'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_postdest-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['postdest'], $destArray);
			break;

			case "app-daynight":
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#2c3e50";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Call-flow control";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['name']." ( ".$data[$dest][$id]['control_code']." )",
					"id"=> $dest."%".$id,
					"type" => "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Normal flow (green)",
					"id"=> "green_flow-".$dest."%".$id,
					"type" => "output",
					"editable"=> "false"
				);
				$widget['entities'][] = array(
					"text"=> "Alternative flow (red)",
					"id"=> "red_flow-".$dest."%".$id,
					"type" => "output",
					"editable"=> "false"
				);

				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['green_flow']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['green_flow'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_green_flow-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['green_flow'], $destArray);

				$res = getDestination($data[$dest][$id]['red_flow']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['red_flow'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_red_flow-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['red_flow'], $destArray);
			break;

			case "timeconditions":
				//print "\tCONDZ.TEMP True: ".$data[$dest][$id]['displayname']."--> ";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#D24D57";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Time Conditions";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['displayname'],
					"id"=> $dest."%".$id,
					"type" => "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "True condition",
					"id"=> "truegoto-".$dest."%".$id,
					"type" => "output",
					"editable"=> "false"
				);
				$widget['entities'][] = array(
					"text"=> "False condition",
					"id"=> "falsegoto-".$dest."%".$id,
					"type" => "output",
					"editable"=> "false"
				);

				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['truegoto']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['truegoto'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_truegoto-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['truegoto'], $destArray);

				$res = getDestination($data[$dest][$id]['falsegoto']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['falsegoto'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_falsegoto-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['falsegoto'], $destArray);
				//print "\t\t\tCONDZ.TEMP False: ".$data[$dest][$id]['displayname']."--> ";
			break;

			case "ivr":
				//print "IVR: ".$data[$dest][$id]['name']."\n";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#7f8c8d";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "IVR";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['name'],
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Invalid destination",
					"id"=> "invalid_destination-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
				$widget['entities'][] = array(
					"text"=> "Timeout destination",
					"id"=> "timeout_destination-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
	
				$res = getDestination($data[$dest][$id]['invalid_destination']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['invalid_destination']."-invalid";
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_invalid_destination-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				//print "\n-->Invalid:".$data[$dest][$id]['invalid_destination']."|> ";
				explore($data, $data[$dest][$id]['invalid_destination'], $destArray);

				$res = getDestination($data[$dest][$id]['timeout_destination']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['timeout_destination']."-timeout";
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_timeout_destination-".$dest."%".$id
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				//print "\n-->Timeout:".$data[$dest][$id]['timeout_destination']."|> ";
				explore($data, $data[$dest][$id]['timeout_destination'], $destArray);

				foreach ($data[$dest][$id]['selections'] as $value) {
					$widget['entities'][] = array(
						"text"=> "Selection ".$value['selection'],
						"id"=> "selection_".$value['selection']."-".$dest."%".$id,
						"type"=> "output",
						"editable"=> "false"
					);

					$res = getDestination($value['dest']);
					$destNew = $res[0];
					$idDest = $res[1];

					$connection = $connectionTemplate;
					$connection['id'] = $dest."%".$id."=".$value['dest'];
					$connection['source'] = array(
						"node"=> $dest."%".$id,
						"port"=> "output_selection_".$value['selection']."-".$dest."%".$id
					);
					$connection['target'] = array(
						"node"=> $destNew."%".$idDest,
						"port"=> "input_".$destNew."%".$idDest,
						"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
					);

					// add connection
					array_push($connections, $connection);
					//print "\n-->Sel: ".$value['selection']."==> ";
					explore($data, $value['dest'], $destArray);
				}

				array_push($widgets, $widget);
				//print "<---------------------------------------".$data[$dest][$id]['name']."\n";
			break;

			case "ext-queues":
				//print "CODA: ".$data[$dest][$id]['descr']." --> ";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#9b59b6";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Queues";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['descr']." ( ".$data[$dest][$id]['num']." )",
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Static members",
					"id"=> $dest."%".$id."stext",
					"type"=> "text",
					"editable"=> "false"
				);
				$widget['entities'][] = array(
					"text"=> implode(",", $data[$dest][$id]['members']),
					"id"=> $dest."%".$id."slist",
					"type"=> "list",
					"editable"=> "true"
				);

				$widget['entities'][] = array(
					"text"=> "Dynamic members",
					"id"=> $dest."%".$id."dtext",
					"type"=> "text",
					"editable"=> "false"
				);
				$widget['entities'][] = array(
					"text"=> implode(",", $data[$dest][$id]['dynmembers']),
					"id"=> $dest."%".$id."dlist",
					"type"=> "list",
					"editable"=> "true"
				);

				$widget['entities'][] = array(
					"text"=> "Fail destination",
					"id"=> "faildest-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
	
				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['dest']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['dest'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_faildest-".$dest."%".$id,
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);

				explore($data, $data[$dest][$id]['dest'], $destArray);
			break;

			case "ext-group":
				//print "CALL GROUP: ".$data[$dest][$id]['description']." LIST: [".$data[$dest][$id]['grplist']."] --> ";
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['radius'] = "0";
				$widget['bgColor'] = "#2980b9";
				$widget['id'] = $dest."%".$id;
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				$widget['name'] = "Groups";
				$widget['entities'][] = array(
					"text"=> $data[$dest][$id]['description']." (".$data[$dest][$id]['num']." )",
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Internals list",
					"id"=> $dest."%".$id,
					"type"=> "text",
					"editable"=> "true"
				);
				$widget['entities'][] = array(
					"text"=> "Fail destination",
					"id"=> "faildest-".$dest."%".$id,
					"type"=> "output",
					"editable"=> "false"
				);
	
				// add widget
				array_push($widgets, $widget);

				$res = getDestination($data[$dest][$id]['postdest']);
				$destNew = $res[0];
				$idDest = $res[1];

				$connection = $connectionTemplate;
				$connection['id'] = $dest."%".$id."=".$data[$dest][$id]['postdest'];
				$connection['source'] = array(
					"node"=> $dest."%".$id,
					"port"=> "output_faildest-".$dest."%".$id,
				);
				$connection['target'] = array(
					"node"=> $destNew."%".$idDest,
					"port"=> "input_".$destNew."%".$idDest,
					"decoration"=> "draw2d.decoration.connection.ArrowDecorator"
				);

				// add connection
				array_push($connections, $connection);
				explore($data, $data[$dest][$id]['postdest'], $destArray);
			break;

			default:
				$widget = $widgetTemplate;
				$widget['type'] = "Base";
				$widget['id'] = $dest."%".$id;
				$widget['radius'] = "20";
				$widget['x'] = $xPos;
				$widget['y'] = $yPos;
				if($dest != "") {
					$widget['name'] = "Alternative destination";
					$text = $dest;
				} else {
					$widget['name'] = "Disabled";
					$text = "disabled";
				}
				$widget['entities'][] = array(
					"text"=> $text,
					"id"=> $dest."%".$id,
					"type"=> "input",
					"editable"=> "false"
				);

				// add widget
				array_push($widgets, $widget);
		}
	} else {
		//print "--LOOP--$destination\n";
	}
}

function json_pretty($json, $options = array())
{
    $tokens = preg_split('|([\{\}\]\[,])|', $json, -1, PREG_SPLIT_DELIM_CAPTURE);
    $result = '';
    $indent = 0;

    $format = 'txt';

    //$ind = "\t";
    $ind = "    ";

    if (isset($options['format'])) {
        $format = $options['format'];
    }

    switch ($format) {
        case 'html':
            $lineBreak = '<br />';
            $ind = '&nbsp;&nbsp;&nbsp;&nbsp;';
            break;
        default:
        case 'txt':
            $lineBreak = "\n";
            //$ind = "\t";
            $ind = "    ";
            break;
    }

    // override the defined indent setting with the supplied option
    if (isset($options['indent'])) {
        $ind = $options['indent'];
    }

    $inLiteral = false;
    foreach ($tokens as $token) {
        if ($token == '') {
            continue;
        }

        $prefix = str_repeat($ind, $indent);
        if (!$inLiteral && ($token == '{' || $token == '[')) {
            $indent++;
            if (($result != '') && ($result[(strlen($result) - 1)] == $lineBreak)) {
                $result .= $prefix;
            }
            $result .= $token . $lineBreak;
        } elseif (!$inLiteral && ($token == '}' || $token == ']')) {
            $indent--;
            $prefix = str_repeat($ind, $indent);
            $result .= $lineBreak . $prefix . $token;
        } elseif (!$inLiteral && $token == ',') {
            $result .= $token . $lineBreak;
        } else {
            $result .= ( $inLiteral ? '' : $prefix ) . $token;

            // Count # of unescaped double-quotes in token, subtract # of
            // escaped double-quotes and if the result is odd then we are 
            // inside a string literal
            if ((substr_count($token, "\"") - substr_count($token, "\\\"")) % 2 != 0) {
                $inLiteral = !$inLiteral;
            }
        }
    }
    return $result;
}