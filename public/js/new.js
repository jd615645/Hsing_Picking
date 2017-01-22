$(document).ready(function() {
  window.departmentData = {};

  // var selectedDept;
  window.selectedDept;

  // 引入選單資料
  var getSelect = $.getJSON('./json/select.json',function(data) {
    $.each(data, function(key, val) {
      var item = val['searchItem'],
      detail = val['searchDetail'];
      departmentData[key] = detail;
    });
    selectedDept = departmentData[0];
  });

  getSelect.then(function(){
    var vm = new Vue({
      el: '#app',
      data() {
        return {
          notifyKeep: 0,
          notifyCourse: 0,
          credits: 0,
          selectedDept: selectedDept,
          tabView: 0
        }
      }
    });
  })
});
