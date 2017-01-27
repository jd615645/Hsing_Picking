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
      // tab-nav
      selectItem: '-1',
      selectDetail: '-1',
      detailData: [''],
      selectTime: '-1',
      // 顯示堂數
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
      if (dept.slice(-1) == 'A' || dept.slice(-1) == 'B') {
        level = level + dept.slice(-1);
        dept = dept.replace(/ A| B/g,'');
      }

      this.pickingCourse = [];
      this.credits = 0;
      $.each(departmentData[year][dept][level], (key, code) => {
        if (courseCode[year][code]['obligatory_tf']) {
          this.addSelected(code);
        }
        else {
          this.addKeep(code);
        }
      });
    },
    changeItem(item) {
      console.log(item);
      this.detailData = departmentData[item];
    },
    changeDetail(detail) {
      console.log(detail);
    },
    changeTime(time) {
      console.log(time);
    },
    addSelected(code) {
      var year = this.selectYear;

      this.credits += courseCode[year][code]['credits_parsed'];
      this.pickingCourse.push(courseCode[year][code]);
      $.each(courseCode[year][code]['time_parsed'], (ik, iv) => {
        $.each(iv.time, (jk, jv) => {
          var day = iv.day,
              time = jv;
          // console.log('day:' + day);
          // console.log(jv);
          this.schedule[time-1][day-1] = courseCode[year][code];
        });
      });
    },
    addKeep(code) {
      var year = this.selectYear;
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
    clrBtn() {

    },
    getOnepiceUrl(num) {
      return 'https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main_q?v_strm=' + this.selectYear + '&v_class_nbr=' + num;
    },
  }
});
