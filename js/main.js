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

	// 根據選取項目改變其他選單內容
	function select_item(value) {
		$('#search-detail').empty();
		$('#search-detail').dropdown('clear');
		$('.search.selection .default.text').text('選取分類');
		$.each(window.dropdown[value][0], function(key, val) {
			var html = $.parseHTML("<option value=\"" + val.value +"\">" + val.name + "<\/option>");
			$('#search-detail').append(html);
		});
	}
	function degree_change(value) {
		var level = ['一年級', '二年級', '三年級', '四年級', '五年級',]
		var department = 2, html;
		$('#select-department .menu').empty();
		$('#select-department .text').text('選取科系');
		$('#select-level .menu').empty();
		$('#select-level .text').text('選取年級');
		// $('#select-level .menu').empty();

		if(value == '學士班' || value == '進修學士班')
			department = 5;

		for (var i = 0; i < department; i++) {
			html = $.parseHTML("<div class=\"item\" value=\"" + i +"\">" + level[i] + "<\/div>");
			$('#select-level .menu').append(html);
		};

		$.each(window.dropdown[value][0], function(key, val) {
			html = $.parseHTML("<div class=\"item\" value=\"" + val.value +"\">" + val.name + "<\/div>");
			$('#select-department .menu').append(html);
		});


	}

	// 搜尋選單監聽
	$('#search-item').change(function() {
		select_item($(this).dropdown('get value'));
	});
	// 系級選單監聽
	$('#select-degree').change(function() {
		degree_change($(this).dropdown('get value'));
	});
	$('#tools-btn .ui.button').popup();
	$('#serch-sol .ui.button').popup({position : 'bottom right'});
});
