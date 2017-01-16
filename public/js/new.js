$(document).ready(function() {
  var menuTab = 1;

  $('#courseTab .tab-nav li').click(function() {
    var tabVal = parseInt($(this).attr('value')),
        nowTab = parseInt($('#courseTab li.active').attr('value'));

    if (tabVal != nowTab) {
      $('#courseTab li.active').removeClass('active');
      $('#courseTab li[value="' + tabVal + '"]').addClass('active');

      $('#title h4.active').removeClass('active');
      $('#title h4[value="' + tabVal + '"]').addClass('active');

      $('#toolTab .active').removeClass('active');
      $('#toolTab [value="' + tabVal + '"]').addClass('active');
    }
  });

  // time view switch
  $('#timeSwitch').click(function() {
    var viewType = $(this).find('a').attr('view');
    $('#timeSwitch').find('.active').removeClass('active');
    if (viewType == 'day') {
      $(this).find('a').attr('view', 'night');
      viewType = 'night';
    }
    else {
      $(this).find('a').attr('view', 'day');
      viewType = 'day';
    }
    $('#timeSwitch i[type="' + viewType + '"]').addClass('active');
  })

  // schedule view type
  $('#viewSwitch').click(function() {
    var viewType = parseInt($(this).find('a').attr('view'));
    $('#viewSwitch').find('.active').removeClass('active');

    if (viewType < 4) {
      viewType += 1;
    }
    else {
      viewType = 1;
    }

    $(this).find('a').attr('view', viewType);
    $('#viewSwitch i[value="' + viewType + '"]').addClass('active');
  })

  $('#courseTab .tab-nav li[value="1"]').click();
});
