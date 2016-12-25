angular.module('zhuzhuqs').controller('OrderAssignController',
  ['$rootScope', '$scope', '$state', 'OrderService', 'CompanyService', 'OrderError', 'GlobalEvent', 'CompanyError', 'UserProfileService', 'OrderHelper',
    function ($rootScope, $scope, $state, OrderService, CompanyService, OrderError, GlobalEvent, CompanyError, UserProfileService, OrderHelper) {
      $scope.orders = {
        config: {
          selectOptions: [
            {
              key: '运单号',
              value: {
                name: '运单号',
                value: 'order_number',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '参考单号',
              value: {
                name: '参考单号',
                value: 'ref_number',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '订单号',
              value: {
                name: '订单号',
                value: 'original_order_number',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: false
            }
            , {
              key: '货物名称',
              value: {
                name: '货物名称',
                value: 'goods_name',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: true
            }, {
              key: '件重体',
              value: {
                name: '件/重/体',
                value: 'count_weight_volume',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '提货时间',
              value: {
                name: '提货时间',
                value: 'pickup_start_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '交货时间',
              value: {
                name: '交货时间',
                value: 'delivery_start_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '发货方',
              value: {
                name: '发货方',
                value: 'sender_name',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            },
            {
              key: '收货方',
              value: {
                name: '收货方',
                value: 'receiver_name',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }, {
              key: '备注',
              value: {
                name: '备注',
                value: 'description',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }, {
              key: '状态',
              value: {
                name: '状态',
                value: 'status',
                isSort: false,
                isSearch: false,
                columnWidth: 1
              },
              isSelected: true
            }, {
              key: '分配时间',
              value: {
                name: '分配时间',
                value: 'assign_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }],
          rowExpand: {
            enable: true,
            expandText: '分配',
            cancelText: '取消',
            selfCloseButton: true
          },
          selectionOption: {
            columnWidth: 1
          },
          handleOption: {
            columnWidth: 2
          },
          fields: [],
          fields_length: 7,
          isShowPagination: true,
          pagination: {
            currentPage: 1,
            currentLimit: 10,
            limit: 10,
            totalCount: 0,
            pageCount: 0,
            pageNavigationCount: 5,
            canSeekPage: true,
            limitArray: [10, 20, 30, 40, 100],
            pageList: [1],
            sortName: '',
            sortValue: '',
            searchName: '',
            searchValue: '',
            onCurrentPageChanged: function (callback) {
              if ($scope.orders.config.pagination.currentLimit !== $scope.orders.config.pagination.limit) {
                $scope.orders.config.pagination.currentLimit = $scope.orders.config.pagination.limit;
                onSaveMaxPageCount('max_page_count_assign', $scope.orders.config.pagination.limit);
              }

              loadOrders(callback($scope.orders.config.pagination));
            }
          },
          rows: [],
          events: {
            selectedHandler: [onSelected],
            rowClickHandler: [onRowClick],
            rowDeleteHandler: [onRowDelete],
            rowInfoEditHandler: [onRowInfoEdit],
            headerSortChangedHandler: [onHeaderSortChanged],
            headerKeywordsChangedHandler: [onHeaderKeywordsChanged],
            updateDisplayFields: [onUpdateDisplayFields],
            saveDisplayFields: [onSaveDisplayFields]
          },
          extendData: {
            partnerCompanies: [],
            partnerDrivers: [],
            rangeTimePanel: null,
            onRowSubmit: function (order) {
              orderAssign(order);
            }
          }
        },
        isShowBatchAssign: false,
        isShowBatchDelete: false,
        currentOrderList: []
      };

      $scope.patchAssignInfo = {
        count: 0,
        partnerType: '',
        partnerId: '',
        partnerName: '',
        is_wechat: false,
        enableEdit: false,
        selectedOrders: [],
        isWarehouse: false,
        isRoadOrder: false,
        driverOptions: [],
        selectOptions: [],
        warehouseOptions: [],
        defaultContent: '搜索合作公司或司机',
        options: [],
        onSelected: selectPatchAssignPartner
      };

      function getUserProfile(callback) {
        UserProfileService.getUserProfile().then(function (data) {
          if (!data) {
            console.log('get user profile failed');
            return callback();
          }
          if (data.err) {
            console.log(data.err);
            return callback();
          }

          if (!data.user_profile) {
            console.log('customer do not has user profile content');
            return callback();
          }

          if (!data.user_profile.customize_columns_assign || data.user_profile.customize_columns_assign.length <= 0) {
            console.log('customer did not create customer profile until now');
          }
          else {
            var currentOption, i;
            for (i = 0; i < $scope.orders.config.selectOptions.length; i++) {
              currentOption = $scope.orders.config.selectOptions[i];
              currentOption.isSelected = false;
            }

            data.user_profile.customize_columns_assign.forEach(function (columnName) {
              for (i = 0; i < $scope.orders.config.selectOptions.length; i++) {
                currentOption = $scope.orders.config.selectOptions[i];

                if (currentOption.key === columnName) {
                  currentOption.isSelected = true;
                  break;
                }
              }
            });
          }

          if (data.user_profile.max_page_count_assign) {
            $scope.orders.config.pagination.limit = parseInt(data.user_profile.max_page_count_assign) || $scope.orders.config.pagination.limit;
            $scope.orders.config.pagination.currentLimit = $scope.orders.config.pagination.limit;
          }

          return callback();
        }, function (err) {
          console.log(err);
          return callback();
        });
      }

      function fillDisplayFields() {
        if (!$scope.orders.config.selectOptions || $scope.orders.config.selectOptions.length <= 0) {
          return;
        }

        $scope.orders.config.fields = [];
        $scope.orders.config.selectOptions.forEach(function (optionItem) {
          if (optionItem.isSelected) {
            $scope.orders.config.fields.push(optionItem.value);
          }
        });

        if ($scope.orders.config.fields.length > $scope.orders.config.fields_length) {
          $scope.orders.config.fields = $scope.orders.config.fields.slice(0, $scope.orders.config.fields_length);
        }
      }

      function generateFieldsColumn(currentOrder) {
        var rowData = {};

        $scope.orders.config.fields.forEach(function (fieldItem) {
          switch (fieldItem.value) {
            case 'order_number':
              rowData.order_number = currentOrder.order_number;
              break;
            case 'ref_number':
              rowData.ref_number = currentOrder.refer_order_number ? currentOrder.refer_order_number : '未填';
              break;
            case 'original_order_number':
              rowData.original_order_number = currentOrder.original_order_number ? currentOrder.original_order_number : '未填';
              break;
            case 'goods_name':
              rowData.goods_name = OrderHelper.getGoodsNameString(currentOrder);
              break;
            case 'count_weight_volume':
              rowData.count_weight_volume = OrderHelper.getCountDetail(currentOrder);
              break;
            case 'pickup_start_time':
              rowData.pickup_start_time = currentOrder.pickup_start_time ? new Date(currentOrder.pickup_start_time).Format('yy/MM/dd hh:mm') : '未填';
              break;
            case 'delivery_start_time':
              rowData.delivery_start_time = currentOrder.delivery_start_time ? new Date(currentOrder.delivery_start_time).Format('yy/MM/dd hh:mm') : '未填';
              break;
            case 'sender_name':
              rowData.sender_name = currentOrder.sender_name ? currentOrder.sender_name : '未填';
              break;
            case 'receiver_name':
              rowData.receiver_name = currentOrder.receiver_name ? currentOrder.receiver_name : '未填';
              break;
            case 'description':
              rowData.description = currentOrder.description ? currentOrder.description : '未填';
              break;
            case 'status':
              rowData.status = generateOrderStatus(currentOrder.status, currentOrder.delete_status);
              break;
            case 'assign_time':
              rowData.assign_time = (currentOrder.assign_time ? new Date(currentOrder.assign_time).Format('yyyy-MM-dd hh:mm:ss') : '无');
              break;
            default:
              break;
          }
        });

        return rowData;
      }

      function onUpdateDisplayFields() {
        fillDisplayFields();

        if ($scope.orders.currentOrderList && $scope.orders.currentOrderList.length > 0) {
          renderOrderListRows($scope.orders.currentOrderList);
        }
      }

      function onSaveDisplayFields() {
        var columnFields = [];
        var currentOption;
        for (var i = 0; i < $scope.orders.config.selectOptions.length; i++) {
          currentOption = $scope.orders.config.selectOptions[i];

          if (currentOption.isSelected) {
            columnFields.push(currentOption.key);
          }
        }

        if (columnFields.length > 0) {
          UserProfileService.setAssignCustomizeColumns(columnFields).then(function (data) {
            if (!data) {
              console.log('set customize columns failed');
              return;
            }
            if (data.err) {
              console.log(data.err);
              return;
            }

          }, function (err) {
            console.log(err);
          });
        }
      }

      function onSaveMaxPageCount(columnName, pageCount) {
        UserProfileService.setMaxPageCount({column_name: columnName, max_page_count: pageCount}).then(function (data) {
          if (!data || data.err) {
            return console.log('set assign page max count failed');
          }

          console.log('set assign page max count success');
        }, function (err) {
          return console.log('set assign page max count failed');
        });
      }

      function generateOrderStatus(status, isDelete) {
        if (isDelete) {
          return '已撤销';
        }

        var statusText = getStatusString(status);
        return statusText ? statusText : '已完成';
      };
      function getStatusString(status) {
        var statusString = '';

        switch (status) {
          case 'unAssigned':
            statusString = '未分配';
            break;
          case 'assigning':
            statusString = '分配中';
            break;
          case 'unPickupSigned':
          case 'unPickuped':
            statusString = '未提货';
            break;
          case 'unDeliverySigned':
          case 'unDeliveried':
            statusString = '未交货';
            break;
          case 'pickupSign':
            statusString = '提货签到';
            break;
          case 'pickup':
            statusString = '提货';
            break;
          case 'deliverySign':
            statusString = '交货签到';
            break;
          case 'delivery':
            statusString = '交货';
            break;
          case 'halfway':
            statusString = '中途事件';
            break;
          case 'completed':
            statusString = '已完成';
            break;
          default:
            break;
        }

        return statusString;
      }

      $scope.changePartnerType = function () {
        if (!$scope.patchAssignInfo.enableEdit) {
          return;
        }
        if ($scope.patchAssignInfo.isRoadOrder) {
          return;
        }

        $scope.patchAssignInfo.isWarehouse = !$scope.patchAssignInfo.isWarehouse;

        if ($scope.patchAssignInfo.isWarehouse) {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.warehouseOptions;
          $scope.patchAssignInfo.partnerType = 'warehouse';
          $scope.patchAssignInfo.defaultContent = '搜索仓库管理员';
        }
        else {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机';
        }

      };
      $scope.changeRoadOrder = function () {
        if (!$scope.patchAssignInfo.enableEdit) {
          return;
        }
        if ($scope.patchAssignInfo.isWarehouse) {
          return;
        }

        $scope.patchAssignInfo.isRoadOrder = !$scope.patchAssignInfo.isRoadOrder;

        if ($scope.patchAssignInfo.isRoadOrder) {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.driverOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作司机';
        }
        else {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机';
        }

      };

      function selectPatchAssignPartner(option) {
        if (!option) {
          option = {
            key: '',
            value: ''
          };
        }
        $scope.patchAssignInfo.partnerId = option.key;
        $scope.patchAssignInfo.partnerName = option.value;
        $scope.patchAssignInfo.partnerType = option.group_type;
        $scope.patchAssignInfo.is_wechat = option.is_wechat || false;
      }

      function generateSelectData(partners, driverCompanies) {
        var executeDriverData = [];
        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {
          var currentPartner = partners[i];
          executeSelectData.push(OrderHelper.getCompanyAssignOption(currentPartner));
        }

        //提供给路单使用
        executeDriverData.push({key: null, value: '合作司机'});
        //合作公司和合作司机
        executeSelectData.push({key: null, value: '合作司机'});
        //仓储运单使用
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < driverCompanies.length; i++) {
          if (driverCompanies[i].driver && driverCompanies[i].driver.is_signup) {//邀请司机的时候直接建立了关联，此时司机不存在，不应该加进去
            executeDriverData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'driver'));
            executeSelectData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'warehouse'));
          }
        }

        //executeDriverData.push({key: null, value: '微信司机'});
        //executeSelectData.push({key: null, value: '微信司机'});
        //executeWarehouseSelectData.push({key: null, value: '微信仓库管理员'});
        //for (var i = 0; i < driverCompanies.length; i++) {
        //  //如果绑定了微信
        //  if (driverCompanies[i].driver && driverCompanies[i].driver.wechat_profile && driverCompanies[i].driver.wechat_profile.openid) {
        //    executeDriverData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'driver'));
        //    executeSelectData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'driver'));
        //    executeWarehouseSelectData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'warehouse'));
        //  }
        //}

        return {
          executeDriverData: executeDriverData,
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };
      }

      $scope.orderBatchDelete = function () {
        if (!$scope.orders.isShowBatchDelete) {
          return;
        }
        if ($scope.patchAssignInfo.selectedOrders.length <= 0) {
          return;
        }

        $scope.$emit(GlobalEvent.onShowAlertConfirm, '确认要删除这' + $scope.patchAssignInfo.selectedOrders.length + '项运单吗？', function (param) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          var order_ids = [];
          for (var index = 0; index < $scope.patchAssignInfo.selectedOrders.length; index++) {
            var currentOrder = $scope.patchAssignInfo.selectedOrders[index];
            order_ids.push(currentOrder._id);
          }

          OrderService.batchDeleteOrders(order_ids).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);

            if (!data) {
              return handleOrderError('');
            }
            if (data.err) {
              return handleOrderError(data.err.type);
            }

            var showTip = '删除成功';
            if (data.failedOrders && data.failedOrders.length > 0) {
              showTip = '操作完成，失败' + data.failedOrders.length + '个';
            }
            $scope.$emit(GlobalEvent.onShowAlert, showTip, function () {
              $state.go('order_assign', {}, {reload: true});
            });

          }, function (err) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            console.log(err);
          });

        }, null);
      };

      $scope.orderPatchAssign = function () {
        if ($scope.patchAssignInfo.selectedOrders.length <= 0) {
          return;
        }

        if (!$scope.patchAssignInfo.partnerId || $scope.patchAssignInfo.partnerId === '') {
          return;
        }

        if (!$scope.patchAssignInfo.partnerType || $scope.patchAssignInfo.partnerType === '') {
          return;
        }

        if ($scope.patchAssignInfo.isRoadOrder) {
          $scope.$emit(GlobalEvent.onShowAlertPrompt, {
            tipText: '设置路单号：',
            placeholderText: '输入您要设置的路单号（选填）',
            sure: '开始分配'
          }, function (inputContent) {
            orderPatchAssign(inputContent);
          });
        }
        else {
          orderPatchAssign();
        }
      };

      function orderPatchAssign(inputContent) {
        var assignInfo = {
          type: $scope.patchAssignInfo.partnerType,
          partner_name: $scope.patchAssignInfo.partnerName,
          is_wechat: $scope.patchAssignInfo.is_wechat,
          order_ids: [],
          road_order_name: inputContent
        };

        if (assignInfo.type === 'company') {
          assignInfo.company_id = $scope.patchAssignInfo.partnerId;
        }
        else {
          assignInfo.driver_id = $scope.patchAssignInfo.partnerId;
        }

        for (var i = 0; i < $scope.patchAssignInfo.selectedOrders.length; i++) {
          assignInfo.order_ids.push($scope.patchAssignInfo.selectedOrders[i]._id);
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.batchAssign(assignInfo).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            console.log(data.err);
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, '分配成功');
            $state.go('order_assign', {}, {reload: true});
          }
        }, function (err) {
          console.log(err);
        });
      }

      function orderAssign(order) {
        var order_id = order._id;
        var new_order_number = order.new_order_number;

        var assign_infos = order.extendData.assignInfos;

        var isValid = true;
        for (var i = 0; i < assign_infos.length; i++) {
          var currentAssignInfo = assign_infos[i];
          if (submitValid(currentAssignInfo) == false) {
            isValid = false;
            break;
          }

          currentAssignInfo.pickupTimeRange = '';
          currentAssignInfo.deliveryTimeRange = '';
          if (currentAssignInfo.pickup_start_time && currentAssignInfo.pickup_start_time.toISOString) {
            currentAssignInfo.pickup_start_time = currentAssignInfo.pickup_start_time.toISOString();
          }
          if (currentAssignInfo.pickup_end_time && currentAssignInfo.pickup_end_time.toISOString) {
            currentAssignInfo.pickup_end_time = currentAssignInfo.pickup_end_time.toISOString();
          }

          if (currentAssignInfo.delivery_start_time && currentAssignInfo.delivery_start_time.toISOString) {
            currentAssignInfo.delivery_start_time = currentAssignInfo.delivery_start_time.toISOString();
          }
          if (currentAssignInfo.delivery_end_time && currentAssignInfo.delivery_end_time.toISOString) {
            currentAssignInfo.delivery_end_time = currentAssignInfo.delivery_end_time.toISOString();
          }

          delete currentAssignInfo.$$hashKey;
          delete currentAssignInfo.currentChoice;
          delete currentAssignInfo.options;
        }

        if (!isValid) {
          $scope.$emit(GlobalEvent.onShowAlert, "分配信息有误，请分配给司机或供应商或者仓库管理员");
          return;
        }

        if (order.extendData.assign_status == 'assigning') {
          continueAssign(order_id, assign_infos);
        }
        else {
          firstAssign(order_id, new_order_number, assign_infos);
        }
      };

      function onRowClick(row) {
        console.log('onRowClick');
        console.log(row);
      }

      function onSelected(selectedOrders) {
        $scope.patchAssignInfo.count = selectedOrders.length;
        $scope.patchAssignInfo.selectedOrders = selectedOrders;
        if (selectedOrders && selectedOrders.length > 0) {
          $scope.orders.isShowBatchAssign = true;
          $scope.patchAssignInfo.enableEdit = true;
          $scope.orders.isShowBatchDelete = true;

          for (var index = 0; index < selectedOrders.length; index++) {
            var currentOrder = selectedOrders[index];
            if (currentOrder.rowConfig.unEdited) {
              $scope.orders.isShowBatchDelete = false;
              break;
            }
          }
        }
        else {
          $scope.orders.isShowBatchAssign = false;
          $scope.patchAssignInfo.enableEdit = false;
          $scope.orders.isShowBatchDelete = false;
        }

        console.log(selectedOrders);
      }

      function onRowInfoEdit(row) {
        console.log('on row info edit');

        var modifyOrder = {
          order_id: row._id,
          order_number: row.columns.order_number,
          refer_order_number: row.extendData.detail.refer_order_number,
          original_order_number: row.extendData.detail.original_order_number,
          goods_name: (row.columns.goods_name === '未填' ? '' : row.columns.goods_name),

          count: row.extendData.detail.count,
          weight: row.extendData.detail.weight,
          volume: row.extendData.detail.volume,

          count_unit: row.extendData.detail.count_unit,
          weight_unit: row.extendData.detail.weight_unit,
          volume_unit: row.extendData.detail.volume_unit,
          freight_charge: row.extendData.detail.freight_charge,


          customer_name: row.extendData.detail.customer_name,
          pickup_start_time: row.extendData.detail.pickup_start_time,
          delivery_start_time: row.extendData.detail.delivery_start_time,
          pickup_end_time: row.extendData.detail.pickup_end_time,
          delivery_end_time: row.extendData.detail.delivery_end_time,
          description: row.extendData.detail.description,
          group_id: row.extendData.detail.execute_group,

          //contacts
          pickup_contact_name: row.extendData.detail.pickup_contact_name,
          pickup_contact_phone: row.extendData.detail.pickup_contact_phone,
          pickup_contact_mobile_phone: row.extendData.detail.pickup_contact_mobile_phone,
          pickup_contact_address: row.extendData.detail.pickup_contact_address,
          pickup_contact_email: '',

          delivery_contact_name: row.extendData.detail.delivery_contact_name,
          delivery_contact_phone: row.extendData.detail.delivery_contact_phone,
          delivery_contact_mobile_phone: row.extendData.detail.delivery_contact_mobile_phone,
          delivery_contact_address: row.extendData.detail.delivery_contact_address,
          delivery_contact_email: '',

          sender_name: row.extendData.detail.sender_name,
          receiver_name: row.extendData.detail.receiver_name,
          receiver_company: row.extendData.detail.receiver_company,
          sender_company: row.extendData.detail.sender_company

        };
        console.log(modifyOrder);
        $state.go('order_create', {order: JSON.stringify(modifyOrder), modify_type: 'normal', title: '修改运单'});
      }

      function onRowDelete(row) {
        console.log('on row delete');
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要删除吗？", function (param) {
          OrderService.deleteUnAssignedOrder(param._id).then(function (data) {
            console.log(data);
            $state.go('order_assign', {}, {reload: true});
          }, function (err) {
            console.log(err);
          })
        }, row);
        console.log(row);
      }

      function onHeaderKeywordsChanged(field) {
        $scope.orders.config.pagination.searchName = field.value;
        $scope.orders.config.pagination.searchValue = field.keyword;
        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      }

      function onHeaderSortChanged(field) {
        $scope.orders.config.pagination.sortName = field.value;
        $scope.orders.config.pagination.sortValue = field.curSort.value;
        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      }

      var phoneRegex = /\d{11}/;

      function submitValid(currentAssignInfo) {
        if (!currentAssignInfo)
          return false;

        if (currentAssignInfo.type === 'driver' || currentAssignInfo.type === 'warehouse') {
          if (currentAssignInfo.driver_id) {
            return true;
          }
          else if (currentAssignInfo.currentText && phoneRegex.test(currentAssignInfo.currentText)) {
            currentAssignInfo.driver_username = currentAssignInfo.currentText;
            return true;
          }
          else {
            return false;
          }
        }
        else {
          if (!currentAssignInfo.company_id && currentAssignInfo.currentText && phoneRegex.test(currentAssignInfo.currentText)) {
            currentAssignInfo.type = 'driver';
            currentAssignInfo.driver_username = currentAssignInfo.currentText;
          }
          return true;
        }
      }

      $scope.orderInfo = {
        curOrder: {},
        curPath: [],
        showAssignDialog: false,
        partnerCompanys: [],
        partnerDrivers: [],
        selectedPartner: null,
        PickUpMinTime: '',
        deliveryMinTime: '',
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
          timePickerIncrement: 1,
          timePicker12Hour: false,
          separator: "~",
          format: 'YYYY-MM-DD HH:mm:ss',
          opens: 'right'
        }
      };

      $scope.clickPartner = function () {
        console.log($scope.orderInfo.selectedPartner);
        var obj = null;
        if ($scope.orderInfo.selectedPartner) {
          obj = JSON.parse($scope.orderInfo.selectedPartner)
        }
        if (obj) {
          var path = $scope.orderInfo.curPath;
          if (obj['driver']) {
            path.driver_id = obj.driver._id;
            path.partner_name = obj.driver.username;
            path.type = 'driver';
          }
          else {
            path.company_id = obj.company._id ? obj.company._id : obj.partner._id;
            path.partner_name = obj.company._id ? obj.company.name : obj.partner.name;
            path.type = 'company';
          }
        }
      };

      function loadPageData() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        loadPartners(function (partners) {
          loadDrivers(function (drivers) {
            var options = generateSelectData(partners, drivers);
            $scope.patchAssignInfo.driverOptions = options.executeDriverData;
            $scope.patchAssignInfo.selectOptions = options.executeSelectData;
            $scope.patchAssignInfo.warehouseOptions = options.executeWarehouseSelectData;
            $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
            $scope.patchAssignInfo.partnerType = 'driver';
            $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机 ';
            $scope.changePartnerType();

            loadOrders(function () {
              $scope.$emit(GlobalEvent.onShowLoading, false);
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
            handleCompanyError(data.err.type);
          }
          else {
            data.partnerCompany.sort(sortPartnerCompanies);
            $scope.orderInfo.partnerCompanys = data.partnerCompany;
            $scope.orders.config.extendData.partnerCompanies = data.partnerCompany;
          }

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
          else if (companyDriver.driver.goodEvaluation >= 60 && companyDriver.driver.goodEvaluation < 80) {
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
            handleCompanyError(data.err.type);
          }
          else {
            calculateEvaluation(data.driverCompanys);
            data.driverCompanys.sort(sortPartnerDrivers);
            $scope.orderInfo.partnerDrivers = data.driverCompanys;
            $scope.orders.config.extendData.partnerDrivers = data.driverCompanys;
          }

          if (callback)
            return callback(data.driverCompanys);

          return;
        }, function (err) {

        });
      }

      function loadOrders(callback) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        var searchArray = getSearchCondition();
        OrderService.getUnsignedOrder(
          $scope.orders.config.pagination.currentPage,
          $scope.orders.config.pagination.limit,
          $scope.orders.config.pagination.sortName,
          $scope.orders.config.pagination.sortValue,
          searchArray
          //$scope.orders.config.pagination.searchName,
          //$scope.orders.config.pagination.searchValue

          )
          .then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);
            if (data.err) {
              handleOrderError(data.err.type);
              return;
            }
            else {
              $scope.orders.currentOrderList = data.orders;
              renderOrderListRows(data.orders);

              $scope.orders.config.pagination.limit = parseInt(data.limit);
              $scope.orders.config.pagination.totalCount = data.totalCount;
              $scope.orders.config.pagination.currentPage = parseInt(data.currentPage);
              $scope.orders.config.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
              $scope.orders.config.pagination.render();
              $scope.orders.config.extendData.rangeTimePanel = $scope.zzRangeDatePicker;

              if (callback)
                return callback();

              return;
            }
          }, function (err) {

          });
      }

      function renderOrderListRows(orders) {
        $scope.orders.config.rows.splice(0, $scope.orders.config.rows.length);
        if (orders.length === 0) {
          return;
        }

        for (var i = 0; i < orders.length; i++) {
          var currentOrder = orders[i];
          $scope.orders.config.rows.push({
            _id: currentOrder._id,
            columns: generateFieldsColumn(currentOrder),
            extendData: {
              status: currentOrder.status,
              assign_status: currentOrder.assign_status,
              assignInfos: currentOrder.assigned_infos,
              detail: {
                parent_order: currentOrder.parent_order,
                order_number: currentOrder.order_number,
                refer_order_number: currentOrder.refer_order_number,
                original_order_number: currentOrder.original_order_number,
                goods_name: currentOrder.goods_name,
                pickup_contact_name: currentOrder.pickup_contacts.name,
                pickup_contact_phone: currentOrder.pickup_contacts.phone,
                pickup_contact_mobile_phone: currentOrder.pickup_contacts.mobile_phone,
                pickup_contact_address: currentOrder.pickup_contacts.address,
                delivery_contact_name: currentOrder.delivery_contacts.name,
                delivery_contact_phone: currentOrder.delivery_contacts.phone,
                delivery_contact_mobile_phone: currentOrder.delivery_contacts.mobile_phone,
                delivery_contact_address: currentOrder.delivery_contacts.address,
                pickup_start_time: currentOrder.pickup_start_time,
                pickup_end_time: currentOrder.pickup_end_time,
                delivery_start_time: currentOrder.delivery_start_time,
                delivery_end_time: currentOrder.delivery_end_time,
                customer_name: currentOrder.customer_name,
                create_user: currentOrder.create_user,
                create_group: currentOrder.create_group,
                execute_group: currentOrder.execute_group,
                description: currentOrder.description,
                count: currentOrder.count,
                weight: currentOrder.weight,
                volume: currentOrder.volume,
                count_unit: currentOrder.count_unit,
                weight_unit: currentOrder.weight_unit,
                volume_unit: currentOrder.volume_unit,
                freight_charge: currentOrder.freight_charge,
                details: currentOrder.details,
                receiver_name: currentOrder.receiver_name,
                sender_name: currentOrder.sender_name,
                receiver_company: currentOrder.receiver_company,
                sender_company: currentOrder.sender_company
              }
            },
            rowConfig: {
              notOptional: (currentOrder.status !== 'unAssigned'),
              unEdited: true,//(currentOrder.create_company._id !== currentOrder.execute_company) || currentOrder.status !== 'unAssigned',
              expand: true,
              expandText: currentOrder.assign_status === 'assigning' ? '继续分配' : '分配'
            }
          });
        }
        ;
        $scope.orders.config.load();
      };

      function firstAssign(order_id, new_order_number, assign_infos) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.assignOrder({
          order_id: order_id,
          assign_infos: assign_infos,
          new_order_number: new_order_number
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, '分配成功');
            //$state.go('order_assign', {}, {reload: true});
            $scope.searchModule.searchHandle();
          }
        }, function (err) {
          console.log(err);
        });
      }

      function continueAssign(order_id, assign_infos) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.continueAssignOrder({
          order_id: order_id,
          assign_infos: assign_infos
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, " 分配成功");
            //$state.go('order_assign', {}, {reload: true});
            $scope.searchModule.searchHandle();
          }
        }, function (err) {
          console.log(err);
        });
      }

      function handleCompanyError(errType) {

        if (CompanyError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, CompanyError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");

        }

      }

      function handleOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");

        }
      }


      //搜素模块
      $scope.searchModule = {
        isShowHighSearch: false,
        showHighSearchHandle: '',
        hideHighSearchHandle: '',
        receiver: '',
        goods_name: '',
        sender: '',
        description: '',
        order_number: '',
        searchHandle: '',

        createTimeRange: '',
        pickUpTimeRange: '',
        deliveryTimeRange: '',
        cleanDeliveryTime: '',
        cleanPickupTime: '',

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
          format: 'YY/MM/DD HH:mm'
        }
      };

      $scope.searchModule.showHighSearchHandle = function () {
        $scope.searchModule.isShowHighSearch = true;
      };
      $scope.searchModule.hideHighSearchHandle = function () {
        $scope.searchModule.isShowHighSearch = false;
      };

      $scope.searchModule.searchHandle = function () {
        $scope.orders.config.pagination.currentPage = 1;

        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      };

      function getSearchCondition() {
        if (!$scope.searchModule)
          return;

        var searchArray = [];

        if ($scope.searchModule.createTimeRange) {

          searchArray.push({
            key: 'createTimeStart',
            value: moment($scope.searchModule.createTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'createTimeEnd',
            value: moment($scope.searchModule.createTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.deliveryTimeRange) {

          searchArray.push({
            key: 'planDeliveryTimeStart',
            value: moment($scope.searchModule.deliveryTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'planDeliveryTimeEnd',
            value: moment($scope.searchModule.deliveryTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.receiver) {
          searchArray.push({
            key: 'receiver',
            value: $scope.searchModule.receiver
          });
        }
        if ($scope.searchModule.goods_name) {
          searchArray.push({
            key: 'goods_name',
            value: $scope.searchModule.goods_name
          });
        }
        if ($scope.searchModule.damaged && $scope.searchModule.damaged !== '不限') {
          searchArray.push({
            key: 'damaged',
            value: $scope.searchModule.damaged === '有' ? true : false
          });
        }
        if ($scope.searchModule.pickUpTimeRange) {
          searchArray.push({
            key: 'planPickupTimeStart',
            value: moment($scope.searchModule.pickUpTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'planPickupTimeEnd',
            value: moment($scope.searchModule.pickUpTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.sender) {
          searchArray.push({
            key: 'sender',
            value: $scope.searchModule.sender
          });
        }
        if ($scope.searchModule.description) {
          searchArray.push({
            key: 'description',
            value: $scope.searchModule.description
          });
        }

        if ($scope.searchModule.order_number) {
          searchArray.push({
            key: 'order_number',
            value: $scope.searchModule.order_number
          });
        }

        return searchArray;
      };

      getUserProfile(function () {
        fillDisplayFields();
        loadPageData();
      });

    }]);
