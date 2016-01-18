jQuery(document).ready(function($) {
	$('#menu_btn').click(function() {
		$('.ui.sidebar').sidebar('toggle');
	});
	$('#serch_type').dropdown();
});
