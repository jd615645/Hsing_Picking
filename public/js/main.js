// 學士班->U, 碩班->G, 夜校->N, 其他->O
var careerType = ['U', 'G', 'N', 'O'];

// window.departmentData = {};
var departmentData = {};
// window.courseCode = [];
var courseCode = [];
// window.courseDept = [];
var courseDept = [];

var savedImg = false;

//your APIv3 client id
var clientId = '30b5b43a2e55afd';
// clipboard init
var clipboard = new Clipboard('#copyLink button');
clipboard.on('success', function(e) {
  e.clearSelection();
});

clipboard.on('error', function(e) {
  console.error('Action:', e.action);
  console.error('Trigger:', e.trigger);
});

var vm = new Vue({
  el: '#app',
  data() {
    return {
      // search
      searchKeyword: '',
      searchItem: '-1',
      searchDetail: '-1',
      detailData: [],
      searchTime: '-1',
      searchCourse: [],
      startSearch: false,
      // 顯示節數
      tableView: 8,
      viewSwitch: 0,
      // keepTab
      keepCourse: [],
      // courseTab
      credits: 0,
      pickingCourse: [],
      // tab切換
      tabView: 0,
      // 科系下拉選單
      deptData: [],
      // titleBar
      selectYear: '1052',
      selectDegree: '0',
      selectDept: '-1',
      selectLevel: '-1',
      schedule: [],
      // modal
      imgUrl: '#',
      startUpload: false,
      warningType: 1,
      // addSelf
      selfTitle: '',
      selfProfessor: '',
      selfLocation: '',
      selfCredits: '',
      selfTime: '',
    }
  },
  mounted() {
    $.when(
      $.getJSON('./json/select.json')
    ).then((data) => {
      $.each(data, (key, val) => {
        var item = val['item'],
            detail = val['detail'];
        departmentData[key] = detail;
      });
      this.deptData = departmentData[0];
    });
    this.getCareer(1052);

    while(this.schedule.push([]) < 13);
    $.each(this.schedule, (key, val) => {
      while(this.schedule[key].push([]) < 5);
    });
    $('[data-toggle="popover"]').popover({delay: {'hide': 100 }});
  },
  methods: {
    getCareer(selectYear) {
      if (_.isEmpty(courseCode[selectYear])) {
        courseCode[selectYear] = [];
        departmentData[selectYear] = [];

        var careerRequest = [];
        $.each(careerType, (key, val) => {
          careerRequest.push($.getJSON('./json/' + selectYear + '/career_' + val + '.json'));
        });
        $.when
          .apply($, careerRequest)
          .then((career_U, career_G, career_N, career_O) => {
            var careerData = [career_U, career_G, career_N, career_O];
            $.each(careerData, (ik, iv) => {
              $.each(iv[0]['course'], (jk, jv) => {
                var code = parseInt(jv.code);
                courseCode[selectYear][code] = jv;
                // console.log(courseCode[selectYear][jv.code]);
                // 以科系班級建立索引，內容為課程資訊
                if (_.isUndefined(departmentData[selectYear][jv.for_dept])) {
                  departmentData[selectYear][jv.for_dept] = {};
                }
                // 以部門建立索引，內容為課程代碼
                if (_.isUndefined(departmentData[selectYear][jv.for_dept][jv.class])) {
                  departmentData[selectYear][jv.for_dept][jv.class] = [];
                }
                departmentData[selectYear][jv.for_dept][jv.class].push(jv.code);
              })
            });

            // console.log(courseCode[selectYear]);
            // console.log(departmentData[selectYear]);
          });
      }
    },
    changeYear(num) {
      this.getCareer(num);
      this.selectDegree = 0;
      this.selectDept = -1;
      this.selectLevel = -1;
    },
    changeDegree(num) {
      this.deptData = departmentData[num];
      this.selectDept = -1;
      this.selectLevel = -1;
    },
    changeDepartment() {
      this.selectLevel = -1;
    },
    changeLevel() {
      var year = this.selectYear,
          dept = this.selectDept,
          level = this.selectLevel;

      this.clearCourse();
      // 區分AB班
      if (dept.slice(-1) == 'A' || dept.slice(-1) == 'B') {
        level = level + dept.slice(-1);
        dept = dept.replace(/ A| B/g,'');
      }

      this.keepCourse = [];
      this.pickingCourse = [];
      this.credits = 0;
      $.each(departmentData[year][dept][level], (key, code) => {
        //  確認是否必修
        if (courseCode[year][code]['obligatory_tf']) {
          if (courseCode[year][code]['title'].match('專題') == null) {
            this.addCourse(code);
          }
          else {
            this.addKeep(code);
          }
        }
        else {
          this.addKeep(code);
        }
      });
    },
    // tool menu change selected
    changeItem(item) {
      // console.log(item);
      this.detailData = departmentData[item];
      this.searchDetail = -1;
      this.searchTime = -1;
    },
    changeDetail(detail) {
      // console.log(detail);
    },
    changeTime(time) {
      // console.log(time);
    },
    warningAdd() {
      if(_.isUndefined(this.pickingCourse[0])) {
        this.changeLevel();
      }
      else {
        $('#warningAdd').modal();
      }
    },
    addCourse(code, type) {
      if(this.isFree(code)) {
        savedImg = false;
        var year = this.selectYear;

        // add credits
        this.credits += courseCode[year][code]['credits_parsed'];

        if(type == 'search') {
          var removeSpace = _.findIndex(this.searchCourse, {code: code});
          this.searchCourse.splice(removeSpace, 1);
        }
        else if(type == 'keep') {
          var removeSpace = _.findIndex(this.keepCourse, {code: code});
          this.keepCourse.splice(removeSpace, 1);
        }

        // add course to picking list
        this.pickingCourse.push(courseCode[year][code]);
        $.each(courseCode[year][code]['time_parsed'], (ik, iv) => {
          $.each(iv.time, (jk, jv) => {
            var day = iv.day,
            time = jv;
            this.schedule[time-1][day-1] = courseCode[year][code];
          });
        });
      }
      else {
        alert('衝堂');
      }
    },
    addKeep(code) {
      var year = this.selectYear;
      var removeSpace = _.findIndex(this.searchCourse, {code: code});

      // if sourse is keep remove item
      if(removeSpace != -1) {
        this.searchCourse.splice(removeSpace, 1);
      }

      this.keepCourse.push(courseCode[year][code]);
    },
    removeCourse(code, type) {
      var year = this.selectYear;

      if (type == 'search') {
        // remove list course
        var removeSpace = _.findIndex(this.searchCourse, {code: code});

        this.searchCourse.splice(removeSpace, 1);
      }
      else if (type == 'keep') {
        var removeSpace = _.findIndex(this.keepCourse, {code: code});

        this.keepCourse.splice(removeSpace, 1);
      }
      else if (type == 'now') {
        savedImg = false;

        var removeSpace = _.findIndex(this.pickingCourse, {code: code});

        this.pickingCourse.splice(removeSpace, 1);
        // remove table course
        $.each(courseCode[year][code]['time_parsed'], (ik, iv) => {
          $.each(iv.time, (jk, jv) => {
            var day = iv.day,
            time = jv;
            this.schedule[time-1][day-1] = [];
          });
        });

        // less credits
        this.credits -= courseCode[year][code]['credits_parsed'];
      }
    },
    // 課程搜尋
    searchData() {
      this.startSearch=true;
      setTimeout( ()=> {
        var deptMap = ['學士班', '碩士班', '', '', '', '進修學士班', '通識教育中心', '全校共同'];

        var year = this.selectYear;
        keyword = this.searchKeyword,
        item = this.searchItem,
        detail = this.searchDetail,
        time = this.searchTime;
        var filteredCourse = [];

        if (keyword != '') {
          if (keyword.length >1) {
            var filtered = [];
            filtered = _.filter(courseCode[year], (course) => {
              if (!(_.isUndefined(course))) {
                return course['code'] == keyword ||
                course['professor'].indexOf(keyword) > -1 ||
                course['title_parsed']['zh_TW'].indexOf(keyword) > -1;
              }
            });

            filteredCourse = filtered;
          }
          else {
            $('#warningModal').modal();
          }
        }

        // 尚未寫無keyword
        if (item != -1) {
          var src = filteredCourse;
          if (keyword == '') {
            src = courseCode[year];
          }
          filtered = _.filter(src, (course) => {
            if (!(_.isUndefined(course))) {
              var dept = course['for_dept'];
              if (dept == '全校共同' && course['department'] == '通識教育中心') {
                dept = '通識教育中心';
              }
              return dept.indexOf(deptMap[item]) > -1;
            }
          });
          filteredCourse = filtered;
        }

        if (detail != -1) {
          var filtered = [];

          if (item < 6) {
            if (detail.slice(-1) == 'A' || detail.slice(-1) == 'B') {
              level = level + detail.slice(-1);
              detail = dept.replace(/ A| B/g,'');
            }

            filtered = _.filter(filteredCourse, (course) => {
              if (!(_.isUndefined(course))) {
                return course['for_dept'].indexOf(detail) > -1;
              }
            });
          }
          else {
            $.each(filteredCourse, (key, val) => {
              var code = parseInt(val.code),
              type = this.courseType(code);
              if (detail == type) {
                filtered.push(val);
              }
            });
          }
          filteredCourse = filtered;
        }

        if (time != -1) {
          var filtered = [];
          if (time != 0) {
            $.each(filteredCourse, (key, val) => {
              if (!(_.isUndefined(val['time_parsed'][0]['day']))) {
                if(_.has(val['time_parsed'][0]['day'], time)) {
                  filtered.push(val);
                }
              }
            });
          }
          else {
            // find空堂
          }
          filteredCourse = filtered;
        }

        this.searchCourse = filteredCourse;
        this.startSearch = false;
      }, 10);
    },
    highlightSchedule(code, clear) {
      if (clear) {

      }
      else {

      }
    },
    // 判斷是否衝堂
    isFree(code) {
      var year = this.selectYear;
      var free = true;
      $.each(courseCode[year][code]['time_parsed'], (ik, iv) => {
        $.each(iv.time, (jk, jv) => {
          var day = iv.day,
              time = jv;
          if(_.isUndefined((this.schedule[time-1][day-1]).length)) {
            free = false;
          }
        });
      });
      console.log(free);
      return free;
    },
    saveSchedule() {
      $('#saveSchedule').modal();
      if(!savedImg) {
        this.startUpload = true;
        html2canvas($('#scheduleBlock'), {
          onrendered: (canvas) => {
            var canvasUrl = canvas.toDataURL('image/png');

            this.uploadImg(canvasUrl).then((response) => {
              console.log(response);
              if(response.success) {
                this.imgUrl = response.data.link;
                // $('#saveSchedule').modal();
              }
              else {
                console.error('upload error');
              }
              this.startUpload = false;
            });
          }
        });
        savedImg = true;
      }
    },
    clearSearch() {
      this.searchCourse = [];
    },
    clearKeep() {
      this.keepCourse = [];
    },
    clearCourse() {
      savedImg = false;

      this.credits = 0;
      this.pickingCourse = [];

      $.each(this.schedule, (ik, iv) => {
        $.each(iv, (jk, jv) => {
          this.schedule[ik][jk] = [];
        });
      });
    },
    clearAll() {
      this.clearSearch();
      this.clearKeep();
      this.clearCourse();
      this.searchKeyword = '';
      this.searchItem = '-1';
      this.searchDetail = '-1';
      this.detailData = [];
      this.searchTime = '-1';
      this.selectYear = '1052';
      this.selectDegree = '0';
      this.selectDept = '-1';
      this.selectLevel = '-1';
    },
    addSelf() {
      var title = this.selfTitle,
          professor = this.selfProfessor,
          location = this.selfLocation,
          credits = this.selfCredits,
          time = this.selfTime;
      var course = {
        "title_parsed": {
          "zh_TW": title
        },
        "professor": professor,
        "location": [
          location
        ],
        "credits_parsed": credits,
        "time_parsed": [
          {
            "time": [
              3,
              4
            ],
            "day": 5
          }
        ],
      }
    },
    courseType(code) {
      var year = this.selectYear;
      var course = courseCode[year][code];
      var generalType = {
        '人文通識': ['文學學群', '歷史學群', '哲學學群', '藝術學群', '文化學群'],
        '社會通識': ['公民與社會學群', '法律與政治學群', '商業與管理學群', '心理與教育學群', '資訊與傳播學群'],
        '自然通識': ['生命科學學群', '環境科學學群', '物質科學學群', '數學統計學群', '工程科技學群']
      };
      var sol = '';

      if(course['discipline'] != '') {
        $.each(generalType, (ik, iv) => {
          $.each(iv, (jk, jv) => {
            if (course['discipline'] == jv) {
              sol = ik;
            }
          });
        });
      }
      else if (course['department'] == '通識教育中心' || course['department'] == '夜中文') {
        sol = '大學國文';
      }
      else if (course.obligatory == '必修' &&
               (course['department'] == "語言中心" || course['department'] == "夜外文" || (course['department'] == "夜共同科" && ((course['title_parsed']['zh_TW']).substr(0,1) == '英文')))) {
        sol = '大一英文';
      }
      else if (course['department'] == '體育室' || course['department'] == '夜共同科') {
        sol = '體育';
      }
      else if (course['department'] == '師資培育中心') {
        sol = '教育學程';
      }
      else if (course['department'] == '教官室') {
        sol = '國防教育';
      }
      else if (course['department'] == '語言中心') {
        sol = '全校英外語';
      }
      else {
        sol = course['obligatory'];
      }
      return sol;
    },
    getOnepiceUrl(num) {
      return 'https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main_q?v_strm=' + this.selectYear + '&v_class_nbr=' + num;
    },
    uploadImg(canvasUrl) {
      return $.ajax({
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {
          Authorization: 'Client-ID ' + clientId
        },
        data: {
          image: canvasUrl.split(',').pop()
        },
        dataType: 'json'
      });
    },
  }
});
