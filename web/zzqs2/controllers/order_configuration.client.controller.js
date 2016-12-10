angular.module('zhuzhuqs').controller('OrderConfigurationController',
  ['$scope', '$stateParams', '$timeout', 'config', 'CompanyService', 'BMapService', 'ExcelReaderService', 'CompanyError', 'GlobalEvent',
    function ($scope, $stateParams, $timeout, config, CompanyService, BMapService, ExcelReaderService, CompanyError, GlobalEvent) {
      var _configuration;

      $scope.partnersInfo = {
        address: [],
        curSelect: 'orderConfig'
      };
      $scope.partnersInfo.showDetailPanel = function (panel) {
        panel = panel || 'orderConfig';
        if ($scope.partnersInfo.curSelect !== panel) {
          $scope.partnersInfo.curSelect = panel;
          $scope.rightHeader.update(panel);
        }
      };

      $scope.rightHeader = {
        all: [
          {
            name: '推送配置',
            en: 'pushConfig'
          },
          {
            name: '运单配置',
            en: 'orderConfig'
          }
        ],
        current: {},
        update: function (type) {
          var that = this;
          for (var i = 0; i < this.all.length; i++) {
            if (this.all[i].en === type) {
              this.current = this.all[i];
              break;
            }
          }
        }
      };
      $scope.rightHeader.update($scope.partnersInfo.curSelect);

      var orderConfig = {
        options: [
          {
            title: '提货操作',
            entrance: {
              isOpen: false,
              title: '强制进场',
              description: '司机在提货前必须执行进场操作'
            },
            entrance_photo: {
              isOpen: false,
              title: '强制进场拍照',
              description: '司机在进场时必须拍摄照片，您可以自定义进场拍照的步骤',
              isPlate: false
            },
            entrance_photo_array: [],
            take_photo: {
              isOpen: false,
              title: '强制提货拍照',
              description: '司机在提货时必须拍摄照片，您可以自定义提货拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            take_photo_array: [],
            confirm_detail: {
              isOpen: false,
              title: '强制货物明细确认',
              description: '司机在提货时，必须进行货物明细确认'
            }
          },
          {
            title: '交货操作',
            entrance: {
              isOpen: false,
              title: '强制进场',
              description: '司机在交货前必须执行进场操作'
            },
            entrance_photo: {
              isOpen: false,
              title: '强制进场拍照',
              description: '司机在进场时必须拍摄照片，您可以自定义进场拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            entrance_photo_array: [],
            take_photo: {
              isOpen: false,
              title: '强制交货拍照',
              description: '司机在交货时必须拍摄照片，您可以自定义交货拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            take_photo_array: [],
            confirm_detail: {
              isOpen: false,
              title: '强制货物明细确认',
              description: '司机在交货时，必须进行货物明细确认并上报'
            }
          },
          {
            title: '推送操作',
            abnormal_push: {
              isOpen: false
            },
            create_push: {
              isOpen: false
            },
            delivery_sign_push: {
              isOpen: false
            },
            pickup_push: {
              isOpen: false
            },
            delivery_push: {
              isOpen: false
            },
            pickup_deferred_duration_switch : false,
            delivery_early_duration_switch : false,
            pickup_deferred_duration: 0, //提货滞留报警时长
            delivery_early_duration: 0,  //交货提前通知时长
            load: function (option) {
              if (!option) {
                return;
              }
              this.abnormal_push.isOpen = (option.abnormal_push === false ? false : true);

              this.create_push.isOpen = (option.create_push === true ? true : false);
              this.delivery_sign_push.isOpen = (option.delivery_sign_push === true ? true : false);

              this.pickup_push.isOpen = option.pickup_push === true ? true : false;
              this.delivery_push.isOpen = option.delivery_push ? true : false;
              this.pickup_deferred_duration_switch = option.pickup_deferred_duration ? true : false;
              this.delivery_early_duration_switch = option.delivery_early_duration ? true : false;
              this.pickup_deferred_duration = (option.pickup_deferred_duration || 12).toString();
              this.delivery_early_duration = (option.delivery_early_duration || 12).toString();
            },
            check: function () {
              var result = {
                success: true,
                message: ''
              };
              // if (!this.pickup_deferred_duration || !parseInt(this.pickup_deferred_duration)) {
              //   result.success = false;
              //   result.message = '请设置提货滞留报警时间';
              //   return result;
              // }
              //
              // if (!this.delivery_early_duration || !parseInt(this.delivery_early_duration)) {
              //   result.success = false;
              //   result.message = '请设置到货推送提前时间';
              //   return result;
              // }
              return result;
            },
            getData: function () {
              var config = {};
              config.abnormal_push = this.abnormal_push.isOpen;

              config.create_push = this.create_push.isOpen;
              config.delivery_sign_push = this.delivery_sign_push.isOpen;

              config.pickup_push = this.pickup_push.isOpen;
              config.delivery_push = this.delivery_push.isOpen;

              if(this.pickup_deferred_duration_switch){
                config.pickup_deferred_duration = this.pickup_deferred_duration;
              }else{
                config.pickup_deferred_duration = 0;
              }
              if(this.delivery_early_duration_switch){
                config.delivery_early_duration = this.delivery_early_duration;
              }else{
                config.delivery_early_duration = 0;
              }

              return config;
            }
          }
        ],
        submitOrderConfig: function () {
        },
        submitPushConfig: function () {
        }

      };
      $scope.orderConfig = orderConfig;

      orderConfig.submitOrderConfig = function () {
        var pickupConfig = orderConfig.options[0].getData();
        var deliveryConfig = orderConfig.options[1].getData();

        if (pickupConfig.err) {
          return $scope.$emit(GlobalEvent.onShowAlert, pickupConfig.err);
        }
        if (deliveryConfig.err) {
          return $scope.$emit(GlobalEvent.onShowAlert, deliveryConfig.err);
        }

        if (!pickupConfig.isModify && !deliveryConfig.isModify) {
          return $scope.$emit(GlobalEvent.onShowAlert, '没有任何更改');
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.updateOrderConfiguration({
          pickup_option: pickupConfig.config,
          delivery_option: deliveryConfig.config
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          console.log(data);
          if (!data || data.err) {
            return console.log('update company order configuration failed');
          }
          initConfiguration(data);

          return $scope.$emit(GlobalEvent.onShowAlert, '保存成功');

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      };

      orderConfig.submitPushConfig = function () {
        var pushConfig = this.options[2];
        var checkResult = pushConfig.check();
        if (!checkResult.success) {
          return $scope.$emit(GlobalEvent.onShowAlert, checkResult.message);
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.updatePushConfiguration({
          push_option: pushConfig.getData()
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          console.log(data);
          if (!data || data.err) {
            return console.log('update company push configuration failed');
          }
          initConfiguration(data);

          return $scope.$emit(GlobalEvent.onShowAlert, '保存成功');

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      };

      function initConfiguration(data) {
        _configuration = data;
        if (!data) {
          data = {};
        }
        orderConfig.options[0].load(data.pickup_option || {});
        orderConfig.options[1].load(data.delivery_option || {});
        orderConfig.options[2].load(data.push_option || {});

      }

      function getCompanyConfiguration() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getConfiguration().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          initConfiguration(data);
        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      }

      getCompanyConfiguration();
    }]);