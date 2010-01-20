const DISPLAY_TEMPLATE = "<div style=\"clear: both;\">${title}</div><div style=\"float: left;\"><img style=\"height: 50px; width: 50px; float: left;\" src=\"${image}\"/><ul style=\"display: block; list-style-type: none; float: left;\"><li><p>Next Episode: ${nextTitle} | ${nextDate}</p></li><li><p>Last Episode: ${lastTitle} | ${lastDate}</p></li> </ul></div>";
const DATE_MATCHER = /([1-9]{1}|2[0-9]{1}|3[0-1]{1})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s([0-9]{2})/;
const TITLE_MATCHER = /<a target="_blank" href="http:\/\/www.tv.com\/[\w-\/%\d]+summary.html">[\w\s',!]*<\/a>/;
const NUMBER_MATCHER = /\d{1}-(\s\d|\d{1,2})/;

var log = CmdUtils.log;

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
				url: url,
				success: function(data) {
					pblock.innerHTML = "Parsing results...";
					
					// Won't take multiple e.g. 'div pre'
					var eplist = jQuery(data).find('pre').html();
					
					var episodes = eplist.split("</a>");
					
					var nextEpisode;
					var lastEpisode;
					var now = Date.today();
					
					var last = episodes.length - 1;
		
					for (var i = last; i >= 0; --i) {
						try {
							// Readd the </a> removed from split
							var temp = episodes[i] + "</a>";
							var dates = DATE_MATCHER.exec(temp);
							if (!dates) {
								continue;
							}
							// Cannot be used as it has no date
							if (dates[0].length <= 6) {
								continue;
							}
							var date = Date.parse(dates[0]);
							
							var titles = TITLE_MATCHER.exec(temp);
							if (!titles){
								continue;
							}
							var title = titles[0];
							
							var before = date.isBefore(now);
							
							var object = {
								date: date,
								title: title
							};
							
							if (date.isAfter(now)){
								nextEpisode = object;
							}
							else {
								lastEpisode = object;
								break;
							}
						}
						catch (e){
							pblock.innerHTML += e;
						}
					}
					
					//pblock.innerHTML =	"Next: " + nextEpisode.date + " | " + nextEpisode.title;
					
					if (!nextEpisode){
						nextEpisode = {date: "Unknown", title: "Unknown"};
					}
					if (!lastEpisode){
						lastEpisode = {date: "Unknown", title: "Unknown"};
					}
					
					var params = {
						title: "Test",
						image: "Image",
						lastTitle: lastEpisode.title,
						lastDate: lastEpisode.date,
						nextTitle: nextEpisode.title,
						nextDate: nextEpisode.date
					};
					pblock.innerHTML = CmdUtils.renderTemplate(DISPLAY_TEMPLATE, params);
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