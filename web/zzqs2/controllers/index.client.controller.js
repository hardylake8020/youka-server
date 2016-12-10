angular.module('zhuzhuqs').controller('IndexController',
  ['$rootScope', '$scope', '$state', 'GlobalEvent', 'InformService', 'InformEnum', 'HomeService', 'Auth', 'CompanyService', 'SalesmanService',
    function ($rootScope, $scope, $state, GlobalEvent, InformService, InformEnum, HomeService, Auth, CompanyService, SalesmanService) {
      $scope.pageShow = {
        dialogConfig: {
          title: '消息',
          content: '<div class="dialog-img"><img src="images/global/tips.png"/></div><div class="dialog-bottom">给力开发中...敬请期待!</div>',
          okLabel: "确定",
          show: false
        }
      };
      $rootScope.$on(GlobalEvent.onShowDevelopmentTips, function (event, title) {
        $scope.pageShow.dialogConfig.title = title;
        $scope.pageShow.dialogConfig.show = true;
      });
      $scope.$on(GlobalEvent.onUpdatePanelLabel, function (event, state) {
        HomeService.updatePanelItemsFromLocal(state);
      });

      $scope.$on(GlobalEvent.onUserReseted, function (event, state) {
        Auth.userUpdatedCallback();
        HomeService.updatePanelItemsFromServer();
      });
      $scope.clickBody = function () {
        $rootScope.$broadcast(GlobalEvent.onBodyClick);
      };
      $scope.informConfig = {
        timeShow: {
          today: new Date(),
          getDateFormat: function (time) {
            time = new Date(time);
            if (time.getYear() !== this.today.getYear()) {
              return 'yyyy-MM-dd';
            }
            if (time.getMonth() !== this.today.getMonth()) {
              return 'MM-dd';
            }
            if (time.getDate() !== this.today.getDate()) {
              return 'MM-dd';
            }
            return 'HH:mm';
          }
        },
        pushInfo: [],
        pushInfoWindow: {
          text: '',
          isShow: false
        },
        showPushWindow: function () {
          if (this.pushInfo.length > 0) {
            var lastPush = this.pushInfo[this.pushInfo.length - 1];
            this.pushInfoWindow.text = lastPush.title + lastPush.text;
            this.pushInfoWindow.isShow = true;
          }
        },
        hidePushWindow: function (event) {
          this.pushInfoWindow.text = '';
          this.pushInfoWindow.isShow = false;

          if (event) {
            stopBubble(event);
          }
        },
        goAbnormalPage: function () {
          if (this.pushInfo.length > 0) {
            InformService.clearAbnormalInforms();
          }
          this.clearPushInfo();
          $state.go('abnormal_orders', {}, {reload: true});
        },
        clearPushInfo: function () {
          this.pushInfo = [];
          this.hidePushWindow();
        },
        addPushInfo: function (info) {
          this.pushInfo.push(info);
          this.showPushWindow();
        },
        initPushInfo: function (infoArray) {
          this.pushInfo = infoArray;
        }
      };

      InformService.addCallback(InformEnum.onSingleAbnormalOrder, function (data) {
        HomeService.updatePanelItemsFromServer();
        $scope.$apply(function () {
          $scope.informConfig.addPushInfo(data);
        });
      });
      InformService.addCallback(InformEnum.onBatchAbnormalOrder, function (data) {
        if (!data || data.length === 0) {
          return;
        }
        var informArray = data.map(function (item) {
          return item.context;
        });
        $scope.$apply(function () {
          $scope.informConfig.initPushInfo(informArray);
        })
      });
      //InformService.connect();

      $scope.initNotificationList = [];

     
    }]);