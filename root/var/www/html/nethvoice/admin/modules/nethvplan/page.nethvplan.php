<?php 

echo '<h2>Visual Plan</h2>';

echo '<a target="_blank" href="nethvplan/index.html?did=new_route"><button>Add new route</button></a>';

echo '<h4>Routes List</h4>';

foreach (core_did_list() as $key => $row) {
	if ($row['cidnum'] != "") 
		$id=$row['extension']." / ".$row['cidnum'];
	else 
		$id=$row['extension'];

	if($id) {
		echo '<a target="_blank" href="nethvplan/index.html?did='.urlencode($id).'">'.$id.'</a><br />'."\n";
	}

}






