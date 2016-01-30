jQuery(document).ready(function($) {
	window.dropdown = {};
	window.search_item = [];
	window.search_detail = [];
	window.select_department = [];
	$.getJSON("json/select.json",function(data){
		// console.log(data);
		for(var i=0 ; i < data.length ; i++)
		{
			if(typeof(window.dropdown[data[i].searchItem]) == 'undefined')
				window.dropdown[data[i].searchItem] = [];
			
			window.dropdown[data[i].searchItem].push(data[i].searchDetail);
		}
		$('.dropdown').dropdown();
	})
	
	function select_item(item) {
		$('#search-detail').empty();
		$('#search-detail').dropdown('clear');
		$('.search.selection .default.text').text('選取分類');
		$.each(window.dropdown[item][0], function(key, val) {
			var html = $.parseHTML("<option value=\"" + val.value +"\">" + val.name + "<\/option>");
			$('#search-detail').append(html);
		});
	}
	$('#search-item').change(function() {
		select_item($(this).dropdown('get value'));
	});
});
