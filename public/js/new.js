// 學士班->U, 碩班->G, 夜校->N, 其他->O
var careerType = ['U', 'G', 'N', 'O'];

var departmentData = {};
// window.courseCode = [];
var courseCode = [];
// window.courseDept = [];
var courseDept = [];


var vm = new Vue({
  el: '#app',
  data() {
    return {
      // search
      searchKeyword: '',
      searchItem: '-1',
      searchDetail: '-1',
      detailData: [''],
      searchTime: '-1',
      searchCourse: [],
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
      deptData: [''],
      // titleBar
      selectYear: '1052',
      selectDegree: '0',
      selectDept: '-1',
      selectLevel: '-1',
      schedule: [],
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
                courseCode[selectYear][jv.code] = jv;
                // 以科系班級建立索引，內容為課程代碼
                if (_.isUndefined(departmentData[selectYear][jv.for_dept])) {
                  departmentData[selectYear][jv.for_dept] = {};
                }
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
    changeDepartment(num) {
      this.selectLevel = -1;
    },
    changeLevel(num) {
      var year = this.selectYear,
          dept = this.selectDept,
          level = this.selectLevel;

      this.clearSelected();
      // 區分AB班
      if (dept.slice(-1) == 'A' || dept.slice(-1) == 'B') {
        level = level + dept.slice(-1);
        dept = dept.replace(/ A| B/g,'');
      }

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
      console.log(item);
      this.detailData = departmentData[item];
      this.searchDetail = -1;
      this.searchTime = -1;
    },
    changeDetail(detail) {
      console.log(detail);
    },
    changeTime(time) {
      console.log(time);
    },
    addCourse(code) {
      if(this.isFree(code)) {
        var year = this.selectYear;
        var removeSpace = _.findIndex(this.keepCourse, {code: code});

        // add credits
        this.credits += courseCode[year][code]['credits_parsed'];

        // if sourse is keep remove item
        if(removeSpace != -1) {
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
    clearSelected() {
      this.credits = 0;
      this.pickingCourse = [];

      $.each(this.schedule, (ik, iv) => {
        $.each(iv, (jk, jv) => {
          this.schedule[ik][jk] = [];
        });
      });
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
      var year = this.selectYear;
          keyword = this.searchKeyword,
          item = this.searchItem,
          detail = this.searchDetail,
          time = this.searchTime;
      var filteredCourse = [];
      if (keyword != '') {
        if (keyword.length >1) {
          filteredCourse = _.filter(courseCode[year], (course) => {
            if (!(_.isUndefined(course))) {
              return course['code'] == keyword ||
                     course['professor'].indexOf(keyword) > -1 ||
                     course['title_parsed']['zh_TW'].indexOf(keyword) > -1;
            }
          });
        }
        else {
          alert('關鍵字請大於2個字');
        }
        console.log(filteredCourse);
      }
      this.searchCourse = filteredCourse;
      // console.log('year: ' + year);
      // console.log('searchKeyword: ' + searchKeyword);
      // console.log('searchItem: ' + searchItem);
      // console.log('searchDetail: ' + searchDetail);
      // console.log('searchTime: ' + searchTime);
    },
    // 判斷是否衝堂
    isFree(code) {
      var year = this.selectYear;
      var free = true;
      $.each(courseCode[year][code]['time_parsed'], (ik, iv) => {
        $.each(iv.time, (jk, jv) => {
          var day = iv.day,
              time = jv;
          if(!(this.schedule[time-1][day-1])) {
            free = false;
          }
        });
      });
      return free;
    },
    clearAll() {

    },
    clearSearch() {
      this.searchCourse = [];
    },
    clearKeep() {
      this.keepCourse = [];
    },
    clearCourse() {
      this.clearSelected();
    },
    getOnepiceUrl(num) {
      return 'https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main_q?v_strm=' + this.selectYear + '&v_class_nbr=' + num;
    },
  }
});
