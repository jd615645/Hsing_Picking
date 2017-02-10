var vm = new Vue({
  el: '#app',
  data() {
    return {
      departmentData: {},
      // 課程代碼索引
      courseCode: {},
      courseDept: {},
      // check is really need to upload img
      savedImg: false,
      // search
      searchKeyword: '',
      searchItem: '',
      searchDetail: '',
      searchTime: '',
      searchCourse: [],
      startSearch: false,
      // 顯示節數
      tableView: 9,
      viewSwitch: 0,
      // keepTab
      keepCourse: [],
      // courseTab
      pickingCourse: [],
      // tab切換
      tabView: 0,
      // titleBar
      selectYear: '1052',
      selectDegree: '',
      selectDept: '',
      selectLevel: '',
      // timeTable
      schedule: [],
      // modal
      imgUrl: '#',
      startUpload: false,
      warningType: 1,
      studentID: '',
      // addSelf
      selfTitle: '',
      selfProfessor: '',
      selfLocation: '',
      selfCredits: '',
      selfTime: '',
      // clipboard init
      clipboard: new Clipboard('#copyLink button'),
      //imgpur APIv3 client id
      imgurAPI: '30b5b43a2e55afd',
    }
  },
  mounted() {
    $.when(
      $.getJSON('./json/select.json')
    ).then((data) => {
      $.each(data, (key, val) => {
        var item = val['item'],
            detail = val['detail'];
        this.departmentData[key] = detail;
      });
    });
    this.getCareer(1052);

    // init timetable
    this.schedule = _.map(Array(13), () => {
      return _.map(Array(5), () => [{}, 0]);
    });

    // clipboard init
    this.clipboard
      .on('success', (e) => {
        e.clearSelection();
      })
      .on('error', (e) => {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
      });
  },
  computed: {
    calcCredits() {
      var credits = 0;
      $.each(this.pickingCourse, (key, course) => {
        credits += course['credits_parsed'];
      });
      return credits;
    },
    deptDropdown() {
      this.selectDept = '';
      this.selectLevel = '';
      return _.get(this.departmentData, [this.selectDegree], []);
    },
    detailDropdown() {
      this.searchDetail = '';
      return _.get(this.departmentData, [this.searchItem], []);
    }

  },
  methods: {
    getCareer(selectYear) {
      if (_.isEmpty(this.courseCode[selectYear])) {
        // 學士班->U, 碩班->G, 夜校->N, 其他->O
        var careerType = ['U', 'G', 'N', 'O'];
        var careerRequest = [];

        $.each(careerType, (key, val) => {
          careerRequest.push($.getJSON('./json/' + selectYear + '/career_' + val + '.json'));
        });
        $.when
          .apply($, careerRequest)
          .then((...careerData) => {
            // var careerData = [career_U, career_G, career_N, career_O];
            $.each(careerData, (ik, iv) => {
              $.each(iv[0]['course'], (jk, course) => {
                _.setWith(this.courseCode, [selectYear, course.code], course, Object);

                // 依照this.courseDept[學年度][科系][班級]建立索引，內容微課程代碼
                // https://lodash.com/docs/4.17.4#setWith
                if (!_.has(this.courseDept, [selectYear, course.for_dept, course.class])) {
                  _.setWith(this.courseDept, [selectYear, course.for_dept, course.class], [], Object);
                }
                this.courseDept[selectYear][course.for_dept][course.class].push(course.code);
              })
            });

            // console.log(this.courseCode[selectYear]);
            // console.log(this.courseDept[selectYear]);
          });
      }
    },
    changeYear(num) {
      this.getCareer(num);
      this.selectDegree = 0;
      this.selectDept = '';
      this.selectLevel = '';
    },
    changeDepartment() {
      this.selectLevel = '';
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

      $.each(this.courseDept[year][dept][level], (key, code) => {
        //  確認是否必修
        if (this.courseCode[year][code]['obligatory_tf']
            && this.courseCode[year][code]['title'].match('專題') == null) {
            this.addCourse(code);
        } else {
          this.addKeep(code);
        }
      });
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
        this.savedImg = false;
        var year = this.selectYear;

        if(type == 'search') {
          var removeSpace = _.findIndex(this.searchCourse, {code: code});
          this.searchCourse.splice(removeSpace, 1);
        }
        else if(type == 'keep') {
          var removeSpace = _.findIndex(this.keepCourse, {code: code});
          this.keepCourse.splice(removeSpace, 1);
        }

        // add course to picking list
        this.pickingCourse.push(this.courseCode[year][code]);
        $.each(this.courseCode[year][code]['time_parsed'], (ik, iv) => {
          $.each(iv.time, (jk, jv) => {
            var day = iv.day,
                time = jv;
            this.schedule[time-1][day-1][0] = this.courseCode[year][code];
          });
        });
      }
      else {
        console.warn('code: ' + code + ',衝堂');
      }
    },
    addKeep(code) {
      var year = this.selectYear;
      var removeSpace = _.findIndex(this.searchCourse, {code: code});

      // if sourse is keep remove item
      if(removeSpace != -1) {
        this.searchCourse.splice(removeSpace, 1);
      }

      this.keepCourse.push(this.courseCode[year][code]);
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
        this.savedImg = false;

        var removeSpace = _.findIndex(this.pickingCourse, {code: code});

        this.pickingCourse.splice(removeSpace, 1);
        // remove table course
        $.each(this.courseCode[year][code]['time_parsed'], (ik, iv) => {
          $.each(iv.time, (jk, jv) => {
            var day = iv.day,
            time = jv;
            this.schedule[time-1][day-1][0] = {};
          });
        });
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
            filtered = _.filter(this.courseCode[year], (course) => {
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
        if (item != '') {
          var src = filteredCourse;
          if (keyword == '') {
            src = this.courseCode[year];
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

        if (detail != '') {
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
            $.each(filteredCourse, (key, course) => {
              type = this.courseType(course.code);
              if (detail == type) {
                filtered.push(course);
              }
            });
          }
          filteredCourse = filtered;
        }

        if (time != '') {
          var filtered = [];
          if (time != 0) {
            $.each(filteredCourse, (ik, course) => {
              if (!(_.isUndefined(course))) {
                if (course['time'] != '*' && course['time'] != '') {
                  try {
                    $.each(course['time_parsed'], (jk, ji) => {
                      var courseDay = ji['day'];
                      if(courseDay == time) {
                        filtered.push(course);
                      }
                    });
                  }
                  catch (e) {
                    console.error(course);
                  }
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
      var year = this.selectYear;

      try {
        var thisCourse = this.courseCode[year][code];
        if (thisCourse['time'] != '*' && thisCourse['time'] != '') {
          $.each(thisCourse['time_parsed'], (ik, iv) => {
            $.each(iv.time, (jk, jv) => {
              var day = iv.day,
                  time = jv;

              var course = this.schedule[time-1][day-1];

              if (clear) {
                console.log('clear');

                this.$set(this.schedule[time-1][day-1], '1', 0);
              }
              else {
                console.log('in');

                if (_.isEmpty(course[0])) {
                  // is free
                  this.$set(this.schedule[time-1][day-1], '1', 1);
                }
                else {
                  // not free
                  var scheduleCode = this.schedule[time-1][day-1][0]['code'];

                  if (scheduleCode == code) {
                    // self
                    this.$set(this.schedule[time-1][day-1], '1', 3);
                  }
                  else {
                    this.$set(this.schedule[time-1][day-1], '1', 2);
                  }
                }
              }

              var highlight = this.schedule[time-1][day-1][1];
              console.log('(' + (time-1) + ', ' + (day-1) + ') ' + highlight);
            });
          });
        }
      }
      catch (e) {
        console.error(thisCourse);
      }

    },
    // 判斷是否衝堂
    isFree(code) {
      var year = this.selectYear;
      var free = true;
      try {
        var thisCourse = this.courseCode[year][code];

        if (thisCourse['time'] != '*' && thisCourse['time'] != '') {
          $.each(thisCourse['time_parsed'], (ik, iv) => {
            $.each(iv.time, (jk, jv) => {
              var day = iv.day,
                  time = jv;
              if(!_.isEmpty(this.schedule[time-1][day-1][0])) {
                free = false;
              }
            });
          });
        }
      }
      catch (e) {
        console.error(thisCourse);
      }
      return free;
    },
    saveSchedule() {
      $('#saveSchedule').modal();
      if(!this.savedImg || pickingCourse.length != 0) {
        this.startUpload = true;
        html2canvas($('#scheduleBlock'), {
          onrendered: (canvas) => {
            var canvasUrl = canvas.toDataURL('image/png');

            this.uploadImg(canvasUrl).then((response) => {
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
        this.savedImg = true;
      }
    },
    clearSearch() {
      this.searchCourse = [];
    },
    clearKeep() {
      this.keepCourse = [];
    },
    clearCourse() {
      this.savedImg = false;

      this.pickingCourse = [];

      $.each(this.schedule, (ik, iv) => {
        $.each(iv, (jk, jv) => {
          this.schedule[ik][jk][0] = [];
        });
      });
    },
    clearAll() {
      this.clearSearch();
      this.clearKeep();
      this.clearCourse();

      this.searchKeyword = '';
      this.searchItem = '';
      this.searchDetail = '';
      this.searchTime = '';

      this.selectYear = '1052';
      this.selectDegree = '';
      this.selectDept = '';
      this.selectLevel = '';
    },
    // addSelf() {
    //   var title = this.selfTitle,
    //       professor = this.selfProfessor,
    //       location = this.selfLocation,
    //       credits = this.selfCredits,
    //       time = this.selfTime;
    //   var course = {
    //     'title_parsed': {
    //       'zh_TW': title
    //     },
    //     'professor': professor,
    //     'location': [
    //       location
    //     ],
    //     'credits_parsed': credits,
    //     'time_parsed': [
    //       {
    //         'time': [
    //           3,
    //           4
    //         ],
    //         'day': 5
    //       }
    //     ],
    //   }
    // },
    courseType(code) {
      var year = this.selectYear;
      var course = this.courseCode[year][code];
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
          Authorization: 'Client-ID ' + imgurAPI
        },
        data: {
          image: canvasUrl.split(',').pop()
        },
        dataType: 'json'
      });
    },
  }
});
