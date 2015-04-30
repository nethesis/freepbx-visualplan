<?php 
foreach (core_did_list() as $key => $row) {
	if ($row['cidnum'] != "") 
		$id=$row['extension']." / ".$row['cidnum']];
	else 
		$id=$row['extension'];
	$id=urlencode($id);
	echo '<a href="admin/nethvplan/index.html?did='.$id.'"  ><br />'."\n";

}






