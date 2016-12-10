angular.module('zhuzhuqs').controller('OnlineReportConfigController',
  ['$scope', '$stateParams', '$timeout', 'OnlineReportConfigService', 'CompanyError', 'GlobalEvent',
    function ($scope, $stateParams, $timeout, OnlineReportConfigService, CompanyError, GlobalEvent) {

      $scope.time = {
        queryLogTimeRange: {startDate: moment().add(-1, 'day').format('YYYY-MM-DD HH'), endDate: moment().format('YYYY-MM-DD HH')},
        /*queryLogMinTime: moment(),*/
        dateOptions: {
          locale: {
            fromLabel: "起始",
            toLabel: "结束",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          singleDatePicker: true,
          timePicker: true,
          showDropdowns: true,
          timePicker12Hour: false,
          timePickerIncrement: 60,
          separator: "",
          format: 'YYYY-MM-DD HH:mm'
        }
      };

      $scope.reportConfig = {
        emails: '',
        start_send_time: $scope.time.queryLogTimeRange.startDate,
        interval: 7,
        submit_name: '保存设置'
      };
      $scope.reportOrderConfig = {
          fields: ['公司', '发货方', '收货方', '运单号', '创建时间', '分配时间', '提货进场时间', '交货进场时间', '中途事件', '参考单号', '品名', '运费', '状态', '司机姓名', '司机手机', '司机车牌', '承运商', '件数', '件数单位', '重量', '重量单位', '体积', '体积单位', '实际提货时间', '实际交货时间', '计划提货时间', '计划交货时间', '提货联系人', '提货联系手机', '提货联系固话', '提货地址', '交货联系人', '交货联系手机', '交货联系固话', '交货地址', '关注人', '备注', '提货进场拍照', '提货拍照', '交货进场拍照', '交货拍照', '中途事件拍照', '实收货物', '实收数量','货缺', '货损']
      };
      $scope.currentReportType = "default";
      $scope.rightHeader = {
        config: {
          name: '在线报表配置',
          count: 0,
          columns: [
            {
              name: '在线报表配置',
              length: 4
            }
          ]
        }
      };
      $scope.submitOrderExportConfig = function(){
          var fields = [];
          jQuery('.body.order input[name=order_fields]').each(function(){
             var input = this;
              if(input.checked){
                  fields.push(this.value);
              }
          });
          if(!fields || fields.length<1){
              $scope.$emit(GlobalEvent.onShowAlert, '请选择导出项');
              return;
          }
          OnlineReportConfigService.saveOrUpdateOrderExportFields({fields:fields.join(",")}).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                  $scope.$emit(GlobalEvent.onShowAlert, data.err.message);
                  return;
              }
              else {
                  $scope.$emit(GlobalEvent.onShowAlert, "保存成功");

              }
          }, function (err) {

          });
      };
      $scope.submitConfig = function() {
        if (!$scope.reportConfig.emails) {
          $scope.$emit(GlobalEvent.onShowAlert, '请输入目标邮箱！');
          return;
        }

        console.log($scope.reportConfig.start_send_time);
        $scope.reportConfig.start_send_time = $('.start_send_time').val();
        console.log($scope.reportConfig.start_send_time);

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OnlineReportConfigService.saveOrUpdate($scope.reportConfig).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            $scope.$emit(GlobalEvent.onShowAlert, data.err.message);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, "保存成功");

          }
        }, function (err) {

        });
      };

      var init = function() {
        OnlineReportConfigService.getReportConfig().then(function(data){
          console.log(data);
          if(data && data != '') {
            $scope.reportConfig.emails = data.emails;
            $scope.reportConfig.start_send_time = data.start_send_time;
            $scope.reportConfig.interval = data.interval;
            $scope.time.queryLogTimeRange.startDate = data.start_send_time;//moment(data.start_send_time, 'YYYY-MM-DD hh:mm').locale("cn").toDate();
            $scope.time.queryLogTimeRange.endDate = $scope.time.queryLogTimeRange.startDate;
          }
        });
        OnlineReportConfigService.getOrderExportReportConfig().then(function(data){
            if(data && data.fields){
                var fields = data.fields.split(',');
                console.log(fields);
                for(var i= 0,ilen=fields.length;i<ilen;i++){
                    var field = fields[i];
                    jQuery('.body.order input[name=order_fields][value='+field+']').attr('checked', 'checked');
                }
            }
        });
      };

      init();
}]);
