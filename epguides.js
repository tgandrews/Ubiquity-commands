const TEMPLATE = "<div style=\"clear: both;\">${title}</div><div style=\"float: left;\"><img style=\"height: 50px; width: 50px; float: left;\" src=\"${image}\"/><ul style=\"display: block; list-style-type: none; float: left;\"><li><p>Next Episode: ${next}</p></li><li><p>Last Episode: ${previous}</p></li> </ul></div>";

var log = CmdUtils.log;
// Object cache!
var cache = Application.storage;

CmdUtils.CreateCommand({
	names: ["epguides"],
	icon: "http://epguides.com/favicon.ico",
	homepage: "http://tomandrews.co.uk/",
	author: {name: "Tom Andrews", email: "me@tomandrews.co.uk"},
	license: "GPL",
	description: "Allows you to search epguides.com for playing info for the latest TV shows.",
	help: "Enter the name of the TV show to search for.",
	arguments: [{role: "object", nountype: noun_arb_text, label: "torrent to search for"}],
	
	preview: function(pblock, args) {
		var searchText = jQuery.trim(args.object.text);
    	
		if (searchText.length < 1){
			pblock.innerHTML = "Searches epguides.com";
			return;
		}
		
		// Preview template
		var template = "Searching epguides.com for <b>${query}</b>...";
		var params = {query: searchText};
		pblock.innerHTML = CmdUtils.renderTemplate(template, params);
		
		// Remove spaces
		var re = new RegExp("\\s","g");
		searchText = searchText.replace(re, "");
		
		var url = "http://epguides.com/" + searchText;
		
		CmdUtils.previewAjax(
			pblock, 
			{
				type: "GET",
				url: url, 
				success: function(data) {
					pblock.innerHTML = "Parsing results...";
				
					if (data) {
						pblock.innerHTML = data;
					}
					else {
						plock.innerHTML = "<h1>Fail!</h1>";
					}
					
					
										
				},
				error: function(request, errorMsg) {
					pblock.innerHTML = "Failed to find " + searchText;
				}
			}
		);
	},
	execute: function(args){
		// Remove spaces
		var re = new RegExp("\\s","g");
		searchText = searchText.replace(re, "");
		
		var url = "http://epguides.com/" + searchText;
	}
	
});	