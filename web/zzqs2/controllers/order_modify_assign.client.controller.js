angular.module('zhuzhuqs').controller('OrderModifyAssignController',
  ['$scope', '$state', '$stateParams', 'GlobalEvent', 'OrderService', 'CompanyService', 'OrderError',
    function ($scope, $state, $stateParams, GlobalEvent, OrderService, CompanyService, OrderError) {
      var currentOrderId = $stateParams.id;
      if (!currentOrderId) {
        return;
      }

      $scope.order = {};
      $scope.assign_infos = [];
      $scope.selectData = {};
      $scope.rangeTimePanel = {};

      loadPageData();
      function loadPageData() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        loadPartners(function (partners) {
          loadDrivers(function (drivers) {
            var selectData = generateSelectData(partners, drivers);
            $scope.selectData = selectData;
            $scope.rangeTimePanel = $scope.zzRangeDatePicker;
            loadOrderInfo(currentOrderId, selectData.executeSelectData, selectData.executeWarehouseSelectData, function (err) {
              if (err) {
                return handleCompanyError(err);
              }

              $scope.$emit(GlobalEvent.onShowLoading, false);
              return;
            });
          });
        });
      };
      function sortPartnerCompanies(companyA, companyB) {
        var a = companyA.partner._id ? companyA.partner : companyA.company;

        if (a.auth_status && a.auth_status === 'authed') {
          return false;
        }

        return true;
      }
      function loadPartners(callback) {
        CompanyService.getPartnerCompanys().then(function (data) {
          if (data.err) {
            return handleCompanyError(data.err.type);
          }
          data.partnerCompany.sort(sortPartnerCompanies);
          if (callback)
            return callback(data.partnerCompany);


          return;
        }, function (err) {
        });
      };

      //计算好评率和等级
      function calculateEvaluation(companyDrivers) {
        if (!companyDrivers || companyDrivers.length <= 0) {
          return;
        }
        companyDrivers.forEach(function (companyDriver) {
          var evaluation = companyDriver.driver.all_count.evaluationCount;
          var totalCount = evaluation.good + evaluation.general + evaluation.bad;
          if (totalCount < 10) {
            companyDriver.driver.goodEvaluation = 0;
          }
          else {
            companyDriver.driver.goodEvaluation = Math.ceil(evaluation.good * 100 / totalCount);
          }

          if (companyDriver.driver.goodEvaluation >= 80) {
            companyDriver.driver.evaluationLevel = 3;
          }
          else if (companyDriver.driver.goodEvaluation >=60 && companyDriver.driver.goodEvaluation < 80) {
            companyDriver.driver.evaluationLevel = 2;
          }
          else {
            companyDriver.driver.evaluationLevel = 1;
          }

        });
      }
      function sortPartnerDrivers(driverA, driverB) {
        if (driverA.driver.evaluationLevel > driverB.driver.evaluationLevel) {
          return false;
        }
        else if (driverA.driver.evaluationLevel === driverB.driver.evaluationLevel) {
          if (driverA.driver.all_count.orderCount > driverB.driver.all_count.orderCount) {
            return false;
          }
          return true;
        }
        else {
          return true;
        }
      }

      function loadDrivers(callback) {
        CompanyService.getPartnerDrivers().then(function (data) {
          console.log(data);
          if (data.err) {
            return handleCompanyError(data.err.type);
          }

          calculateEvaluation(data.driverCompanys);
          data.driverCompanys.sort(sortPartnerDrivers);
          if (callback)
            return callback(data.driverCompanys);

          return;
        }, function (err) {

        });
      };
      function loadOrderInfo(orderId, executeSelectData, executeWarehouseSelectData, callback) {
        OrderService.getOrderById(orderId)
          .then(function (data) {
            $scope.order = data;
            for (var index = 0; index < data.assigned_infos.length; index++) {
              $scope.assign_infos.push(clone(data.assigned_infos[index]));
            }

            UpdateAssignedInfos($scope.assign_infos, executeSelectData, executeWarehouseSelectData);

            if (callback) {
              callback();
            }

          }, function (err) {
            console.log(err);
            return callback(err);
          })
      };
      function UpdateAssignedInfos(assign_infos, executeSelectData, executeWarehouseSelectData) {
        if (assign_infos.length <= 0) {
          return;
        }

        for (var i = 0; i <= assign_infos.length; i++) {
          updateAssignInfo(assign_infos[i], executeSelectData, executeWarehouseSelectData);
        }
      };
      function updateAssignInfo(assignInfo, executeSelectData, executeWarehouseSelectData) {
        if (!assignInfo)
          return;

        assignInfo.onSelected = updateType;

        assignInfo.pickupTimeRange = {
          startDate: assignInfo.pickup_start_time ? new Date(assignInfo.pickup_start_time) : null,
          endDate: assignInfo.pickup_end_time ? new Date(assignInfo.pickup_end_time) : null
        };

        assignInfo.deliveryTimeRange = {
          startDate: assignInfo.delivery_start_time ? new Date(assignInfo.delivery_start_time) : null,
          endDate: assignInfo.delivery_end_time ? new Date(assignInfo.delivery_end_time) : null
        };

        assignInfo.defaultContent = '搜索合作公司或司机';

        if (assignInfo.type === 'driver') {
          assignInfo.options = executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.options);
        } else if (assignInfo.type === 'warehouse') {
          assignInfo.options = executeWarehouseSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.options);
          assignInfo.defaultContent = '搜索仓库管理员';
        } else {
          assignInfo.options = executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.company_id, assignInfo.options);
        }
      };
      function generateSelectData(partners, drivers) {
        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {

          var currentPartner = partners[i];
          executeSelectData.push({
            key: currentPartner.partner._id ? currentPartner.partner._id : currentPartner.company._id,
            value: currentPartner.partner.name ? currentPartner.partner.name : currentPartner.company.name,
            authed: currentPartner.partner.auth_status ? (currentPartner.partner.auth_status === 'authed') : (currentPartner.company.auth_status === 'authed'),
            group_type: 'company'
          });
        }
        ;

        executeSelectData.push({key: null, value: '合作司机'});
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          executeSelectData.push({
            key: drivers[i].driver._id,
            value: ((drivers[i].driver.nickname === '' ? '匿名' : drivers[i].driver.nickname) + '(' + drivers[i].driver.all_count.orderCount + '单)') + '/'
            + (drivers[i].driver.plate_numbers.length > 0 ? drivers[i].driver.plate_numbers[0] : '未知车牌') + '/'
            + drivers[i].driver.username,
            goodEvaluation: drivers[i].driver.goodEvaluation,
            group_type: 'driver'
          });
          executeWarehouseSelectData.push({
            key: drivers[i].driver._id,
            value: (drivers[i].driver.nickname === '' ? '匿名' : drivers[i].driver.nickname)
            + '/' + drivers[i].driver.username,
            group_type: 'warehouse'
          });
        }
        ;

        return {
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };

      };
      function clone(oldObject) {
        if (typeof(oldObject) != 'object') return oldObject;
        if (oldObject == null) return oldObject;

        var newObject = new Object();
        for (var i in oldObject) {
          newObject[i] = clone(oldObject[i]);
        }

        return newObject;
      }

      function checkChangeAssignInfos() {
        var newAssignInfos = [];
        var isChanged = false;

        for (var index = 0; index < $scope.assign_infos.length; index++) {
          var assignInfo = $scope.assign_infos[index];
          var oldAssignInfo = $scope.order.assigned_infos[index];
          if (checkAssignChanged(assignInfo, oldAssignInfo)) {
            isChanged = true;
          }
        }

        return {newAssignInfos:$scope.assign_infos,isChanged:isChanged};
      }


      //function checkIsRightAssignInfo() {
      //  var isRightInfo = false;
      //
      //  for(var index = 0; index < $scope.assign_infos.length; index ++) {
      //    var assignInfo = $scope.assign_infos[index];
      //
      //    if (assignInfo.currentChoice) {
      //      isRightInfo = true;
      //      break;
      //    }
      //  }
      //
      //  return isRightInfo;
      //}

      function checkAssignChanged(newAssignInfo, oldAssignInfo) {
        if (newAssignInfo.pickup_contact_name !== oldAssignInfo.pickup_contact_name) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_phone !== oldAssignInfo.pickup_contact_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_mobile_phone !== oldAssignInfo.pickup_contact_mobile_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_address !== oldAssignInfo.pickup_contact_address) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_email !== oldAssignInfo.pickup_contact_email) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (newAssignInfo.delivery_contact_name !== oldAssignInfo.delivery_contact_name) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_phone !== oldAssignInfo.delivery_contact_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_mobile_phone !== oldAssignInfo.delivery_contact_mobile_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_address !== oldAssignInfo.delivery_contact_address) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_email !== oldAssignInfo.delivery_contact_email) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.pickup_start_time && !oldAssignInfo.pickup_start_time) {
        }
        else if (!newAssignInfo.pickup_start_time || !oldAssignInfo.pickup_start_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.pickup_start_time).toString() !== new Date(oldAssignInfo.pickup_start_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.pickup_end_time && !oldAssignInfo.pickup_end_time) {
        }
        else if (!newAssignInfo.pickup_end_time || !oldAssignInfo.pickup_end_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.pickup_end_time).toString() !== new Date(oldAssignInfo.pickup_end_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.delivery_start_time && !oldAssignInfo.delivery_start_time) {
        }
        else if (!newAssignInfo.delivery_start_time || !oldAssignInfo.delivery_start_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.delivery_start_time).toString() !== new Date(oldAssignInfo.delivery_start_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.delivery_end_time && !oldAssignInfo.delivery_end_time) {
        }
        else if (!newAssignInfo.delivery_end_time || !oldAssignInfo.delivery_end_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.delivery_end_time).toString() !== new Date(oldAssignInfo.delivery_end_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (newAssignInfo.driver_id !== oldAssignInfo.driver_id) {
          newAssignInfo.executorChanged = true;
        }
        else if (newAssignInfo.company_id !== oldAssignInfo.company_id) {
          newAssignInfo.executorChanged = true;
        }

        if (newAssignInfo.basicInfoChanged || newAssignInfo.executorChanged) {
          return true;
        }

        return false;
      }

      //function checkAssignInfo(){
      //  var isChanged = false;
      //
      //  for(var index = 0; index < $scope.assign_infos.length; index ++) {
      //    var newAssignInfo = $scope.assign_infos[index];
      //    var oldAssignInfo = $scope.order.assigned_infos[index];
      //
      //    if (newAssignInfo.pickup_contact_name !== oldAssignInfo.pickup_contact_name){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_phone !== oldAssignInfo.pickup_contact_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_mobile_phone !== oldAssignInfo.pickup_contact_mobile_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_address !== oldAssignInfo.pickup_contact_address){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_email !== oldAssignInfo.pickup_contact_email){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (newAssignInfo.delivery_contact_name !== oldAssignInfo.delivery_contact_name){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_phone !== oldAssignInfo.delivery_contact_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_mobile_phone !== oldAssignInfo.delivery_contact_mobile_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_address !== oldAssignInfo.delivery_contact_address){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_email !== oldAssignInfo.delivery_contact_email){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.pickup_start_time && !oldAssignInfo.pickup_start_time){
      //    }
      //    else if (!newAssignInfo.pickup_start_time || !oldAssignInfo.pickup_start_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.pickup_start_time).toString() !== new Date(oldAssignInfo.pickup_start_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.pickup_end_time && !oldAssignInfo.pickup_end_time){
      //    }
      //    else if (!newAssignInfo.pickup_end_time || !oldAssignInfo.pickup_end_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.pickup_end_time).toString() !== new Date(oldAssignInfo.pickup_end_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.delivery_start_time && !oldAssignInfo.delivery_start_time){
      //    }
      //    else if (!newAssignInfo.delivery_start_time || !oldAssignInfo.delivery_start_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.delivery_start_time).toString() !== new Date(oldAssignInfo.delivery_start_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.delivery_end_time && !oldAssignInfo.delivery_end_time){
      //    }
      //    else if (!newAssignInfo.delivery_end_time || !oldAssignInfo.delivery_end_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.delivery_end_time).toString() !== new Date(oldAssignInfo.delivery_end_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (newAssignInfo.driver_id !== oldAssignInfo.driver_id) {
      //      newAssignInfo.executorChanged = true;
      //    }
      //    else if (newAssignInfo.company_id !== oldAssignInfo.company_id) {
      //      newAssignInfo.executorChanged = true;
      //    }
      //
      //    if (newAssignInfo.basicInfoChanged || newAssignInfo.executorChanged) {
      //      isChanged = true;
      //    }
      //
      //  }
      //
      //  return isChanged;
      //}

      function handleOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, "未知错误！请联系管理员");
        }
      }

      $scope.contactEdit = {
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

      $scope.changeType = function (assignInfo) {
        assignInfo.currentText = '';
        assignInfo.currentChoice = null;

        if (assignInfo.type === 'driver' || assignInfo.type === 'company') {
          assignInfo.type = 'warehouse';
          assignInfo.defaultContent = '搜索仓库管理员';
          assignInfo.options = $scope.selectData.executeWarehouseSelectData
        }
        else {
          assignInfo.type = 'driver';
          assignInfo.defaultContent = '搜索合作公司或司机';
          assignInfo.options = $scope.selectData.executeSelectData
        }
      };

      $scope.editAssignDetailInfo = function (assignInfo) {
        $scope.contactEdit.isOpen = true;
        $scope.contactEdit.current.assignInfo = assignInfo;
        $scope.contactEdit.current.pickupName = assignInfo.pickup_contact_name;
        $scope.contactEdit.current.deliveryName = assignInfo.delivery_contact_name;
        $scope.contactEdit.current.pickupMobilePhone = assignInfo.pickup_contact_mobile_phone;
        $scope.contactEdit.current.deliveryMobilePhone = assignInfo.delivery_contact_mobile_phone;
        $scope.contactEdit.current.pickupPhone = assignInfo.pickup_contact_phone;
        $scope.contactEdit.current.deliveryPhone = assignInfo.delivery_contact_phone;
      };

      $scope.closeAssignDetailInfo = function () {
        $scope.contactEdit.isOpen = false;
      };

      $scope.saveAssignDetailInfo = function () {
        $scope.contactEdit.current.assignInfo.pickup_contact_name = $scope.contactEdit.current.pickupName;
        $scope.contactEdit.current.assignInfo.pickup_contact_mobile_phone = $scope.contactEdit.current.pickupMobilePhone;
        $scope.contactEdit.current.assignInfo.pickup_contact_phone = $scope.contactEdit.current.pickupPhone;
        $scope.contactEdit.current.assignInfo.delivery_contact_name = $scope.contactEdit.current.deliveryName;
        $scope.contactEdit.current.assignInfo.delivery_contact_mobile_phone = $scope.contactEdit.current.deliveryMobilePhone;
        $scope.contactEdit.current.assignInfo.delivery_contact_phone = $scope.contactEdit.current.deliveryPhone;
        $scope.contactEdit.isOpen = false;
      };

      $scope.cancelAndBack = function () {
        $state.go('order_follow', {}, {reload: true});
      };


      $scope.openPickupRangeDatePicker = function (assignInfo) {

        if (!$scope.rangeTimePanel)
          return;

        if ($scope.rangeTimePanel.isShow()) {
          $scope.rangeTimePanel.hide();
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
          $scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          $scope.rangeTimePanel.show();
        }

        $scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.pickupTimeRange = dateRange;
          assignInfo.pickup_start_time = moment(dateRange.startDate).toISOString();
          assignInfo.pickup_end_time = moment(dateRange.endDate).toISOString();
          console.log('changed');
          console.log(assignInfo.pickup_start_time);
          console.log(assignInfo.pickup_end_time);
          $scope.rangeTimePanel.hide();
        });
      };
      $scope.openDeliveryRangeDatePicker = function (assignInfo) {

        if (!$scope.rangeTimePanel)
          return;

        if ($scope.rangeTimePanel.isShow()) {
          $scope.rangeTimePanel.hide();
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
          $scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          $scope.rangeTimePanel.show();
        }

        $scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.deliveryTimeRange = dateRange;
          assignInfo.delivery_start_time = moment(dateRange.startDate).toISOString();
          assignInfo.delivery_end_time = moment(dateRange.endDate).toISOString();

          $scope.rangeTimePanel.hide();
        });
      };

      $scope.submitOrderAssignInfos = function () {
        var info = checkChangeAssignInfos();
        console.log(info);

        if (!info.isChanged) {
          $state.go('order_follow', {}, {reload: true});
          return;
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);

        info.newAssignInfos.forEach(function (assignInfo) {
          delete assignInfo.$$hashKey;
          delete assignInfo.currentChoice;
          delete assignInfo.options;
        });

        OrderService.updateOrderAssign($scope.order._id.toString(), info.newAssignInfos).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          $scope.$emit(GlobalEvent.onShowAlert, '修改成功');

          //保存
          $state.go('order_follow', {}, {reload: true});

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          return handleOrderError(err.type);
        });
      };

      $scope.dateTransport = function (dateString) {
        return new Date(dateString);
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
        } else if (option.group_type === 'company') {
          this.company_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
        }
        return;
      };

      function findOption(key, options) {
        var result = null;
        for (var i = 0; i < options.length; i++) {
          if (options[i].key === key)
            result = options[i];
        }
        return result;
      };

      function handleCompanyError(errType) {
        console.log(errType);
      };

    }
  ])
;
