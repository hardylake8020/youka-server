/**
 * Created by Wayne on 16/3/12.
 */

tender.controller('TenderCreateController', ['$rootScope', '$scope', '$stateParams', '$state', '$timeout',
  'GlobalEvent', 'HttpTender', 'StoreHelper', 'CommonHelper',
  function ($rootScope, $scope, $stateParams, $state, $timeout, GlobalEvent, HttpTender, StoreHelper, CommonHelper) {
    var basicInfo = {
      title: '基本信息',
      orderNumber: {
        title: '运单号',
        text: ''
      },
      referOrderNumber: {
        title: '参考单号',
        text: ''
      },
      senderCompany: {
        title: '发标单位',
        text: ''
      },
      payApprover: {
        title: '付款审核人',
        text: ''
      },
      financeOfficer: {
        title: '财务负责人',
        text: ''
      },
      timeRange: {
        title: '招标时间',
        line: '至',
        start: '',
        end: ''
      },
      truck: {
        title: '车辆要求',
        text: '',
        count: 1,
        isShowOption: false,
        options: ['金杯车', '4.2米', '6.8米', '7.6米', '9.6前四后四', '9.6前四后八', '12.5米', '14.7米', '16.5米', '17.5米'],
        showOptions: function (event) {
          this.isShowOption = !this.isShowOption;
          stopBubble(event);
        },
        clickSelectItem: function (item) {
          if (this.text !== item) {
            this.text = item;
          }
        },
        increaseCount: function () {
          this.count = this.increase(this.count);
        },
        decreaseCount: function () {
          this.count = this.decrease(this.count);
        },
        changeCount: function () {
          this.count = this.increase(this.count) - 1;
          if (this.count < 1) {
            this.count = 1;
          }
        },
        increase: function (data) {
          data = parseFloat(data) || 0;
          data++;
          return data;
        },
        decrease: function (data) {
          data = parseFloat(data) || 0;
          data--;
          if (data < 1) {
            data = 1;
          }
          return data;
        },
        checkType: function () {
          return this.options.indexOf(this.text) !== -1;
        },
        checkCount: function () {
          var count = parseFloat(this.count) || 0;
          if (count < 1) {
            return false;
          }

          return true;
        }
      },
      remark: {
        title: '备注',
        text: ''
      },
      autoCloseTender: {
        title: '自动截标',
        count: 10,
        increaseCount: function () {
          this.count = this.increase(this.count);
          if (this.count > 60) {
            this.count = 60;
          }
        },
        decreaseCount: function () {
          this.count = this.decrease(this.count);
        },
        changeCount: function () {
          this.count = this.increase(this.count) - 1;
          if (this.count < 1) {
            this.count = 1;
          }
          if (this.count > 60) {
            this.count = 60;
          }
        },
        increase: function (data) {
          data = parseFloat(data) || 0;
          data++;
          return data;
        },
        decrease: function (data) {
          data = parseFloat(data) || 0;
          data--;
          if (data < 1) {
            data = 1;
          }
          return data;
        },
        checkCount: function () {
          var count = parseFloat(this.count) || 0;
          if (count < 1 || count > 60) {
            return false;
          }

          return true;
        }
      }

    };
    $scope.basicInfo = basicInfo;

    var contactInfo = {
      provinceObject: {},
      provinces: [],
      pickup: {
        title: '提货信息',
        address: {
          title: '提货地址',
          province: '',
          city: '',
          region: '',
          region_location: null,
          street: '',
          cities: [],
          regions: [],
          isShowProvince: false,
          isShowCity: false,
          isShowRegion: false,
          selectProvince: function (event) {
            this.isShowProvince = !this.isShowProvince;
            this.isShowCity = false;
            this.isShowRegion = false;
            stopBubble(event);
          },
          selectCity: function (event) {
            this.isShowCity = !this.isShowCity;
            this.isShowProvince = false;
            this.isShowRegion = false;
            stopBubble(event);
          },
          selectRegion: function (event) {
            this.isShowRegion = !this.isShowRegion;
            this.isShowCity = false;
            this.isShowProvince = false;
            stopBubble(event);
          },
          clickProvince: function (province, event) {
            contactInfo.selectProvince(province, this);
          },
          clickCity: function (city, event) {
            contactInfo.selectCity(city, this);
          },
          clickRegion: function (region, event) {
            if (this.region !== region.name) {
              this.region = region.name;
              this.region_location = [region.location.lng, region.location.lat];
            }
          }
        },
        timeRange: '',
        minTime: new Date().Format('YY/MM/DD HH:mm'),
        linkMan: '',
        mobilePhone: '',
        tel: ''
      },
      delivery: {
        title: '收货信息',
        address: {
          title: '收货地址',
          province: '',
          city: '',
          region: '',
          region_location: null,
          street: '',
          cities: [],
          regions: [],
          isShowProvince: false,
          isShowCity: false,
          isShowRegion: false,
          selectProvince: function (event) {
            this.isShowProvince = !this.isShowProvince;
            this.isShowCity = false;
            this.isShowRegion = false;
            stopBubble(event);
          },
          selectCity: function (event) {
            this.isShowCity = !this.isShowCity;
            this.isShowProvince = false;
            this.isShowRegion = false;
            stopBubble(event);
          },
          selectRegion: function (event) {
            this.isShowRegion = !this.isShowRegion;
            this.isShowCity = false;
            this.isShowProvince = false;
            stopBubble(event);
          },
          clickProvince: function (province, event) {
            contactInfo.selectProvince(province, this);
          },
          clickCity: function (city, event) {
            contactInfo.selectCity(city, this);
          },
          clickRegion: function (region, event) {
            if (this.region !== region.name) {
              this.region = region.name;
              this.region_location = [region.location.lng, region.location.lat];
            }
          }
        },
        timeRange: '',
        minTime: new Date().Format('YY/MM/DD HH:mm'),
        linkMan: '',
        mobilePhone: '',
        tel: ''
      },
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
      },
      selectProvince: function (province, resource) {
        if (resource.province !== province) {
          resource.province = province;
          resource.city = '';
          resource.region = '';

          var cities = this.provinceObject.cities[province];
          resource.cities = cities.map(function (item) {
            return item.name;
          });
          resource.regions = [];
        }
      },
      selectCity: function (city, resource) {
        if (resource.city !== city) {
          resource.city = city;
          resource.region = '';

          var cities = this.provinceObject.cities[resource.province];
          var currentCity = cities.filter(function (item) {
            return item.name === city;
          });
          resource.regions = currentCity[0].regions;
        }
      },
      checkAddress: function (address) {
        if (!address.province || !address.city || !address.street) {
          return false;
        }
        return true;
      },
      getAddress: function (address) {
        return [address.province, address.city, address.region, address.street].join('');
      }
    };
    $scope.contactInfo = contactInfo;

    var paymentInfo = {
      title: '支付方式',
      rate: [
        {
          title: '首付占比',
          value: 50,
          cash: 60,
          card: 40,
          increaseCount: function () {
            this.value = paymentInfo.increase(this.value);
            if (this.value > 100) {
              this.value = 100;
            }
            this.calculateOther();
          },
          decreaseCount: function () {
            this.value = paymentInfo.decrease(this.value);
            if (this.value < 0) {
              this.value = 0;
            }
            this.calculateOther();
          },
          changeCount: function () {
            this.value = paymentInfo.increase(this.value) - 1;
            this.calculateOther();
          },
          calculateOther: function () {
            var tailValue = 100 - this.value - paymentInfo.rate[2].value;
            if (tailValue >= 0) {
              paymentInfo.rate[1].value = tailValue;
            }
            else {
              paymentInfo.rate[1].value = 0;
              paymentInfo.rate[2].value = 100 - this.value;
            }
          }
        },
        {
          title: '尾款占比',
          value: 40,
          cash: 100,
          card: 0,
          isHideSlide: true,
          increaseCount: function () {
            this.value = paymentInfo.increase(this.value);
            if (this.value > 100) {
              this.value = 100;
            }
            this.calculateOther();
          },
          decreaseCount: function () {
            this.value = paymentInfo.decrease(this.value);
            if (this.value < 0) {
              this.value = 0;
            }
            this.calculateOther();
          },
          changeCount: function () {
            this.value = paymentInfo.increase(this.value) - 1;
            this.calculateOther();
          },
          calculateOther: function () {
            var topValue = 100 - this.value - paymentInfo.rate[2].value;
            if (topValue >= 0) {
              paymentInfo.rate[0].value = topValue;
            }
            else {
              paymentInfo.rate[0].value = 0;
              paymentInfo.rate[2].value = 100 - this.value;
            }
          }
        },
        {
          title: '回单占比',
          value: 10,
          cash: 100,
          card: 0,
          isHideSlide: true,
          increaseCount: function () {
            this.value = paymentInfo.increase(this.value);
            if (this.value > 100) {
              this.value = 100;
            }
            this.calculateOther();
          },
          decreaseCount: function () {
            this.value = paymentInfo.decrease(this.value);
            if (this.value < 0) {
              this.value = 0;
            }
            this.calculateOther();
          },
          changeCount: function () {
            this.value = paymentInfo.increase(this.value) - 1;
            this.calculateOther();
          },
          calculateOther: function () {
            var tailValue = 100 - this.value - paymentInfo.rate[0].value;
            if (tailValue >= 0) {
              paymentInfo.rate[1].value = tailValue;
            }
            else {
              paymentInfo.rate[1].value = 0;
              paymentInfo.rate[0].value = 100 - this.value;
            }
          }
        }
      ],
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
      floor: 0,
      ceiling: 100,
      step: 1,
      precision: 0,
      translate: function () {
        return '';
      },
      checkRate: function () {
        var result = true;
        var totalRate = 0;
        for (var i = 0; i < paymentInfo.rate.length; i++) {
          var item = paymentInfo.rate[i];
          if (item.cash < 0 || item.cash > 100) {
            result = false;
            break;
          }
          totalRate += item.value;
        }
        if (totalRate !== 100) {
          result = false;
        }
        return result;
      }
    };
    $scope.paymentInfo = paymentInfo;

    var typeInfo = {
      tenderType: 'grab',//compare
      title: '选择比价或抢单模式',
      lowestProtectPrice: 0,
      highestProtectPrice: 0,
      deposit: 500,
      lowestGrabPrice: 0,
      highestGrabPrice: 0,
      grabTimeDuration: 0,
      grabIncrementPrice: 0,
      currentGrabPrice: 0,
      showGrab: true,
      changeGrabDuration: function () {
        this.grabTimeDuration = this.increase(this.grabTimeDuration) - 1;
        if (this.grabTimeDuration < 1) {
          this.grabTimeDuration = 1;
        }
        if (this.grabTimeDuration > 60) {
          this.grabTimeDuration = 60;
        }
      },
      increase: function (data) {
        data = parseFloat(data) || 0;
        data++;
        return data;
      },
      decrease: function (data) {
        data = parseFloat(data) || 0;
        data--;
        if (data < 1) {
          data = 1;
        }
        return data;
      },

      increaseCount: function () {
        this.grabTimeDuration = this.increase(this.grabTimeDuration);
        if (this.grabTimeDuration > 60) {
          this.grabTimeDuration = 60;
        }
      },
      decreaseCount: function () {
        this.grabTimeDuration = this.decrease(this.grabTimeDuration);
      },

      clickType: function () {
        this.showGrab = !this.showGrab;
      }
    };
    $scope.typeInfo = typeInfo;

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

    $scope.datetimepickerConfig = {
      startDataConfig: {
        dropdownSelector: '.dropdown-start',
        startView: 'day'
      },
      endDataConfig: {
        dropdownSelector: '.dropdown-end',
        startView: 'day'
      },
      startBeforeRender: function ($view, $dates, $leftDate, $upDate, $rightDate) {
        var minTime = this.getMinTime(basicInfo.timeRange.start);
        this.unableMinTime($dates, minTime);

        //if (basicInfo.timeRange.end) {
        //  var maxTime = moment(basicInfo.timeRange.end);
        //  this.unableMaxTime($dates, maxTime);
        //}
      },
      endBeforeRender: function ($view, $dates, $leftDate, $upDate, $rightDate) {
        var minTime = this.getMinTime(basicInfo.timeRange.end);
        this.unableMinTime($dates, minTime);
      },
      setStartTime: function (newDate, oldDate) {
      },
      setEndTime: function (newDate, oldDate) {
      },
      getMinTime: function (referTime) {
        var now = moment();
        if (referTime) {
          referTime = moment(referTime);
          if (referTime < now) {
            return moment(referTime.valueOf() - 24 * 3600 * 1000);
          }
        }
        return moment(now.valueOf() - 24 * 3600 * 1000);
      },
      unableMinTime: function (dates, minTime) {
        for (var i = 0; i < dates.length; i++) {
          if (dates[i].localDateValue() < minTime.valueOf()) {
            dates[i].selectable = false;
          }
        }
      },
      unableMaxTime: function (dates, maxTime) {
        for (var i = 0; i < dates.length; i++) {
          if (dates[i].localDateValue() > maxTime.valueOf()) {
            dates[i].selectable = false;
          }
        }
      }

    };

    function getOldTender(callback) {
      if ($stateParams.tender_id) {
        HttpTender.getOneTender($scope, {tender_id: $stateParams.tender_id}, function (err, data) {
          return callback(data);
        });
      }
      else {
        return callback();
      }
    }


    getOldTender(function (oldTender) {
      StoreHelper.getCities(function (err, data) {
        contactInfo.provinceObject = data;

        if (oldTender) {
          setTenderInfo(oldTender);
        }
      });

      StoreHelper.getSalesmen(function (err, data) {
        $scope.salesInfo.init();

        if (data) {
          data.forEach(function (salesman) {
            $scope.salesInfo.options.push({
              key: salesman._id,
              value: salesman.username,
              unable: false
            });
          });
        }
        if ($scope.salesInfo.options.length > 0) {
          //处理修改运单，需要添加业务员显示
          if (oldTender && oldTender.salesmen.length > 0) {
            var findCount = 0;
            for (var i = 0; i < $scope.salesInfo.options.length; i++) {
              if (oldTender.salesmen.indexOf($scope.salesInfo.options[i].value) > -1) {
                var selectItem = deepCopy($scope.salesInfo.selectInfo);
                selectItem.currentText = $scope.salesInfo.options[i].value;
                selectItem.currentChoice = $scope.salesInfo.options[i];
                //添加框
                $scope.salesInfo.addBox(true, selectItem);
                //添加选择
                selectSalesman(null, selectItem);
                findCount++;
              }
              if (oldTender.salesmen.length === findCount) {
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

      });

      $scope.goodsInfo.init();
      //运单修改
      if (oldTender && oldTender.goods.length > 0) {
        oldTender.goods.forEach(function (item) {
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
    });


    function compareTime(time1, time2) {
      return new Date(time1).valueOf() > new Date(time2).valueOf();
    }

    function setTenderInfo(oldTender) {
      basicInfo.orderNumber.text = oldTender.order_number;
      basicInfo.referOrderNumber.text = oldTender.refer_order_number;

      basicInfo.senderCompany.text = oldTender.senderCompany;
      basicInfo.payApprover.text = oldTender.payApprover;
      basicInfo.financeOfficer.text = oldTender.financeOfficer;

      basicInfo.timeRange.start = new Date(oldTender.start_time);
      basicInfo.timeRange.end = new Date(oldTender.end_time);
      basicInfo.truck.text = oldTender.truck_type;
      basicInfo.truck.count = oldTender.truck_count;
      basicInfo.remark.text = oldTender.remark;
      basicInfo.autoCloseTender.count = oldTender.auto_close_duration;

      //pickup_contact_address: contactInfo.getAddress(contactInfo.pickup.address),

      contactInfo.pickup.address.clickProvince(oldTender.pickup_province);
      contactInfo.pickup.address.clickCity(oldTender.pickup_city);

      contactInfo.pickup.address.province = oldTender.pickup_province;
      contactInfo.pickup.address.city = oldTender.pickup_city;
      contactInfo.pickup.address.region = oldTender.pickup_region || '';
      contactInfo.pickup.address.street = oldTender.pickup_street;
      contactInfo.pickup.linkMan = oldTender.pickup_name;
      contactInfo.pickup.tel = oldTender.pickup_tel_phone;
      contactInfo.pickup.mobilePhone = oldTender.pickup_mobile_phone;
      contactInfo.pickup.timeRange = {
        startDate: new Date(oldTender.pickup_start_time),
        endDate: new Date(oldTender.pickup_end_time)
      };

      contactInfo.delivery.address.clickProvince(oldTender.delivery_province);
      contactInfo.delivery.address.clickCity(oldTender.delivery_city);

      contactInfo.delivery.address.province = oldTender.delivery_province;
      contactInfo.delivery.address.city = oldTender.delivery_city;
      contactInfo.delivery.address.region = oldTender.delivery_region || '';
      contactInfo.delivery.address.street = oldTender.delivery_street;
      contactInfo.delivery.linkMan = oldTender.delivery_name;
      contactInfo.delivery.tel = oldTender.delivery_tel_phone;
      contactInfo.delivery.mobilePhone = oldTender.delivery_mobile_phone;
      contactInfo.delivery.timeRange = {
        startDate: new Date(oldTender.delivery_start_time),
        endDate: new Date(oldTender.delivery_end_time)
      };


      paymentInfo.rate[0].value = oldTender.payment_top_rate;
      paymentInfo.rate[0].cash = oldTender.payment_top_cash_rate;
      paymentInfo.rate[0].card = oldTender.payment_top_card_rate;

      paymentInfo.rate[1].value = oldTender.payment_tail_rate;
      paymentInfo.rate[1].cash = oldTender.payment_tail_cash_rate;
      paymentInfo.rate[1].card = oldTender.payment_tail_card_rate;

      paymentInfo.rate[2].value = oldTender.payment_last_rate;
      paymentInfo.rate[2].cash = oldTender.payment_last_cash_rate;
      paymentInfo.rate[2].card = oldTender.payment_last_card_rate;

      publishInfo.type = oldTender.assign_target;
    }

    function getTenderInfo(callback) {
      if (!basicInfo.orderNumber.text) {
        return callback('运单号为空');
      }

      if (!basicInfo.senderCompany.text) {
        return callback('发标方为空');
      }

      if (!basicInfo.payApprover.text) {
        return callback('付款审核人为空');
      }

      if (!basicInfo.financeOfficer.text) {
        return callback('财务负责人为空');
      }

      if (!basicInfo.timeRange.start) {
        return callback('标书开始时间为空');
      }
      if (!basicInfo.timeRange.end) {
        return callback('标书截止时间为空');
      }

      var now = new Date();
      if (!compareTime(basicInfo.timeRange.end, now)) {
        return callback('标书截止时间小于当前时间');
      }
      if (compareTime(basicInfo.timeRange.start, basicInfo.timeRange.end)) {
        return callback('标书开始时间大于截止时间');
      }

      if (!basicInfo.truck.checkType()) {
        return callback('车辆类型不正确');
      }
      if (!basicInfo.truck.checkCount()) {
        return callback('车辆数量不正确');
      }

      var goods = $scope.goodsInfo.getValidGoods();
      if (!goods[0].name) {
        return callback('货物不完整');
      }

      if (!basicInfo.autoCloseTender.checkCount()) {
        return callback('自动截标时长不正确');
      }

      var salesmen = [];
      if (getObjectLength($scope.salesInfo.hasSelected) > 0) {
        for (var saleKey in $scope.salesInfo.hasSelected) {
          salesmen.push($scope.salesInfo.hasSelected[saleKey]);
        }
      }
      if (!contactInfo.checkAddress(contactInfo.pickup.address)) {
        return callback('提货地址不完整');
      }
      if (!contactInfo.pickup.timeRange.startDate || !contactInfo.pickup.timeRange.endDate) {
        return callback('提货时间为空');
      }
      if (compareTime(basicInfo.timeRange.start, contactInfo.pickup.timeRange.endDate)) {
        return callback('提货截止时间小于标书开始时间');
      }

      if (!contactInfo.checkAddress(contactInfo.delivery.address)) {
        return callback('收货地址不完整');
      }
      if (!contactInfo.delivery.timeRange.startDate || !contactInfo.delivery.timeRange.endDate) {
        return callback('收货时间为空');
      }

      if (!paymentInfo.checkRate()) {
        return callback('支付方式设置不正确');
      }

      var info = {
        tender_id: $stateParams.tender_id,
        order_number: basicInfo.orderNumber.text,
        refer_order_number: basicInfo.referOrderNumber.text,

        sender_company: basicInfo.senderCompany.text,
        pay_approver: basicInfo.payApprover.text,
        finance_officer: basicInfo.financeOfficer.text,

        start_time: basicInfo.timeRange.start.toISOString(),
        end_time: basicInfo.timeRange.end.toISOString(),
        salesmen: salesmen,
        truck_type: basicInfo.truck.text,
        truck_count: basicInfo.truck.count,
        auto_close_duration: basicInfo.autoCloseTender.count,
        goods: goods,
        remark: basicInfo.remark.text,
        pickup_contact_province: contactInfo.pickup.address.province,
        pickup_contact_city: contactInfo.pickup.address.city,
        pickup_contact_region: contactInfo.pickup.address.region || '',
        pickup_contact_region_location: contactInfo.pickup.address.region_location || [],
        pickup_contact_street: contactInfo.pickup.address.street,
        pickup_contact_name: contactInfo.pickup.linkMan,
        pickup_contact_phone: contactInfo.pickup.tel,
        pickup_contact_mobile_phone: contactInfo.pickup.mobilePhone,
        pickup_start_time: new Date(contactInfo.pickup.timeRange.startDate).toISOString(),
        pickup_end_time: new Date(contactInfo.pickup.timeRange.endDate).toISOString(),

        delivery_contact_province: contactInfo.delivery.address.province,
        delivery_contact_city: contactInfo.delivery.address.city,
        delivery_contact_region: contactInfo.delivery.address.region || '',
        delivery_contact_region_location: contactInfo.delivery.address.region_location || [],
        delivery_contact_street: contactInfo.delivery.address.street,
        delivery_contact_name: contactInfo.delivery.linkMan,
        delivery_contact_phone: contactInfo.delivery.tel,
        delivery_contact_mobile_phone: contactInfo.delivery.mobilePhone,
        delivery_start_time: new Date(contactInfo.delivery.timeRange.startDate).toISOString(),
        delivery_end_time: new Date(contactInfo.delivery.timeRange.endDate).toISOString(),

        top_rate: paymentInfo.rate[0].value,
        top_cash_rate: paymentInfo.rate[0].cash,
        top_card_rate: 100 - paymentInfo.rate[0].cash,

        tail_rate: paymentInfo.rate[1].value,
        tail_cash_rate: paymentInfo.rate[1].cash,
        tail_card_rate: 100 - paymentInfo.rate[1].cash,

        last_rate: paymentInfo.rate[2].value,
        last_cash_rate: paymentInfo.rate[2].cash,
        last_card_rate: 100 - paymentInfo.rate[2].cash,

        assign_target: publishInfo.type || publishInfo.assign[1].type,


        tender_type: typeInfo.tenderType,
        lowest_protect_price: typeInfo.lowestProtectPrice,
        highest_protect_price: typeInfo.highestProtectPrice,
        deposit: typeInfo.deposit,
        lowest_grab_price: typeInfo.lowestGrabPrice,
        highest_grab_price: typeInfo.highestGrabPrice,
        grab_time_duration: typeInfo.grabTimeDuration,
        grab_increment_price: typeInfo.grabIncrementPrice,
        current_grab_price: typeInfo.currentGrabPrice
      };

      return callback(null, info);
    }

    function goTenderFollow() {
      $state.go('tender_follow');
    }

    var publishInfo = {
      assign: [
        {
          name: '合作中介',
          type: 'cooperation'
        },
        {
          name: '所有中介',
          type: 'all'
        }
      ],
      type: 'all',
      assignClick: function (type) {
        if (this.type !== type) {
          this.type = type;
        }
      },
      submit: function () {
        getTenderInfo(function (err, info) {
          if (err) {
            return CommonHelper.showAlert($scope, err);
          }
          HttpTender.createTender($scope, {tender_info: info}, function (err, data) {
            if (data.success) {
              if ($stateParams.tender_id) {
                return goTenderFollow();
              }

              $state.go('tender_create', {}, {reload: true});
              $scope.$emit(GlobalEvent.onShowAlertConfirm, "标书发布成功", goTenderFollow, null, {
                'sureLabel': '去查看',
                'cancelLabel': '继续创建'
              });
            }
          });

        });
      }
    };

    $scope.quickSubmit = function () {
      var date = new Date();
      var number = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getTime();
      var info = {
        "tender_info": {
          "tender_id": "",
          "order_number": "283748399290-1",
          "refer_order_number": "TestNUMBER-1",
          "sender_company": "邦达龙飞",
          "pay_approver": "13472423583",
          "finance_officer": "13472423583",
          "start_time": "2017-01-24T05:45:00.000Z",
          "end_time": "2017-01-25T05:45:00.000Z",
          "salesmen": ["13472423583"],
          "truck_type": "金杯车",
          "truck_count": 1,
          "auto_close_duration": 10,
          "goods": [{
            "name": "苹果",
            "count": 1,
            "unit": "箱",
            "count2": "11",
            "unit2": "吨",
            "count3": "1",
            "unit3": "立方",
            "price": "10"
          }, {
            "name": "栗子",
            "count": 1,
            "unit": "箱",
            "count2": "",
            "unit2": "吨",
            "count3": "",
            "unit3": "立方",
            "price": "12"
          }],
          "remark": "小心放",
          "pickup_contact_province": "上海",
          "pickup_contact_city": "上海市市辖区",
          "pickup_contact_region": "杨浦区",
          "pickup_contact_region_location": [121.5357165996346, 31.304510479541904],
          "pickup_contact_street": "测试地址1",
          "pickup_contact_name": "13472423583",
          "pickup_contact_phone": "",
          "pickup_contact_mobile_phone": "13472423583",
          "pickup_start_time": "2017-01-23T16:00:00.000Z",
          "pickup_end_time": "2017-01-24T15:59:59.999Z",
          "delivery_contact_province": "安徽",
          "delivery_contact_city": "蚌埠市",
          "delivery_contact_region": "禹会区",
          "delivery_contact_region_location": [117.30551506350041, 32.88969636047627],
          "delivery_contact_street": "测试地址2",
          "delivery_contact_name": "13472423583",
          "delivery_contact_phone": "",
          "delivery_contact_mobile_phone": "13472423583",
          "delivery_start_time": "2017-01-24T16:00:00.000Z",
          "delivery_end_time": "2017-01-25T15:59:59.999Z",
          "top_rate": 50,
          "top_cash_rate": 60,
          "top_card_rate": 40,
          "tail_rate": 40,
          "tail_cash_rate": 100,
          "tail_card_rate": 0,
          "last_rate": 10,
          "last_cash_rate": 100,
          "last_card_rate": 0,
          "assign_target": "all",
          "tender_type": "grab",
          "lowest_protect_price": 0,
          "highest_protect_price": 0,
          "deposit": 500,
          "lowest_grab_price": 2000,
          "highest_grab_price": 3000,
          "grab_time_duration": 10,
          "grab_increment_price": 10,
          "current_grab_price": 0
        }
      };

      HttpTender.createTender($scope, info, function (err, data) {
        if (data.success) {
          if ($stateParams.tender_id) {
            return goTenderFollow();
          }

          $state.go('tender_create', {}, {reload: true});
          $scope.$emit(GlobalEvent.onShowAlertConfirm, "标书发布成功", goTenderFollow, null, {
            'sureLabel': '去查看',
            'cancelLabel': '继续创建'
          });
        }
      });
    };

    $scope.publishInfo = publishInfo;

    $scope.$on(GlobalEvent.onBodyClick, function () {
      if ($scope.goodsInfo.goods.length > 0) {
        $scope.goodsInfo.goods.forEach(function (item) {
          item.isShowOption = false;
          item.isShowOption2 = false;
          item.isShowOption3 = false;
        });
      }
      if (basicInfo.truck.isShowOption) {
        basicInfo.truck.isShowOption = false;
      }
      contactInfo.pickup.address.isShowProvince = false;
      contactInfo.pickup.address.isShowCity = false;
      contactInfo.pickup.address.isShowRegion = false;

      contactInfo.delivery.address.isShowProvince = false;
      contactInfo.delivery.address.isShowCity = false;
      contactInfo.delivery.address.isShowRegion = false;
    });

  }]);
