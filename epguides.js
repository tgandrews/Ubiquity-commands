const DISPLAY_TEMPLATE = "<div style=\"clear: both; margin-bottom:10px;\"><center>${title}</center></div><div style=\"float: left;\"><img style=\"height: 200px; width: auto; float: left;\" src=\"${image}\"/><div style=\"float:left;\">${description}</div></div><ul style=\"display:inline; list-style-type: none; float:right; width:100%;\"><li><p>Last Episode: S${lastSeason}E${lastEpisode} ${lastTitle} | ${lastDate}</p></li><li><p>Next Episode: S${nextSeason}E${nextEpisode} ${nextTitle} | ${nextDate}</p></li></ul>";
const DISPLAY_NONEXT_TEMPLATE = "<div style=\"clear: both; margin-bottom:10px;\"><center>${title}</center></div><div style=\"float: left;\"><img style=\"height: 200px; width: auto; float: left;\" src=\"${image}\"/><div style=\"float:left;\">${description}</div></div><ul style=\"display:inline; list-style-type: none; float:right; width:100%;\"><li><p>Last Episode: S${lastSeason}E${lastEpisode} ${lastTitle} | ${lastDate}</p></li><li><p>Next Episode: Unknown</p></li></ul>";
const DISPLAY_NOLAST_TEMPLATE = "<div style=\"clear: both; margin-bottom:10px;\"><center>${title}</center></div><div style=\"float: left;\"><img style=\"height: 200px; width: auto; float: left;\" src=\"${image}\"/><div style=\"float:left;\">${description}</div></div><ul style=\"display:inline; list-style-type: none; float:right; width:100%;\"><li><p>Last Episode: Unknown</p></li><li><p>Next Episode: S${nextSeason}E${nextEpisode} ${nextTitle} | ${nextDate}</p></li></ul>";
const DISPLAY_NONE_TEMPLATE = "<div style=\"clear: both; margin-bottom:10px;\"><center>${title}</center></div><div style=\"float: left;\"><img style=\"height: 200px; width: auto; float: left;\" src=\"${image}\"/><div style=\"float:left;\">${description}</div></div><ul style=\"display:inline; list-style-type: none; float:right; width:100%;\"><li><p>Last Episode: Unknown</p></li><li><p>Next Episode: Unkown</p></li></ul>";
const DATE_MATCHER = /([1-9]{1}|1[0-9]{1}|2[0-9]{1}|3[0-1]{1})[\s\/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\/]([0-9]{2})/;
const TITLE_MATCHER = /<a [\w='\"\/\d\s?:.-]*>[\w\s,!']*<\/a>/;
const NUMBER_MATCHER = /(\d{1,2})-(\s\d{1,2}|\d{1,2})/;

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
		
		// Remove spaces and the - it is missed off the URL so The Cleveland Show becomes ClevelandShow
		var re = new RegExp("(\\s|the)","ig");
		searchText = searchText.replace(re, "");
		
		var url = "http://epguides.com/" + searchText;
		
		// Go get the page
		CmdUtils.previewAjax(
			pblock, 
			{
				url: url,
				success: function(data) {
					pblock.innerHTML = "Parsing results...";
					
					var eplist = data.split("<pre>")[1].split("</pre>")[0];
					
					var episodes = eplist.split("</a>");
					
					var nextEpisode;
					var lastEpisode;
					var now = Date.today();
					
					var last = episodes.length - 1;
		
					for (var i = last; i >= 0; --i) {
						try {
							if (episodes[i].trim().length < 1){
								continue;
							}
							
							// Readd the </a> removed from split
							var temp = episodes[i] + "</a>";
							
							var dates = DATE_MATCHER.exec(temp);
							var foundDate = false;
							var date = "Unknown";
							if (dates && dates[0].length > 6) {
								date = Date.parse(dates[0]);
								foundDate = true;
							}
							
							var titles = TITLE_MATCHER.exec(temp);
							if (!titles){
								continue;
							}
							var title = titles[0];
							
							var seasonEpisode = NUMBER_MATCHER.exec(temp);
							if (!seasonEpisode){
								continue;
							}
							
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
							
							// If we found a date and it's before now then it must be last.
							if (foundDate && !date.isAfter(now)){
								lastEpisode = object;
								break;
							}
							// Otherwise it is next
							else {
								nextEpisode = object;
							}
						}
						catch (e){
							pblock.innerHTML += e;
							return;
						}
					}

					// Retrieve what is left - this returns nothing if HTML is b0rked
					var jQ = jQuery(data);
					var imgSource = jQ.find("img.CasLogPic").attr("src");
					var image = url + "/" + imgSource;
					
					var title = jQ.find("h1").html();
					
					var description = jQ.find("li.lihd").text();
					
					// TODO: Should this be recurring characters?
					var description = description.replace(/(regulars:|recurring character:)/ig, "");
					
					// OUTPUT
					// No future episodes known about
					if (lastEpisode && !nextEpisode){
						var params = {
							title: title,
							image: image,
							description: description,
							lastTitle: lastEpisode.title,
							lastDate: lastEpisode.date.toString("dd MMM yy"),
							lastEpisode: lastEpisode.episode,
							lastSeason: lastEpisode.season
						}
						pblock.innerHTML = CmdUtils.renderTemplate(DISPLAY_NONEXT_TEMPLATE, params);
					}
					// All episodes in the future
					else if (nextEpisode && !lastEpisode){
						var params = {
							title: title,
							image: image,
							description: description,
							nextTitle: nextEpisode.title,
							nextDate: nextEpisode.date.toString("dd MMM yy"),
							nextEpisode: nextEpisode.episode,
							nextSeason: nextEpisode.season
						};
						pblock.innerHTML = CmdUtils.renderTemplate(DISPLAY_NOLAST_TEMPLATE, params);
					}
					else if (!nextEpisode && !lastEpisode){
						var params = {
							title: title,
							image: image,
							description: description
						};
						pblock.innerHTML = CmdUtils.renderTemplate(DISPLAY_NONE_TEMPLATE, params);
					}
					// Render the default output. When last and next is known.
					else {
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
					}
				},
				error: function(request, errorMsg) {
					pblock.innerHTML = "Failed to find " + args.object.text;
				}
			}
		);
	},
	execute: function(args){
		// Remove spaces
		var re = new RegExp("(\\s|the)","ig");
		searchText = args.object.text.replace(re, "");
		
		var url = "http://epguides.com/" + searchText;
		Utils.openUrlInBrowser(url);
	}
});