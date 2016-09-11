(function($) {
  jQuery(document).ready(function($) {
    window.department_data = {};

    // 學分變數
    window.credits = 0;
    // 模擬課表內容
    window.class_table = {};

    // 以課程代碼為key的物件
    window.course_code = {};
    // 以上課時間為key的物件，其指向課程代碼
    window.course_time = {};
    // 以上課教師為key的物件，其指向課程代碼
    window.course_sensei = {};
    // 以科系為key的物件，其指向課程代碼
    window.course_department = {};
    // 以課程名稱為key的物件，其指向課程代碼
    window.course_title = {};

    window.onepice_url = 'https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main_q?v_strm=1042&v_class_nbr=';

    // U->學士班, O->其他(通識等), N->夜校, G->碩班, W->碩專班, D->博班
    window.degree_data = ['U', 'O', 'N', 'G', 'W', 'D'];

    window.now_course = [];

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
      $('.ui.dropdown').dropdown();
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

    $('#tools-btn .button').click(function() {
      var tools_value = $(this).attr('value');
      switch(tools_value) {
        case '1':
          break;
        case '2':
          console.log(now_course);
          break;
        case '3':
          break;
        case '4':
          break;
        case '5':
          break;
        case '6':
          $('#select-degree', '#search-time', '#search-item').dropdown('restore defaults');
          $('#select-department .menu', '#select-level .menu', '#search-detail').empty();
          $('#select-department', '#select-level', '#search-time').addClass('disabled');
          $($('#search-detail').parents('.multiple')).addClass('disabled');
          $('#select-department .text').text('選取科系');
          $('.search.selection .default.text').text('選取分類');
          $('#select-level .text').text('選取年級');
          $('#search-detail').dropdown('clear');
          $('#search-keyWord').val('');
          now_course = [];
          clear_table();
          clear_course_now();
          clear_course_keep();
          clear_course_search();
          break;
      }
    });

    // 搜尋選單監聽(項目)
    $('#search-item').on('click', '.item', function() {
      select_item($(this).attr('value'));
    });

    // 搜尋選單監聽(分類)
    $('.bottom.attached.segment').on('click', '.multiple .item', function() {
      $('#search-time').removeClass('disabled');
    });

    // 搜尋課程按鈕監聽
    $('#search-btn').click(function() {
      var get_value = $('#search-detail').dropdown('get value');

      var keyWord = ($('#search-keyWord').val()).split(' ');
      var item = $('#search-item .selected').attr('value');
      var detail = get_value[get_value.length-1];
      var time = $('#search-time .selected').attr('value');

      item = item==undefined ? '' : item;
      detail = detail==null ? '' : detail;
      time = time==undefined ? '' : time;

      course_search(keyWord, item, detail, time);
    });

    // 更改部門選單事件監聽
    $('#select-degree').on('click', '.item', function() {
      degree_change($(this).attr('value'));
    });
    // 更改部門選單事件監聽
    $('#select-department').on('click', function() {

    });
    // 更改系級選單事件監聽
    $('#select-department').change(function() {
      $('#select-level').dropdown('restore defaults');
      $('#select-level .text').text('選取年級');
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

    // 鼠標停在尋找課程選項上事件監聽
    $('#course-search').on('mouseenter', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, false, false);
    });
    // 鼠標離開尋找課程選項事件監聽
    $('#course-search').on('mouseleave', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, false, true);
    });

    // 鼠標停在保留課程選項上事件監聽
    $('#course-keep').on('mouseenter', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, false, false);
    });
    // 鼠標離開保留課程選項事件監聽
    $('#course-keep').on('mouseleave', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, false, true);
    });

    // 鼠標停在目前課程選項上
    $('#course-now').on('mouseenter', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, true, false);
    });
    // 鼠標離開目前課程選項
    $('#course-now').on('mouseleave', '.courseItem', function() {
      // 課程代碼
      var code = $(this).attr('value');
      highlight_table(code, true, true);
    });

    // 清除選單內容按鈕事件監聽
    $('#clear-search').click(function() {
      clear_course_search();
    });
    $('#clear-keep').click(function() {
      clear_course_keep();
    });
    $('#clear-now').click(function() {
      clear_course_now();
      clear_table();
    });

    // 將尋找課程中的課程項目排入課表
    $('#course-search').on('click','.add-btn' , function() {
      var code = $(this).parents('.courseItem').attr('value');
      if(isFree(course_code[code][0])) {
        now_course.push(code);
        add_course_now(course_code[code][0]);
        $(this).parents('.courseItem').remove();
        highlight_table(code, false, true);
      }
      else
        console.log('衝堂');
    });

    // 將尋找課程中的課程項目加至保留課程
    $('#course-search').on('click','.keep-btn' , function() {
      var code = $(this).parents('.courseItem').attr('value');
      course_keep_repeat(course_code[code][0]);
      $(this).parents('.courseItem').remove();
      highlight_table(code, false, true);
    });

    // 將保留課程中的課程項目排入課表
    $('#course-keep').on('click','.add-btn' , function() {
      var code = $(this).parents('.courseItem').attr('value');
      if(isFree(course_code[code][0])) {
        now_course.push(code);
        add_course_now(course_code[code][0]);
        $(this).parents('.courseItem').remove();
        highlight_table(code, false, true);
      }
      else
        console.log('衝堂');
    });

    // 各別刪除保留課程中的課程項目
    $('#course-keep').on('click','.del-btn' , function() {
      var code = $(this).parents('.courseItem').attr('value');
      $(this).parents('.courseItem').remove();
      highlight_table(code, false, true);
    });

    // 各別刪除目前課程中的課程項目
    $('#course-now').on('click','.del-btn' , function() {
      var code = $(this).parents('.courseItem').attr('value');
      $(this).parents('.courseItem').remove();
      clear_table_course(code);
      now_course.splice(now_course.indexOf(code), 1);
    });

    // 判斷此課程是否衝堂
    function isFree(course) {
      var free = true;
      $.each(course.time_parsed, function(ik, iv) {
        $.each(iv.time, function(jk, jv) {
          var $td = $('#class-table').find('tr[class-time=' + jv + '] td:eq(' + iv.day + ')');
          if ($td.text() != "")
            free = false;
        });
      });
      return free;
    }

    // 搜尋課程
    function course_search(keyWord, item, detail, time) {
      clear_course_search();
      var search = [];
      var search_key = [];

      if (keyWord[0] != '') {
        $.each(course_code, function(key, val) {
          for (var i = 0; i < keyWord.length; i++) {
            if ((val[0].code).match(keyWord[i]) != null)
              search.push(val[0].code);
            if ((val[0].professor).match(keyWord[i]) != null)
              search.push(val[0].code);
            if ((val[0].title_parsed.zh_TW).match(keyWord[i]) != null)
              search.push(val[0].code);
            for (var j = 0; j < (val[0].location).length; j++) {
              if ((val[0].location[j]).match(keyWord[i]) != null)
                search.push(val[0].code);
            }
          }
        });
      }

      if (item != '') {
        if (keyWord[0] != '') {
          search_key = search;
          search = [];
        }
        else
          search_key = Object.keys(course_code);

        if (item == '0' || item == '5') {
          for (var i = 0; i < search_key.length; i++) {
            var type = parse_course_type(course_code[search_key[i]][0]);

            if (type == '選修' || type == '必修') {
              $.each(detail, function(key, val) {
                department_data[item][val] = department_data[item][val].replace(' A', '');
                department_data[item][val] = department_data[item][val].replace(' B', '');
                if (department_data[item][val] == course_code[search_key[i]][0].for_dept) {
                  search.push(course_code[search_key[i]][0].code);
                }
              });
            }
          }
        }
        else if (item == '6' || item == '7') {
          for (var i = 0; i < search_key.length; i++) {
            var type = parse_course_type(course_code[search_key[i]][0]);
            if (type != '選修' && type != '必修') {
              $.each(detail, function(key, val) {
                if (department_data[item][val] == type) {
                  search.push(course_code[search_key[i]][0].code);
                }
              });
            }
          }
        }
      }

      if (time != '') {
        search_key = search;
        search = [];
        for (var i = 0; i < search_key.length; i++) {
          if (time != 0) {
            for (var j = 0; j < course_code[search_key[i]][0].time_parsed.length; j++) {
              if (time == course_code[search_key[i]][0].time_parsed[j].day)
                search.push(search_key[i]);
            }
          }
          else if (time == 0) {
            if(isFree(course_code[search_key[i]][0]))
              search.push(search_key[i]);
          }
        }
      }

      for (var i = 0; i < search.length; i++) {
        add_course_search(course_code[search[i]][0]);
      }
    }

    // 判斷課程類型
    function parse_course_type(course) {
      var general_type = {'人文通識': ['文學學群', '歷史學群', '哲學學群', '藝術學群', '文化學群'],
                          '社會通識': ['公民與社會學群', '法律與政治學群', '商業與管理學群', '心理與教育學群', '資訊與傳播學群'],
                          '自然通識': ['生命科學學群', '環境科學學群', '物質科學學群', '數學統計學群', '工程科技學群']};
      var sol = '';
      if(course.discipline != '') {
        $.each(general_type, function(ik, iv) {
          $.each(iv, function(jk, jv) {
            if (course.discipline == jv)
              sol = ik;
          });
        });
      }
      else if (course.department == "通識教育中心" || course.department == "夜中文")
        sol = '大學國文';
      else if ( course.obligatory == '必修' &&
                (course.department == "語言中心" || course.department == "夜外文" || (course.department == "夜共同科" && ((course.title_parsed.zh_TW).substr(0,1) == '英文'))))
        sol = '大一英文';
      else if (course.department == "體育室" || course.department == "夜共同科")
        sol = '體育';
      else if (course.department == "師資培育中心")
        sol = '教程';
      else if (course.department == "教官室")
        sol = '國防';
      else if (course.department == "語言中心")
        sol = '全校外語';
      else
        sol = course.obligatory;
      return sol;
    }

    // 清除課表上的指定課程
    function clear_table_course (code) {
      $.each(course_code[code][0].time_parsed, function(ik, iv) {
        $.each(iv.time, function(jk, jv) {
          var $td = $('#class-table').find('tr[class-time=' + jv + '] td:eq(' + iv.day + ')');
          $td.text('');
          $td.css('background-color', 'transparent');
        });
      });

      totle_credits(credits -= course_code[code][0].credits_parsed);
    }

    // 以單位尋找
    function department_find(department, level, team) {
      var mul = [];
      clear_table();
      clear_course_now();
      department = department.replace(' A','');
      department = department.replace(' B','');
      $.each(course_department[department][level+team], function(ik, iv) {
        $.each(course_code[iv], function(jk, jv) {
          if (jv.obligatory_tf) {
            var isMul = multi_obligatory(jv.code);
            if (isMul) {
              mul.push(isMul);
              add_course_keep(jv);
            }
            else {
              now_course.push(jv.code);
              add_course_now(jv);
            }
          }
          else
            course_keep_repeat(jv);
        });
      });

      // mul爆炸中
      $.each(mul, function(key, val) {
         console.log(val);
      });
      // for (var i = 0; i < mul.length; i++) {
      //   var code = mul[i];
      //   console.log(code);
      //   console.log(course_code.code);
      //   add_course_keep(course_code[code]);
      //   $('#course-now .courseItem[value=' + mul[i] + ']').remove;
      //   clear_table_course(mul[i]);
      //   now_course.splice(now_course.indexOf(code), 1);
      // }
    }

    // 將內容填入課表
    function add_course2table(data) {
      var have_class = false;
      $.each(data.time_parsed, function(ik, iv) {
        $.each(iv.time, function(jk, jv) {
          var $td = $('#class-table').find('tr[class-time=' + jv + '] td:eq(' + iv.day + ')');
          if ($td.text() != "")
            have_class = true;
          if (!have_class)
            $td.text(data.title_parsed.zh_TW);
        });
        if (!have_class)
          totle_credits(credits += data.credits_parsed);
      });
    }

    // 新增課程項目至尋找課程欄位
    function add_course_search(item) {
      var type = parse_course_type(item);
      var location = '';
      for (var i = 0; i < item.location.length; i++) {
        location += item.location[i];
        if(i != item.location.length-1)
          location += ',';
      };
      var html = $.parseHTML("<div class=\"item courseItem\" value=\"" + item.code + "\"><div class=\"content\"><div class=\"header default-font text-left\"> <a target=\"_blank\" href=\"" + (onepice_url+item.url) + "\">" + item.title_parsed.zh_TW + "<\/a><div class=\"ui popup hidden text-left\"><div class=\"ui celled horizontal list\"><div class=\"item\">代碼:" + item.code + "<\/div><div class=\"item\">學分:" + item.credits_parsed + "<\/div><div class=\"item\">地點:" + location + "<\/div><\/div><\/div><\/div><div class=\"description text-right\"><div class=\"ui celled horizontal list\"><div class=\"item\">" + item.professor + "<\/div><div class=\"item\">" + type + "<\/div><div class=\"item\"><div class=\"ui dropdown item simple\"><button class=\"blue ui button add-btn\">排課<\/button><div class=\"menu\"><div class=\"item\"><button class=\"orange ui button keep-btn\">保留<\/button><\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/div>");
      $('#course-search .ui.relaxed.divided.list').append(html);
      $('.courseItem a').popup({position : 'bottom left'});
    }

    // 新增課程項目至保留課程欄位
    function add_course_keep(item) {
      var type = parse_course_type(item);
      var location = '';
      for (var i = 0; i < item.location.length; i++) {
        location += item.location[i];
        if(i != item.location.length-1)
          location += ',';
      };
      var html = $.parseHTML("<div class=\"item courseItem\" value=\"" + item.code + "\"><div class=\"content\"><div class=\"header default-font text-left\"> <a target=\"_blank\" href=\"" + (onepice_url+item.url) + "\">" + item.title_parsed.zh_TW + "<\/a><div class=\"ui popup hidden text-left\"><div class=\"ui celled horizontal list\"><div class=\"item\">代碼:" + item.code + "<\/div><div class=\"item\">學分:" + item.credits_parsed + "<\/div><div class=\"item\">地點:" + location + "<\/div><\/div><\/div><\/div><div class=\"description text-right\"><div class=\"ui celled horizontal list\"><div class=\"item\">" + item.professor + "<\/div><div class=\"item\">" + type + "<\/div><div class=\"item\"><div class=\"ui dropdown item simple\"><button class=\"blue ui button add-btn\">排課<\/button><div class=\"menu\"><div class=\"item\"><button class=\"red ui button del-btn\">刪除<\/button><\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/div>");
      $('#course-keep .ui.relaxed.divided.list').append(html);
      $('.courseItem a').popup({position : 'bottom left'});
    }

    // 新增課程項目至目前課程欄位
    function add_course_now(item) {
      var type = parse_course_type(item);
      var location = '';
      for (var i = 0; i < item.location.length; i++) {
        location += item.location[i];
        if(i != item.location.length-1)
          location += ',';
      };
      var html = $.parseHTML("<div class=\"item courseItem\" value=\"" + item.code + "\"><div class=\"content\"><div class=\"header default-font text-left\"><a target=\"_blank\" href=\"" + (onepice_url+item.url) + "\">" + item.title_parsed.zh_TW + "<\/a><div class=\"ui popup hidden text-left\"><div class=\"ui celled horizontal list\"><div class=\"item\">代碼:" + item.code + "<\/div><div class=\"item\">學分:" + item.credits_parsed + "<\/div><div class=\"item\">地點:" + location + "<\/div><\/div><\/div><\/div><div class=\"description text-right\"><div class=\"ui celled horizontal list\"><div class=\"item\">" + item.professor + "<\/div><div class=\"item\">" + type + "<\/div><div class=\"item\"><button class=\"red ui button del-btn\">刪除<\/button><\/div><\/div><\/div><\/div><\/div>");
      $('#course-now .ui.relaxed.divided.list').append(html);
      $('.courseItem a').popup({position : 'bottom left'});
      add_course2table(item);
    }

    // 改變網頁上的學分統計
    function totle_credits(num) {
      $('#totle-credits .value').text(num);
    }

    // 清除課表內所有內容
    function clear_table() {
      for (var i = 1; i <= 13; i++) {
        for (var j = 1; j <= 5; j++) {
          var $td = $('#class-table').find('tr[class-time=' + i + '] td:eq(' + j + ')');
          $td.empty();
        };
      };
      credits=0;
      totle_credits(0);
    }

    // 判斷保留課程欄位內內容不重複
    function course_keep_repeat(course) {
      if (!$('#course-keep .courseItem[value=' + course.code + ']').length > 0)
        add_course_keep(course);
    }

    function clear_course_search() {
      $('#course-search .list').empty();
    }

    function clear_course_keep() {
      $('#course-keep .list').empty();
    }

    function clear_course_now() {
      $('#course-now .list').empty();
    }

    // 再課表上標記被選取課程
    // highlight_table('課程代碼', '是否為目前課程', '是否清除標記')
    function highlight_table(code, self, clear) {
      $.each(course_code[code][0].time_parsed, function(ik, iv) {
        $.each(iv.time, function(jk, jv) {
          var $td = $('#class-table').find('tr[class-time=' + jv + '] td:eq(' + iv.day + ')');
          if(clear)
            $td.css('background-color', 'transparent');
          else {
            if ($td.text() != "") {
              if(self)
                $td.css('background-color', 'lightblue');
              else
                $td.css('background-color', 'lightpink');
            }
            else
                $td.css('background-color', 'lightgreen');
          }
        });
      });
    }

    // 判斷可選必修
    function multi_obligatory(code) {
      var this_course = course_code[code][0].title_parsed.zh_TW;
      var eng = ['a', 'b', 'c', 'd'];

      for (var i = 0; i < eng.length; i++)
        this_course = this_course.replace(eng[i], '');

      // console.log(this_course);

      for (i = 0; i < now_course.length; i++) {
        var this_now_course = course_code[now_course[i]][0].title_parsed.zh_TW;
        for (var j = 0; j < eng.length; j++)
          this_now_course = this_now_course.replace(eng[j], '');

        // console.log(this_course + ',' + this_now_course);
        if (this_course == this_now_course)
          return now_course;
      }
      return false;
    }

    // (標題選擇欄位)根據選取項目改變其他選單內容
    // select_item('部門名稱') => 選取分類欄位載入對應內容
    function degree_change(value) {
      var level = ['一年級', '二年級', '三年級', '四年級', '五年級',];
      var department_level = 1;
      var department = 2, html;

      $('#select-department .menu').empty();
      $('#select-department .text').text('選取科系');
      $('#select-level .menu').empty();
      $('#select-level .text').text('選取年級');
      $('#select-department').removeClass('disabled');
      $('#select-level').addClass('disabled');

      if (value == 0 || value==5)
        department = 5;
      else if (value == 1 || value == 3 || value == 4)
        department_level = 6;
      else if (value == 2)
        department_level = 8;

      // 添加系級至選單
      $.each(department_data[value], function(key, val) {
        html = $.parseHTML("<div class=\"item\" value=\"" + key +"\">" + val + "<\/div>");
        $('#select-department .menu').append(html);
      });
      // 添加年級至選單
      for (var i = 0; i < department; i++) {
        html = $.parseHTML("<div class=\"item\" value=\"" + (i+department_level) +"\">" + level[i] + "<\/div>");
        $('#select-level .menu').append(html);
      };
    }

    // (尋找課程欄位)根據選取項目改變其他選單內容
    // select_item('項目名稱') => 選取分類欄位載入對應內容
    function select_item(value) {
      $($('#search-detail').parents('.multiple')).removeClass('disabled');
      $('#search-time').dropdown('restore defaults');
      $('#search-time').addClass('disabled');

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
    $('.courseItem a').popup({position : 'top left'});
  });
})(jQuery);