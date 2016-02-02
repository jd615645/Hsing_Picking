jQuery(document).ready(function($) {
  window.department_data = {};

  // 學分變數
  window.credits = 0;
  // 模擬課表內容
  window.class_table = {};
  
  // 以上課時間為key的物件
  window.course_time = {};
  // 以課程代碼為key的物件
  window.course_code = {};
  // 以上課教師為key的物件
  window.course_sensei = {};
  // 以科系為key的物件
  window.course_department = {};
  // 以課程名稱為key的物件
  window.course_title = {};


  // U->學士班, O->其他(通識等), N->夜校, G->碩班, W->碩專班, D->博班
  window.degree_data = ['U', 'O', 'N', 'G', 'W', 'D'];

  // 引入選單資料
  $.getJSON('json/select.json',function(data) {
    for(var i=0 ; i < data.length ; i++) {
      // 以各選項資料建立索引
      $.each(data[i].searchDetail, function(key, val) {
        if (typeof(window.department_data[i]) == 'undefined')
          window.department_data[i] = {};
        if (typeof(window.department_data[i][val.value]) == 'undefined')
          window.department_data[i][val.value] = [];
        window.department_data[i][val.value] = val.name;
      });
    }
    $('.dropdown').dropdown();
  })

  // 依序讀入部門資訊
  for (var i = 0 ; i <  (window.degree_data).length  ; i++) {
    $.getJSON('json/career_' + window.degree_data[i] + '.json', function(data) {
      $.each(data.course, function(key, val) {
        // 以課程代碼建立索引
        if (typeof(window.course_code[val.code] == 'undefined'))
          window.course_code[val.code] = [];
        window.course_code[val.code].push(val);
        // 以上課教師建立索引
        if (typeof(window.course_sensei[val.professor] == 'undefined'))
          window.course_sensei[val.professor] = [];
        window.course_sensei[val.professor].push(val.code);
        // 以課程名稱建立索引
        if (typeof(window.course_title[val.title_parsed.zh_TW] == 'undefined'))
          window.course_title[val.title_parsed.zh_TW] = [];
        window.course_title[val.title_parsed.zh_TW].push(val.code);
        // 以上課時間建立建立索引
        $.each(val.time_parsed, function(ik, iv) {
          $.each(iv.time, function(jk, jv) {
            if (typeof(window.course_time[iv.day]) == 'undefined')
              window.course_time[iv.day] = {};
            if (typeof(window.course_time[iv.day][jv]) == 'undefined')
              window.course_time[iv.day][jv] = [];
            window.course_time[iv.day][jv].push(val.code);
          });
        });
        // 以科系班級建立索引，內容為課程代碼，
        if (typeof(window.course_department[val.for_dept]) == 'undefined')
           window.course_department[val.for_dept] = {};
        if (typeof(window.course_department[val.for_dept][val.class]) == 'undefined')
           window.course_department[val.for_dept][val.class] = [];
        window.course_department[val.for_dept][val.class].push(val.code);
      });
    })
  }

  // 搜尋選單監聽
  $('#search-item').on('click', '.item', function() {
    select_item($(this).attr('value'));
  });
  // 更改部門選單事件監聽
  $('#select-degree').on('click', '.item', function() {
    degree_change($(this).attr('value'));
  });
  // 更改系級選單事件監聽
  $('#select-department').change(function() {
    $('#select-level').removeClass('disabled');
  });
  // 更改年級選單事件監聽
  $('#select-level').on('click', '.item', function() {
    // 將必修自動填入課表
    var team = '';
    // var degree = $('#select-degree .active').attr('value');
    // var department = $('#select-department .active').attr('value');
    var department = $('#select-department .active').text();
    var level = $(this).attr('value');
    if (department.slice(-1) == 'A')
      team = 'A';
    else if(department.slice(-1) == 'B')
      team = 'B';
    department_find(department, level, team);
  });

  // 以單位尋找
  function department_find(department, level, team) {
    $.each(course_department[department][level+team], function(ik, iv) {
      $.each(course_code[iv], function(jk, jv) {
        if (jv.obligatory_tf) {
          // console.log(jv.title_parsed.zh_TW);
          add_course2table(jv); 
        }
      });
    });
  }

  // 將內容填入課表
  function add_course2table(data) {
    var have_class = false;
    $.each(data.time_parsed, function(ik, iv) {
      $.each(iv.time, function(jk, jv) {
        var $td = $('#class-table').find('tr[class-time=' + jv + '] td:eq(' + (iv.day - 1) + ')');
        // var $td = $('#class-table tr[class-time=1] td:eq(0)');
        console.log($td.text());
        if ($td.text() != "")
          have_class = true;
        if (!have_class) {
          // console.log($td);
          var html = $.parseHTML('<p>' + data.title_parsed.zh_TW + '<\/p>');
          $td.append(html);
        }
      });
    });
  }

  // (標題選擇欄位)根據選取項目改變其他選單內容
  // select_item('部門名稱') => 選取分類欄位載入對應內容
  function degree_change(value) {
    var level = ['一年級', '二年級', '三年級', '四年級', '五年級',]
    var department = 2, html;
    $('#select-department .menu').empty();
    $('#select-department .text').text('選取科系');
    $('#select-level .menu').empty();
    $('#select-level .text').text('選取年級');
    $('#select-department').removeClass('disabled');
    $('#select-level').addClass('disabled');

    if (value == 0 || value == 5)
      department = 5;
    // 添加系級至選單
    $.each(department_data[value], function(key, val) {
      html = $.parseHTML("<div class=\"item\" value=\"" + key +"\">" + val + "<\/div>");
      $('#select-department .menu').append(html);
    });
    // 添加年級至選單
    for (var i = 0; i < department; i++) {
      html = $.parseHTML("<div class=\"item\" value=\"" + (i+1) +"\">" + level[i] + "<\/div>");
      $('#select-level .menu').append(html);
    };
  }

  // (尋找課程欄位)根據選取項目改變其他選單內容
  // select_item('項目名稱') => 選取分類欄位載入對應內容
  function select_item(value) {
    $('#search-detail').empty();
    $('#search-detail').dropdown('clear');
    $('.search.selection .default.text').text('選取分類');
    $.each(department_data[value], function(key, val) {
      var html = $.parseHTML("<option value=\"" + key +"\">" + val + "<\/option>");
      $('#search-detail').append(html);
    });
  }

  // 提示訊息元件初始化
  $('#tools-btn .ui.button').popup();
  $('#serch-sol .ui.button').popup({position : 'bottom right'});
});
