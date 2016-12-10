angular.module('zhuzhuqs').controller('OrderBatchCreateController',
  ['$scope', '$state', 'OrderService', 'CompanyService', 'ExcelReaderService', 'config', 'GlobalEvent', 'UserProfileService',
    function ($scope, $state, OrderService, CompanyService, ExcelReaderService, config, GlobalEvent, UserProfileService) {
      var uploadBlockSize = 10;
      var templateVersion = 0; //当前模版版本

      $scope.data = {
        executeGroups: [],
        currentGroup: {},
        isUploading: false,
        file: {
          resultType: 'normal', //normal, success, error
          message: '等待上传Excel文件',
          current_filename: ''
        },
        formatOrders: [],
        result: {
          success: true,
          totalCount: 0,
          successCount: 0,
          invalidReceiverCount: 0,
          invalidSenderCount: 0,
          successAssignCount: 0
        },
        pickup_entrance_force: false,
        pickup_photo_force: false,
        delivery_entrance_force: false,
        delivery_photo_force: true,
        isOrderMultiAssign: false,  //相同运单号是否作为多段处理
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
        },

        pickup_deferred_duration: 0,
        delivery_early_duration: 0
      };
      function initUploadData() {
        $scope.data.result.totalCount = 0;
        $scope.data.result.successCount = 0;
        $scope.data.result.invalidReceiverCount = 0;
        $scope.data.result.invalidSenderCount = 0;
        $scope.data.result.successAssignCount = 0;
        $scope.data.result.success = true;
      }

      function getUserProfile() {
        UserProfileService.getUserProfile().then(function (data) {
          console.log(data);

          if (data.err) {
            return console.log(data.err);
          }

          if (data.user_profile) {
            $scope.data.pickup_entrance_force = data.user_profile.pickup_entrance_force;
            $scope.data.pickup_photo_force = data.user_profile.pickup_photo_force;
            $scope.data.delivery_entrance_force = data.user_profile.delivery_entrance_force;
            $scope.data.delivery_photo_force = data.user_profile.delivery_photo_force;

            //记忆选中的组
            if (data.user_profile.order_execute_group && $scope.data.executeGroups.length > 0) {
              for (var i = 0; i < $scope.data.executeGroups.length; i++) {
                if ($scope.data.executeGroups[i]._id.toString() === data.user_profile.order_execute_group) {
                  $scope.clickGroup($scope.data.executeGroups[i]);
                  break;
                }
              }
            }
          }
          else {
            $scope.data.pickup_entrance_force = false;
            $scope.data.pickup_photo_force = false;
            $scope.data.delivery_entrance_force = false;
            $scope.data.delivery_photo_force = true;
          }

        }, function (err) {
          console.log(err);
        });

        CompanyService.getConfiguration().then(function (data) {
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          if (data && data.push_option) {
            $scope.data.abnormal_push.isOpen = data.push_option.abnormal_push;
            $scope.data.pickup_push.isOpen = data.push_option.pickup_push;

            $scope.data.create_push.isOpen = data.push_option.create_push;
            $scope.data.delivery_sign_push.isOpen = data.push_option.delivery_sign_push;
            $scope.data.delivery_push.isOpen = data.push_option.delivery_push;

            $scope.data.pickup_deferred_duration = data.push_option.pickup_deferred_duration;
            $scope.data.delivery_early_duration = data.push_option.delivery_early_duration;
          }

        }, function (err) {
          console.log(err);
        });

      }
      function getGroupList(callback) {
        CompanyService.getExecuteGroupList().then(function (data) {
          if (data.err) {
            $scope.$emit(GlobalEvent.onShowAlert, '获取公司组失败！');
          }
          else {
            $scope.data.executeGroups = data;
            if ($scope.data.executeGroups.length > 0) {
              $scope.clickGroup($scope.data.executeGroups[0]);
            }
          }

          return callback();
        }, function (err) {
          $scope.$emit(GlobalEvent.onShowAlert, '获取公司组失败！');
          return callback();
        });
      }
      function setUserProfileToOrder(formatOrders) {
        if (!formatOrders|| formatOrders.length <= 0) {
          return;
        }
        formatOrders.forEach(function (item) {
          item.createInfo.pickup_entrance_force = $scope.data.pickup_entrance_force;
          item.createInfo.pickup_photo_force = $scope.data.pickup_photo_force;
          item.createInfo.delivery_entrance_force = $scope.data.delivery_entrance_force;
          item.createInfo.delivery_photo_force = $scope.data.delivery_photo_force;

          item.createInfo.pickup_push = $scope.data.pickup_push.isOpen;
          item.createInfo.abnormal_push = $scope.data.abnormal_push.isOpen;

          item.createInfo.create_push = $scope.data.create_push.isOpen;
          item.createInfo.delivery_sign_push = $scope.data.delivery_sign_push.isOpen;
          item.createInfo.delivery_push = $scope.data.delivery_push.isOpen;

          item.createInfo.pickup_deferred_duration = $scope.data.pickup_deferred_duration;
          item.createInfo.delivery_early_duration = $scope.data.delivery_early_duration;

        });
      }
      getGroupList(getUserProfile);

      function goOrderAssign() {
        $state.go('order_assign');
      }

      //只校验这些表头来判断是否为
      var data1Headers = ['客户', '发货方', '收货方', '运单号', '参考单号',
        '承运司机', '运费', '提货时间', '提货联系人', '提货地址',
        '提货联系手机', '提货联系固话', '收货时间', '收货联系人', '收货地址',
        '收货联系手机', '收货联系固话', '品名', '件数', '件数单位',
        '重量', '重量单位', '体积', '体积单位', '备注'];
      var data2Headers = ['客户', '发货方', '收货方', '运单号', '参考单号',
        '承运司机', '运费', '提货时间', '提货联系人', '提货地址',
        '提货联系手机', '提货联系固话', '收货时间', '收货联系人', '收货地址',
        '收货联系手机', '收货联系固话', '备注', '关注人1', '关注人2',
        '关注人3', '品名1', '数量1', '单位1', '品名2',
        '数量2', '单位2', '品名3', '数量3', '单位3',
        '订单号'];
      var columnKeyValue = {
        1: 'A',
        2: 'B',
        3: 'C',
        4: 'D',
        5: 'E',
        6: 'F',
        7: 'G',
        8: 'H',
        9: 'I',
        10: 'J',
        11: 'K',
        12: 'L',
        13: 'M',
        14: 'N',
        15: 'O',
        16: 'P',
        17: 'Q',
        18: 'R',
        19: 'S',
        20: 'T',
        21: 'U',
        22: 'V',
        23: 'W',
        24: 'X',
        25: 'Y',
        26: 'Z',
        27: 'AA',
        28: 'AB',
        29: 'AC',
        30: 'AD',
        31: 'AE',
        32: 'AF',
        33: 'AG',
        34: 'AH',
        35: 'AI',
        36: 'AJ'
      };

      function getOrderCreateInfo(orderItem, columnArray) {
        var result = {};
        columnArray.forEach(function (item) {
          result[item] = orderItem[item];
        });
        return result;
      }
      function getOrderAssignInfo(orderItem, columnArray) {
        var result = {};
        columnArray.forEach(function (item) {
          result[item] = orderItem[item];
        });
        return result;
      }
      function formatOrderWithMultiAssignInfo(orderArray) {
        var formatOrderArray = formatOrderWithAssignInfo(orderArray, true);

        var newOrders = {};
        formatOrderArray.forEach(function (item) {
          if (!newOrders[item.createInfo.order_number]) {
            newOrders[item.createInfo.order_number] = {
              createInfo: item.createInfo,
              assignInfos: []
            };
          }
          newOrders[item.createInfo.order_number].assignInfos = newOrders[item.createInfo.order_number].assignInfos.concat(item.assignInfos);
        });

        var multiAssignArray = [];
        for (var item in newOrders) {
          //只有一段的运单，如果没填承运司机，则不分配
          if (newOrders[item].assignInfos.length === 1 && !newOrders[item].assignInfos[0].driver_username) {
            newOrders[item].assignInfos = [];
          }
          multiAssignArray.push(newOrders[item]);
        }
        return multiAssignArray;
      }
      function formatOrderWithAssignInfo(orderArray, isSaveAssign) {
        if (!orderArray || orderArray.length === 0) {
          return [];
        }
        var createColumnArray = ['customer_name', 'sender_name', 'receiver_name', 'order_number', 'refer_order_number', 'freight_charge',
          'pickup_start_time', 'pickup_end_time', 'pickup_contact_name', 'pickup_contact_address', 'pickup_contact_mobile_phone', 'pickup_contact_phone',
          'delivery_start_time', 'delivery_end_time', 'delivery_contact_name', 'delivery_contact_address', 'delivery_contact_mobile_phone', 'delivery_contact_phone',
          'goods_name', 'count', 'count_unit', 'weight', 'weight_unit', 'volume', 'volume_unit', 'description', 'goods', 'salesmen', 'original_order_number'];
        var assignColumnArray = ['driver_username',
          'pickup_start_time', 'pickup_end_time', 'pickup_contact_name', 'pickup_contact_address', 'pickup_contact_mobile_phone', 'pickup_contact_phone',
          'delivery_start_time', 'delivery_end_time', 'delivery_contact_name', 'delivery_contact_address', 'delivery_contact_mobile_phone', 'delivery_contact_phone'];

        var formatOrders = [];
        orderArray.forEach(function (item) {
          var newOrder = {
            createInfo: getOrderCreateInfo(item, createColumnArray),
            assignInfos: []
          };
          var assignInfo = getOrderAssignInfo(item, assignColumnArray);
          if (assignInfo.driver_username || isSaveAssign) {
            newOrder.assignInfos.push(assignInfo);
          }

          formatOrders.push(newOrder);
        });

        return formatOrders;
      }

      function checkIsNumber(columnValue) {
        if (!columnValue) {
          return true;
        }
        if (isNaN(parseFloat(columnValue))) {
          return false;
        }
        return true;
      }
      function checkIsDate(columnValue) {
        if (!columnValue) {
          return true;
        }
        if (isNaN(Date.parse(columnValue))) {
          return false;
        }
        return true;
      }
      function combineGoodsToOrder(orderItem) {
        var goodsArray = [];
        for (var index = 1; index < 4; index++) {
          if (orderItem['goods' + index]) {
            goodsArray.push({
              name: orderItem['goods' + index],
              count: orderItem['count' + index] || '',
              unit: orderItem['unit' + index] || '箱'
            });
          }
        }
        if (goodsArray.length === 0) {
          goodsArray.push({
            name: '',
            count: '',
            unit: '箱'
          });
        }
        orderItem.goods = goodsArray;
        orderItem.goods_name = goodsArray[0].name;
        orderItem.count = goodsArray[0].count;
        orderItem.count_unit = goodsArray[0].unit;
        orderItem.weight = '';
        orderItem.weight_unit = '吨';
        orderItem.volume = '';
        orderItem.volume_unit = '立方';

      }
      function combineSalesmanToOrder(orderItem) {
        var salesmanArray = [];
        for (var index = 1; index < 4; index++) {
          if (orderItem['salesman' + index]) {
            salesmanArray.push(orderItem['salesman' + index]);
          }
        }
        if (salesmanArray.length > 0) {
          salesmanArray = salesmanArray.zzDistinct();
        }
        if (salesmanArray.length > 0) {
          orderItem.salesmen = salesmanArray;
        }
      }

      function goCompanyConfiguration() {
        $state.go('order_configuration');
      }
      $scope.pickupEntranceHandle = function () {
        //$scope.data.pickup_entrance_force = !$scope.data.pickup_entrance_force;
        goCompanyConfiguration();
      };
      $scope.pickupPhotoHandle = function () {
        //$scope.data.pickup_photo_force = !$scope.data.pickup_photo_force;
        goCompanyConfiguration();
      };
      $scope.deliveryEntranceHandle = function () {
        //$scope.data.delivery_entrance_force = !$scope.data.delivery_entrance_force;
        goCompanyConfiguration();
      };
      $scope.deliveryPhotoHandle = function () {
        //$scope.data.delivery_photo_force = !$scope.data.delivery_photo_force;
        goCompanyConfiguration();
      };

      $scope.multiAssignHandle = function () {
        $scope.data.isOrderMultiAssign = !$scope.data.isOrderMultiAssign;
      };
      $scope.clickGroup = function (userGroup) {
        $scope.data.currentGroup = userGroup;
      };

      $scope.progressBar = {
        max: 0,
        dynamic: 0,
        show: function (max) {
          this.max = max;
          this.dynamic = 0;
        },
        hide: function () {
          this.max = 0;
          this.dynamic = 0;
        },
        change: function (dynamic) {
          this.dynamic = dynamic;
        }
      };

      var importOrder = {
        main: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          data: [],
          handleFile: function () {},
          combineOther: function () {}
        },
        detail: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          rowCount: 0,
          data: {},
          isVersion2: false,
          handleFile: function () {},
          matchOrder: function () {}
        },
        salesman: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          rowCount: 0,
          data: {},
          handleFile: function () {},
          matchOrder: function () {}
        },
        init: function () {
          this.main.changeCount = 0;
          this.main.buttonText = '从本地上传',
          this.main.data = [];
          this.main.resultType = '';
          this.main.message = '上传运单列表';

          this.detail.changeCount = 0;
          this.detail.buttonText = '从本地上传',
          this.detail.data = {};
          this.detail.resultType = '';
          this.detail.message = '添加货物明细表';
          this.detail.rowCount = 0;
          this.detail.disabled = true;
          this.detail.isVersion2 = false;

          this.salesman.changeCount = 0;
          this.salesman.buttonText = '从本地上传',
          this.salesman.data = {};
          this.salesman.resultType = '';
          this.salesman.message = '添加关注人列表';
          this.salesman.rowCount = 0;
          this.salesman.disabled = true;
        },
        reload: function () {
          this.main.data = [];
          this.main.resultType = '';
          this.main.message = '上传运单列表';

          this.detail.data = {};
          this.detail.resultType = '';
          this.detail.message = '添加货物明细表';
          this.detail.rowCount = 0;
          this.detail.disabled = true;

          this.salesman.data = {};
          this.salesman.resultType = '';
          this.salesman.message = '添加关注人列表';
          this.salesman.rowCount = 0;
          this.salesman.disabled = true;
        },
        showResult: function (attribute, resultType, message) {
          this[attribute].resultType = resultType;
          this[attribute].message = message;
          $scope.$apply();
        },
        getMatchInfo: function (rowCount, matchRowCount, matchOrderCount) {
          return '成功读取' + rowCount + '条信息，匹配' + matchRowCount + '条'; //，匹配运单' + matchOrderCount + '条';
        },
        changeFile: function (attribute) {
          this[attribute].changeCount++;
          this[attribute].buttonText = '重新上传';
          if (attribute === 'main') {
            this.detail.changeCount = 0;
            this.detail.buttonText = '从本地上传';
            this.salesman.changeCount = 0;
            this.salesman.buttonText = '从本地上传';
          }
        }
      };
      importOrder.init();
      $scope.importOrder = importOrder;

      function checkExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        var columnIndex;
        var columnName;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData[data1Headers[3]]) {
            return callback({row: rowIndex + 2, column: columnKeyValue[3 + 1], message: data1Headers[3] + '不能为空'});  //第一行是表头，所以+2
          }

          for (var value in rowData) {
            switch (value) {
              case data1Headers[7]:
              case data1Headers[12]:
                if (!checkIsDate(rowData[value])) {
                  columnIndex = data1Headers.indexOf(value);
                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: data1Headers[columnIndex] + '必须为时间格式'
                  });
                }
                break;
              case data1Headers[5]:
              case data1Headers[10]:
              case data1Headers[15]:
              case data2Headers[18]:
              case data2Headers[19]:
              case data2Headers[20]:
                if (rowData[value] && !rowData[value].toString().testPhone() && rowIndex !== 0) {
                  columnIndex = data1Headers.indexOf(value);
                  if (columnIndex === -1) {
                    columnIndex = data2Headers.indexOf(value);
                    columnName = data2Headers[columnIndex];
                  }
                  else {
                    columnName = data1Headers[columnIndex];
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: columnName + '必须为11位手机号格式'
                  });
                }
                break;
              case data1Headers[6]:
              case data1Headers[18]:
              case data1Headers[20]:
              case data1Headers[22]:
              case data2Headers[22]:
              case data2Headers[25]:
              case data2Headers[28]:
                if (!checkIsNumber(rowData[value])) {
                  columnIndex = data1Headers.indexOf(value);
                  if (columnIndex === -1) {
                    columnIndex = data2Headers.indexOf(value);
                    columnName = data2Headers[columnIndex];
                  }
                  else {
                    columnName = data1Headers[columnIndex];
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: columnName + '必须为数字格式'
                  });
                }
                break;
              default:
                break;
            }
          }
        }
        return callback();
      }
      function generateOrderInfo(sheetData) {
        if (!sheetData) {
          return [];
        }
        var headerKeyValue = {
          '客户': 'customer_name',
          '发货方': 'sender_name',
          '收货方': 'receiver_name',
          '运单号': 'order_number',
          '参考单号': 'refer_order_number',
          '承运司机': 'driver_username',
          '运费': 'freight_charge',
          '提货时间': 'pickup_start_time',
          '提货联系人': 'pickup_contact_name',
          '提货地址': 'pickup_contact_address',
          '提货联系手机': 'pickup_contact_mobile_phone',
          '提货联系固话': 'pickup_contact_phone',
          '收货时间': 'delivery_start_time',
          '收货联系人': 'delivery_contact_name',
          '收货地址': 'delivery_contact_address',
          '收货联系手机': 'delivery_contact_mobile_phone',
          '收货联系固话': 'delivery_contact_phone',
          '品名': 'goods_name',
          '件数': 'count',
          '件数单位': 'count_unit',
          '重量': 'weight',
          '重量单位': 'weight_unit',
          '体积': 'volume',
          '体积单位': 'volume_unit',
          '备注': 'description',
          '关注人1': 'salesman1',
          '关注人2': 'salesman2',
          '关注人3': 'salesman3',
          '品名1': 'goods1',
          '数量1': 'count1',
          '单位1': 'unit1',
          '品名2': 'goods2',
          '数量2': 'count2',
          '单位2': 'unit2',
          '品名3': 'goods3',
          '数量3': 'count3',
          '单位3': 'unit3',
          '订单号': 'original_order_number'
        };

        var orderArray = [];
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          if (rowData['客户'] && rowData['客户'].indexOf('本行请保留') > -1) {
            continue;
          }

          var orderItem = {};
          for (var column in rowData) {
            orderItem[headerKeyValue[column]] = rowData[column];
          }
          orderItem.pickup_end_time = orderItem.pickup_start_time;
          orderItem.delivery_end_time = orderItem.delivery_start_time;

          if (templateVersion === 2) {
            //业务员 salesmen
            combineSalesmanToOrder(orderItem);
            //多货物 goods
            combineGoodsToOrder(orderItem);
          }

          orderArray.push(orderItem);
        }

        return orderArray;
      }
      importOrder.main.handleFile = function (element) {
        importOrder.changeFile('main');
        importOrder.reload();
        importOrder.showResult('main', '', '正在校验Excel文件...');
        initUploadData();

        importOrder.main.data = [];

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          $scope.data.file.current_filename = document.getElementById('main-file-name').value;
          document.getElementById('main-file-name').outerHTML = document.getElementById('main-file-name').outerHTML;
          document.getElementById('main-file-name').value = '';
          if (err) {
            return importOrder.showResult('main', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '客户'},
            {key: 'B1', value: '发货方'},
            {key: 'C1', value: '收货方'},
            {key: 'D1', value: '运单号'},
            {key: 'E1', value: '参考单号'},
            {key: 'F1', value: '承运司机'},
            {key: 'G1', value: '运费'},
            {key: 'H1', value: '提货时间'},
            {key: 'I1', value: '提货联系人'},
            {key: 'J1', value: '提货地址'},
            {key: 'K1', value: '提货联系手机'},
            {key: 'L1', value: '提货联系固话'},
            {key: 'M1', value: '收货时间'},
            {key: 'N1', value: '收货联系人'},
            {key: 'O1', value: '收货地址'},
            {key: 'P1', value: '收货联系手机'},
            {key: 'Q1', value: '收货联系固话'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('main', 'error', '请选择系统提供的模版填写运单数据');
            }
            //得到版本
            var isVersion2 = excelReader.isHeaderNameExist(excelSheet, {key: 'S1', value: '关注人1', index: 18});
            var isVersion1 = excelReader.isHeaderNameExist(excelSheet, {key: 'R1', value: '品名', index: 17});
            if (!isVersion1 && !isVersion2) {
              return importOrder.showResult('main', 'error', '请选择系统提供的模版填写运单数据');
            }

            var currentDataHeaders = isVersion2 ? data2Headers : data1Headers;
            templateVersion = isVersion2 ? 2 : 1;

            excelReader.getSheetData(excelSheet, currentDataHeaders, function (err, sheetData) {
              if (err) {
                return importOrder.showResult('main', 'error', err.message);
              }

              checkExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('main', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.main.data = generateOrderInfo(sheetData);
                importOrder.showResult('main', 'success', '成功读取' + importOrder.main.data.length + '条运单信息');
                importOrder.detail.matchOrder();
                importOrder.salesman.matchOrder();
              });
            });

          });
        });
      };
      importOrder.main.combineOther = function () {
        if (this.data.length === 0) {
          return;
        }
        var details = importOrder.detail.data;
        var salesmen = importOrder.salesman.data;

        if (!getObjectLength(details) && !getObjectLength(salesmen)) {
          return;
        }
        this.data.forEach(function (orderItem) {
          if (details[orderItem.order_number] && details[orderItem.order_number].length > 0) {
            orderItem.goods = details[orderItem.order_number];
          }
          if (salesmen[orderItem.order_number] && salesmen[orderItem.order_number].length > 0) {
            orderItem.salesmen = salesmen[orderItem.order_number];
          }
        });
      }


      var detailDataHeader1 = ['运单号','品名','数量','单位', '单价', '总额'];
      var detailDataHeader2 = ['运单号','品名','数量','单位', '数量2','单位2','数量3','单位3', '单价', '总额'];
      function checkDetailExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData['运单号']) {
            return callback({row: rowIndex + 2, column: columnKeyValue[1], message: '运单号不能为空'});  //第一行是表头，所以+2
          }

          var columnIndex;
          for (var rowValue in rowData) {
            switch(rowValue) {
              case detailDataHeader2[2]:
              case detailDataHeader2[4]:
              case detailDataHeader2[6]:
                if (!checkIsNumber(rowData[rowValue])) {
                  columnIndex = detailDataHeader1.indexOf(rowValue);
                  if (columnIndex === -1) {
                    columnIndex = detailDataHeader2.indexOf(rowValue);
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: rowValue + '必须为数字格式'
                  });
                }
                break;
              case detailDataHeader1[4]:
                if (!checkIsNumber(rowData[rowValue])) {
                  if (importOrder.detail.isVersion2) {
                    columnIndex = detailDataHeader2.indexOf(rowValue);
                  }
                  else {
                    columnIndex = detailDataHeader1.indexOf(rowValue);
                  }
                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: rowValue + '必须为数字格式'
                  });
                }
                break;
            }
          }
        }
        return callback();
      }
      function generateDetailInfo(sheetData) {
        if (!sheetData) {
          return {};
        }

        var headerKeyValue = {
          '品名': 'name',
          '数量': 'count',
          '单位': 'unit',
          '数量2': 'count2',
          '单位2': 'unit2',
          '数量3': 'count3',
          '单位3': 'unit3',
          '单价': 'price'
        };

        var details = {};
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //没有货物名称，则直接跳过
          if (!rowData['品名']) {
            continue;
          }

          if (!details[rowData['运单号']]) {
            details[rowData['运单号']] = [];
          }

          var rowDetail = {};
          for (var column in rowData) {
            if (column !== '运单号') {
              rowDetail[headerKeyValue[column]] = rowData[column];
            }
          }
          rowDetail.unit = rowDetail.unit || '箱';
          rowDetail.unit2 = rowDetail.unit2 || '吨';
          rowDetail.unit3 = rowDetail.unit3 || '立方';

          details[rowData['运单号']].push(rowDetail);
          importOrder.detail.rowCount++;
        }

        return details;
      }
      importOrder.detail.handleFile = function (element) {
        importOrder.changeFile('detail');
        importOrder.showResult('detail', '', '正在校验Excel文件...');
        importOrder.detail.data = [];
        importOrder.detail.rowCount = 0;

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('detail-file-name').outerHTML = document.getElementById('detail-file-name').outerHTML;
          document.getElementById('detail-file-name').value = '';
          if (err) {
            return importOrder.showResult('detail', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '运单号'},
            {key: 'B1', value: '品名'},
            {key: 'C1', value: '数量'},
            {key: 'D1', value: '单位'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('detail', 'error', '请选择系统提供的模版填写货物明细数据');
            }

            var isVersion2 = excelReader.isHeaderNameExist(excelSheet, {key: 'I1', value: '单价', index: 8});
            var isVersion1 = excelReader.isHeaderNameExist(excelSheet, {key: 'E1', value: '单价', index: 4});
            if (!isVersion1 && !isVersion2) {
              return importOrder.showResult('detail', 'error', '请选择系统提供的模版填写货物明细数据');
            }

            importOrder.detail.isVersion2 = isVersion2;
            excelReader.getSheetData(excelSheet, (isVersion2 ? detailDataHeader2 : detailDataHeader1), function (err, sheetData) {
              if (err) {
                return importOrder.showResult('detail', 'error', err.message);
              }

              checkDetailExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('detail', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.detail.data = generateDetailInfo(sheetData);
                importOrder.showResult('detail', 'success', '成功读取' + importOrder.detail.rowCount + '条信息');
                importOrder.detail.matchOrder();
              });
            });

          });
        });
      };
      importOrder.detail.matchOrder = function () {
        var mainArray = importOrder.main.data;
        if (mainArray.length === 0) {
          return;
        }
        if (!this.rowCount) {
          return;
        }
        var details = this.data;
        var matchRow = {
          totalCount: 0,
          add: function(count) {
            this.totalCount += count;
          }
        };
        var matchOrderCount = 0;
        mainArray.forEach(function (orderItem) {
          if (details[orderItem.order_number] && details[orderItem.order_number].length > 0) {
            matchOrderCount++;
            if (!matchRow[orderItem.order_number]) {
              matchRow[orderItem.order_number] = details[orderItem.order_number].length;
              matchRow.add(details[orderItem.order_number].length);
            }
          }
        });

        if (this.rowCount) {
          importOrder.showResult('detail', 'success', importOrder.getMatchInfo(this.rowCount, matchRow.totalCount, matchOrderCount));
        }
      }

      function checkSalesmanExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData['运单号']) {
            return callback({row: rowIndex + 2, column: columnKeyValue[1], message: '运单号不能为空'});  //第一行是表头，所以+2
          }

          if (rowData['关注人手机号']) {
            if (!rowData['关注人手机号'].testPhone()) {
              return callback({row: rowIndex + 2, column: columnKeyValue[2], message: '数量必须为11位手机号'});
            }
          }
        }
        return callback();
      }
      function generateSalesmanInfo(sheetData) {
        if (!sheetData) {
          return {};
        }

        var salesmanObject = {};
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //没有关注人手机号，则直接跳过
          if (!rowData['关注人手机号']) {
            continue;
          }

          if (!salesmanObject[rowData['运单号']]) {
            salesmanObject[rowData['运单号']] = [];
          }
          salesmanObject[rowData['运单号']].push(rowData['关注人手机号']);
          importOrder.salesman.rowCount++;
        }
        return salesmanObject;
      }
      importOrder.salesman.handleFile = function (element) {
        importOrder.changeFile('salesman');
        importOrder.showResult('salesman', '', '正在校验Excel文件...');
        importOrder.salesman.data = [];
        importOrder.salesman.rowCount = 0;

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('salesman-file-name').outerHTML = document.getElementById('salesman-file-name').outerHTML;
          document.getElementById('salesman-file-name').value = '';
          if (err) {
            return importOrder.showResult('salesman', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '运单号'},
            {key: 'B1', value: '关注人手机号'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('salesman', 'error', '请选择系统提供的模版填写运单关注人数据');
            }

            var dataHeader = ['运单号', '关注人手机号'];
            excelReader.getSheetData(excelSheet, dataHeader, function (err, sheetData) {
              if (err) {
                return importOrder.showResult('salesman', 'error', err.message);
              }

              checkSalesmanExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('salesman', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.salesman.data = generateSalesmanInfo(sheetData);
                importOrder.showResult('salesman', 'success', '成功读取' + importOrder.salesman.rowCount + '条信息');
                importOrder.salesman.matchOrder();
              });
            });

          });
        });
      };
      importOrder.salesman.matchOrder = function () {
        var mainArray = importOrder.main.data;

        if (mainArray.length === 0) {
          return;
        }
        if (!this.rowCount) {
          return;
        }
        var salesmen = this.data;
        var matchRow = {
          totalCount: 0,
          add: function(count) {
            this.totalCount += count;
          }
        };
        var matchOrderCount = 0;
        mainArray.forEach(function (orderItem) {
          if (salesmen[orderItem.order_number] && salesmen[orderItem.order_number].length > 0) {
            matchOrderCount++;
            if (!matchRow[orderItem.order_number]) {
              matchRow[orderItem.order_number] = salesmen[orderItem.order_number].length;
              matchRow.add(salesmen[orderItem.order_number].length);
            }
          }
        });

        if (this.rowCount) {
          importOrder.showResult('salesman', 'success', importOrder.getMatchInfo(this.rowCount, matchRow.totalCount, matchOrderCount));
        }
      }

      function stopUpload(message) {
        $scope.data.isUploading = false;
        if (message) {
          $scope.$emit(GlobalEvent.onShowAlert, message);
        }
      }
      $scope.uploadOrders = function () {
        if ($scope.data.isUploading)  //防重入
          return;
        else {
          $scope.data.isUploading = true;
        }

        if (!$scope.data.file.current_filename) {
          return stopUpload('请选择要上传的Excel文件');
        }

        if (importOrder.main.data.length === 0) {
          return stopUpload('没有任何运单信息，请检查文件数据!');
        }
        importOrder.main.combineOther();

        if (!$scope.data.currentGroup) {
          return stopUpload('请选择操作组');
        }

        OrderService.getRemainOrderCreateCount().then(function (data) {
          if (data.err) {
            return stopUpload('获取订单数量失败');
          }

          var formatOrders;
          if ($scope.data.isOrderMultiAssign) {
            formatOrders = formatOrderWithMultiAssignInfo(importOrder.main.data);
          }
          else {
            formatOrders = formatOrderWithAssignInfo(importOrder.main.data);
          }

          if (formatOrders.length > data.remain) {
            return stopUpload('今日还能上传' + data.remain + '张订单, 当前订单数量为' + formatOrders.length + '张');
          }

          setUserProfileToOrder(formatOrders);
          var sliceOrders = ExcelReaderService.splitArray(formatOrders, uploadBlockSize);
          var startTime = new Date();

          //$scope.$emit(GlobalEvent.onShowLoading, true);

          var progressLength = 0;
          $scope.progressBar.show(formatOrders.length);

          sliceOrders.zzEachSeries(function (sliceItem, eachCallback){
            OrderService.batchCreate(sliceItem, $scope.data.currentGroup._id)
              .then(function (data) {
                if (!data || data.err) {
                  return eachCallback(data.err);
                }
                progressLength += uploadBlockSize;
                $scope.progressBar.change(progressLength);

                $scope.data.result.totalCount += data.totalCount;
                $scope.data.result.successCount += data.successCount;
                $scope.data.result.invalidReceiverCount += data.invalidReceiverCount;
                $scope.data.result.invalidSenderCount += data.invalidSenderCount;
                $scope.data.result.successAssignCount += data.successAssignCount;

                return eachCallback();

              }, function (err) {
                return eachCallback(err);
              });

          }, function (err) {
           // $scope.$emit(GlobalEvent.onShowLoading, false);
            $scope.progressBar.hide();

            if (err) {
              console.log(err);
              return stopUpload('上传订单遇到错误');
            }

            if ($scope.data.result.totalCount !== formatOrders.length) {
              console.log('total count: ', formatOrders.length, 'actual upload count: ', $scope.data.result.totalCount);
              return stopUpload('上传订单遇到错误');
            }

            console.log('-------------batch create time-------------', new Date().getTime() - startTime.getTime());

            var failedCreateCount = $scope.data.result.totalCount - $scope.data.result.successCount;
            var successAssignCount = $scope.data.result.successAssignCount;
            var senderText = ($scope.data.result.invalidSenderCount > 0 ? $scope.data.result.invalidSenderCount + '单的发货方' : '');
            var receiverText = ($scope.data.result.invalidReceiverCount > 0 ? $scope.data.result.invalidReceiverCount + '单的收货方' : '');
            var senderReceiverText = (senderText ? (senderText + '/' + receiverText) : receiverText);

            var info = {
              content_one: (($scope.data.result.successCount > 0 ? '成功上传' + $scope.data.result.successCount + '单' : '') + (failedCreateCount > 0 ? '，失败' + failedCreateCount + '单' : '')),
              content_two: ('成功自动分配' + successAssignCount + '段'),
              content_three: (senderReceiverText ? (senderReceiverText + '未注册柱柱签收') : '')
            };

            $scope.$emit(GlobalEvent.onShowAlertConfirmStyle, info, goOrderAssign, null, {
              'sureLabel': '去分配',
              'cancelLabel': '继续上传'
            });

            stopUpload();
            $state.go('order_batch_create', {}, {reload: true});
          });

        }, function (err) {
          stopUpload('获取订单数量失败');
        });
      };

    }]);