(function () {
	//setup the search autocomplete on page load
	function SearchController() {
		this.init = init;

		$.fn.typeahead.Constructor.prototype.render = function(items) {
			var ul = [];

			items.forEach(function(item) {
				var li = $('<li class="autocomplete autocomplete-' + item.type + '"><a href="' + pathTo('search/goto/' + item.type + '/' + item.id) + '"></a></li>');
				var a = li.find('a');

				//if the html is already rendered, just append it
				if(item.html) {
					a.append(item.html);
				}
				//otherwise just append the basic item title/name
				else {
					switch(item.type) {
						case 'user':
							//render a user
							a.append(item.displayName);
							break;
						case 'content':
							//render a content item
							a.append(item.title || item.text.substring(0, 50));
							break;
						case 'page':
							a.append(item.title);
							//render a page
							break;
						case 'group':
							a.append(item.name);
							//render a group
							break;
					}
				}

				ul.push(li);
			});

			//add a hidden element for no-selection
			ul.push($('<li class="hidden"></li>'));

			this.$menu.html(ul)
	      	return this;
		};

		$.fn.typeahead.Constructor.prototype.select = function () {
	    	var li = this.$menu.find('.active');
	    	var a = li.find('a');

	    	if(a.length) window.location = a.attr('href');
	    	else {
	    		//just submit the search form
	    		$('.navbar-search')[0].submit();
	    	}
	    };

	    function init() {
			$('.navbar-search #search').typeahead({
				menu: '<ul class="typeahead dropdown-menu typeahead-search"></ul>',
				matcher: function(item) { return true },
				sorter: function(items) { return items },
				source: function(query, process) {
					$.post(pathTo('search/query'), { query: query }, function(data) {
						process(data);
					});
				}
			});
		}
	}

	// EXPORTS
	window.SearchController = SearchController;
})();