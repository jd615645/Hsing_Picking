let vm = new Vue({
  el: '#app',
  data() {
    return {
      waitLoading: true,
      exception: [],
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
      selectYear: '1061',
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
      // imgpur APIv3 client id
      imgurAPI: '30b5b43a2e55afd',
      // restAPI: 'https://api.hsingpicking.com.tw'
      restAPI: 'http://127.0.0.1:3001'
    }
  },
  mounted() {
    $.when(
      $.getJSON('./json/select.json'),
      $.getJSON('./json/exception.json')
    ).then((selectData, exception) => {
      $.each(selectData[0], (key, val) => {
        let item = val['item'],
          detail = val['detail']
        this.departmentData[key] = detail
      })
      $.each(exception[0][0]['exception'], (key, val) => {
        this.exception.push(val)
      })
      this.waitLoading = false
    })

    // init timetable
    this.schedule = _.map(Array(13), () => {
      return _.map(Array(5), () => [{}, 0])
    })

    // clipboard init
    this.clipboard
      .on('success', (e) => {
        e.clearSelection()
      })
      .on('error', (e) => {
        console.error('Action:', e.action)
        console.error('Trigger:', e.trigger)
      })
    this.loadStorage()
  },
  computed: {
    calcCredits() {
      let credits = 0
      _.each(this.pickingCourse, (course) => {
        credits += course['credits']
      })
      return credits
    },
    deptDropdown() {
      this.selectDept = ''
      this.selectLevel = ''
      return _.get(this.departmentData, [this.selectDegree], [])
    },
    detailDropdown() {
      this.searchDetail = ''
      return _.get(this.departmentData, [this.searchItem], [])
    }
  },
  filters: {
    titleShort: (title) => {
      if (!title) return ''
      if (title.length > 11) {
        title = title.substr(0, 13) + '…'
      }
      return title
    }
  },
  methods: {
    changeYear(num) {
      this.selectDegree = 0
      this.selectDept = ''
      this.selectLevel = ''
    },
    changeDepartment() {
      this.selectLevel = ''
    },
    changeLevel() {
      let year = this.selectYear
      let dept = this.selectDept
      let level = this.selectLevel

      this.clearCourse()

      // 區分AB班
      if (dept.slice(-1) == 'A' || dept.slice(-1) == 'B') {
        level = level + dept.slice(-1)
        dept = dept.replace(/ A| B/g, '')
      }

      this.keepCourse = []
      this.pickingCourse = []
      this.credits = 0

      $.getJSON(this.restAPI + '/year/' + year + '/dept/' + dept + '/level/' + level, (courses) => {
        _.forEach(courses, (course) => {
          let code = course.code
          // 確認是否必修
          if (course.obligatory) {
            this.addCourse(course)
          }else {
            this.addKeep(course)
          }
        })
      })
    },
    warningAdd() {
      if (_.isUndefined(this.pickingCourse[0])) {
        this.changeLevel()
      }else {
        $('#warningAdd').modal()
      }
    },
    addCourse(course, type) {
      let periods = [course.time_1, course.time_2]

      if (this.isFree(course)) {
        if (type === 'search') {
          let removeSpace = _.findIndex(this.searchCourse, {code: course.code})
          this.searchCourse.splice(removeSpace, 1)
        }
        else if (type === 'keep') {
          let removeSpace = _.findIndex(this.keepCourse, {code: course.code})
          this.keepCourse.splice(removeSpace, 1)
        }

        this.pickingCourse.push(course)
        _.forEach(periods, (period) => {
          if (period !== '') {
            let parseTime = _.map(_.split(period, '.'), _.parseInt)
            let day = parseTime[0]
            let times = _.drop(parseTime)

            _.forEach(times, (time) => {
              this.schedule[time - 1][day - 1][0] = course
            })
          }
        })
        this.highlightSchedule(course, true)
      }else {
        console.warn('code: ' + course.code + ',衝堂')
      }
      this.saveToStorage()
    },
    addKeep(course) {
      let periods = [course.time_1, course.time_2]
      let removeSpace = _.findIndex(this.searchCourse, {code: course.code})

      // if sourse is keep remove item
      if (removeSpace != -1) {
        this.searchCourse.splice(removeSpace, 1)
      }

      this.keepCourse.push(course)
      this.highlightSchedule(course, true)
      this.saveToStorage()
    },
    removeCourse(course, type) {
      if (type === 'search') {
        // remove list course
        let removeSpace = _.findIndex(this.searchCourse, {code: course.code})
        this.searchCourse.splice(removeSpace, 1)
      }
      else if (type === 'keep') {
        let removeSpace = _.findIndex(this.keepCourse, {code: course.code})
        this.keepCourse.splice(removeSpace, 1)
      }
      else if (type === 'now') {
        this.savedImg = false

        let removeSpace = _.findIndex(this.pickingCourse, {code: course.code})
        this.pickingCourse.splice(removeSpace, 1)

        let periods = [course.time_1, course.time_2]
        // remove table course
        _.forEach(periods, (period) => {
          if (period !== '') {
            let parseTime = _.map(_.split(period, '.'), _.parseInt)
            let day = parseTime[0]
            let times = _.drop(parseTime)

            _.forEach(times, (time) => {
              this.schedule[time - 1][day - 1][0] = {}
            })
          }
        })
      }
      this.highlightSchedule(course, true)
    },
    // 課程搜尋
    searchData() {
      let year = this.selectYear
      let keyword = this.searchKeyword
      let item = this.searchItem
      let detail = this.searchDetail

      console.log('year: ' + year)
      console.log('keyword: ' + keyword)
      console.log('item: ' + item)
      console.log('detail: ' + detail)
    },
    // searchData() {
    //   this.startSearch = true
    //   setTimeout(() => {
    //     let deptMap = ['學士班', '碩士班', '', '', '', '進修學士班', '通識教育中心', '全校共同']

    //     let year = this.selectYear
    //     let keyword = this.searchKeyword
    //     let item = this.searchItem
    //     let detail = this.searchDetail
    //     time = this.searchTime
    //     let filteredCourse = []

    //     if (keyword != '') {
    //       if (keyword.length > 1) {
    //         let filtered = []
    //         filtered = _.filter(this.courseCode[year], (course) => {
    //           if (!(_.isUndefined(course))) {
    //             return course['code'] == keyword ||
    //               course['professor'].indexOf(keyword) > -1 ||
    //               course['title_parsed']['zh_TW'].indexOf(keyword) > -1
    //           }
    //         })

    //         filteredCourse = filtered
    //       }else {
    //         $('#warningModal').modal()
    //       }
    //     }

    //     // 尚未寫無keyword
    //     if (item != '') {
    //       let src = filteredCourse
    //       if (keyword == '') {
    //         src = this.courseCode[year]
    //       }
    //       filtered = _.filter(src, (course) => {
    //         if (!(_.isUndefined(course))) {
    //           let dept = course['for_dept']
    //           if (dept == '全校共同' && course['department'] == '通識教育中心') {
    //             dept = '通識教育中心'
    //           }
    //           return dept.indexOf(deptMap[item]) > -1
    //         }
    //       })
    //       filteredCourse = filtered
    //     }

    //     if (detail != '') {
    //       let filtered = []

    //       if (item < 6) {
    //         if (detail.slice(-1) == 'A' || detail.slice(-1) == 'B') {
    //           level = level + detail.slice(-1)
    //           detail = dept.replace(/ A| B/g, '')
    //         }

    //         filtered = _.filter(filteredCourse, (course) => {
    //           if (!(_.isUndefined(course))) {
    //             return course['for_dept'].indexOf(detail) > -1
    //           }
    //         })
    //       }else {
    //         $.each(filteredCourse, (key, course) => {
    //           type = this.courseType(course.code)
    //           if (detail == type) {
    //             filtered.push(course)
    //           }
    //         })
    //       }
    //       filteredCourse = filtered
    //     }

    //     if (time != '') {
    //       let filtered = []
    //       if (time != 0) {
    //         $.each(filteredCourse, (ik, course) => {
    //           if (!(_.isUndefined(course))) {
    //             if (course['time'] != '*' && course['time'] != '') {
    //               try {
    //                 $.each(course['time_parsed'], (jk, ji) => {
    //                   let courseDay = ji['day']
    //                   if (courseDay == time) {
    //                     filtered.push(course)
    //                   }
    //                 })
    //               } catch (e) {
    //                 console.error(course)
    //               }
    //             }
    //           }
    //         })
    //       }else {
    //         // find空堂
    //         $.each(filteredCourse, (ik, course) => {
    //           if (this.isFree(course)) {
    //             filtered.push(course)
    //           }
    //         })
    //       }
    //       filteredCourse = filtered
    //     }

    //     this.searchCourse = filteredCourse
    //     this.startSearch = false
    //   }, 10)
    //   this.saveToStorage()
    // },
    highlightSchedule(course, clear) {
      let periods = [course.time_1, course.time_2]

      _.forEach(periods, (period) => {
        if (period !== '') {
          let parseTime = _.map(_.split(period, '.'), _.parseInt)
          let day = parseTime[0]
          let times = _.drop(parseTime)

          _.forEach(times, (time) => {
            let tableCourse = this.schedule[time - 1][day - 1]

            if (clear) {
              this.$set(this.schedule[time - 1][day - 1], '1', 0)
            } else {
              if (_.isEmpty(tableCourse)) {
                // is free
                this.$set(this.schedule[time - 1][day - 1], '1', 1)
              } else {
                // not free
                let scheduleCode = this.schedule[time - 1][day - 1][0]['code']

                if (scheduleCode === course.code) {
                  // self
                  this.$set(this.schedule[time - 1][day - 1], '1', 3)
                } else {
                  this.$set(this.schedule[time - 1][day - 1], '1', 2)
                }
              }
            }
          })
        }
      })
    },
    // 判斷是否衝堂
    isFree(course) {
      let periods = [course.time_1, course.time_2]

      _.forEach(periods, (period) => {
        if (period !== '') {
          let parseTime = _.map(_.split(period, '.'), _.parseInt)
          let day = parseTime[0]
          let times = _.drop(parseTime)

          _.forEach(times, (time) => {
            if (!_.isEmpty(this.schedule[time - 1][day - 1][0])) {
              return false
            }
          })
        }
      })
      return true
    },
    saveSchedule() {
      $('#saveSchedule').modal()
      if (!this.savedImg || pickingCourse.length != 0) {
        this.startUpload = true
        html2canvas($('#scheduleBlock'), {
          onrendered: (canvas) => {
            let canvasUrl = canvas.toDataURL('image/png')

            this.uploadImg(canvasUrl).then((response) => {
              if (response.success) {
                this.imgUrl = response.data.link
              // $('#saveSchedule').modal()
              }else {
                console.error('upload error')
              }
              this.startUpload = false
            })
          }
        })
        this.savedImg = true
      }
    },
    clearSearch() {
      this.searchCourse = []
      this.saveToStorage()
    },
    clearKeep() {
      this.keepCourse = []
      this.saveToStorage()
    },
    clearCourse() {
      this.savedImg = false

      this.pickingCourse = []

      $.each(this.schedule, (ik, iv) => {
        $.each(iv, (jk, jv) => {
          this.schedule[ik][jk][0] = []
        })
      })
      this.saveToStorage()
    },
    clearAll() {
      this.clearSearch()
      this.clearKeep()
      this.clearCourse()

      this.searchKeyword = ''
      this.searchItem = ''
      this.searchDetail = ''
      this.searchTime = ''

      this.selectYear = '1061'
      this.selectDegree = ''
      this.selectDept = ''
      this.selectLevel = ''

      this.saveToStorage()
    },
    outputCourse() {
      $('#outputCourse').modal()
    },
    checkClear() {
      $('#checkClear').modal()
    },
    courseType(code) {
      let year = this.selectYear
      let course = this.courseCode[year][code]
      let generalType = {
        '人文通識': ['文學學群', '歷史學群', '哲學學群', '藝術學群', '文化學群'],
        '社會通識': ['公民與社會學群', '法律與政治學群', '商業與管理學群', '心理與教育學群', '資訊與傳播學群'],
        '自然通識': ['生命科學學群', '環境科學學群', '物質科學學群', '數學統計學群', '工程科技學群']
      }
      let sol = ''

      if (course['discipline'] != '') {
        $.each(generalType, (ik, iv) => {
          $.each(iv, (jk, jv) => {
            if (course['discipline'] == jv) {
              sol = ik
            }
          })
        })
      }
      else if (course['department'] == '通識教育中心' || course['department'] == '夜中文') {
        sol = '大學國文'
      }
      else if (course.obligatory == '必修' &&
        (course['department'] == '語言中心' || course['department'] == '夜外文' || (course['department'] == '夜共同科' && ((course['title_parsed']['zh_TW']).substr(0, 1) == '英文')))) {
        sol = '大一英文'
      }
      else if (course['department'] == '體育室' || course['department'] == '夜共同科') {
        sol = '體育'
      }
      else if (course['department'] == '師資培育中心') {
        sol = '教育學程'
      }
      else if (course['department'] == '教官室') {
        sol = '國防教育'
      }
      else if (course['department'] == '語言中心') {
        sol = '全校英外語'
      }else {
        sol = course['obligatory']
      }
      return sol
    },
    getOnepiceUrl(num) {
      return 'https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main_q?v_strm=' + this.selectYear + '&v_class_nbr=' + num
    },
    uploadImg(canvasUrl) {
      return $.ajax({
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {
          Authorization: 'Client-ID ' + this.imgurAPI
        },
        data: {
          image: canvasUrl.split(',').pop()
        },
        dataType: 'json'
      })
    },
    saveToStorage() {
      window.localStorage['searchCourse'] = JSON.stringify(this.searchCourse)
      window.localStorage['keepCourse'] = JSON.stringify(this.keepCourse)
      window.localStorage['pickingCourse'] = JSON.stringify(this.pickingCourse)
      window.localStorage['schedule'] = JSON.stringify(this.schedule)
    },
    loadStorage() {
      if (!_.isUndefined(window.localStorage['searchCourse'])) {
        this.searchCourse = JSON.parse(window.localStorage['searchCourse'])
      }
      if (!_.isUndefined(window.localStorage['keepCourse'])) {
        this.keepCourse = JSON.parse(window.localStorage['keepCourse'])
      }
      if (!_.isUndefined(window.localStorage['pickingCourse'])) {
        this.pickingCourse = JSON.parse(window.localStorage['pickingCourse'])
      }
      if (!_.isUndefined(window.localStorage['schedule'])) {
        this.schedule = JSON.parse(window.localStorage['schedule'])
      }
    }
  }
})
