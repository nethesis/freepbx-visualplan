<?php 
foreach (core_did_list() as $key => $row) {
	if ($row['cidnum'] != "") 
		$id=$row['extension']." / ".$row['cidnum'];
	else 
		$id=$row['extension'];
	echo '<a target="_blank" href="nethvplan/index.html?did='.urlencode($id).'"  >'.$id.'</a><br />'."\n";

}






