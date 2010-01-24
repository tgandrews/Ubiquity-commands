const DISPLAY_TEMPLATE = "<div style=\"clear: both; margin-bottom:10px;\"><center>${title}</center></div><div style=\"float: left;\"><img style=\"height: 200px; width: auto; float: left;\" src=\"${image}\"/><div style=\"float:left;\">${description}</div></div><ul style=\"display:inline; list-style-type: none; float:right; width:100%;\"><li><p>Last Episode: S${lastSeason}E${lastEpisode} ${lastTitle} | ${lastDate}</p></li><li><p>Next Episode: S${nextSeason}E${nextEpisode} ${nextTitle} | ${nextDate}</p></li></ul>";
const DATE_MATCHER = /([1-9]{1}|2[0-9]{1}|3[0-1]{1})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s([0-9]{2})/;
const TITLE_MATCHER = /<a target="_blank" href="http:\/\/www.tv.com\/[\w-\/%\d]+summary.html">[\w\s',!]*<\/a>/;
const NUMBER_MATCHER = /(\d{1})-(\s\d|\d{1,2})/;

var log = CmdUtils.log;

CmdUtils.CreateCommand({
	names: ["epguides"],
	icon: "http://epguides.com/favicon.ico",
	homepage: "http://tomandrews.co.uk/",
	author: {name: "Tom Andrews", email: "me@tomandrews.co.uk"},
	license: "GPL",
	description: "Allows you to search epguides.com for playing info for the latest TV shows.",
	help: "Enter the name of the TV show to search for.",
	arguments: [{role: "object", nountype: noun_arb_text, label: "TV show to search for"}],
	
	preview: function(pblock, args) {
		var searchText = jQuery.trim(args.object.text);
    	
		if (searchText.length < 1){
			pblock.innerHTML = "Searches epguides.com";
			return;
		}
		
		// Preview template
		var template = "<center><p>Searching epguides.com for <b>${query}</b> please wait...</p></center>";
		var params = {query: searchText};
		pblock.innerHTML = CmdUtils.renderTemplate(template, params);
		
		// Remove spaces
		var re = new RegExp("\\s","g");
		searchText = searchText.replace(re, "");
		
		var url = "http://epguides.com/" + searchText;
		
		// Go get the page
		CmdUtils.previewAjax(
			pblock, 
			{
				url: url,
				success: function(data) {
					pblock.innerHTML = "Parsing results...";
					
					// Won't take multiple e.g. 'div pre'
					var jQ = jQuery(data);
					var eplist = jQ.find('pre').html();
					
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
							
							var seasonEpisode = NUMBER_MATCHER.exec(temp);
							
							var seasonSimple = seasonEpisode[1];
							var season = "";
							if (seasonSimple < 10){
								season = "0" + seasonSimple;
							}
							else {
								season = seasonSimple;
							}
							
							var episodeSimple = seasonEpisode[2];
							var episode = seasonEpisode[2];
							if (episodeSimple < 10){
								episode = "0" + episodeSimple;
							}
							else {
								episode = episodeSimple;
							}
							
							var object = {
								date: date,
								title: title,
								season: season,
								episode: episode
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
					
					// Retrieve what is left
					var imgSource = jQ.find("img.CasLogPic").attr("src");
					var image = url + "/" + imgSource;
					
					var title = jQ.find("h1").html();
					
					var description = jQ.find("li.lihd").text();
					var description = description.replace(/regulars:/, "");
					
					// Possible to not find either episode if dates not used!
					var blank = {date: "Unknown", title: "Unknown", season: "00", episode: "00"};
					if (!nextEpisode){
						nextEpisode = blank;
					}
					if (!lastEpisode){
						lastEpisode = blank;
					}
					
					// Render the output! Yay!
					var params = {
						title: title,
						image: image,
						description: description,
						lastTitle: lastEpisode.title,
						lastDate: lastEpisode.date.toString("dd MMM yy"),
						lastEpisode: lastEpisode.episode,
						lastSeason: lastEpisode.season,
						nextTitle: nextEpisode.title,
						nextDate: nextEpisode.date.toString("dd MMM yy"),
						nextEpisode: nextEpisode.episode,
						nextSeason: nextEpisode.season
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