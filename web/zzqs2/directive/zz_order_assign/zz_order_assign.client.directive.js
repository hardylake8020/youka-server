/**
 * Created by elinaguo on 15/5/24.
 */
zhuzhuqs.directive('zzOrderAssign', ['OrderHelper', function (OrderHelper) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_order_assign/zz_order_assign.html',
    replace: true,
    link: function (scope, element, attributes, controllers) {

      scope.order = scope.$parent.row;
      scope.order.new_order_number = '';

      scope.extendData = scope.$parent.$parent.config.extendData;
      scope.rangeTimePanel = scope.extendData.rangeTimePanel;
      scope.selectData = generateSelectData();
      scope.isOpenEditBox = false;

      scope.contactEdit = {
        isOpen: false,
        current: {
          assignInfo: null,
          pickupName: '',
          deliveryName: '',
          pickupMobilePhone: '',
          deliveryMobilePhone: '',
          pickupPhone: '',
          deliveryPhone: ''
        }
      };

      scope.dateTransport = function (dateString) {
        return new Date(dateString);
      };

      if (!scope.order.extendData.assignInfos) {
        scope.order.extendData.assignInfos = [];
      }

      if (scope.order.extendData.assignInfos.length === 0) {
        scope.order.extendData.assignInfos.push(initAssignInfo());
      } else {

        var selectData = generateSelectData();
        for (var i = 0; i < scope.order.extendData.assignInfos.length; i++) {
          updateAssignInfo(scope.order.extendData.assignInfos[i], selectData);
        }
      }

      function generateSelectData() {
        var partners = scope.extendData.partnerCompanies;
        var drivers = scope.extendData.partnerDrivers;

        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {

          var currentPartner = partners[i];
          executeSelectData.push(OrderHelper.getCompanyAssignOption(currentPartner));
        }

        executeSelectData.push({key: null, value: '合作司机'});
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          if (drivers[i].driver && drivers[i].driver.is_signup) {
            executeSelectData.push(OrderHelper.getDriverAssignOption(drivers[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getDriverAssignOption(drivers[i].driver, 'warehouse'));
          }
        }

        executeSelectData.push({key: null, value: '微信司机'});
        executeWarehouseSelectData.push({key: null, value: '微信仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          if (drivers[i].driver && drivers[i].driver.wechat_profile && drivers[i].driver.wechat_profile.openid) {
            executeSelectData.push(OrderHelper.getWechatDriverAssignOption(drivers[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getWechatDriverAssignOption(drivers[i].driver, 'warehouse'));
          }
        }

        return {
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };

      }

      function updateAssignInfo(assignInfo, selectData) {
        if (!assignInfo)
          return;

        assignInfo.onSelected = updateType;
        if (assignInfo.pickup_start_time) {
          assignInfo.pickupTimeRange = {
            startDate: assignInfo.pickup_start_time ? new Date(assignInfo.pickup_start_time) : null,
            endDate: assignInfo.pickup_end_time ? new Date(assignInfo.pickup_end_time) : null
          };

        }
        if (assignInfo.delivery_start_time) {
          assignInfo.deliveryTimeRange = {
            startDate: assignInfo.delivery_start_time ? new Date(assignInfo.delivery_start_time) : null,
            endDate: assignInfo.delivery_end_time ? new Date(assignInfo.delivery_end_time) : null
          };
        }

        if (assignInfo.is_assigned === true || assignInfo.is_assigned === 'true') {
          assignInfo.enableEdit = false;
        } else {
          assignInfo.enableEdit = true;
        }

        if (assignInfo.type === 'driver') {
          assignInfo.options = selectData.executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.is_wechat, assignInfo.options);
          if (!assignInfo.currentChoice && assignInfo.driver_username) {  //临时司机的情况
            assignInfo.currentText = assignInfo.driver_username;
          }
        } else if (assignInfo.type === 'warehouse') {
          assignInfo.options = selectData.executeWarehouseSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.is_wechat, assignInfo.options);
          if (!assignInfo.currentChoice && assignInfo.driver_username) { //临时司机的情况
            assignInfo.currentText = assignInfo.driver_username;
          }

        } else {
          assignInfo.options = selectData.executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.company_id, assignInfo.is_wechat, assignInfo.options);
        }

        if (!assignInfo.currentText) {
          assignInfo.currentText = assignInfo.currentChoice ? assignInfo.currentChoice.value : '';
        }
      };

      function findOption(key, isWechat, options) {
        var result = null;
        for (var i = 0; i < options.length; i++) {
          if (options[i].key === key) {
            if (isWechat) {
              if (options[i].is_wechat == isWechat) {
                result = options[i];
                break;
              }
            }
            else {
              result = options[i];
              break;
            }
          }
        }
        return result;
      };

      function initAssignInfo() {
        return {
          pickup_contact_name: scope.order.extendData.detail.pickup_contact_name,
          pickup_contact_phone: scope.order.extendData.detail.pickup_contact_phone,
          pickup_contact_mobile_phone: scope.order.extendData.detail.pickup_contact_mobile_phone,
          pickup_contact_address: scope.order.extendData.detail.pickup_contact_address,
          pickup_contact_email: '',
          delivery_contact_name: scope.order.extendData.detail.delivery_contact_name,
          delivery_contact_phone: scope.order.extendData.detail.delivery_contact_phone,
          delivery_contact_mobile_phone: scope.order.extendData.detail.delivery_contact_mobile_phone,
          delivery_contact_address: scope.order.extendData.detail.delivery_contact_address,
          delivery_contact_email: '',
          company_id: '',
          is_assigned: false,
          pickup_start_time: scope.order.extendData.detail.pickup_start_time,
          pickup_end_time: scope.order.extendData.detail.pickup_end_time,
          delivery_start_time: scope.order.extendData.detail.delivery_start_time,
          delivery_end_time: scope.order.extendData.detail.delivery_end_time,
          driver_id: '',
          type: 'company',
          pickupTimeRange: {
            startDate: scope.order.extendData.detail.pickup_start_time ? new Date(scope.order.extendData.detail.pickup_start_time) : null,
            endDate: scope.order.extendData.detail.pickup_end_time ? new Date(scope.order.extendData.detail.pickup_end_time) : null
          },
          deliveryTimeRange: {
            startDate: scope.order.extendData.detail.delivery_start_time ? new Date(scope.order.extendData.detail.delivery_start_time) : null,
            endDate: scope.order.extendData.detail.delivery_end_time ? new Date(scope.order.extendData.detail.delivery_end_time) : null
          },
          currentText: null,
          currentChoice: null,                          //以下都是该行的选择框配置数据
          defaultContent: '搜索合作公司或司机',
          options: scope.selectData.executeSelectData,
          onSelected: updateType,
          enableEdit: true    //是否启用编辑
        };
      };

      function generateNewAssignInfo() {
        return {
          pickup_contact_name: '',
          pickup_contact_phone: '',
          pickup_contact_mobile_phone: '',
          pickup_contact_address: '',
          pickup_contact_email: '',
          delivery_contact_name: '',
          delivery_contact_phone: '',
          delivery_contact_mobile_phone: '',
          delivery_contact_address: '',
          delivery_contact_email: '',
          company_id: '',
          pickup_start_time: '',
          pickup_end_time: '',
          delivery_start_time: '',
          delivery_end_time: '',
          driver_id: '',
          partner_name: '',
          type: 'company',
          pickupTimeRange: null,
          deliveryTimeRange: null,
          currentText: null,
          currentChoice: null,                          //以下都是该行的选择框配置数据
          defaultContent: '搜索合作公司或司机',
          options: scope.selectData.executeSelectData,
          onSelected: updateType,
          enableEdit: true    //是否启用编辑
        };
      };

      function updateType(option) {
        if (!option) {
          this.company_id = '';
          this.driver_id = '';
          this.partner_name = '';

          return;
        }

        if (option.group_type === 'driver' || option.group_type === 'warehouse') {
          this.driver_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
          this.is_wechat = option.is_wechat || false;
        } else if (option.group_type === 'company') {
          this.company_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
        }
        return;
      };

      scope.changeType = function (assignInfo) {
        if (assignInfo.enableEdit == false)
          return;

        var extendData = generateSelectData();
        if (assignInfo.type === 'driver' || assignInfo.type === 'company') {
          assignInfo.type = 'warehouse';
          assignInfo.currentChoice = null;
          assignInfo.defaultContent = '搜索仓库管理员';
          assignInfo.options = extendData.executeWarehouseSelectData
        }
        else {
          assignInfo.type = 'driver';
          assignInfo.currentChoice = null;
          assignInfo.defaultContent = '搜索合作公司或司机';
          assignInfo.options = extendData.executeSelectData
        }

      };

      scope.addNewAssignInfo = function () {
        scope.order.extendData.assignInfos.push(generateNewAssignInfo());
      };
      scope.cancelAssign = function () {
        scope.order.isExpand = false;
        scope.rangeTimePanel.hide();
      };
      scope.removeAssignInfo = function (index) {
        if (index < 0 || index >= scope.order.extendData.assignInfos.length)
          return;

        if (index === 0 && scope.order.extendData.assignInfos.length === 1)
          return;

        return scope.order.extendData.assignInfos.splice(index, 1);
      };

      scope.editAssignDetailInfo = function (assignInfo) {
        console.log('editAssignDetailInfo');
        console.log(assignInfo);
        scope.contactEdit.isOpen = true;
        scope.contactEdit.current.assignInfo = assignInfo;
        scope.contactEdit.current.pickupName = assignInfo.pickup_contact_name;
        scope.contactEdit.current.deliveryName = assignInfo.delivery_contact_name;
        scope.contactEdit.current.pickupMobilePhone = assignInfo.pickup_contact_mobile_phone;
        scope.contactEdit.current.deliveryMobilePhone = assignInfo.delivery_contact_mobile_phone;
        scope.contactEdit.current.pickupPhone = assignInfo.pickup_contact_phone;
        scope.contactEdit.current.deliveryPhone = assignInfo.delivery_contact_phone;
        //window.scrollTo(0,0);
      };
      scope.closeAssignDetailInfo = function () {
        scope.contactEdit.isOpen = false;
      };
      scope.saveAssignDetailInfo = function () {
        scope.contactEdit.current.assignInfo.pickup_contact_name = scope.contactEdit.current.pickupName;
        scope.contactEdit.current.assignInfo.pickup_contact_mobile_phone = scope.contactEdit.current.pickupMobilePhone;
        scope.contactEdit.current.assignInfo.pickup_contact_phone = scope.contactEdit.current.pickupPhone;
        scope.contactEdit.current.assignInfo.delivery_contact_name = scope.contactEdit.current.deliveryName;
        scope.contactEdit.current.assignInfo.delivery_contact_mobile_phone = scope.contactEdit.current.deliveryMobilePhone;
        scope.contactEdit.current.assignInfo.delivery_contact_phone = scope.contactEdit.current.deliveryPhone;
        scope.contactEdit.isOpen = false;
      };

      scope.submitOrderAssignInfos = function () {
        if (!scope.extendData.onRowSubmit) {
          return;
        }

        for (var i = 0; i < scope.order.extendData.assignInfos.length; i++) {
          var currentAssignInfo = scope.order.extendData.assignInfos[i];
          if (currentAssignInfo.currentChoice) {
            currentAssignInfo.enableEdit = false;
          }
        }

        scope.extendData.onRowSubmit(scope.order);
      };
      scope.openPickupRangeDatePicker = function (assignInfo) {
        if (!assignInfo.enableEdit)
          return;

        if (!scope.rangeTimePanel)
          return;

        if (scope.rangeTimePanel.isShow()) {
          scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          scope.rangeTimePanel.show();
        }

        scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.pickupTimeRange = dateRange;
          assignInfo.pickup_start_time = dateRange.startDate._d;
          assignInfo.pickup_end_time = dateRange.endDate._d;
          console.log('changed');
          console.log(assignInfo.pickup_start_time);
          console.log(assignInfo.pickup_end_time);
          scope.rangeTimePanel.hide();
        });
      };
      scope.openDeliveryRangeDatePicker = function (assignInfo) {
        if (!assignInfo.enableEdit)
          return;

        if (!scope.rangeTimePanel)
          return;

        if (scope.rangeTimePanel.isShow()) {
          scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          scope.rangeTimePanel.show();
        }

        scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.deliveryTimeRange = dateRange;
          assignInfo.delivery_start_time = dateRange.startDate._d;
          assignInfo.delivery_end_time = dateRange.endDate._d;

          scope.rangeTimePanel.hide();
        });
      };
    }
  };
}]);
