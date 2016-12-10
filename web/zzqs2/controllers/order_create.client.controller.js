angular.module('zhuzhuqs').controller('OrderCreateController',
  ['$scope', '$stateParams', '$state', '$timeout', 'CompanyService', 'OrderService', 'SalesmanService', 'OrderError', 'GroupError', 'GlobalEvent', 'UserProfileService',
    function ($scope, $stateParams, $state, $timeout, CompanyService, OrderService, SalesmanService, OrderError, GroupError, GlobalEvent, UserProfileService) {
      console.log($state);
      console.log($stateParams);
      $scope.orderInfo = {};
      $scope.order = {
        submit_name: ''
      };

      $scope.executeGroups = [];
      $scope.newInfo = {
        showWarnning: false,
        currentGroup: {}
      };

      $scope.pageShow = {
        pickUpTimeRange: '',
        deliveryTimeRange: '',
        pickUpMinTime: moment().format('YY/MM/DD HH:mm'),
        deliveryMinTime: moment().format('YY/MM/DD HH:mm'),
        count_unit: ['箱', '托', '桶', '包', '个', '瓶', '只', 'TK', '其他'],
        weight_unit: ['吨', '公斤'],
        volume_unit: ['立方', '升', '尺', '20尺', '40尺'],
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
          separator: " ~ ",
          singleDatePicker: true,
          autoApply: true,
          format: 'YY/MM/DD HH:mm'
        }
      };

      //发货方信息
      $scope.senderInfo = {
        enableEdit: true,
        defaultContent: '搜索发货方',
        currentText: '',
        currentChoice: '',
        options: [],
        onSelected: selectSender
      };

      //收货方信息
      $scope.receiverInfo = {
        enableEdit: true,
        defaultContent: '搜索收货方',
        currentText: '',
        currentChoice: '',
        options: [],
        onSelected: selectReceiver
      };

      $scope.pushConfig = {
        order_transport_type: 'ltl',
        abnormal_push: {
          isOpen: false
        },
        pickup_push: {
          isOpen: false
        },
        create_push: {
          isOpen: false
        },
        delivery_sign_push: {
          isOpen: false
        },
        delivery_push: {
          isOpen: false
        }
      };

      var isModify = $stateParams.order !== "";
      var modifyType = $stateParams.modify_type || 'normal';
      console.log('stateParams.order:==========');
      console.log($stateParams.order);
      if (isModify) {
        $scope.order.submit_name = '修改这张订单';
        try {
          var updateOrderInfo = JSON.parse($stateParams.order);
          console.log(updateOrderInfo);
          console.log('orderInfo:==========');
          InitUpdateViewData(updateOrderInfo);
        }
        catch (e) {
          $scope.$emit(GlobalEvent.onShowAlert, '修改参数解析错误！');
        }
      }
      else {
        $scope.order.submit_name = '创建这张订单';
        InitCreateViewData();
      }

      function InitUpdateViewData(updateOrderInfo) {
        $scope.orderInfo = {
          order_id: updateOrderInfo.order_id,
          //order detail
          order_number: updateOrderInfo.order_number,
          refer_order_number: updateOrderInfo.refer_order_number,
          original_order_number: updateOrderInfo.original_order_number,
          goods_name: updateOrderInfo.goods_name,
          count: updateOrderInfo.count || '',
          weight: updateOrderInfo.weight || '',
          volume: updateOrderInfo.volume || '',
          count_unit: updateOrderInfo.count_unit,
          weight_unit: updateOrderInfo.weight_unit,
          volume_unit: updateOrderInfo.volume_unit,
          freight_charge: updateOrderInfo.freight_charge || '',
          sender_name: updateOrderInfo.sender_name,
          sender_company_id: '',
          receiver_name: updateOrderInfo.receiver_name,
          receiver_company_id: '',
          salesmen: [],
          goods: [],

          //order
          customer_name: updateOrderInfo.customer_name,
          pickup_start_time: updateOrderInfo.pickup_start_time,
          delivery_start_time: updateOrderInfo.delivery_start_time,
          pickup_end_time: updateOrderInfo.pickup_end_time,
          delivery_end_time: updateOrderInfo.delivery_end_time,
          description: updateOrderInfo.description,
          group_id: updateOrderInfo.group_id,
          pickup_entrance_force: updateOrderInfo.pickup_entrance_force,
          pickup_photo_force: updateOrderInfo.pickup_photo_force,
          delivery_entrance_force: updateOrderInfo.delivery_entrance_force,
          delivery_photo_force: updateOrderInfo.delivery_photo_force,
          pickup_deferred_duration: updateOrderInfo.pickup_deferred_duration,
          delivery_early_duration: updateOrderInfo.delivery_early_duration,

          //contacts
          pickup_contact_name: updateOrderInfo.pickup_contact_name,
          pickup_contact_phone: updateOrderInfo.pickup_contact_phone || '',
          pickup_contact_mobile_phone: updateOrderInfo.pickup_contact_mobile_phone || '',
          pickup_contact_address: updateOrderInfo.pickup_contact_address,
          pickup_contact_email: '',

          delivery_contact_name: updateOrderInfo.delivery_contact_name,
          delivery_contact_phone: updateOrderInfo.delivery_contact_phone || '',
          delivery_contact_mobile_phone: updateOrderInfo.delivery_contact_mobile_phone || '',
          delivery_contact_address: updateOrderInfo.delivery_contact_address,
          delivery_contact_email: ''
        };

        if (updateOrderInfo.goods) {
          $scope.orderInfo.goods = updateOrderInfo.goods;
        }
        if (updateOrderInfo.salesmen) {
          //TODO 设置salesmanInfo
          $scope.orderInfo.salesmen = updateOrderInfo.salesmen;
        }
        if (updateOrderInfo.receiver_company) {
          if (updateOrderInfo.receiver_company.company_id) {
            $scope.orderInfo.receiver_company_id = updateOrderInfo.receiver_company.company_id;
          }
          if (updateOrderInfo.receiver_company.company_name) {
            $scope.receiverInfo.currentChoice = {};
            $scope.receiverInfo.currentChoice.key = updateOrderInfo.receiver_company.company_id;
            $scope.receiverInfo.currentChoice.value = updateOrderInfo.receiver_company.company_name;
            $scope.receiverInfo.currentText = updateOrderInfo.receiver_company.company_name;
          }
        }
        if (!$scope.receiverInfo.currentText && updateOrderInfo.receiver_name) {
          $scope.receiverInfo.currentText = updateOrderInfo.receiver_name; //兼容旧数据
        }

        if (updateOrderInfo.sender_company) {
          if (updateOrderInfo.sender_company.company_id) {
            $scope.orderInfo.sender_company_id = updateOrderInfo.sender_company.company_id;
          }
          if (updateOrderInfo.sender_company.company_name) {
            $scope.senderInfo.currentChoice = {};
            $scope.senderInfo.currentChoice.key = updateOrderInfo.sender_company.company_id;
            $scope.senderInfo.currentChoice.value = updateOrderInfo.sender_company.company_name;
            $scope.senderInfo.currentText = updateOrderInfo.sender_company.company_name;
          }
        }
        if (!$scope.senderInfo.currentText && updateOrderInfo.sender_name) {
          $scope.senderInfo.currentText = updateOrderInfo.sender_name; //兼容旧数据
        }

        if (!updateOrderInfo.pickup_start_time && !updateOrderInfo.pickup_end_time) {
          $scope.pageShow.pickUpTimeRange = '';
        }
        else {
          $scope.pageShow.pickUpTimeRange = {
            startDate: updateOrderInfo.pickup_start_time ? updateOrderInfo.pickup_start_time : null,
            endDate: updateOrderInfo.pickup_end_time ? updateOrderInfo.pickup_end_time : null
          };
        }

        if (!updateOrderInfo.delivery_start_time && !updateOrderInfo.delivery_end_time) {
          $scope.pageShow.deliveryTimeRange = '';
        }
        else {
          $scope.pageShow.deliveryTimeRange = {
            startDate: updateOrderInfo.delivery_start_time ? updateOrderInfo.delivery_start_time : null,
            endDate: updateOrderInfo.delivery_end_time ? updateOrderInfo.delivery_end_time : null
          };
        }


        $scope.pushConfig.order_transport_type = updateOrderInfo.order_transport_type;

        $scope.pushConfig.abnormal_push.isOpen = updateOrderInfo.abnormal_push;
        $scope.pushConfig.pickup_push.isOpen = updateOrderInfo.pickup_push;

        $scope.pushConfig.create_push.isOpen = updateOrderInfo.create_push;
        $scope.pushConfig.delivery_sign_push.isOpen = updateOrderInfo.delivery_sign_push;
        $scope.pushConfig.delivery_push.isOpen = updateOrderInfo.delivery_push;

      };

      function InitCreateViewData() {
        $scope.order.submit_name = '创建这张订单';
        $scope.orderInfo = {
          //order detail
          order_number: '',
          refer_order_number: '',
          original_order_number: '',
          goods_name: '',
          count: '',
          weight: '',
          volume: '',
          count_unit: '箱',
          weight_unit: '吨',
          volume_unit: '立方',
          freight_charge: '',
          salesmen: [],
          goods: [],

          //order
          customer_name: '',
          pickup_start_time: '',
          delivery_start_time: '',
          pickup_end_time: '',
          delivery_end_time: '',
          description: '',
          group_id: '',
          sender_name: '',
          sender_company_id: '',
          receiver_name: '',
          receiver_company_id: '',
          pickup_entrance_force: false,
          pickup_photo_force: false,
          delivery_entrance_force: false,
          delivery_photo_force: true,
          pickup_deferred_duration: 0,
          delivery_early_duration: 0,

          //contacts
          pickup_contact_name: '',
          pickup_contact_phone: '',
          pickup_contact_mobile_phone: '',
          pickup_contact_address: '',
          pickup_contact_email: '',

          delivery_contact_name: '',
          delivery_contact_phone: '',
          delivery_contact_mobile_phone: '',
          delivery_contact_address: '',
          delivery_contact_email: ''
        };
      };

      $scope.clickPage = function () {
        $scope.customerInfo.showPanel = false;
        $scope.pickupContactInfo.showPanel = false;
        $scope.deliveryContactInfo.showPanel = false;
      };

      $scope.clickCustomer = function (name) {
        $scope.orderInfo.customer_name = name;
      };

      $scope.customerInfo = {
        customers: [],
        isGetting: false,
        showPanel: false
      };

      $scope.getCustomersByKeyword = function () {
        if ($scope.customerInfo.isGetting)
          return;
        $scope.customerInfo.isGetting = true;
        $scope.customerInfo.showPanel = true;
        $timeout(function () {
          CompanyService.getCompanyCustomersByFilter({customer_name: $scope.orderInfo.customer_name}).then(function (data) {
            console.log(data);
            $scope.customerInfo.customers = data;
            $scope.customerInfo.isGetting = false;
          }, function (err) {
            console.log(err);
            $scope.customerInfo.customers = [];
            $scope.customerInfo.isGetting = false;
          });
        }, 500);
      };

      $scope.pickupContactInfo = {
        contacts: [],
        isGetting: false,
        showPanel: false
      };

      $scope.deliveryContactInfo = {
        contacts: [],
        isGetting: false,
        showPanel: false
      };

      $scope.clickContactItem = function (contact, isPickup) {
        if (isPickup) {
          //$scope.orderInfo.pickup_contact_name = contact.name;
          //$scope.orderInfo.pickup_contact_phone = contact.phone || '';
          //$scope.orderInfo.pickup_contact_mobile_phone = contact.mobile_phone || '';
          $scope.orderInfo.pickup_contact_address = contact.brief || contact.detail;
          //$scope.orderInfo.pickup_contact_email = contact.email;
        }
        else {
          //$scope.orderInfo.delivery_contact_name = contact.name;
          //$scope.orderInfo.delivery_contact_phone = contact.phone || '';
          //$scope.orderInfo.delivery_contact_mobile_phone = contact.mobile_phone || '';
          $scope.orderInfo.delivery_contact_address = contact.brief || contact.detail;
          //$scope.orderInfo.delivery_contact_email = contact.email;
        }
      };

      $scope.getContractsByKeyword = function (isPickup) {
        if ($scope.pickupContactInfo.isGetting || $scope.deliveryContactInfo.isGetting)
          return;
        var address;
        if (isPickup) {
          if (!$scope.orderInfo.pickup_contact_address) {
            $scope.pickupContactInfo.contacts = [];
            return;
          }
          $scope.pickupContactInfo.isGetting = true;
          $scope.pickupContactInfo.showPanel = true;
          address = {address: $scope.orderInfo.pickup_contact_address};
        }
        else {
          if (!$scope.orderInfo.delivery_contact_address) {
            $scope.pickupContactInfo.contacts = [];
            return;
          }
          $scope.deliveryContactInfo.isGetting = true;
          $scope.deliveryContactInfo.showPanel = true;
          address = {address: $scope.orderInfo.delivery_contact_address};
        }

        $timeout(function () {

          if (isPickup && $scope.senderInfo.currentText) {
            OrderService.getSenderPickupAddressList($scope.senderInfo.currentText, address.address).then(function (data) {
              if (data.err) {
                console.log(data.err);
                $scope.pickupContactInfo.contacts = [];
              }
              else {
                data = data.map(function (item) {
                  return {
                    detail: item
                  };
                });
                $scope.pickupContactInfo.contacts = data;
              }
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;

            }, function (err) {
              console.log(err);
              $scope.pickupContactInfo.contacts = [];
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            });
          }
          else {
            CompanyService.getContactsByFilter(address).then(function (data) {
              console.log(data);
              $scope.pickupContactInfo.contacts = data;
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            }, function (err) {
              console.log(err);
              $scope.pickupContactInfo.contacts = [];
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            });
          }

        }, 1000);
      };

      $scope.clickGroup = function (executeGroup) {
        $scope.newInfo.currentGroup = executeGroup;
      };

      $scope.submitOrder = function (form) {
        var valid = form.$valid;
        if(!$scope.validates){
          $scope.validates = {};
        }
        if (!$scope.orderInfo.receiver_name && !$scope.receiverInfo.currentText) {
          valid = false;
          // $scope.validates['receiverInfo.currentText'] = {required : true};
        }
        if (!$scope.orderInfo.sender_name && !$scope.senderInfo.currentText) {
          valid = false;
          // $scope.validates['senderInfo.currentText'] = {required : true};
        }
        if(!$scope.pageShow.pickUpTimeRange){
          valid = false;
          $scope.new_order['pageShow.pickUpTimeRange'].$setValidity('required', false);
        }
        if(!$scope.pageShow.deliveryTimeRange){
          valid = false;
          $scope.new_order['pageShow.deliveryTimeRange'].$setValidity('required', false);
        }

        if(!valid){
          $scope.submitted = true;
          return;
        }

        if (!$scope.orderInfo.receiver_name && $scope.receiverInfo.currentText) {
          $scope.orderInfo.receiver_name = $scope.receiverInfo.currentText;
        }
        if (!$scope.orderInfo.sender_name && $scope.senderInfo.currentText) {
          $scope.orderInfo.sender_name = $scope.senderInfo.currentText;
        }

        $scope.orderInfo.salesmen = [];
        if (getObjectLength($scope.salesInfo.hasSelected) > 0) {
          for (var saleKey in $scope.salesInfo.hasSelected) {
            for(var i=0, len=$scope.salesInfo.options.length; i<len; i++){
              if($scope.salesInfo.hasSelected[saleKey] === $scope.salesInfo.options[i].value){
                $scope.orderInfo.salesmen.push($scope.salesInfo.options[i].username);
                break;
              }
            }
          }
        }

        $scope.orderInfo.goods = $scope.goodsInfo.getValidGoods();
        $scope.orderInfo.goods_name = $scope.orderInfo.goods[0].name;
        $scope.orderInfo.count = $scope.orderInfo.goods[0].count;
        $scope.orderInfo.count_unit = $scope.orderInfo.goods[0].unit;
        $scope.orderInfo.volume = '';
        $scope.orderInfo.volume_unit = '立方';
        $scope.orderInfo.weight = '';
        $scope.orderInfo.weight_unit = '吨';

        if ($scope.orderInfo.pickup_contact_address
          && $scope.orderInfo.delivery_contact_address
          && ($scope.orderInfo.pickup_contact_address === $scope.orderInfo.delivery_contact_address)) {
          $scope.$emit(GlobalEvent.onShowAlert, '提货地址和交货地址不能相同！');
          return;
        }

        if ($scope.orderInfo.delivery_contact_mobile_phone) {
          if ($scope.orderInfo.delivery_contact_mobile_phone.length != 11) {
            $scope.$emit(GlobalEvent.onShowAlert, '交货手机号码必须11位！');
            return;
          }
        }
        if ($scope.orderInfo.pickup_contact_mobile_phone) {
          if ($scope.orderInfo.pickup_contact_mobile_phone.length != 11) {
            $scope.$emit(GlobalEvent.onShowAlert, '提货手机号码必须11位！');
            return;
          }
        }
        if ($scope.pageShow.pickUpTimeRange.startDate) {
          $scope.orderInfo.pickup_start_time = moment($scope.pageShow.pickUpTimeRange.startDate).toISOString();
        }
        if ($scope.pageShow.pickUpTimeRange.endDate) {
          $scope.orderInfo.pickup_end_time = moment($scope.pageShow.pickUpTimeRange.endDate).toISOString();
        }
        if ($scope.pageShow.deliveryTimeRange.startDate) {
          $scope.orderInfo.delivery_start_time = moment($scope.pageShow.deliveryTimeRange.startDate).toISOString();
        }
        if ($scope.pageShow.deliveryTimeRange.endDate) {
          $scope.orderInfo.delivery_end_time = moment($scope.pageShow.deliveryTimeRange.endDate).toISOString();
        }

        $scope.orderInfo.order_transport_type = $scope.pushConfig.order_transport_type;
        $scope.orderInfo.abnormal_push = $scope.pushConfig.abnormal_push.isOpen;
        $scope.orderInfo.pickup_push = $scope.pushConfig.pickup_push.isOpen;

        $scope.orderInfo.create_push = $scope.pushConfig.create_push.isOpen;
        $scope.orderInfo.delivery_sign_push = $scope.pushConfig.delivery_sign_push.isOpen;
        $scope.orderInfo.delivery_push = $scope.pushConfig.delivery_push.isOpen;

        createOrder();
      };

      function createOrder() {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        if (isModify) {
          if (modifyType === 'normal') {
            OrderService.updateUnAssignedOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                handleCreateOrderError(data.err.type);
                return;
              }
              else {
                $scope.$emit(GlobalEvent.onShowAlert, "订单修改成功");
                $state.go('order_assign');
              }
            }, function (err) {

            });
          } else {
            OrderService.updateAssignedOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                handleCreateOrderError(data.err.type);
                return;
              }
              else {
                $scope.$emit(GlobalEvent.onShowAlert, "订单修改成功");
                $state.go('order_follow');
              }
            }, function (err) {

            });
          }

        } else {
          OrderService.createOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);
            if (data.err) {
              handleCreateOrderError(data.err.type);
              return;
            }
            else {
              $state.go('order_create', {}, {reload: true});
              $scope.$emit(GlobalEvent.onShowAlertConfirm, "订单创建成功", goOrderAssign, null, {
                'sureLabel': '去分配',
                'cancelLabel': '继续创建'
              });
            }
          }, function (err) {

          });
        }


      }

      function goOrderAssign() {
        $state.go('order_assign');
      }

      function getGroupList(callback) {
        CompanyService.getExecuteGroupList().then(function (data) {
          console.log(data);
          if (data.err) {
            handleGetGroupListError(data.err.type);
          }
          else {
            $scope.executeGroups = data;
            if ($scope.executeGroups.length > 0) {
              if (isModify) {
                for (var i = 0; i < $scope.executeGroups.length; i++) {
                  if ($scope.executeGroups[i]._id === updateOrderInfo.group_id) {
                    $scope.clickGroup($scope.executeGroups[i]);
                    break;
                  }
                }
              } else {
                $scope.clickGroup($scope.executeGroups[0]);
              }
            }
          }

          return callback();

        }, function (err) {
          console.log('getGroupList error:' + err);
          return callback();
        });
      }

      getGroupList(getUserProfile);

      function getUserProfile() {
        UserProfileService.getUserProfile().then(function (data) {
          console.log(data);

          if (data.err) {
            return handleCreateOrderError(data.err.type);
          }

          if (data.user_profile) {
            $scope.orderInfo.pickup_entrance_force = data.user_profile.pickup_entrance_force;
            $scope.orderInfo.pickup_photo_force = data.user_profile.pickup_photo_force;
            $scope.orderInfo.delivery_entrance_force = data.user_profile.delivery_entrance_force;
            $scope.orderInfo.delivery_photo_force = data.user_profile.delivery_photo_force;

            //记忆选中的组
            if (data.user_profile.order_execute_group && !isModify && $scope.executeGroups.length > 0) {
              for (var i = 0; i < $scope.executeGroups.length; i++) {
                if ($scope.executeGroups[i]._id.toString() === data.user_profile.order_execute_group) {
                  $scope.clickGroup($scope.executeGroups[i]);
                  break;
                }
              }
            }
          }
          else {
            $scope.orderInfo.pickup_entrance_force = false;
            $scope.orderInfo.pickup_photo_force = false;
            $scope.orderInfo.delivery_entrance_force = false;
            $scope.orderInfo.delivery_photo_force = true;
          }

        }, function (err) {
          console.log(err);
        });

        CompanyService.getConfiguration().then(function (data) {
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          if (!isModify && data && data.push_option) {
            $scope.pushConfig.abnormal_push.isOpen = data.push_option.abnormal_push;
            $scope.pushConfig.pickup_push.isOpen = data.push_option.pickup_push;

            $scope.pushConfig.create_push.isOpen = data.push_option.create_push;
            $scope.pushConfig.delivery_sign_push.isOpen = data.push_option.delivery_sign_push;
            $scope.pushConfig.delivery_push.isOpen = data.push_option.delivery_push;

            $scope.orderInfo.pickup_deferred_duration = data.push_option.pickup_deferred_duration;
            $scope.orderInfo.delivery_early_duration = data.push_option.delivery_early_duration;
          }

        }, function (err) {
          console.log(err);
        });

      }

      function goCompanyConfiguration() {
        $state.go('order_configuration');
      }

      $scope.pickupEntranceHandle = function () {
        goCompanyConfiguration();
      };
      $scope.pickupPhotoHandle = function () {
        //$scope.orderInfo.pickup_photo_force = !$scope.orderInfo.pickup_photo_force;
        goCompanyConfiguration();
      };
      $scope.deliveryEntranceHandle = function () {
        //$scope.orderInfo.delivery_entrance_force = !$scope.orderInfo.delivery_entrance_force;
        goCompanyConfiguration();
      };
      $scope.deliveryPhotoHandle = function () {
        //$scope.orderInfo.delivery_photo_force = !$scope.orderInfo.delivery_photo_force;
        goCompanyConfiguration();
      };

      function handleCreateOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function handleGetGroupListError(errType) {
        if (GroupError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, GroupError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      $scope.goodsInfo = {
        goods: [],
        unitOptions: [
          {
            name: '件数',
            value: ['箱', '托', '桶', '包', '个', '瓶', '只', 'TK', '其他']
          },
          {
            name: '重量',
            value: ['吨', '公斤']
          },
          {
            name: '体积',
            value: ['立方', '升', '尺', '20尺', '40尺']
          }],
        itemTemplate: {
          name: '',
          count: 1,
          unit: '箱',
          count2: '',
          unit2: '吨',
          count3: '',
          unit3: '立方',
          price: '',
          canDelete: true,
          isShowOption: false,
          isShowOption2: false,
          isShowOption3: false,
          increaseCount1: function () {
            this.count = this.increase(this.count);
          },
          decreaseCount1: function () {
            this.count = this.decrease(this.count);
          },
          increaseCount2: function () {
            this.count2 = this.increase(this.count2);
          },
          decreaseCount2: function () {
            this.count2 = this.decrease(this.count2);
          },
          increaseCount3: function () {
            this.count3 = this.increase(this.count3);
          },
          decreaseCount3: function () {
            this.count3 = this.decrease(this.count3);
          },
          increase: function (data) {
            data = parseFloat(data) || 0;
            data++;
            return data;
          },
          decrease: function (data) {
            data = parseFloat(data) || 0;
            data--;
            if (data < 0) {
              data = 0;
            }
            return data;
          },
          changeText: function () {
            $scope.goodsInfo.updateAddStatus();
          },
          clickUnit: function (showOption, event) {
            $scope.goodsInfo.goods.forEach(function (item) {
              item.isShowOption = false;
              item.isShowOption2 = false;
              item.isShowOption3 = false;
            });

            this[showOption] = true;
            stopBubble(event);
          },
          clickUnit1: function (event) {
            this.clickUnit('isShowOption', event);
          },
          clickUnit2: function (event) {
            this.clickUnit('isShowOption2', event);
          },
          clickUnit3: function (event) {
            this.clickUnit('isShowOption3', event);
          }
        },
        canAdd: false,
        init: function () {
          this.goods = [];
          this.canAdd = false;
        },
        updateAddStatus: function () {
          this.canAdd = this.goods.filter(function (item) {
              return !item.name;
            }).length === 0;
        },
        addGoodsItem: function (item) {
          item = item || deepCopy(this.itemTemplate);
          this.goods.push(item);
        },
        addPageGoodsItem: function () {
          if (this.canAdd) {
            this.addGoodsItem();
            this.updateAddStatus();
          }
        },
        removeGoodsItem: function (index) {
          this.goods.splice(index, 1);
          this.updateAddStatus();
        },
        getValidGoods: function () {
          var validGoods = this.goods.filter(function (item) {
            return (item.name && item.name.length > 0);
          });
          if (validGoods.length === 0) {
            validGoods.push({
              name: '',
              count: '',
              unit: '箱',
              count2: '',
              unit2: '吨',
              count3: '',
              unit3: '立方',
              price: ''
            });
          }
          else {
            validGoods = validGoods.map(function (item) {
              return {
                name: item.name,
                count: item.count,
                unit: item.unit,
                count2: item.count2 || '',
                unit2: item.unit2 || '吨',
                count3: item.count3 || '',
                unit3: item.unit3 || '立方',
                price: item.price || ''
              };
            });
          }
          return validGoods;
        }
      };

      //sender包含key,value。key为company_id， value为company_name
      function selectSender(sender) {
        if (!sender) {
          $scope.orderInfo.sender_company_id = '';
          $scope.orderInfo.sender_name = '';
        }
        else {
          $scope.orderInfo.sender_company_id = sender.key;
          $scope.orderInfo.sender_name = sender.value;
        }
      }

      //receiver包含key,value。key为company_id， value为company_name
      function selectReceiver(receiver) {
        if (!receiver) {
          $scope.orderInfo.receiver_company_id = '';
          $scope.orderInfo.receiver_name = '';
        }
        else {
          $scope.orderInfo.receiver_company_id = receiver.key;
          $scope.orderInfo.receiver_name = receiver.value;
        }
      }

      function ableOldSelectSalesman(selectInfo) {
        if (selectInfo.key) {
          if ($scope.salesInfo.hasSelected[selectInfo.key]) {
            delete $scope.salesInfo.hasSelected[selectInfo.key];
          }
          $scope.salesInfo.unableOption(selectInfo.key, false);
          $scope.salesInfo.updateAddStatus();

          delete selectInfo.key;
        }
      }

      function selectSalesman(option, selectInfo) {
        selectInfo = selectInfo || this;
        //选中了
        if (selectInfo.currentChoice) {

          ableOldSelectSalesman(selectInfo);

          //为了手动删除选项的时候使用
          selectInfo.key = selectInfo.currentChoice.key;

          //记录下选中的值
          $scope.salesInfo.hasSelected[selectInfo.currentChoice.key] = selectInfo.currentChoice.value;

          //选中后其他人不能继续选择
          $scope.salesInfo.unableOption(selectInfo.currentChoice.key, true);

          //计算此时是否可以添加
          $scope.salesInfo.updateAddStatus();
        }
        else {
          ableOldSelectSalesman(selectInfo);
          //手动添加的未知关注人
          if (selectInfo.currentText && selectInfo.currentText.testPhone()) {
            selectInfo.key = selectInfo.currentText;
            $scope.salesInfo.hasSelected[selectInfo.currentText] = selectInfo.currentText;
            $scope.salesInfo.updateAddStatus();
          }
        }
      }

      //业务员信息
      $scope.salesInfo = {
        boxInfo: [],
        hasSelected: {},
        selectInfo: {
          canDelete: true,
          enableEdit: true,
          defaultContent: '搜索关注人',
          currentText: '',
          currentChoice: '',
          options: [],
          onSelected: selectSalesman
        },
        options: [],
        canAdd: false,
        init: function () {
          this.boxInfo = [];
          this.hasSelected = {};
          this.options = [];
          this.canAdd = false;
        },
        addBox: function (canDelete, value) {
          value = value || deepCopy(this.selectInfo);
          var index = this.boxInfo.push(value);
          this.boxInfo[index - 1].options = this.options;
          this.boxInfo[index - 1].canDelete = canDelete;
          this.updateAddStatus();
        },
        addPageBox: function () {
          if (this.canAdd) {
            this.addBox(true);
          }
        },
        removeBox: function (index) {
          if (index < this.boxInfo.length) {
            var removeItem = this.boxInfo.splice(index, 1)[0];
            ableOldSelectSalesman(removeItem);
            this.updateAddStatus();
          }
        },
        unableOption: function (key, isUnable) {
          if (!key) {
            return;
          }
          for (var i = 0; i < this.options.length; i++) {
            if (this.options[i].key === key) {
              this.options[i].unable = isUnable;
              break;
            }
          }
        },
        updateAddStatus: function () {
          this.canAdd = this.boxInfo.length === getObjectLength(this.hasSelected);
        }
      };

      (function getPartnerCompanies() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          if (data.err) {
            handleCreateOrderError(data.err.type);
            return;
          }

          if (data.partnerCompany && data.partnerCompany.length > 0) {
            data.partnerCompany.forEach(function (item) {
              //别人加我为合作公司
              if (item.company._id) {
                $scope.receiverInfo.options.push({
                  key: item.company._id,
                  value: item.company.name
                });
                $scope.senderInfo.options.push({
                  key: item.company._id,
                  value: item.company.name
                });
              }
              else if (item.partner._id) { //我加别人为合作公司
                $scope.receiverInfo.options.push({
                  key: item.partner._id,
                  value: item.partner.name
                });
                $scope.senderInfo.options.push({
                  key: item.partner._id,
                  value: item.partner.name
                });
              }

            });
          }

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });

        $scope.$emit(GlobalEvent.onShowLoading, true);
        SalesmanService.getBasicList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          if (data.err) {
            return handleCreateOrderError(data.err.type);
          }
          $scope.salesInfo.init();

          if (data) {
            data.forEach(function (salesman) {
              $scope.salesInfo.options.push({
                key: salesman._id,
                value: salesman.nickname ? salesman.username + '(' + salesman.nickname + ')' : salesman.username,
                username: salesman.username,
                unable: false
              });
            });
          }
          if ($scope.salesInfo.options.length > 0) {
            //处理修改运单，需要添加业务员显示
            if ($scope.orderInfo.salesmen.length > 0) {
              var findCount = 0;
              for (var i = 0; i < $scope.salesInfo.options.length; i++) {
                if ($scope.orderInfo.salesmen.indexOf($scope.salesInfo.options[i].username) > -1) {
                  var selectItem = deepCopy($scope.salesInfo.selectInfo);
                  selectItem.currentText = $scope.salesInfo.options[i].value;
                  selectItem.currentChoice = $scope.salesInfo.options[i];
                  //添加框
                  $scope.salesInfo.addBox(true, selectItem);
                  //添加选择
                  selectSalesman(null, selectItem);
                  findCount++;
                }
                if ($scope.orderInfo.salesmen.length === findCount) {
                  break;
                }
              }

              if ($scope.salesInfo.boxInfo.length > 0) {
                $scope.salesInfo.boxInfo[0].canDelete = false;
              }
            }
          }
          //如果框数为0, 默认增加一个框
          if ($scope.salesInfo.boxInfo.length <= 0) {
            $scope.salesInfo.addBox(false);
          }

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleCreateOrderError('error');
        });


        $scope.goodsInfo.init();
        //运单修改
        if ($scope.orderInfo.goods.length > 0) {
          $scope.orderInfo.goods.forEach(function (item) {
            var insertItem = deepCopy($scope.goodsInfo.itemTemplate);
            insertItem.name = item.name || '';

            insertItem.count = item.count || '';
            insertItem.unit = item.unit || '箱';

            insertItem.count2 = item.count2 || '';
            insertItem.unit2 = item.unit2 || '吨';

            insertItem.count3 = item.count3 || '';
            insertItem.unit3 = item.unit3 || '立方';

            insertItem.price = item.price || '';
            $scope.goodsInfo.addGoodsItem(insertItem);
          });
        }
        if ($scope.goodsInfo.goods.length === 0) {
          $scope.goodsInfo.addGoodsItem();
        }
        $scope.goodsInfo.goods[0].canDelete = false;
        $scope.goodsInfo.updateAddStatus();

      })();

      $scope.$on(GlobalEvent.onBodyClick, function () {
        if ($scope.goodsInfo.goods.length > 0) {
          $scope.goodsInfo.goods.forEach(function (item) {
            item.isShowOption = false;
            item.isShowOption2 = false;
            item.isShowOption3 = false;
          });
        }
      });

    }])
;
