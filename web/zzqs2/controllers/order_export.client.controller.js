angular.module('zhuzhuqs').controller('OrderExportController',
  ['$scope', '$rootScope', 'OrderService', 'GlobalEvent', 'CompanyService', 'OnlineReportConfigService', 'Auth',
    function ($scope, $rootScope, OrderService, GlobalEvent, CompanyService, OnlineReportConfigService, Auth) {
      $scope.exportInfo = {
        isShow: false,
        isOnTime: '',
        damaged: '',
        order_transport_type: '',
        timeOptions: [
          {val: 1, label: '一天以内'},
          {val: 3, label: '三天以内'},
          {val: 7, label: '一周以内'},
          {val: 30, label: '一月以内'}
        ],
        companyPartnerOptions: [],
        customerOptions: [],
        time: 1,
        partner: '',
        customer: '',
        showTimePanel: false,
        fields: ['发货方', '收货方', '运单号', '创建时间', '分配时间',
          '提货进场时间', '交货进场时间', '中途事件', '参考单号', '品名', '运费',
          '状态', '司机姓名', '司机手机', '司机车牌', '承运商', '件数',
          '件数单位', '重量', '重量单位', '体积', '体积单位', '实际提货时间',
          '实际交货时间', '计划提货时间', '计划交货时间', '提货联系人', '提货联系手机', '提货联系固话',
          '提货地址', '交货联系人', '交货联系手机', '交货联系固话', '交货地址', '关注人', '备注',
          '提货进场拍照', '提货拍照', '交货进场拍照', '交货拍照', '中途事件拍照', '实收货物',
          '实收数量','货缺', '货损', '类型', '问题运单推送', '创建运单通知',
          '发货通知', '到货通知', '送达通知']
      };
      $scope.time = {
        queryLogTimeRange: {startDate: new Date(moment().add(-1, 'day')), endDate: new Date(moment())},
        queryLogMaxTime: moment(),
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
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: "~",
          format: 'YYYY-MM-DD HH:mm:ss'
        }
      };


      $rootScope.$on(GlobalEvent.onShowExportDialog, function (event, bo) {
        OnlineReportConfigService.getOrderExportReportConfig().then(function(data){
          var fields;
          if(data && data.fields){
            fields = data.fields.split(',');
          }
          if(!fields || fields.length == 0){
            fields = $scope.exportInfo.fields;
          }
          for(var i= 0,ilen=fields.length;i<ilen;i++){
            var field = fields[i];
            jQuery('.order-columns-config input[name=order_fields][value='+field+']').attr('checked', 'checked');
          }
        });
        $scope.showDialog();
      });

      $scope.selectOnTime = function (val) {
        $scope.exportInfo.isOnTime = val;
      };

      $scope.selectDamage = function (val) {
        $scope.exportInfo.damaged = val;
      };

      $scope.showDialog = function () {
        $scope.exportInfo.isShow = true;

        $scope.getPartner();
        $scope.getCustomer();
      };

      $scope.hideDialog = function () {
        $scope.exportInfo.isShow = false;
      };

      $scope.getPartner = function () {
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.exportInfo.companyPartnerOptions = data.partnerCompany;
          console.log(data);
        }, function (err) {
          console.log(err);
        })
      };

      $scope.getCustomer = function () {
        CompanyService.getCompanyCustomers().then(function (data) {
          $scope.exportInfo.customerOptions = data;
          console.log(data);
        }, function (err) {
          console.log(err);
        })
      };

      $scope.exportOrders = function () {
        var fields = jQuery('.order-columns-config input[name=order_fields]:checkbox:checked').map(function(){
          return $(this).val();
        }).get();
        if(!fields || fields.length<1){
          $scope.$emit(GlobalEvent.onShowAlert, '请选择导出项');
          return;
        }
        var params = {
          startDate: moment($scope.time.queryLogTimeRange.startDate).toISOString(),
          endDate: moment($scope.time.queryLogTimeRange.endDate).toISOString(),
          damaged: $scope.exportInfo.damaged,
          isOnTime: $scope.exportInfo.isOnTime,
          partner_id: $scope.exportInfo.partner,
          customer_name: $scope.exportInfo.customer,
          order_transport_type: $scope.exportInfo.order_transport_type,
          fields : fields.join(',')
        };

        $scope.hideDialog();
        var param = "";
        for (var p in params) {
          var paramData = params[p];
          if (paramData instanceof Array) {
            for (var j in paramData) {
              param += p + "=" + paramData[j] + "&";
            }
          } else {
            param += p + "=" + params[p] + "&";
          }
        }
        var url = '/order/export?' + param + "access_token=" + Auth.getToken();
        window.open(url);
        return;
        $scope.hideDialog();
      };
    }]);