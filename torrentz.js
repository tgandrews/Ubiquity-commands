CmdUtils.CreateCommand({
  names: ["torrentz"],
  icon: "http://torrentz.com/favicon.ico",
  homepage: "http://tomandrews.co.uk/",
  author: {name: "Tom Andrews", email: "me@tomandrews.co.uk"},
  license: "GPL",
  description: "Allows you to search for active torrents via the meta search engine Torrentz.com",
  help: "Enter the name of the active torrent you wish to search for on the meta search engine Torrentz.com. The results are ordered by total number of peers.",
  arguments: [{role: "object", nountype: noun_arb_text, label: "torrent to search for"}],
  preview: function(pblock, args) {

    
    var searchText = jQuery.trim(args.object.text);
    
    if (searchText.length < 1){
      pblock.innerHTML = "Searches Torrentz.com";
      return;
    }
    
      
    var template = "Searching Torrentz.com for <b>${query}</b>....";
    var data = {query: searchText};
    pblock.innerHTML = CmdUtils.renderTemplate(template, data);
    
    // This is done by the search on the page but isn't necessary
    var re = new RegExp("\\s","g");
    searchText = searchText.replace(re, "+");
    
    var url = "http://torrentz.com/search?q=" + searchText;
            
    CmdUtils.previewAjax(pblock, {
      type: "GET",
      url: url,
      error: function() {
        pblock.innerHTML = "Error searching Torrentz.com!!";
        return;
      },
      success: function(searchResponse) {
        var re = new RegExp("peers");
        if (!re.exec(searchResponse)){
          pblock.innerHTML = "Search returned no results.";
          return;
        }
        
        
        // Only up to div.results
        var array_of_results = searchResponse.split("<dl>");
        
        // Output the first 5 results
        var output = "<h3>Torrentz Search Results</h3>";
        for (i = 1; i < array_of_results.length; i++){
          if (i == 6){
            break;
          }
          
          var temp = array_of_results[i];
          
          // Stop when reached the end
          if (!temp.match("<span class=\"a\">")){
            break;
          }
          
          // If get to the end then stop
          if (temp.match("</dl></div>")){
            // Get rid of the stuff off the bottom
            var temp_split = temp.split("</div><div style=");
            temp = temp_split[0];
          }
          
          // Turn it into a paragraph
          temp = temp.replace("<dt>", "<p>");
          temp = temp.replace("</dt>", "<br />");
          temp = temp.replace("<dd>", "");
          temp = temp.replace("</dd>", "");
          temp = temp.replace("</dl>","</p>");
          
          // Turn the spans into additional details
          temp = temp.replace("<span class=\"a\">", "<strong>Added: </strong>");
          temp = temp.replace("<span class=\"s\">", "<strong>Size: </strong>");
          temp = temp.replace("<span class=\"u\">", "<strong>Uploaders: </strong>");
          temp = temp.replace("<span class=\"d\">", "<strong>Downloaders: </strong>");
          temp = temp.replace("</span>","<br />");
        
          // Fix the URL
          temp = temp.replace("href=\"/", "href=\"http://torrentz.com/");
        
          output += temp;
        }
        
        pblock.innerHTML = output;
      }
    });
          
  },
  execute: function(args) {
    // Open the search in a new window when a user hits enter
    var output = jQuery.trim(args.object.text);
    var re = new RegExp("\\s","g");
    output = output.replace(re, "+");
    Utils.openUrlInBrowser("http://torrentz.com/search?q=" + output);
  }
});

