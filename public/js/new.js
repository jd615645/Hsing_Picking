// 學士班->U, 碩班->G, 夜校->N, 其他->O
var careerType = ['U', 'G', 'N', 'O'];

var departmentData = {};
// window.courseCode = [];
var courseCode = [];
// window.courseDept = [];
var courseDept = [];

// window.schedule = [];
var schedule = [];

while(schedule.push([]) < 13);
$.each(schedule, (key, val) => {
  while(schedule[key].push([]) < 5);
});

var vm = new Vue({
  el: '#app',
  data() {
    return {
      notifyKeep: 0,
      notifyCourse: 0,
      credits: 0,
      deptData: [''],
      tabView: 0,
      selectYear: '1052',
      selectDegree: '0',
      selectDepartment: '-1',
      selectlevel: '-1',
      schedule: schedule,
      selectItem: '-1',
      selectDetail: '-1',
      detailData: [''],
      selectTime: '-1',
    }
  },
  mounted() {
    var my = this;
    $.when(
      $.getJSON('./json/select.json')
    ).then((data) => {
      $.each(data, (key, val) => {
        var item = val['item'],
            detail = val['detail'];
        departmentData[key] = detail;
      });
      my.deptData = departmentData[0];
    });
    this.getCareer(1052);
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
    changeYear(year) {
      console.log(year);
      this.getCareer(year);
      this.selectDegree = 0;
      this.selectDepartment = -1;
      this.selectlevel = -1;
    },
    changeDegree(degree) {
      console.log(degree);
      this.deptData = departmentData[degree];
      this.selectDepartment = -1;
      this.selectlevel = -1;
    },
    changeDepartment(department) {
      console.log(department);
      this.selectlevel = -1;
    },
    changeLevel(level) {
      console.log(level);
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

    }
  }
});
