/**
 * Created by Wayne on 15/10/9.
 */

'use strict';

tender.controller('TenderFollowController', ['$rootScope', '$scope', '$state', '$interval', 'config',
  'HttpTender', 'CommonHelper', 'TenderHelper', 'GlobalEvent', 'BMapService', 'AudioPlayer', 'Auth',
  function ($rootScope, $scope, $state, $interval, config, HttpTender, CommonHelper, TenderHelper, GlobalEvent,
            BMapService, AudioPlayer, Auth) {

    Date.prototype.Format = function (fmt) {
      var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
      };
      if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return fmt;
    };
    var topHeader = {
      title: '查看标书',
      label: {
        processing: '进行中',
        completed: '已完成',
        current: 'processing',
        change: function () {
        }
      },
      search: {
        orderNumber: '',
        isExpand: false,
        expand: function () {
        },
        exec: function () {

        }
      },
      createTender: function () {
        $state.go('tender_create');
      }
    };
    $scope.topHeader = topHeader;

    $scope.timeRange = {
      //说明：timeRange 必须直接在$scope下面
      //不能取名叫startTime
      start: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
      end: ''
    };

    topHeader.label.change = function (name) {
      if (this.current === name) {
        return;
      }
      this.current = name;

      tenderView.getTenderList();
    };
    topHeader.search.expand = function (isExpand) {
      if (this.isExpand !== isExpand) {
        this.isExpand = isExpand;
      }
    };
    topHeader.search.exec = function () {
      tenderView.getTenderList();
      return false;
    };

    var tenderView = {
      getSearchCondition: function () {
        var result = {
          currentPage: tenderConfig.list.pagination.currentPage || 1,
          limit: tenderConfig.list.pagination.limit || 10,
          sortName: tenderConfig.list.pagination.sortName,
          sortValue: tenderConfig.list.pagination.sortValue || -1,
          startTime: $scope.timeRange.start && $scope.timeRange.start.Format('yyyy-MM-dd hh:mm:ss'),
          endTime: $scope.timeRange.end && $scope.timeRange.end.Format('yyyy-MM-dd hh:mm:ss')
        };

        var searchArray = [];
        searchArray.push({
          key: 'status',
          value: topHeader.label.current === 'processing' ? ['unStarted', 'comparing', 'compareEnd', 'unAssigned', 'inProgress', 'stop'] : ['completed']
        });
        if (topHeader.search.orderNumber) {
          searchArray.push({
            key: 'order_number',
            value: topHeader.search.orderNumber
          });
        }
        result.searchArray = searchArray;
        return result;
      },
      getTenderList: function () {
        HttpTender.getTenders($scope, this.getSearchCondition(), function (err, data) {
          console.log(err);
          console.log(data);
          tenderView.renderList(data);
          tenderConfig.detail.init();
        });
      },
      reloadTenderList: function () {
        tenderConfig.list.pagination.backHome();
        this.getTenderList();
      },
      renderList: function (data) {
        tenderConfig.list.rows = [];
        var currentTender;
        for (var i = 0; i < data.tenders.length; i++) {
          currentTender = data.tenders[i];

          var rowItem = {
            _id: currentTender._id,
            status: currentTender.status,
            columns: tenderView.generateFieldsColumn(currentTender),
            extendData: currentTender,
            rowConfig: {
              isDeleted: currentTender.status === 'deleted' || currentTender.status === 'obsolete',
              unEdited: true,
              selfButtons: tenderView.generateSelfButton(currentTender)
            }
          };

          tenderConfig.list.rows.push(rowItem);
        }

        if (data.totalCount && data.limit && data.currentPage) {
          tenderConfig.list.pagination.currentPage = data.currentPage;
          tenderConfig.list.pagination.limit = data.limit;
          tenderConfig.list.pagination.totalCount = data.totalCount;
          tenderConfig.list.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
          tenderConfig.list.pagination.render();
        }
      },
      generateFieldsColumn: function (tenderItem) {
        var rowData = {};

        tenderConfig.list.fields.forEach(function (fieldItem) {
          switch (fieldItem.value) {
            case 'order_number':
              rowData.order_number = tenderItem.order_number;
              break;
            case 'ref_number':
              rowData.ref_number = tenderItem.refer_order_number || '--';
              break;
            case 'goods_name':
              rowData.goods_name = TenderHelper.getGoodsName(tenderItem);
              break;
            case 'count_weight_volume':
              rowData.count_weight_volume = TenderHelper.getOrderCountDetail(tenderItem);
              break;
            case 'start_time':
              rowData.start_time = new Date(tenderItem.start_time).Format('yy/MM/dd hh:mm');
              break;
            case 'end_time':
              rowData.end_time = new Date(tenderItem.end_time).Format('yy/MM/dd hh:mm');
              break;
            case 'auto_close_time':
              rowData.auto_close_time = new Date(tenderItem.auto_close_time).Format('yy/MM/dd hh:mm');
              break;
            case 'request_count':
              if (tenderItem.status == 'unStarted') {
                rowData.request_count = '未开始';
              }
              else if (tenderItem.status == 'compareEnd') {
                rowData.request_count = '已过期';
              }
              else {
                rowData.request_count = tenderItem.tender_records.length || 0;
              }
              break;
            default:
              break;
          }
        });

        return rowData;
      },
      generateSelfButton: function (tenderItem) {
        var selfButtons = [];
        if (tenderItem.status === 'deleted' || tenderItem.status === 'obsolete') {
          return selfButtons;
        }

        if (tenderItem.status === 'unStarted') {
          selfButtons.push({
            text: '',
            clickHandle: tenderView.onDeleteClick,
            className: 'delete-order',
            title: '删除'
          })
        }

        return selfButtons;
      },
      onDeleteClick: function (row, event, callback) {
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要删除吗？",
          function (param) {
            HttpTender.deleteTender($scope, {tender_id: param._id}, function (err, data) {
              if (data.success) {
                tenderView.reloadTenderList();
                CommonHelper.showAlert($scope, '删除成功');
              }
              else {
                CommonHelper.showAlert($scope, '删除失败');
              }
              return callback();
            });
          }, row);
        if (event) {
          stopBubble(event);
        }
      },
      onRowClick: function (row, event) {
        if (row.rowConfig.isDeleted) {
          return;
        }

        tenderConfig.detail.setTender(row.extendData);
        tenderConfig.detail.show(true);
        stopBubble(event);
      },
      onModifyClick: function (tenderId) {
        $state.go('tender_create', {
          title: '修改标书',
          tender_id: tenderId
        });
      },
      onHeaderSortChanged: function (field) {
        tenderConfig.list.pagination.sortName = field.value;
        tenderConfig.list.pagination.sortValue = field.curSort.value;
        tenderView.getTenderList();
      }
    };

    var tenderConfig = {
      list: {
        fields: [
          {
            name: '运单号',
            value: 'order_number',
            isSort: true,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '参考单号',
            value: 'ref_number',
            isSort: false,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '货物名称',
            value: 'goods_name',
            abbr: true,
            abbrLen: 30,
            isSort: false,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '件/重/体',
            value: 'count_weight_volume',
            isSort: false,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '开始时间',
            value: 'start_time',
            isSort: true,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '截止时间',
            value: 'end_time',
            isSort: true,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '自动截标时间',
            value: 'auto_close_time',
            isSort: false,
            isSearch: false,
            columnWidth: 1,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '投标数量',
            value: 'request_count',
            isSort: false,
            isSearch: false,
            columnWidth: 1
          }
        ],
        isShowPagination: true,
        pagination: {
          currentPage: 1,
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
            tenderView.getTenderList();
          },
          backHome: function () {
            this.currentPage = 1;
          }
        },
        rows: [],
        events: {
          //selectedHandler: [onRowSelected],
          rowClickHandler: [tenderView.onRowClick],
          headerSortChangedHandler: [tenderView.onHeaderSortChanged]
          //headerKeywordsChangedHandler: [onHeaderKeywordsChanged],
          //updateDisplayFields: [onUpdateDisplayFields],
          //saveDisplayFields: [onSaveDisplayFields]
        }
      },
      detail: {
        currentTab: 'detail',
        gpsCount: 0,
        ungpsCount: 0,
        isShow: false,
        currentTender: {},
        currentOrder: {},
        topRecord: [],
        allRecord: [],
        isShowAllRecord: false,
        limitRecordCount: 3,
        currentLimitRecordCount: 0,
        timer: null,
        bidderId: '',
        winBidRecord: {},
        curPhotoList: [],
        showPhotoScan: false,
        imgIndex: 0,
        currentEvent: '',
        init: function () {
          this.currentTab = 'detail';
          this.gpsCount = 0;
          this.ungpsCount = 0;
          this.currentTender = {};
          this.currentOrder = {};
          this.topRecord = [];
          this.allRecord = [];
          this.isShowAllRecord = false;
          this.currentLimitRecordCount = this.limitRecordCount;
          this.bidderId = '';
          this.winBidRecord = {};
          this.curPhotoList = [];
          this.showPhotoScan = false;
          this.imgIndex = 0;
          this.currentEvent = '';
        },
        setTender: function (tenderInfo) {
          this.init();
          this.currentTender = tenderInfo;
          this.currentTender.goodsInfo = TenderHelper.createOrderGoodsDetail(tenderInfo);

          if (tenderInfo.status === 'inProgress' || tenderInfo.status === 'stop') {
            tenderInfo.remainTime = TenderHelper.getRemainTime(tenderInfo.end_time);
            if (tenderInfo.remainTime !== '00:00:00') {

              this.timer = $interval(function () {
                tenderInfo.remainTime = TenderHelper.getRemainTime(tenderInfo.end_time);
              }, 1000);
            }

            this.getTopQuoteRecord();
            this.getAllBidRecord();
          }
          if (this.currentTender.status === 'completed') {
            this.getWinnerRecord();

            if (this.currentTender.order) {
              this.getOrderInfo();
            }
          }
        },
        show: function (isShow) {
          this.isShow = isShow;
        },
        close: function (event) {
          if (this.timer) {
            $interval.cancel(this.timer);
            this.timer = null;
          }
          clearMap();
          this.show(false);
          stopBubble(event);
        },
        changeTab: function (tabName, onlyGps) {
          if (tabName === 'map') {
            clearMap();
            drawTraceLineOnMap(onlyGps, function (err, tracePoints) {
              if (err) {
                return;
              }
              var railingPoint = addExpectLocationOnMap(tenderConfig.detail.currentOrder);  //添加预计提货交货点范围圈
              tracePoints = tracePoints || [];
              var allPoints = tracePoints.concat(railingPoint);

              setTimeout(function () {
                map.setViewport(allPoints); //将所有的点都显示出来
              }, 1000);
            });
            addEventMarkerOnMap();
          }

          if (this.currentTab !== tabName) {
            this.currentTab = tabName;
          }
        },
        formatTime: function (time, format, defaultText) {
          if (!time) {
            return defaultText;
          }
          else {
            return new Date(time).Format(format);
          }
        },
        modifyTender: function () {
          if (!this.currentTender._id) {
            return;
          }
          tenderView.onModifyClick(this.currentTender._id);
        },
        deleteTender: function () {
          if (!this.currentTender._id) {
            return;
          }
          tenderView.onDeleteClick(this.currentTender, null, function () {
            tenderConfig.detail.show(false);
          });
        },
        showAllRecord: function (isTrue) {
          this.isShowAllRecord = !this.isShowAllRecord;
          this.currentLimitRecordCount = this.isShowAllRecord ? this.topRecord.length : this.limitRecordCount;

        },
        getTopQuoteRecord: function () {
          if (!this.currentTender._id) {
            return;
          }
          HttpTender.getTopQuoteRecord($scope, {tender_id: this.currentTender._id}, function (err, data) {
            tenderConfig.detail.topRecord = data || [];

            if (tenderConfig.detail.topRecord.length > tenderConfig.detail.currentTender.has_participate_bidders_count) {
              tenderConfig.detail.currentTender.has_participate_bidders_count = tenderConfig.detail.topRecord.length;
            }
          });
        },
        getAllBidRecord: function () {
          HttpTender.getAllBidRecord($scope, {tender_id: this.currentTender._id}, function (err, data) {
            console.log(data);
            tenderConfig.detail.allRecord = data || [];
          });
        },
        getWinnerRecord: function () {
          if (!this.currentTender._id) {
            return;
          }

          if (this.currentTender.type === 'grab') {
            this.currentTender.winner_price = this.currentTender.current_grab_price;

          }
          // if (this.currentTender.type === 'grab') {
          //   tenderConfig.detail.winBidRecord = this.currentTender.driver_winner || {};
          // }
          // else {
          //   HttpTender.getWinnerRecord($scope, {tender_id: this.currentTender._id}, function (err, data) {
          //     tenderConfig.detail.winBidRecord = data || {};
          //   });
          // }
        },
        getOrderInfo: function () {
          if (!this.currentTender.order) {
            return;
          }

          tenderConfig.detail.currentOrder = this.currentTender.order;
          tenderConfig.detail.currentOrder.goodsInfo = TenderHelper.createOrderGoodsDetail(tenderConfig.detail.currentOrder);
          tenderConfig.detail.getOrderEvent();

          // HttpTender.getOrderInfo($scope, {order_id: this.currentTender.order}, function (err, data) {
          //   if (!data.currentOrder || !data.assignedCompanyOrders) {
          //     return CommonHelper.showAlert($scope, '获取运单详情失败');
          //   }
          //   tenderConfig.detail.currentOrder = data.currentOrder || {};
          //   tenderConfig.detail.currentOrder.goodsInfo = TenderHelper.createOrderGoodsDetail(tenderConfig.detail.currentOrder.order_details);
          //   // tenderConfig.detail.currentOrder.assignedCompanyOrders = data.assignedCompanyOrders
          //
          //   tenderConfig.detail.getOrderEvent();
          // });
        },
        getOrderEvent: function () {
          if (!this.currentOrder._id) {
            return;
          }

          HttpTender.getOrderEvent($scope, {order_id: this.currentOrder._id}, function (err, result) {
            result.events = hideMoreSameEventForOrder(result.events);
            //
            tenderConfig.detail.currentOrder.eventInfo = result.events;
            tenderConfig.detail.curPhotoList = [];
            initPhotos(result.events);
            initVoices(result.events);
            initBarcode(result.events);
            initActualInfo(result.events);
          });
        },
        chooseBidder: function (bidderId) {
          if (this.bidderId !== bidderId) {
            this.bidderId = bidderId;
          }
        },
        applyToBidder: function () {
          if (!this.bidderId || this.topRecord.length === 0 || !this.currentTender._id) {
            return;
          }
          var selectedBidRecord = this.topRecord.filter(function (item) {
            return item.bidder._id === tenderConfig.detail.bidderId;
          });
          if (selectedBidRecord.length !== 1) {
            return;
          }


          $scope.$emit(GlobalEvent.onShowAlertPrompt, {
            tipText: "确认选择 " + selectedBidRecord[0].bidder.username,
            placeholderText: '输入选标原因（选填）',
            sure: '确认'
          }, function (inputContent) {

            HttpTender.applyBidder($scope, {
              tender_id: tenderConfig.detail.currentTender._id,
              bid_record_id: selectedBidRecord[0]._id,
              bidder_id: selectedBidRecord[0].bidder._id,
              price: selectedBidRecord[0].current_price,
              reason: inputContent || ''
            }, function (err, data) {
              if (data.success) {
                tenderView.reloadTenderList();
                CommonHelper.showAlert($scope, '招标成功');
                tenderConfig.detail.show(false);
              }
            });

          });
        },
        clickVoice: function (event) {
          if (!event)
            return;
          if (!event.voice_file)
            return;

          //此时每个AudioPlayer对象都已经创建，可直接调用。
          var currentEvent = this.currentEvent;
          //1、判断是否点击自己
          if (currentEvent && currentEvent.voice_file === event.voice_file) {
            if (currentEvent.audioPlayer) {
              if (currentEvent.audioPlayer.status === 'playing') {
                currentEvent.audioPlayer.stop();
              }
              else {
                currentEvent.audioPlayer.play();
              }
            }
            return;
          }

          //2、点击别人
          if (event.audioPlayer) {
            if (currentEvent && currentEvent.audioPlayer) {
              currentEvent.audioPlayer.stop();
            }
            event.audioPlayer.play();
            this.currentEvent = event;
          }

          return;
        }
      }
    };
    $scope.tenderConfig = tenderConfig;


    $scope.showPhotos = function (photo) {
      tenderConfig.detail.imgIndex = getIndexByPhotoNameInScanList(photo);
      tenderConfig.detail.showPhotoScan = true;
      if (tenderConfig.detail.currentTab == 'map') {
        $scope.$apply();
      }
    };
    $scope.generatePhoto = function (photoName) {
      return photoName ? generatePhotoUrl(photoName) : 'images/icon/order_follow/error.jpg';
    };
    $scope.formatTime = function (time, format, defaultText) {
      if (!time) {
        return defaultText;
      }
      else {
        return new Date(time).Format(format);
      }
    };

    $scope.generateTenderStatusString = function (status) {
      switch (status) {
        case  'unStarted':
          return '未开始';
        case  'comparing':
          return '比价中';
        case  'compareEnd':
          return '已过期';
        case  'unAssigned':
          return '未分配';
        case  'inProgress':
          return '进行中';
        case  'completed':
          return '已完成';
      }
    };

    $scope.generateEventTypeDescription = function (event) {
      if (event.order.type === 'warehouse')
        return '仓储收货';
      return getStatusString(event.type);
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
        case 'confirm':
          statusString = '确认接单';
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


    function hideMoreSameEventForOrder(orderEvents) {
      if (!orderEvents || orderEvents.length <= 0) {
        return [];
      }
      //orderEvents包含多个分段上传的多个事件。
      //将同一个Order的相同事件隐藏。
      var acturalResult = [];

      var singleArray = [];
      for (var i = 0; i < orderEvents.length; i++) {
        var orderItemEvent = orderEvents[i];
        var isExist = false;

        for (var j = 0; j < singleArray.length; j++) {
          var singleItem = singleArray[j];

          if (singleItem.order_id.toString() === orderItemEvent.order._id.toString()) {
            isExist = true;

            if (orderItemEvent.type === 'pickupSign' && singleItem.events.indexOf('pickupSign') > -1) {
              continue;
            }
            if (orderItemEvent.type === 'pickup' && singleItem.events.indexOf('pickup') > -1) {
              continue;
            }
            if (orderItemEvent.type === 'deliverySign' && singleItem.events.indexOf('deliverySign') > -1) {
              continue;
            }
            if (orderItemEvent.type === 'delivery' && singleItem.events.indexOf('delivery') > -1) {
              continue;
            }

            singleItem.events.push(orderItemEvent.type);
            acturalResult.push(orderItemEvent);
          }
        }

        if (!isExist) {
          singleArray.push({order_id: orderItemEvent.order._id, events: [orderItemEvent.type]});
          acturalResult.push(orderItemEvent);
        }

      }

      return acturalResult;
    }

    var photoThumListAreaWidth = 0;
    var photo_thum_width = 111;

    function generatePhotoUrl(photoName) {
      return config.qiniuServerAddress + photoName;
    }

    function addPhotosToList(photo) {
      for (var i = 0; i < tenderConfig.detail.curPhotoList.length; i++) {
        if (tenderConfig.detail.curPhotoList[i] == photo) {
          return;
        }
      }
      tenderConfig.detail.curPhotoList.push(photo);
    }

    function getTypeStringByPhotoType(type) {
      switch (type) {
        case 'pickup':
          return '提货货物照片';
        case 'delivery':
          return '交货货物照片';
        case 'pickupSign':
          return '提货签到照片';
        case 'deliverySign':
          return '交货签到照片';
        case 'halfway':
          return '中途事件照片'
      }
      return '';
    }

    function getIndexByPhotoNameInScanList(photo) {
      if (tenderConfig.detail.curPhotoList.length === 0) {
        return 0;
      }
      var _url = generatePhotoUrl(photo);
      for (var i = 0; i < tenderConfig.detail.curPhotoList.length; i++) {
        if (tenderConfig.detail.curPhotoList[i].url === _url) {
          return i;
        }
      }
      return 0;
    }

    function initPhotos(events) {
      if (!events || events.length <= 0)
        return;

      events.forEach(function (event) {
        switch (event.type) {
          case 'pickup':
          case 'delivery':
          {
            if (event.goods_photos && event.goods_photos.length > 0) {
              event.goods_photos.forEach(function (img) {
                photoThumListAreaWidth += photo_thum_width;
                var scan_obj = {
                  order: tenderConfig.detail.currentOrder.order_number,
                  title: '提货货物照片',
                  warning: event.damaged ? '货物有损' : '',
                  url: generatePhotoUrl(img),
                  remark: event.description
                };
                addPhotosToList(scan_obj);
              });
            }

            if (event.credential_photos && event.credential_photos.length > 0) {
              event.credential_photos.forEach(function (img) {
                photoThumListAreaWidth += photo_thum_width;
                var scan_obj = {
                  order: tenderConfig.detail.currentOrder.order_number,
                  title: '提货单据照片',
                  warning: event.damaged ? '货物有损' : '',
                  url: generatePhotoUrl(img),
                  remark: event.description
                };
                addPhotosToList(scan_obj);
              });
            }

            break;
          }
          case 'pickupSign':
          case 'deliverySign':
          case 'halfway':
          {
            if (event.halfway_photos && event.halfway_photos.length > 0) {
              event.halfway_photos.forEach(function (img) {
                photoThumListAreaWidth += photo_thum_width;
                var scan_obj = {
                  order: tenderConfig.detail.currentOrder.order_number,
                  title: getTypeStringByPhotoType(event.type),
                  warning: event.damaged ? '货物有损' : '',
                  url: generatePhotoUrl(img),
                  remark: event.description
                };
                addPhotosToList(scan_obj);
              });
            }
            break;
          }
        }

        if (event.photos && event.photos.length > 0) {
          event.photos.forEach(function (img) {
            photoThumListAreaWidth += photo_thum_width;
            var scan_obj = {
              order: tenderConfig.detail.currentOrder.order_number,
              title: img.name,
              warning: event.damaged ? '货物有损' : '',
              url: generatePhotoUrl(img.url),
              remark: event.description
            };
            addPhotosToList(scan_obj);
          });
        }

      });
    }

    function initVoices(events) {
      if (!events || events.length <= 0)
        return;
      for (var index = 0; index < events.length; index++) {
        var event = events[index];

        if (event.voice_file.length > 0) {
          event.voice_file = config.qiniuServerAddress + event.voice_file;
          event.audioPlayer = new AudioPlayer(event.voice_file, function (type, status) {
            setTimeout(function () {
              $scope.$apply();
            }, 1);
          });
        }
      }
    }

    function initBarcode(events) {
      if (!events || events.length <= 0)
        return;

      for (var index = 0; index < events.length; index++) {
        var event = events[index];

        if (event.order_codes && event.order_codes.length > 0) {
          event.barcodes = event.order_codes.join(', ');
        }
        else {
          event.barcodes = '';
        }
      }
    }

    function initActualInfo(events) {
      if (!events || events.length <= 0)
        return;

      for (var index = 0; index < events.length; index++) {
        var event = events[index];

        event.actualGoods = [];
        event.actualShowing = false;

        if (event.actual_more_goods_record && event.actual_more_goods_record.length > 0) {
          for (var i = 0; i < event.actual_more_goods_record.length; i++) {
            if (event.actual_more_goods_record[i].name || event.actual_more_goods_record[i].count) {
              event.actualShowing = true;
            }
            event.actualGoods.push({
              title: '实收货物' + (i + 1),
              name: event.actual_more_goods_record[i].name || '未知名称',
              count: event.actual_more_goods_record[i].count || '未知数量',
              unit: event.actual_more_goods_record[i].unit
            });
          }
          if (event.actualGoods.length === 1) {
            event.actualGoods[0].title = '实收货物';
          }
        }
        else {
          if (event.actual_goods_record) {
            if (event.actual_goods_record.goods_name ||
              (event.actual_goods_record.count ||
              event.actual_goods_record.weight ||
              event.actual_goods_record.volume)) {
              event.actualShowing = true;
            }
            event.actualGoods.push({
              title: '实收货物',
              name: event.actual_goods_record.goods_name || '未知名称',
              count: TenderHelper.getOrderCountDetail(event.actual_goods_record),
              unit: ''
            });
          }
        }
      }
    }


    var map = BMapService.create('orderTraceMap', '北京', 11, true);
    var iconSize = new BMap.Size(42, 33);
    var iconAnchorSize = new BMap.Size(14, 33);
    var myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_current.gif", iconSize, {anchor: iconAnchorSize});
    var currentMapLocationMarkers = [];

    function clearMap() {
      map.clearOverlays();
    }

    function drawTraceLineOnMap(onlyGps, callback) {
      if (!tenderConfig.detail.currentOrder._id) {
        return;
      }

      HttpTender.getOrderTrace($scope, {order_id: tenderConfig.detail.currentOrder._id}, function (err, traces) {
        console.log(traces, '====driverTraces====');
        if (err) {
          return callback(err);
        }

        var allDriverPoints = [];
        var latestPoint = {
          trace: '',
          time: new Date('1988/1/10')
        };
        tenderConfig.detail.currentOrder.gpsCount = 0;
        tenderConfig.detail.currentOrder.ungpsCount = 0;

        traces.forEach(function (driverTraceObject) {
          var drawLineResult = BMapService.drawLine(map, driverTraceObject.traces, latestPoint, onlyGps);
          var driverPoints = drawLineResult.points;
          tenderConfig.detail.currentOrder.gpsCount += drawLineResult.gpsCount;
          tenderConfig.detail.currentOrder.ungpsCount += drawLineResult.ungpsCount;

          driverPoints.forEach(function (driverPoint) {
            allDriverPoints.push(driverPoint);
          });
        });

        //绘制当前位置
        var currentOrder = tenderConfig.detail.currentOrder;
        if (currentOrder.status != 'completed' && currentOrder.status != 'unAssigned') {
          if (latestPoint.trace) {
            removeCurrentMarkers();

            addCurrentDriverLocation(new BMap.Point(latestPoint.trace.location[0], latestPoint.trace.location[1]));
          }
        }

        return callback(null, allDriverPoints);

      });
    }

    function addEventMarkerOnMap() {
      if (!tenderConfig.detail.currentOrder.eventInfo || tenderConfig.detail.currentOrder.eventInfo <= 0) {
        return;
      }
      tenderConfig.detail.currentOrder.eventInfo.forEach(function (event) {
        var html = generateTipHtml(event);
        BMapService.drawDriverEvent(map, event, html);
      });
    }

    function generateTipHtml(event) {
      var html = '<div class="event-tip">'
        + '<div class="event_type">' + getStatusString(event.type) + '</div>'
        + '<div class="driver"><strong>司机:</strong><span>'
        + (event.driver.nickname ? (event.driver.nickname) + " " : '')
        + (event.driver.username ? (event.driver.username) + " " : '')
        + (event.driver.plate_numbers.length > 0 ? (event.driver.plate_numbers[0] + " ") : '')
        + '</span></div>'
        + '<div class="time"><strong>时间:</strong><time>' + new Date(event.time).toLocaleString() + '</time></div>'
        + '<div class="address"><strong>地点:</strong><span>' + event.address + '</span></div>'
        + '<div class="damaged"><strong>货损:</strong><span>' + (event.damaged ? '有' : '无') + '</span></div>'
        + '<div class="description"><strong>备注:</strong><span>' + (event.description ? event.description : '无') + '</span></div>'
        + generatePhotoHtml(event)
        + '</div>';
      return html;
    }

    function generatePhotoHtml(event) {
      var displayPhotos = [];
      switch (event.type) {
        case 'pickup':
        case 'delivery':
        {
          if (event.goods_photos && event.goods_photos.length > 0) {
            displayPhotos.push(event.goods_photos[0]);
          }
          if (event.credential_photos && event.credential_photos.length > 0) {
            displayPhotos.push(event.credential_photos[0]);
          }
          break;
        }
        case 'pickupSign':
        case 'deliverySign':
        case 'halfway':
        {
          if (event.halfway_photos && event.halfway_photos.length > 0) {
            displayPhotos.push(event.halfway_photos[0]);
          }
          break;
        }
      }
      var result = '';
      if (displayPhotos.length > 0) {
        result += '<div id="' + event._id + '" class="photos">';
        displayPhotos.forEach(function (photo) {
          result += ('<div class="photo" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
          '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
        });
        result += '</div>';
      }
      return result;
    }

    function removeCurrentMarkers() {
      if (currentMapLocationMarkers.length > 0) {
        currentMapLocationMarkers.forEach(function (marker) {
          map.removeOverlay(marker);
        });
      }
    }

    function addCurrentDriverLocation(bmapPoint) {
      if (bmapPoint) {
        var marker = new BMap.Marker(bmapPoint, {icon: myIcon});
        map.addOverlay(marker);
        currentMapLocationMarkers.push(marker);
      }
    }

    function addExpectLocationOnMap(currentOrderDetail) {
      //1.获取要绘制的点
      //2.默认从分配信息中获取所有的点
      //3.如果是顶层运单，优先选择创建地址
      var locations = [];
      if (!currentOrderDetail.parent_order) {
        if (currentOrderDetail.pickup_contacts.location && currentOrderDetail.pickup_contacts.location.length === 2) {
          locations.push(
            {
              point: currentOrderDetail.pickup_contacts.location,
              type: 'pickup',
              address: currentOrderDetail.pickup_contacts.brief || currentOrderDetail.pickup_contacts.address
            });
        }
        if (currentOrderDetail.delivery_contacts.location && currentOrderDetail.delivery_contacts.location.length === 2) {
          locations.push(
            {
              point: currentOrderDetail.delivery_contacts.location,
              type: 'delivery',
              address: currentOrderDetail.delivery_contacts.brief || currentOrderDetail.delivery_contacts.address
            });
        }
      }

      if (locations.length === 0) {
        if (currentOrderDetail.assigned_infos && currentOrderDetail.assigned_infos.length > 0) {
          currentOrderDetail.assigned_infos.forEach(function (assignItem) {
            if (assignItem.pickup_contact_location && assignItem.pickup_contact_location.length === 2) {
              locations.push(
                {
                  point: assignItem.pickup_contact_location,
                  type: 'pickup',
                  address: assignItem.pickup_contact_brief || assignItem.pickup_contact_address
                });
            }
            if (assignItem.delivery_contact_location && assignItem.delivery_contact_location.length === 2) {
              locations.push(
                {
                  point: assignItem.delivery_contact_location,
                  type: 'delivery',
                  address: assignItem.delivery_contact_brief || assignItem.delivery_contact_address
                });
            }
          });
        }
      }

      var mapPoints = [];
      if (locations.length > 0) {
        mapPoints = BMapService.drawCircle(map, locations);
      }

      return mapPoints;
    }


    tenderView.getTenderList();
    $scope.paymentInfo = {
      paymentFunc: function (type, number) {
      HttpTender.payment($scope, {type: type, number: number}, function (err, data) {
        if (!data.err) {
          $scope.$emit(GlobalEvent.onShowAlert, '支付成功', function () {
            $state.go('tender_follow', {}, {reload: true});
          });
        }
      });
    }

    };
  }]);