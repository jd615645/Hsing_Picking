let vm = new Vue({
  el: '#app',
  data() {
    return {
      waitLoading: true,
      exception: [],
      departmentData: {},
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

      let url = this.restAPI + '/year/' + year + '/dept/' + dept + '/level/' + level
      $.getJSON(url, (courses) => {
        if (_.isUndefined(courses.message)) {
          _.forEach(courses, (course) => {
            // 確認是否必修
            if (course.obligatory) {
              this.addCourse(course)
            }else {
              this.addKeep(course)
            }
          })
        }else {
          console.error(courses.message)
        }
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

      if (this.selectYear !== course.term) {
        toastr.error('請注意該課程並不是這個學年度的', '新增課程錯誤')
      }
      else if (!this.isFree(course)) {
        toastr.error('課程代碼 ' + course.code + ' 衝堂', '新增課程錯誤')
      }else {
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
        this.saveToStorage()
      }
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
    searchCourseData() {
      this.startSearch = true
      let type = {
        '0': 'dept',
        '5': 'dept',
        '6': 'general',
        '7': 'common'
      }
      let year = this.selectYear
      let keyword = this.searchKeyword
      let item = !_.isUndefined(type[this.searchItem]) ? type[this.searchItem] : ''
      let detail = this.searchDetail
      let week = this.searchTime

      let urls = []
      let urlRoot = this.restAPI + '/year/' + year
      if (keyword !== '' || (item !== '' && detail !== '')) {
        if (item !== '' && detail !== '') {
          let url = urlRoot + '/' + item + '/' + detail
          switch (week) {
            case '':
            case '0':
              urls.push(url)
              break
            default:
              urls.push(url + '/week/' + week)
              break
          }
        }
        if (keyword !== '') {
          let urlAry = [
            urlRoot + '/code/' + keyword,
            urlRoot + '/title/' + keyword,
            urlRoot + '/professor/' + keyword
          ]
          switch (week) {
            case '':
            case '0':
              _.each(urlAry, (url) => {
                urls.push(url)
              })
              break
            default:
              _.each(urlAry, (url) => {
                urls.push(url + '/week/' + week)
              })
              break
          }
        }
        let ary = []
        _.each(urls, (url) => {
          ary.push($.getJSON(url))
        })
        $.when
          .apply($, ary)
          .then((...inputData) => {
            let filters = []
            if (ary.length > 1) {
              if (item === '' && detail === '') {
                _.each(inputData, (courses) => {
                  _.each(courses[0], (course) => {
                    if (_.isObject(course)) {
                      filters.push(course)
                    }
                  })
                })
              }else {
                _.each(inputData[0], (course) => {
                  if (_.isObject(course)) {
                    filters.push(course)
                  }
                })
              }
            }else {
              _.each(inputData[0], (course) => {
                if (_.isObject(course)) {
                  filters.push(course)
                }
              })
            }

            _.each(filters, (course) => {
              if (week === '0') {
                if (this.isFree(course)) {
                  this.searchCourse.push(course)
                }
              }else {
                this.searchCourse.push(course)
              }
            })
            this.startSearch = false
          })
      }else {
        this.startSearch = false
      }
    },
    highlightSchedule(course, clear) {
      let periods = [course.time_1, course.time_2]

      _.forEach(periods, (period) => {
        if (period !== '') {
          let parseTime = _.map(_.split(period, '.'), _.parseInt)
          let day = parseTime[0]
          let times = _.drop(parseTime)

          _.forEach(times, (time) => {
            let tableCourse = this.schedule[time - 1][day - 1][0]

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
      let isfree = true

      _.forEach(periods, (period) => {
        if (period !== '') {
          let parseTime = _.map(_.split(period, '.'), _.parseInt)
          let day = parseTime[0]
          let times = _.drop(parseTime)
          _.forEach(times, (time) => {
            if (!_.isEmpty(this.schedule[time - 1][day - 1][0])) {
              isfree = false
            }
          })
        }
      })
      return isfree
    },
    saveSchedule() {
      $('#saveSchedule').modal()
      if (!this.savedImg || this.pickingCourse.length != 0) {
        this.startUpload = true
        html2canvas($('#scheduleBlock'), {
          onrendered: (canvas) => {
            let canvasUrl = canvas.toDataURL('image/png')

            this.uploadImg(canvasUrl).then((response) => {
              if (response.success) {
                this.imgUrl = response.data.link
              }else {
                toastr.error('上傳圖片失敗請再試一次')
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
