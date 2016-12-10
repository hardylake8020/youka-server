/**
* Created by elinaguo on 15/5/24.
*/
/**
 * Created by elinaguo on 15/5/24.
 */
/**

 html页面:
      <zz-range-date-picker></zz-range-date-picker>

 js:
      //绑定指令回调方法
      $scope.zzRangeDatePicker.bindDateRangeChangedEvent(updateInputText);
      function updateInputText(dateRange) {
        //do something
      };

      //同级作用域下调用显示
      $scope.zzRangeDatePicker.show();
      //同级作用域下调用隐藏
      $scope.zzRangeDatePicker.hide();
      //设置绝对定位的left和top值
      zzRangeDatePicker.setLocation({left:30,top:30});
      //设置指定开始和结束时间
      zzRangeDatePicker.setDateValue({startDate: new Date(),endDate: new Date()});

 */



angular.module('zhuzhuqs').directive('zzRangeDatePicker', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<input ng-show="zzRangeDatePickerConfig.isShow" type="text" date-range-picker  class="zz-range-date-picker"'
                  +'ng-model="zzRangeDatePickerConfig.queryLogTimeRange"'
                  +'min="zzRangeDatePickerConfig.queryLogMaxTime"'
                  +'options="zzRangeDatePickerConfig.dateOptions" readonly/>',
    link: function (scope, elem, attrs) {
      scope.element = elem;
      scope.zzRangeDatePickerConfig = {
        isShow: false,
        queryLogTimeRange: {startDate: new Date(), endDate: new Date()},
        queryLogMaxTime: moment().format('YY/MM/DD HH:mm'),
        dateOptions: {
          locale: {
            fromLabel: "起始时间",
            toLabel: "结束时间",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: "~",
          format: 'YY/MM/DD HH:mm',
          opens: 'left'
        },
        onDateRangeChanged: null
      };
      scope.zzRangeDatePicker = {
        isShow: function(){
          return scope.zzRangeDatePickerConfig.isShow;
        },
        isBindEvent: function(){
          return (scope.zzRangeDatePickerConfig.onDateRangeChanged !== undefined && scope.zzRangeDatePickerConfig.onDateRangeChanged !== null);
        },
        show: function(){
          scope.zzRangeDatePickerConfig.isShow = true;
        },
        hide: function(){
          scope.zzRangeDatePickerConfig.isShow = false;
        },
        bindDateRangeChangedEvent: function(eventName){
          scope.zzRangeDatePickerConfig.onDateRangeChanged = eventName;
        },
        setDateValue: function(startDate, endDate){
          scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate = startDate;
          scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate = endDate;
        },
        setLocation: function(position){
          scope.element.css({
            position: "absolute",
            top: position.top.toString() + 'px',
            left: position.left.toString() + 'px'
          })
        }
      };

      scope.$watch(function(){
        var startDate = scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate;
        var endDate = scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate;

        return startDate + endDate;
      }, function(){
        if(!scope.zzRangeDatePickerConfig.onDateRangeChanged){
          return;
        }
        console.log('queryLogTimeRange changed');
        console.log(scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate);
        console.log(scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate);

        scope.zzRangeDatePickerConfig.onDateRangeChanged(scope.zzRangeDatePickerConfig.queryLogTimeRange);
      });

    }
  }
});
