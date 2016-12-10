angular.module('zhuzhuqs').controller('BussnessController',
  ['$scope', '$stateParams', '$timeout', 'config', 'CompanyService', 'SalesmanService', 'BidderService',
    'ExcelReaderService', 'CompanyError', 'DriverError', 'GlobalEvent', 'Auth',
    function ($scope, $stateParams, $timeout, config, CompanyService, SalesmanService, BidderService,
              ExcelReaderService, CompanyError, DriverError, GlobalEvent, Auth) {
      $scope.partnersInfo = {
        drivers: {
          driverCompanys: [],
          inviteDrivers: []
        },
        company: {
          partnerCompanies: [],
          inviteCompanies: [],
          handleFile: function () {
          }
        },
        salesman: [],
        bidders: [],
        curSelect: $stateParams.params || 'company',
        deleteInviteDriver: '',
        deleteCorporateDriver: '',
        deleteInviteCompany: '',
        deleteCorporateCompany: '',
        showDetailPanel: ''
      };
      $scope.maskInfo = {
        isShow: false
      };
      $scope.newInfo = {
        username: '',
        showDriverDialog: false,
        openDialog: function () {
        },
        submit: function () {
        }
      };
      $scope.rightHeader = {
        company: {
          name: '合作公司',
          count: 0,
          columns: [
            {
              name: '公司名称',
              length: 4
            },
            {
              name: '公司类型',
              length: 2
            },
            {
              name: '公司地址',
              length: 3
            }
          ]
        },
        driver: {
          name: '合作司机',
          count: 0,
          columns: [
            {
              name: '姓名',
              length: 2
            },
            {
              name: '好评率',
              length: 1
            },
            {
              name: '运单数',
              length: 1
            },
            {
              name: '拒单数',
              length: 1
            },
            {
              name: '电话',
              length: 2
            },
            {
              name: '车牌',
              length: 2
            },
            {
              name: '绑定微信',
              length: 2
            },
            {
              name: '评价',
              length: 1
            }
          ]
        },
        salesman: {
          name: '关注人',
          count: 0,
          columns: [
            {
              name: '手机号',
              length: 3
            },
            {
              name: '姓名',
              length: 2
            },
            {
              name: '邮箱',
              length: 3
            },
            {
              name: '绑定时间',
              length: 2
            }
          ]
        },
        bidder: {
          name: '合作中介',
          count: 0,
          columns: [
            {
              name: '手机号',
              length: 3
            },
            {
              name: '姓名',
              length: 2
            },
            {
              name: '昵称',
              length: 2
            },
            {
              name: '中标次数',
              length: 2
            },
            {
              name: '绑定时间',
              length: 2
            }
          ]
        },
        current: {},
        update: function (type) {
          this.current = this[type];
        },
        updateCount: function (type, count) {
          this[type].count = count;
        }
      };
      $scope.singleSalesman = {
        isModify: false,
        username: '',
        nickname: '',
        email: '',
        showDialog: false,
        usernameError: '必填项',
        nicknameError: '必填项',
        isEmailError: false,
        isPhoneError: false,
        blurUsername: function () {
        },
        blurEmail: function () {
        },
        submit: function () {
        },
        remove: function () {
        },
        modify: function (salesman) {
          this.showDialog = true;
          this.isModify = true;
          this.usernameError = '';
          this.copy(salesman);
        },
        create: function () {
          this.showDialog = true;
          this.isModify = false;
          this.clear();
        },
        clear: function () {
          this.username = '';
          this.nickname = '';
          this.email = '';
          this.usernameError = '必填项';
          this.nicknameError = '必填项';
        },
        copy: function (item) {
          this.username = item.username;
          this.nickname = item.nickname;
          this.email = item.email;
        },
        handleFile: function () {
        }
      };

      var driverEvaluationsConfig = {
        pagination: {
          currentPage: 1,
          limit: 10,
          totalCount: 0,
          pageCount: 0,
          pageNavigationCount: 5,
          canSeekPage: true,
          limitArray: [10, 20, 30, 40, 100],
          pageList: [1],
          onCurrentPageChanged: function (callback) {
            findDriverEvaluations();
          }
        },
        isShowPagination: true,
        isOptional: false,
        isFieldSetting: false,
        rows: [],
        fields: [
          {
            name: '运单号',
            value: 'order_number',
            isSort: false,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '公司名称',
            value: 'company_name',
            isSort: false,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '评价',
            value: 'content_text',
            isSearch: false,
            curSort: '',
            keyword: ''
          },
          {
            name: '等级',
            value: 'level',
            isSort: true,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '评价时间',
            value: 'update_time_format',
            isSort: true,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          }
        ],
        driverId: null,
        show : false
      };

      $scope.driverEvaluationsConfig = driverEvaluationsConfig;

      getPartnerCompanys();
      getPartnerDrivers();
      getSalesmanList();
      getBidderList();

      function findDriverEvaluations(){
        var parameters = {
          driverId : driverEvaluationsConfig.driverId,
          currentPage : driverEvaluationsConfig.pagination.currentPage,
          limit : driverEvaluationsConfig.pagination.limit
        };
        CompanyService.findDriverEvaluations(parameters).then(function (response) {
          if(response && response.status && response.status == 'success' && response.data){
            var rows = [];
            driverEvaluationsConfig.rows = rows;
            response.data.forEach(function(e){
              var rowData = {
                content_text : e.content_text,
                update_time_format : e.update_time_format
              };
              if(e.order && e.order.order_details){
                rowData.order_number = e.order.order_details.order_number;
              }
              if(e.user && e.user.company){
                rowData.company_name = e.user.company.name;
              }
              if(e.level){
                switch (e.level + ''){
                  case '1' :
                    rowData.level = '好评';
                    break;
                  case '2' :
                    rowData.level = '中评';
                    break;
                  case '3' :
                    rowData.level = '差评';
                    break;
                  default :
                }
              }
              rows.push({
                columns: rowData,
                rowConfig: {
                  notOptional: true,
                  isShowUpdateButton: false,
                  isShowDeleteButton: false,
                  isShowExportButton: false
                }
              });
            });

            renderPagination(response.pagination);
            if(driverEvaluationsConfig.reLoad) {
              driverEvaluationsConfig.reLoad();
            }
            driverEvaluationsConfig.show = true;
          }
        }, function(err){
          console.log(err);
        });
      }

      function renderPagination(data) {
        if (!data) {
          return;
        }
        driverEvaluationsConfig.pagination.currentPage = parseInt(data.currentPage || 1);
        driverEvaluationsConfig.pagination.limit = parseInt(data.limit || 10);
        driverEvaluationsConfig.pagination.totalCount = parseInt(data.total || 0);
        driverEvaluationsConfig.pagination.pageCount = Math.ceil( parseInt(data.total || 0) / parseInt(data.limit || 10));
        if(driverEvaluationsConfig.pagination.render){
          driverEvaluationsConfig.pagination.render();
        }
      }

      $scope.showDriver = function(driverCompany){
        if(driverCompany.driver.all_count.evaluationCount){
          driverEvaluationsConfig.driverId = driverCompany.driver._id;
          findDriverEvaluations();
        }
      };

      $scope.exportData = function(){

          var types = {
              company:"/company/export",
              salesman:"/salesman/export",
              driver : '/company/export-company-driver',
              bidder : '/bidder/export-company-bidder'
          };
          var type = $scope.partnersInfo.curSelect;
          if(types[type]){
              var url = types[type] +"?access_token=" + Auth.getToken();
              window.open(url);
          }
      };

      $scope.generatePhoto = function (photo) {
        if (!photo) {
          return '';
        }
        return config.qiniuServerAddress + photo;
      };
      $scope.rightHeader.update($scope.partnersInfo.curSelect);
      $scope.partnersInfo.deleteInviteDriver = function (driver_phone) {
        if (!driver_phone) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作司机');
        }
        //手机号验证(11位数字)
        var phoneRegex = /\d{11}/;
        if (!phoneRegex.test(driver_phone)) {
          console.log(driver_phone, 'driver phone format is not right');
          return $scope.$emit(GlobalEvent.onShowAlert, '司机用户名不合法');
        }

        var alertContent = '确定删除合作司机' + driver_phone + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (driverPhone) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteInviteDriver(driverPhone).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerDrivers();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, driver_phone, {title: '删除'});
      };
      $scope.partnersInfo.deleteCorporateDriver = function (driver) {
        if (!driver) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作司机');
        }

        var alertContent = '确定删除合作司机' + (driver.nickname ? driver.nickname : driver.username) + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (driverId) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteCorporateDriver(driverId).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerDrivers();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, driver._id, {title: '删除'});
      };
      $scope.partnersInfo.deleteInviteCompany = function (inviteCompany) {
        if (!inviteCompany || !inviteCompany._id) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作公司');
        }

        var alertContent = '确定删除合作公司' + (inviteCompany.name || inviteCompany.username) + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteInviteCompanyById(inviteCompany._id).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerCompanys();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, null, {title: '删除'});
      };
      $scope.partnersInfo.deleteCorporateCompany = function (partnerCompany) {
        if (!partnerCompany) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作公司');
        }

        var alertContent = '确定删除合作公司' + partnerCompany.name + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (companyId) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteCorporateCompany(companyId).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerCompanys();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, partnerCompany._id, {title: '删除'});
      };
      $scope.partnersInfo.showDetailPanel = function (panel) {
        panel = panel || 'company';
        if ($scope.partnersInfo.curSelect !== panel) {
          $scope.partnersInfo.curSelect = panel;
          $scope.rightHeader.update(panel);
          switch (panel) {
            case 'company':
              getPartnerCompanys();
              break;
            case 'driver':
              getPartnerDrivers();
              break;
            case 'salesman':
              getSalesmanList();
              break;
            case 'bidder':
              getBidderList();
              break;
            default:
              break;
          }
        }
      };

      //batch create partner company start
      var companyDataHeaders = ['公司名称', '电子邮箱'];

      function checkCompanyExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }

        var companyNameArray = []; //防重复
        var emailArray = []; //防重复

        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //因为获取到每行的数据不一定每一列都存在值，所以每一行的列数是不固定的
          //因此那一列有问题，用固定值。
          if (!rowData[companyDataHeaders[0]]) {
            return callback({row: rowIndex + 2, column: 'A', message: companyDataHeaders[0] + '不能为空'});  //第一行是表头，所以+2
          }
          if (companyNameArray.indexOf(rowData[companyDataHeaders[0]]) > -1) {
            return callback({row: rowIndex + 2, column: 'A', message: companyDataHeaders[0] + '不能重复'});
          }
          companyNameArray.push(rowData[companyDataHeaders[0]]);

          if (rowData[companyDataHeaders[1]]) {
            if (!rowData[companyDataHeaders[1]].testMail()) {
              return callback({row: rowIndex + 2, column: 'B', message: companyDataHeaders[1] + '必须为邮箱格式'});
            }
            if (emailArray.indexOf(rowData[companyDataHeaders[1]]) > -1) {
              return callback({row: rowIndex + 2, column: 'B', message: companyDataHeaders[1] + '不能重复'});
            }

            emailArray.push(rowData[companyDataHeaders[1]]);
          }
        }
        return callback();
      }

      function generateCompanyData(sheetData) {
        var companyArray = [];
        if (!sheetData) {
          return companyArray;
        }
        var headerKeyValue = {
          '公司名称': 'companyName',
          '电子邮箱': 'email'
        };

        var rowData;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var company = {};
          rowData = sheetData[rowIndex];
          for (var columnData in rowData) {
            company[headerKeyValue[columnData]] = rowData[columnData];
          }
          companyArray.push(company);
        }
        return companyArray;
      }

      $scope.partnersInfo.company.handleFile = function (element) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        $scope.$apply();

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('company-filename').outerHTML = document.getElementById('company-filename').outerHTML;
          document.getElementById('company-filename').value = '';
          if (err) {
            return handleReadError(err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '公司名称'},
            {key: 'B1', value: '电子邮箱'}
          ];

          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return handleReadError('请选择系统提供的模版填写合作公司数据');
            }
            excelReader.getSheetData(excelSheet, companyDataHeaders, function (err, sheetData) {
              if (err) {
                return handleReadError(err.message);
              }

              checkCompanyExcelFormat(sheetData, function (err) {
                if (err) {
                  return handleReadError('第' + err.row + '行第' + err.column + '列' + err.message);
                }

                var companyArray = generateCompanyData(sheetData);
                var sliceArray = ExcelReaderService.splitArray(companyArray, 30);
                var totalCount = companyArray.length;
                var successCount = 0, failedCount = 0;

                for (var index = 0; index < sliceArray.length; index++) {
                  CompanyService.batchInviteCompany(sliceArray[index]).then(function (data) {
                    $scope.$emit(GlobalEvent.onShowLoading, false);
                    console.log(data);
                    if (data.err) {
                      return $scope.$emit(GlobalEvent.onShowAlert, '上传失败');
                    }

                    successCount += data.success.length;
                    failedCount += data.faileds.length;

                    //全部完成
                    if (totalCount === (successCount + failedCount)) {
                      var showText = '成功上传' + successCount + '个公司';
                      if (failedCount > 0) {
                        showText += '，剩余' + failedCount + '个上传失败';
                      }
                      $scope.$emit(GlobalEvent.onShowAlert, showText);

                      getPartnerCompanys();
                    }
                  });
                }
              });
            });

          });

        });
      };

      //batch create partner company end

      function handleErrorByDriver(errType) {
        if (DriverError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, DriverError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function calculateEvaluation(companyDrivers) {
        if (!companyDrivers || companyDrivers.length <= 0) {
          return;
        }
        companyDrivers.forEach(function (companyDriver) {
          var evaluation = companyDriver.driver.all_count.evaluationCount;
          var totalCount = evaluation.good + evaluation.general + evaluation.bad;
          if (totalCount < 10) {
            companyDriver.driver.goodEvaluation = 0;
            return;
          }
          companyDriver.driver.goodEvaluation = Math.ceil(evaluation.good * 100 / totalCount);
        });
      }

      function getPartnerDrivers() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerDrivers().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleErrorByDriver(data.err.type);
          }

          calculateEvaluation(data.driverCompanys);

          $scope.partnersInfo.drivers.driverCompanys = data.driverCompanys;
          $scope.partnersInfo.drivers.inviteDrivers = data.inviteDrivers;

          $scope.rightHeader.updateCount('driver', $scope.partnersInfo.drivers.driverCompanys.length + $scope.partnersInfo.drivers.inviteDrivers.length);

        }, function (err) {
          console.log(data);
          handleErrorByDriver('error');
        });
      }

      $scope.newInfo.submit = function () {
        if (!this.username) {
          return;
        }
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.inviteDriverByPhone1($scope.newInfo.username).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.newInfo.openDialog(false);
          getPartnerDrivers();
        }, function (err) {
          console.log(err);
          return handleErrorByDriver('error');
        });
      };
      $scope.newInfo.openDialog = function (isOpen) {
        this.username = '';
        this.showDriverDialog = isOpen;
        $scope.maskInfo.isShow = isOpen;
      };

      //salesman-code start
      $scope.singleSalesman.blurUsername = function () {
        if (!this.username) {
          return this.usernameError = '必填项';
        }
        if (!this.username.testPhone()) {
          return this.usernameError = '格式不正确';
        }
        return this.usernameError = '';
      };
      $scope.singleSalesman.blurNickname = function () {
        if (!this.nickname) {
          return this.nicknameError = '必填项';
        }
        return this.nicknameError = '';
      };
      $scope.singleSalesman.blurEmail = function () {
        this.isEmailError = this.email && !this.email.testMail();
      };
      $scope.singleSalesman.submit = function () {
        if (this.usernameError) {
          return;
        }
        if (this.nicknameError) {
          return;
        }
        if (this.email && !this.email.testMail()) {
          return this.isEmailError = true;
        }

        var userInfo = {
          username: this.username,
          nickname: this.nickname || '',
          email: this.email || ''
        };
        this.clear();
        this.showDialog = false;
        if (this.isModify) {
          modifySalesman(userInfo);
        } else {
          createSalesman(userInfo);
        }
      };
      $scope.singleSalesman.remove = function (salesman) {
        if (!salesman) {
          return;
        }

        var alertContent = '确定删除关注人' + salesman.username + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
          $scope.$emit(GlobalEvent.onShowLoading, true);
          SalesmanService.removeSalesmanCompanyByUsername(salesman.username).then(function (result) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(result);
            if (result.err) {
              return handleErrorByDriver(result.err.type);
            }
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');
            getSalesmanList();
          }, function (err) {
            console.log(err);
            $scope.$emit(GlobalEvent.onShowLoading, false);
            handleErrorByDriver('error');
          });

        });
      };
      function getSalesmanList() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        SalesmanService.getDetailList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          if (data.length > 0) {
            data.sort(function (a, b) {
              if (!a && !b) {
                return false;
              }
              return a.nickname.localeCompare(b.nickname);
            });
          }
          $scope.partnersInfo.salesman = data;
          $scope.rightHeader.updateCount('salesman', $scope.partnersInfo.salesman.length);

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      function createSalesman(userInfo) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        SalesmanService.create({user_info: userInfo}).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.$emit(GlobalEvent.onShowAlert, '创建成功');
          getSalesmanList();
        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      function modifySalesman(userInfo) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        SalesmanService.update({user_info: userInfo}).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.$emit(GlobalEvent.onShowAlert, '修改成功');
          getSalesmanList();
        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      var salesmanDataHeaders = ['手机号码', '姓名', '电子邮箱'];

      function checkExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }

        var usernameArray = []; //防重复
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //因为获取到每行的数据不一定每一列都存在值，所以每一行的列数是不固定的
          //因此那一列有问题，用固定值。
          if (!rowData[salesmanDataHeaders[0]]) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '不能为空'});  //第一行是表头，所以+2
          }
          if (rowData.length < 2 || !rowData[salesmanDataHeaders[1]]) {
            return callback({row: rowIndex + 2, column: 'B', message: salesmanDataHeaders[1] + '不能为空'});  //第一行是表头，所以+2
          }
          if (!rowData[salesmanDataHeaders[0]].testPhone()) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '必须为手机号码'});  //第一行是表头，所以+2
          }
          if (usernameArray.indexOf(rowData[salesmanDataHeaders[0]]) > -1) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '不能重复'});
          }
          usernameArray.push(rowData[salesmanDataHeaders[0]]);

          for (var value in rowData) {
            switch (value) {
              case salesmanDataHeaders[2]:
                if (rowData[value] && !rowData[value].testMail()) {
                  return callback({row: rowIndex + 2, column: 'C', message: salesmanDataHeaders[2] + '必须为邮箱格式'});
                }
                break;
              default:
                break;
            }
          }
        }
        return callback();
      }

      function generateSalesmanData(sheetData) {
        var salesmanArray = [];
        if (!sheetData) {
          return salesmanArray;
        }
        var headerKeyValue = {
          '手机号码': 'username',
          '姓名': 'nickname',
          '电子邮箱': 'email'
        };

        var rowData;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var salesman = {};
          rowData = sheetData[rowIndex];
          for (var columnData in rowData) {
            salesman[headerKeyValue[columnData]] = rowData[columnData];
          }
          salesmanArray.push(salesman);
        }
        return salesmanArray;
      }

      function handleReadError(message) {
        $scope.$emit(GlobalEvent.onShowAlert, message);
        $scope.$emit(GlobalEvent.onShowLoading, false);
        return $scope.$apply();
      }

      $scope.singleSalesman.handleFile = function (element) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        $scope.$apply();

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('salesman-filename').outerHTML = document.getElementById('salesman-filename').outerHTML;
          document.getElementById('salesman-filename').value = '';
          if (err) {
            return handleReadError(err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '手机号码'},
            {key: 'B1', value: '姓名'},
            {key: 'C1', value: '电子邮箱'}
          ];

          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return handleReadError('请选择系统提供的模版填写关注人数据');
            }
            excelReader.getSheetData(excelSheet, salesmanDataHeaders, function (err, sheetData) {
              if (err) {
                return handleReadError(err.message);
              }

              checkExcelFormat(sheetData, function (err) {
                if (err) {
                  return handleReadError('第' + err.row + '行第' + err.column + '列' + err.message);
                }

                var salesmanArray = generateSalesmanData(sheetData);
                var sliceArray = ExcelReaderService.splitArray(salesmanArray, 30);
                var totalCount = salesmanArray.length;
                var successCount = 0, failedCount = 0;

                for (var index = 0; index < sliceArray.length; index++) {
                  SalesmanService.batchCreate({user_infos: sliceArray[index]}).then(function (data) {
                    successCount += data.success.length;
                    failedCount += data.faileds.length;

                    //全部完成
                    if (totalCount === (successCount + failedCount)) {
                      var showText = '成功上传' + successCount + '名关注人';
                      if (failedCount > 0) {
                        showText += '，剩余' + failedCount + '名上传失败';
                      }
                      $scope.$emit(GlobalEvent.onShowLoading, false);
                      $scope.$emit(GlobalEvent.onShowAlert, showText);

                      getSalesmanList();
                    }
                  });
                }
              });
            });

          });

        });
      };
      //salesman-code end

      function handleErrorByCompany(errType) {
        if (CompanyError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, CompanyError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function afterInviteSuccessEvent(data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        if (data.err) {
          handleErrorByCompany(data.err.type);
        }
        else {
          $scope.newCompanyInfo.isFinished = true;
        }
      }

      function afterInviteErrorEvent(err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        handleErrorByCompany('error'); //未知错误
      }

      function getPartnerCompanys() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleErrorByCompany(data.err.type);
          }
          if (data.partnerCompany)
            $scope.partnersInfo.company.partnerCompanies = data.partnerCompany;
          if (data.inviteCompany)
            $scope.partnersInfo.company.inviteCompanies = data.inviteCompany;

          $scope.rightHeader.updateCount('company', $scope.partnersInfo.company.partnerCompanies.length + $scope.partnersInfo.company.inviteCompanies.length);
        }, function (err) {
          handleErrorByCompany('error');
        });
      }

      $scope.newCompanyInfo = {
        isShowDialog: false,
        inputValue: '',
        matchCompanys: [],
        isFinished: false,
        isShowDrop: false,
        isAllowQuery: true,
        timerPromise: '',
        finishText: '',
        clickClosePage: '',
        clickCompanyItem: '',
        clickConfirm: '',
        clickFinish: '',
        emailReg: /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/,
        openDialog: function () {
        }
      };
      $scope.newCompanyInfo.openDialog = function () {
        this.isShowDialog = true;
        $scope.maskInfo.isShow = true;
      }
      $scope.newCompanyInfo.clickClosePage = function () {
        this.isShowDialog = false;
        this.inputValue = '';
        this.matchCompanys = [];
        this.isFinished = false;
        this.isShowDialog = false;
        this.isAllowQuery = true;
        this.timerPromise = '';
        this.finishText = '';
        $scope.maskInfo.isShow = false;
      };
      $scope.newCompanyInfo.clickFinish = function () {
        $scope.newCompanyInfo.clickClosePage();

        getPartnerCompanys();
      }
      $scope.newCompanyInfo.clickCompanyItem = function (selectedCompany) {
        $scope.newCompanyInfo.matchCompanys.forEach(function (companyItem) {
          companyItem.isSelected = false;
        });

        selectedCompany.isSelected = true;
        $scope.newCompanyInfo.inputValue = selectedCompany.name;
        $scope.newCompanyInfo.isShowDrop = false;

        //推迟执行，让$watch执行完再执行。去除最后一次查找，因为已完全匹配
        $timeout(function () {
          if ($scope.newCompanyInfo.timerPromise) {
            $timeout.cancel($scope.newCompanyInfo.timerPromise);
            $scope.newCompanyInfo.isAllowQuery = true;
          }
        }, 200);
      }
      $scope.newCompanyInfo.clickConfirm = function () {
        if (!$scope.newCompanyInfo.inputValue) {
          return;
        }
        var isExistCompany = false;
        if ($scope.newCompanyInfo.matchCompanys.length > 0) {
          //判断是否有选中的
          $scope.newCompanyInfo.matchCompanys.every(function (companyItem, index, arr) {
            if (companyItem.name === $scope.newCompanyInfo.inputValue) {
              isExistCompany = true;
              return false;
            }
            return true;
          });

          if (!isExistCompany) {
            $scope.$emit(GlobalEvent.onShowAlert, "公司名不存在或邮箱不合法");
            return;
          }
        }
        else {
          //检查是否匹配有效邮箱
          if (!$scope.newCompanyInfo.emailReg.test($scope.newCompanyInfo.inputValue)) {
            $scope.$emit(GlobalEvent.onShowAlert, "公司名不存在或邮箱不合法");
            return;
          }
        }

        if (isExistCompany) {
          $scope.newCompanyInfo.finishText = '恭喜您，您已经成功添加了' + $scope.newCompanyInfo.inputValue + '，该公司将出现在您的合作公司列表中。';
        } else {
          $scope.newCompanyInfo.finishText = '恭喜您，您已经成功邀请了' + $scope.newCompanyInfo.inputValue + '，该公司注册后将出现在您的合作公司列表中。';
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        if (isExistCompany) {
          CompanyService.inviteCompanyByName($scope.newCompanyInfo.inputValue).then(function (data) {
            afterInviteSuccessEvent(data);
          }, function (err) {
            afterInviteErrorEvent(err);
          });
        }
        else {
          CompanyService.inviteCompanyByEmail($scope.newCompanyInfo.inputValue).then(function (data) {
            afterInviteSuccessEvent(data);
          }, function (err) {
            afterInviteErrorEvent(err);
          });
        }
      };
      $scope.$watch(function () {
        return $scope.newCompanyInfo.inputValue;
      }, function () {
        if ($scope.newCompanyInfo.isAllowQuery) {
          $scope.newCompanyInfo.isAllowQuery = false;
          $scope.newCompanyInfo.timerPromise = $timeout(function () {
            if ($scope.newCompanyInfo.inputValue) {
              if ($scope.newCompanyInfo.emailReg.test($scope.newCompanyInfo.inputValue)) {
                $scope.newCompanyInfo.isShowDrop = false;
              }
              else {
                CompanyService.getMatchCompanies($scope.newCompanyInfo.inputValue).then(function (data) {
                  if (!data) {
                    console.log('get match companies empty');
                  }
                  else if (data.err) {
                    console.log(data.err);
                  }
                  else {
                    $scope.newCompanyInfo.matchCompanys = data;
                  }
                }, function (err) {
                  console.log('get match companies error: ' + err);
                });

                $scope.newCompanyInfo.isShowDrop = true;
              }
            }
            else {
              $scope.newCompanyInfo.isShowDrop = false;
            }

            $scope.newCompanyInfo.isAllowQuery = true;

          }, 500);
        }
      });



      $scope.newBidderInfo = {
        username: '',
        real_name: '',
        showBidderDialog: false,
        username_readonly: false,
        modify: function(bidder){
          this.username = bidder.username;
          this.real_name = bidder.real_name;
          this.showBidderDialog = true;
          this.username_readonly = true;
          $scope.maskInfo.isShow = true;
        },
        remove: function(bidder){
          if (!bidder) {
            return;
          }

          var alertContent = '确定删除合作中介吗' + bidder.username + '吗？';
          $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
            $scope.$emit(GlobalEvent.onShowLoading, true);
            BidderService.removeCompanyBidder({username: bidder.username}).then(function (result) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              if (result.err) {
                return handleErrorByDriver(result.err.type);
              }
              $scope.$emit(GlobalEvent.onShowAlert, '删除成功');
              getBidderList();
            }, function (err) {
              console.log(err);
              $scope.$emit(GlobalEvent.onShowLoading, false);
              handleErrorByDriver('error');
            });

          });
        },
        openDialog: function (isOpen) {
          this.username = '';
          this.showBidderDialog = isOpen;
          this.username_readonly = false;
          $scope.maskInfo.isShow = isOpen;
        },
        submit: function () {
          if (!this.username) {
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入手机号码');
          }
          if (!this.username.testPhone()) {
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入正确的手机号码');
          }
          if(!this.real_name){
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入中介姓名');
          }

          var that = this;

          $scope.$emit(GlobalEvent.onShowLoading, true);

          BidderService.inviteBidderByPhone({username: this.username, real_name: this.real_name}).then(function (data) {

            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return $scope.$emit(GlobalEvent.onShowAlert, data.err.zh_message || '操作出错');
            }

            getBidderList();
            that.openDialog(false);

            if(data.update_success){
              $scope.$emit(GlobalEvent.onShowAlert, '修改成功');
            }else if(data.add_success){
              $scope.$emit(GlobalEvent.onShowAlert, '添加成功');
            }

          }, function (err) {
            console.log(err);
            return handleErrorByDriver('error');
          });
        }
      };

      function getBidderList() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        BidderService.getDetailList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.partnersInfo.bidders = data;
          $scope.rightHeader.updateCount('bidder', $scope.partnersInfo.bidders.length);

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });

      }
    }]);
