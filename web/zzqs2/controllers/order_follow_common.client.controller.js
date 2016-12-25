/**
 * Created by Wayne on 15/9/9.
 */

function OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration) {
  var map = BMapService.create('orderTraceMap', '北京', 11, true);

  $scope.orders = {
    orderList: {
      selectOptions: configuration.selectOptions,

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
          if ($scope.orders.orderList.pagination.currentLimit !== $scope.orders.orderList.pagination.limit) {
            $scope.orders.orderList.pagination.currentLimit = $scope.orders.orderList.pagination.limit;
            onSaveMaxPageCount('max_page_count_follow', $scope.orders.orderList.pagination.limit);
          }

          getOrderList();
        }
      },
      rows: [],
      events: {
        selectedHandler: [onRowSelected],
        rowClickHandler: [onRowClick],
        headerSortChangedHandler: [onHeaderSortChanged],
        headerKeywordsChangedHandler: [onHeaderKeywordsChanged],
        updateDisplayFields: [onUpdateDisplayFields],
        saveDisplayFields: [onSaveDisplayFields]
      }
    },
    transportEvent: {
      current: '',
      clickVoice: ''
    },
    isShowBatchDelete: false,
    isShowBatchShare: false,
    currentOrderList: []
  };

  $scope.orderDetailInfo = {
    isAdmin: false,
    showDialog: false,
    imgIndex: 0,
    showOrderDetail: false,
    showPhotoScan: false,
    currentTab: 'timeline',
    currentId: '',
    currentOrderDetail: {},
    currentOrderEventInfo: {},
    curPhotoList: [],
    curPhotoItem: '',
    curPhotoIndex: 0,
    gpsCount: 0,
    ungpsCount: 0,
    currentTitle: configuration.pageTitle || '运单跟踪'
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

      if (!data.user_profile.customize_columns_follow || data.user_profile.customize_columns_follow.length <= 0) {
        console.log('customer did not create customer profile until now');
      }
      else {
        var currentOption, i;
        for (i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
          currentOption = $scope.orders.orderList.selectOptions[i];
          currentOption.isSelected = false;
        }

        data.user_profile.customize_columns_follow.forEach(function (columnName) {
          for (i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
            currentOption = $scope.orders.orderList.selectOptions[i];

            if (currentOption.key === columnName) {
              currentOption.isSelected = true;
              break;
            }
          }
        });
      }

      if (data.user_profile.max_page_count_follow) {
        $scope.orders.orderList.pagination.limit = parseInt(data.user_profile.max_page_count_follow) || $scope.orders.orderList.pagination.limit;
        $scope.orders.orderList.pagination.currentLimit = $scope.orders.orderList.pagination.limit;
      }
      return callback();
    }, function (err) {
      console.log(err);
      return callback();
    });
  }

  function fillDisplayFields() {
    if (!$scope.orders.orderList.selectOptions || $scope.orders.orderList.selectOptions.length <= 0) {
      return;
    }

    $scope.orders.orderList.fields = [];
    $scope.orders.orderList.selectOptions.forEach(function (optionItem) {
      if (optionItem.isSelected) {
        $scope.orders.orderList.fields.push(optionItem.value);
      }
    });

    if ($scope.orders.orderList.fields.length > $scope.orders.orderList.fields_length) {
      $scope.orders.orderList.fields = $scope.orders.orderList.fields.slice(0, $scope.orders.orderList.fields_length);
    }
  }

  function generateExecuteDriverName(driver) {
    var displayName = '';
    displayName += ((driver.nickname ? driver.nickname : '未知') + '/');
    displayName += (((driver.plate_numbers && driver.plate_numbers.length > 0) ? driver.plate_numbers[0] : '未知') + '/');
    displayName += (driver.username ? driver.username : '未知');

    return displayName;
  }

  function generateFieldsColumn(currentOrder) {
    var rowData = {};

    $scope.orders.orderList.fields.forEach(function (fieldItem) {
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
          rowData.goods_name = OrderHelper.getGoodsNameString(currentOrder.goods);
          break;
        case 'execute_driver':
          rowData.execute_driver = ((currentOrder.execute_drivers && currentOrder.execute_drivers.length > 0) ? generateExecuteDriverName(currentOrder.execute_drivers[0]) : '无');
          break;
        case 'execute_company':
          rowData.execute_company = ((currentOrder.execute_companies && currentOrder.execute_companies.length > 0) ? currentOrder.execute_companies[0].name : '无');
          break;
        case 'sender_name':
          rowData.sender_name = (currentOrder.sender_name ? currentOrder.sender_name : '未填');
          break;
        case 'receiver_name':
          rowData.receiver_name = (currentOrder.receiver_name ? currentOrder.receiver_name : '未填');
          break;
        case 'damage':
          rowData.damage = (currentOrder.damaged === true || currentOrder.damaged === 'true') ? '有货损 ' : '无货损 ';
          break;
        case 'description':
          rowData.description = currentOrder.description ? currentOrder.description : '未填';
          break;
        case 'status':
          rowData.status = $scope.generateOrderStatus(currentOrder.status, currentOrder.delete_status);
          break;
        case 'abnormal_reason':
          rowData.abnormal_reason = currentOrder.abnormal_reason;
          break;
        case 'assign_time':
          rowData.assign_time = (currentOrder.assign_time ? new Date(currentOrder.assign_time).Format('yyyy-MM-dd hh:mm:ss') : '无');
          break;
        case 'entrance_time':
          if (currentOrder.pickup_sign_events && currentOrder.pickup_sign_events.length > 0) {
            rowData.entrance_time = new Date(currentOrder.pickup_sign_events[0].created).Format('yyyy-MM-dd hh:mm:ss');
          }
          else {
            rowData.entrance_time = '无';
          }
          break;
        case 'halfway':
          if (currentOrder.halfway_events && currentOrder.halfway_events.length > 0) {
            rowData.halfway = (new Date(currentOrder.halfway_events[0].created).Format('yyyy-MM-dd hh:mm:ss') + ' ');

            if (currentOrder.halfway_events[0].description) {
              rowData.halfway += currentOrder.halfway_events[0].description;
            }
            else {
              rowData.halfway += '无描述';
            }
          }
          else {
            rowData.halfway = '无';
          }
          break;
        case 'confirm':
          if (currentOrder.confirm_events && currentOrder.confirm_events.length > 0) {
            rowData.confirm = '已确认';
          }
          else {
            rowData.confirm = '未确认';
          }
          break;
        default:
          break;
      }
    });

    return rowData;
  }

  $scope.close = function (e) {
    //关闭音频
    if ($scope.orderDetailInfo.currentOrderEventInfo && $scope.orderDetailInfo.currentOrderEventInfo.events) {
      closeVoices($scope.orderDetailInfo.currentOrderEventInfo.events);
    }
    $scope.orders.transportEvent.current = '';

    $scope.orderDetailInfo.currentId = '';
    $scope.orderDetailInfo.currentOrderDetail = {};
    $scope.orderDetailInfo.currentTab = 'timeline';
    $scope.orderDetailInfo.curPhotoList = [];
    $scope.orderDetailInfo.showOrderDetail = false;
    showMaskLayer(false);
    clearMap();
    stopBubble(e);
  };
  $scope.changeTab = function (tabName, onlyGps) {
    $scope.orderDetailInfo.currentTab = tabName;
    if (tabName == 'map') {
      clearMap();
      drawTraceLineOnMap(onlyGps, function (err, tracePoints) {
        var railingPoint = addExpectLocationOnMap($scope.orderDetailInfo.currentOrderDetail.orderDetail);  //添加预计提货交货点范围圈
        tracePoints = tracePoints || [];
        var allPoints = tracePoints.concat(railingPoint);

        setTimeout(function () {
          map.setViewport(allPoints); //将所有的点都显示出来
        }, 1000);
      });
      addEventMarkerOnMap();
    }
  };
  $scope.evaluateDriver = function (driverOrder) {
    var user = Auth.getUser();
    var url = '/driver/evaluation/page?driver_id=' + driverOrder.execute_driver._id +
      '&order_id=' + driverOrder._id +
      '&company_id=' + user.company._id +
      '&access_token=' + Auth.getToken();

    openNewScreenWindow(url, '评价司机');
  };
  $scope.getEvaluationLevel = function (level) {
    var levelText = '';
    switch (level) {
      case 1:
        levelText = '好评';
        break;
      case 2:
        levelText = '中评';
        break;
      case 3:
        levelText = '差评';
        break;
      default:
        break;
    }
    return levelText;
  };

  $scope.orders.transportEvent.clickVoice = function (event) {
    if (!event)
      return;
    if (!event.voice_file)
      return;

    //此时每个AudioPlayer对象都已经创建，可直接调用。
    var currentEvent = $scope.orders.transportEvent.current;
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
      $scope.orders.transportEvent.current = event;
    }

    return;
  };

  function closeVoices(events) {
    if (!events || events.length <= 0)
      return;

    for (var index = 0; index < events.length; index++) {
      var event = events[index];

      if (event.audioPlayer) {
        event.audioPlayer.close();
        event.audioPlayer = null;
      }
    }
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
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
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
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
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
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
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
            order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
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
            count: OrderHelper.getCountDetail(event.actual_goods_record),
            unit: ''
          });
        }
      }
    }
  }

  function getOrderCountVolumeWeight(orderDetail) {
    var sText = '';
    sText += (orderDetail.count ? (orderDetail.count + (orderDetail.count_unit ? orderDetail.count_unit : '件')) : '未填') + '/';
    sText += (orderDetail.weight ? (orderDetail.weight + (orderDetail.weight_unit ? orderDetail.weight_unit : '吨')) : '未填') + '/';
    sText += (orderDetail.volume ? (orderDetail.volume + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方')) : '未填');

    return sText;
  }

  function onHeaderKeywordsChanged(field) {
    $scope.orders.orderList.pagination.searchName = field.value;
    $scope.orders.orderList.pagination.searchValue = field.keyword;
    getOrderList();
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
    for (var i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
      currentOption = $scope.orders.orderList.selectOptions[i];

      if (currentOption.isSelected) {
        columnFields.push(currentOption.key);
      }
    }

    if (columnFields.length > 0) {
      UserProfileService.setFollowCustomizeColumns(columnFields).then(function (data) {
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
        return console.log('set follow page max count failed');
      }

      console.log('set follow page max count success');
    }, function (err) {
      return console.log('set follow page max count failed');
    });
  }

  function onHeaderSortChanged(field) {
    $scope.orders.orderList.pagination.sortName = field.value;
    $scope.orders.orderList.pagination.sortValue = field.curSort.value;
    getOrderList();
  }

  //<editor-fold desc='公共方法'>
  function showMaskLayer(isShow) {
    $scope.orderDetailInfo.showDialog = isShow;
  }

  function stopBubble(e) {
    if (e && e.stopPropagation)
      e.stopPropagation(); //非IE
    else
      window.event.cancelBubble = true; //IE
  }

  function handleError(errType) {
    if (OrderError[errType]) {
      $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
    }
    else {
      $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
    }
  }

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

  //</editor-fold desc='公共方法'>

  //<editor-fold desc='照片处理逻辑'>
  var photoThumListArea = document.querySelector("[id='photo-thum-list']");
  var photoThumListAreaWidth = 0;
  var photo_thum_width = 111;
  var photo_thum_position = 0;

  function generatePhotoUrl(photoName) {
    return config.qiniuServerAddress + photoName;
  }

  function getIndexByPhotoNameInScanList(photo) {
    if ($scope.orderDetailInfo.curPhotoList.length === 0) {
      return 0;
    }
    var _url = generatePhotoUrl(photo);
    for (var i = 0; i < $scope.orderDetailInfo.curPhotoList.length; i++) {
      if ($scope.orderDetailInfo.curPhotoList[i].url === _url) {
        return i;
      }
    }
    return 0;
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

  function addPhotosToList(photo) {
    for (var i = 0; i < $scope.orderDetailInfo.curPhotoList.length; i++) {
      if ($scope.orderDetailInfo.curPhotoList[i] == photo) {
        return;
      }
    }
    $scope.orderDetailInfo.curPhotoList.push(photo);
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

  $scope.generatePhoto = function (photoName) {
    return photoName ? generatePhotoUrl(photoName) : 'images/icon/order_follow/error.jpg';
  };

  $scope.showPhotos = function (photo) {
    $scope.orderDetailInfo.imgIndex = getIndexByPhotoNameInScanList(photo);
    $scope.orderDetailInfo.showPhotoScan = true;
    if ($scope.orderDetailInfo.currentTab == 'map') {
      $scope.$apply();
    }
  };
  $scope.showPhotoByPhotos = function (img) {
    $scope.orderDetailInfo.curPhotoItem = img;
  };

  $scope.moveThumList = function () {
    var view_width = $(".photo-nav-view").width();
    if (photoThumListAreaWidth < view_width) {
      return;
    }
    photo_thum_position -= photo_thum_width;
    if (photo_thum_position - view_width + photoThumListAreaWidth <= 0) {
      return;
    }
    $("#photo-thum-list").css("left", photo_thum_position + 'px');
  };

  //</editor-fold desc='照片处理逻辑'>

  //<editor-fold desc='订单信息'>

  function onRowSelected(rowsInfo, event) {
    console.log(rowsInfo.length);
    if (!rowsInfo || rowsInfo.length <= 0) {
      $scope.orderShare.batchShareInfo.orders = [];
      $scope.orders.isShowBatchDelete = false;
      $scope.orders.isShowBatchShare = false;
    }
    else {
      $scope.orderShare.batchShareInfo.orders = rowsInfo;
      $scope.orders.isShowBatchDelete = true;
      $scope.orders.isShowBatchShare = true;

      for (var index = 0; index < rowsInfo.length; index++) {
        var currentOrder = rowsInfo[index];

        if (currentOrder.create_company_id !== currentOrder.execute_company_id || (currentOrder.status !== 'unAssigned' && currentOrder.status !== 'assigning' && currentOrder.status !== 'unPickupSigned')) {
          $scope.orders.isShowBatchDelete = false;
          break;
        }
      }
    }

    stopBubble(event);
  }

  function onRowClick(rowInfo) {
    if (!rowInfo || !rowInfo._id)
      return;

    if (rowInfo.rowConfig.isDeleted) {
      return;
    }

    $scope.orderDetailInfo.currentId = rowInfo._id;
    clearPointsNumber();
    getOrderInfo(rowInfo._id);

    if (configuration.onRowClick) {
      configuration.onRowClick(rowInfo, $scope.searchModule.currentLabel);
    }
  }

  function getOrderList() {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    var searchArray = getSearchCondition();

    configuration.getOrderList(
      $scope.orders.orderList.pagination.currentPage,
      $scope.orders.orderList.pagination.limit,
      $scope.orders.orderList.pagination.sortName,
      $scope.orders.orderList.pagination.sortValue,
      searchArray)
      .then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        console.log(data.orders);
        if (data.err) {
          handleError(data.err.type);
        }
        else {
          if (configuration.handleOrders && (typeof(configuration.handleOrders) === 'function')) {
            configuration.handleOrders(data);
          }

          $scope.orders.currentOrderList = data.orders;
          renderOrderListRows(data.orders);
          $scope.orders.orderList.pagination.currentPage = parseInt(data.currentPage);
          $scope.orders.orderList.pagination.limit = parseInt(data.limit);
          $scope.orders.orderList.pagination.totalCount = parseInt(data.totalCount);
          $scope.orders.orderList.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
          $scope.orders.orderList.pagination.render();
        }
      }, function (err) {
        if (err)
          console.log(err);
      });
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

  function myRound(x) {
    if (x) {
      return Math.round(x * 100) / 100;
    } else {
      return x;
    }
  }

  function formatGood(good, sum) {
    if (good) {
      var a = [];
      if (good.count && good.unit) {
        var count = parseFloat(good.count);
        if (count) {
          a.push(myFixed(count) + good.unit);
          if (sum[good.unit]) {
            sum[good.unit] += myRound(count);
          } else {
            sum[good.unit] = myRound(count);
          }
        }
      }
      if (good.count2 && good.unit2) {
        var count2 = parseFloat(good.count2);
        if (count2) {
          a.push(myFixed(count2) + good.unit2);
          if (sum[good.unit2]) {
            sum[good.unit2] += myRound(count2);
          } else {
            sum[good.unit2] = myRound(count2);
          }
        }
      }
      if (good.count3 && good.unit3) {
        var count3 = parseFloat(good.count3);
        if (count3) {
          a.push(myFixed(count3) + good.unit3);
          if (sum[good.unit3]) {
            sum[good.unit3] += myRound(count3);
          } else {
            sum[good.unit3] = myRound(count3);
          }
        }
      }
      if (a.length == 0) {
        return '-';
      } else {
        return a.join('/');
      }
    }
    return '-';
  }

  function getOrderEvent(orderId, orderDetail) {
    OrderService.getEventsByOrderId(orderId, $scope.searchModule.currentLabel)
      .then(function (result) {
        if (result.err) {
          return handleError(result.err.type);
        }
        if (result && result.events && result.events instanceof Array) {
          result.events.forEach(function (evt) {
            if (evt.type == 'pickup' || evt.type == 'delivery') {
              var plan_goods = orderDetail.goods;
              var actual_goods = evt.actual_more_goods_record;
              var compare_goods = [];
              var plan_sum = {}, actual_sum = {}, compare_sum = '正常';
              for (var i = 0, len = plan_goods.length; i < len; i++) {
                var good1 = plan_goods[i];
                var good2 = actual_goods.filter(function (e) {
                    if (good1._id.toString() == e._id.toString()) {
                      return e;
                    }
                  })[0] || {};
                var good1_string = formatGood(good1, plan_sum);
                var good2_string = formatGood(good2, actual_sum);
                var compare;
                if (good2 && good2.count) {
                  if (good1.count != good2.count) {
                    compare = '缺货';
                    compare_sum = '缺货';
                  } else {
                    compare = '正常';
                  }
                } else {
                  compare = '缺货';
                  compare_sum = '缺货';
                }
                compare_goods.push({
                  name: good1.name,
                  planned: good1_string,
                  actual: good2_string,
                  compare: compare
                });
              }
              var plan_sum_string = '';
              for (var p in plan_sum) {
                if (plan_sum.hasOwnProperty(p)) {
                  plan_sum_string += '/' + myFixed(plan_sum[p]) + p;
                }
              }
              if (plan_sum_string.length > 0) {
                plan_sum_string = plan_sum_string.substring(1);
              }
              var actual_sum_string = '';
              for (p in actual_sum) {
                if (actual_sum.hasOwnProperty(p)) {
                  actual_sum_string += '/' + myFixed(actual_sum[p]) + p;
                }
              }
              if (actual_sum_string.length > 0) {
                actual_sum_string = actual_sum_string.substring(1);
              } else {
                actual_sum_string = '-';
              }
              compare_goods.push({
                name: '合计',
                planned: plan_sum_string,
                actual: actual_sum_string,
                compare: compare_sum
              });

              evt.compare_goods = compare_goods;
            }
          });
        }

        result.events = hideMoreSameEventForOrder(result.events);

        $scope.orderDetailInfo.currentOrderEventInfo = result;
        $scope.orderDetailInfo.curPhotoList = [];
        initPhotos($scope.orderDetailInfo.currentOrderEventInfo.events);
        initVoices($scope.orderDetailInfo.currentOrderEventInfo.events);
        initBarcode($scope.orderDetailInfo.currentOrderEventInfo.events);
        initActualInfo($scope.orderDetailInfo.currentOrderEventInfo.events);

      }, function (err) {
        console.log(err);
        $scope.orderDetailInfo.currentOrderEventInfo = {};
        return handleError(err.err.type);
      });
  }

  function getDriverOrderEventObject(planAddress, planTime, actualEvent) {
    var eventObject = {};
    if (actualEvent) {
      eventObject.address = actualEvent.address || '未知地址';
      eventObject.time = new Date(actualEvent.time).Format('yyyy/MM/dd hh:mm');
      eventObject.isActual = true;
    }
    else {
      eventObject.address = planAddress || '未知地址';
      eventObject.time = planTime ? new Date(planTime).Format('yyyy/MM/dd hh:mm') : '未知时间';
      eventObject.isActual = false;
    }

    return eventObject;
  }

  function filterCompanyOrdersWithAssignDriver(data) {
    var user = Auth.getUser();

    data.companyOrdersWithAssignDriver = [];
    if (data && data.assignedCompanyOrders && data.assignedCompanyOrders.length > 0) {
      data.companyOrdersWithAssignDriver = data.assignedCompanyOrders.filter(function (companyOrder) {
        if (companyOrder.drivers && companyOrder.drivers.length > 0) {
          return true;
        }
        return false;
      });
    }
    data.companyOrdersWithAssignDriver.sort(function (a, b) {
      if (!a.assign_time) {
        return true;
      }
      if (!b.assign_time) {
        return false;
      }
      return new Date(a.assign_time) > new Date(b.assign_time);
    });

    var number = 1;
    for (var i = 0; i < data.companyOrdersWithAssignDriver.length; i++) {
      var companyOrder = data.companyOrdersWithAssignDriver[i];
      if (companyOrder.assign_time) {
        companyOrder.assign_time_format = new Date(companyOrder.assign_time).Format('yyyy/MM/dd hh:mm');
      }
      else {
        companyOrder.assign_time_format = '未知时间';
      }

      for (var j = 0; j < companyOrder.drivers.length; j++) {
        var driverOrder = companyOrder.drivers[j];

        driverOrder.pickup_event_format = getDriverOrderEventObject(
          driverOrder.pickup_contacts.address,
          driverOrder.pickup_start_time,
          driverOrder.pickup_events[0]
        );
        driverOrder.delivery_event_format = getDriverOrderEventObject(
          driverOrder.delivery_contacts.address,
          driverOrder.delivery_start_time,
          driverOrder.delivery_events[0]
        );

        if (driverOrder.driver_evaluations && driverOrder.driver_evaluations.length > 0) {
          var currentEvaluation = driverOrder.driver_evaluations.filter(function (item) {
            return item.company_id.toString() === user.company._id.toString();
          });
          if (currentEvaluation.length > 0) {
            driverOrder.current_evaluation = currentEvaluation[0];
          }
        }

        driverOrder.number = number;
        number++;
      }
    }
  }

  function createOrderGoodsDetail(orderDetail) {
    var goods = [];
    if (orderDetail.goods && orderDetail.goods.length > 0) {
      for (var i = 0; i < orderDetail.goods.length; i++) {
        goods.push({
          title: '货物' + (i + 1),
          name: orderDetail.goods[i].name || '未知名称',
          value: OrderHelper.getSingleCountDetail(orderDetail.goods[i]),
          sum: (parseFloat(orderDetail.goods[i].count) || 0) * (parseFloat(orderDetail.goods[i].price) || 0)
        });
      }
      if (goods.length === 1) {
        goods[0].title = '货物';
      }
    }
    else {
      goods.push({
        title: '货物',
        name: orderDetail.goods_name || '未知名称',
        value: OrderHelper.getOrderCountVolumeWeight(orderDetail),
        sum: 0
      });
    }
    orderDetail.goodsInfo = goods;
  }

  function getOrderInfo(orderId) {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    OrderService.getAssignedOrderDetail(orderId, $scope.searchModule.currentLabel).then(function (data) {
      $scope.$emit(GlobalEvent.onShowLoading, false);
      console.log(data);
      console.log(orderId);
      if (data.err) {
        return handleError(data.err.type);
      }
      if (data && data.orderDetail && data.orderDetail.salesmen && data.orderDetail.salesmen.length > 0) {
        var salesmen = [];
        for (var i = 0, len = data.orderDetail.salesmen.length; i < len; i++) {
          var salesman = data.orderDetail.salesmen[i];
          if (salesman) {
            if (salesman.nickname && salesman.nickname != salesman.username) {
              salesmen.push(salesman.nickname + '(' + salesman.username + ')');
            } else {
              salesmen.push(salesman.username);
            }
          }
        }
        data.orderDetail._salesmen = salesmen;
      } else {
        data.orderDetail._salesmen = [];
      }
      $scope.orderDetailInfo.showOrderDetail = true;
      showMaskLayer(true);

      filterCompanyOrdersWithAssignDriver(data); //显示已分配司机的单子
      createOrderGoodsDetail(data.orderDetail);  //显示多货物
      $scope.orderDetailInfo.currentOrderDetail = data;

      getOrderEvent(orderId, data.orderDetail);
    }, function (err) {
      handleError(err);
    });
  }

  function renderOrderListRows(orders) {
    $scope.orders.orderList.rows = [];

    for (var i = 0; i < orders.length; i++) {
      var currentOrder = orders[i];

      var rowItem = {
        _id: currentOrder._id,
        //create_company_id: currentOrder.create_company._id.toString(),
        //execute_company_id: currentOrder.execute_company.toString(),
        status: currentOrder.status,
        columns: generateFieldsColumn(currentOrder),
        extendData: {
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

          sender_name: currentOrder.sender_name,
          receiver_name: currentOrder.receiver_name,
          receiver_company: currentOrder.receiver_company,
          sender_company: currentOrder.sender_company,
          salesmen: currentOrder.salesmen || [],
          goods: currentOrder.goods || [],

          pickup_deferred_duration: currentOrder.pickup_deferred_duration || 0,
          delivery_early_duration: currentOrder.delivery_early_duration || 0,
          abnormal_push: currentOrder.abnormal_push || false,
          pickup_push: currentOrder.pickup_push || false,

          create_push: currentOrder.create_push || false,
          delivery_sign_push: currentOrder.delivery_sign_push || false,
          delivery_push: currentOrder.delivery_push || false,
          order_transport_type: currentOrder.order_transport_type || 'ltl'
        },
        rowConfig: {
          isDeleted: currentOrder.delete_status,
          notOptional: currentOrder.delete_status ? true : false,
          unEdited: true,
          selfButtons: generateSelfButton(currentOrder)
        }
      };
      if (configuration.generateRowData) {
        configuration.generateRowData(rowItem, currentOrder, Auth.getUser()._id.toString());
      }

      $scope.orders.orderList.rows.push(rowItem);
    }

    $scope.orders.orderList.load();
  };

  function generateSelfButton(currentOrder) {
    var selfButtons = [];
    if (currentOrder.delete_status === true) {
      return selfButtons;
    }

    if ($scope.searchModule.currentLabel === 'assign') {

      // if (currentOrder.create_company._id === currentOrder.execute_company && currentOrder.status !== 'completed') {
      //   selfButtons.push({
      //     text: '',
      //     clickHandle: modifyOrderInfo,
      //     className: 'modify-order',
      //     title: '修改运单'
      //   });
      // }

      //已经分配的订单,已经签到
      if (currentOrder.status === 'unPickupSigned' || currentOrder.status === 'assigning') {
        var canAssignAgain = true;
        if (currentOrder.assigned_infos && currentOrder.assigned_infos.length > 0) {
          //for (var index = 0; index < currentOrder.assigned_infos.length; index++) {
          //  if (!currentOrder.assigned_infos[index].order_id) {
          //    canAssignAgain = false;
          //    break;
          //  }
          //}

          if (canAssignAgain) {
            selfButtons.push({
              text: '',
              clickHandle: modifyAssignInfo,
              className: 'modify-assign-info',
              title: '重新分配'
            });
          }

        }
      }
    }

    selfButtons.push({
      text: '',
      clickHandle: shareOrderByEmail,
      className: 'email-share',
      title: '分享到邮件'
    });
    selfButtons.push({
      text: '',
      clickHandle: function (rowInfo, event) {
        var orderInfo = generateWechatShareOrderInfos([rowInfo]);
        shareOrderByWechat(orderInfo, event);
      },
      className: 'wechat-share',
      title: '分享到微信'
    });

    if ($scope.searchModule.currentLabel === 'assign') {

      //已经分配的订单,已经签到
      // if (currentOrder.create_company._id === currentOrder.execute_company && (currentOrder.status === 'unAssigned' || currentOrder.status === 'assigning' || currentOrder.status === 'unPickupSigned')) {
      //   selfButtons.push({
      //     text: '',
      //     clickHandle: deleteOrder,
      //     className: 'delete-order',
      //     title: '删除'
      //   });
      // }
    }

    return selfButtons;
  };

  $scope.generateOrderStatus = function (status, isDelete) {
    if (isDelete) {
      return '已撤销';
    }

    var statusText = getStatusString(status);
    return statusText ? statusText : '已完成';
  };
  $scope.generateEventTypeDescription = function (event) {
    if (event.order.type === 'warehouse')
      return '仓储收货';
    return eventTypeConvert(event.type);
  };
  $scope.getDetailInfo = function (orderId) {
    $scope.orderDetailInfo.currentId = orderId;
    clearPointsNumber();
    getOrderInfo(orderId);
  };
  $scope.exportOrderPdf = function () {
    OrderService.exportOrderPdf($scope.orderDetailInfo.currentId);
  };

  $scope.showPartners = function (arr) {
    if (arr) {
      $scope.partners = '';
      arr.forEach(function (info) {
        $scope.partners += info.partner_name + ' ';
      });
    }
  };
  $scope.batchDeleteOrders = function () {
    if (!$scope.orders.isShowBatchDelete) {
      return;
    }

    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    var order_ids = [];
    for (var index = 0; index < $scope.orderShare.batchShareInfo.orders.length; index++) {
      var currentOrder = $scope.orderShare.batchShareInfo.orders[index];
      order_ids.push(currentOrder._id);
    }

    $scope.$emit(GlobalEvent.onShowAlertConfirm, '确认要删除这' + $scope.orderShare.batchShareInfo.orders.length + '项运单吗？', function (param) {

      $scope.$emit(GlobalEvent.onShowLoading, true);
      OrderService.batchDeleteOrders(order_ids).then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        console.log(data);

        if (!data) {
          return handleError('');
        }
        if (data.err) {
          return handleError(data.err.type);
        }

        var showTip = '删除成功';
        if (data.failedOrders && data.failedOrders.length > 0) {
          showTip = '操作完成，失败' + data.failedOrders.length + '个';
        }
        $scope.$emit(GlobalEvent.onShowAlert, showTip, function () {
          $state.go('order_follow', {}, {reload: true});
        });

      }, function (err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);

        console.log(err);
      });

    }, null);

  };

  //<editor-fold desc="订单操作相关">
  function modifyOrderInfo(row, event) {
    console.log('修改订单信息');

    var modifyOrder = {
      order_id: row._id,
      order_number: row.columns.order_number,
      refer_order_number: row.extendData.refer_order_number,
      original_order_number: row.extendData.original_order_number,
      goods_name: row.extendData.goods_name,

      count: row.extendData.count,
      weight: row.extendData.weight,
      volume: row.extendData.volume,

      count_unit: row.extendData.count_unit,
      weight_unit: row.extendData.weight_unit,
      volume_unit: row.extendData.volume_unit,
      freight_charge: row.extendData.freight_charge,

      customer_name: row.extendData.customer_name,
      pickup_start_time: row.extendData.pickup_start_time,
      delivery_start_time: row.extendData.delivery_start_time,
      pickup_end_time: row.extendData.pickup_end_time,
      delivery_end_time: row.extendData.delivery_end_time,
      description: row.extendData.description,
      group_id: row.extendData.execute_group,

      //contacts
      pickup_contact_name: row.extendData.pickup_contact_name,
      pickup_contact_phone: row.extendData.pickup_contact_phone,
      pickup_contact_mobile_phone: row.extendData.pickup_contact_mobile_phone,
      pickup_contact_address: row.extendData.pickup_contact_address,
      pickup_contact_email: '',

      delivery_contact_name: row.extendData.delivery_contact_name,
      delivery_contact_phone: row.extendData.delivery_contact_phone,
      delivery_contact_mobile_phone: row.extendData.delivery_contact_mobile_phone,
      delivery_contact_address: row.extendData.delivery_contact_address,
      delivery_contact_email: '',

      sender_name: row.extendData.sender_name,
      receiver_name: row.extendData.receiver_name,
      receiver_company: row.extendData.receiver_company,
      sender_company: row.extendData.sender_company,
      goods: row.extendData.goods,
      salesmen: [],

      pickup_deferred_duration: row.extendData.pickup_deferred_duration,
      delivery_early_duration: row.extendData.delivery_early_duration,
      abnormal_push: row.extendData.abnormal_push,
      pickup_push: row.extendData.pickup_push,

      create_push: row.extendData.create_push,
      delivery_sign_push: row.extendData.delivery_sign_push,
      delivery_push: row.extendData.delivery_push,
      order_transport_type: row.extendData.order_transport_type
    };
    if (row.extendData.salesmen && row.extendData.salesmen.length > 0) {
      modifyOrder.salesmen = row.extendData.salesmen.map(function (item) {
        return item.username;
      });
    }

    if (!row.extendData.goods || row.extendData.goods.length == 0) {
      var goods = [];
      goods.push({
        name: row.extendData.goods_name,
        count: row.extendData.count,
        unit: row.extendData.count_unit,
        count2: row.extendData.weight,
        unit2: row.extendData.weight_unit,
        count3: row.extendData.volume,
        unit3: row.extendData.volume_unit
      });
      modifyOrder.goods = goods;
    }

    console.log(modifyOrder);

    stopBubble(event);
    $state.go('order_create', {
      title: '修改运单',
      order: JSON.stringify(modifyOrder),
      modify_type: row.status === 'unAssigned' ? 'normal' : 'assigned'
    });
  };

  function modifyAssignInfo(row, event) {
    console.log('修改订单分配信息');

    $state.go('order_modify_assign', {id: row._id});
    stopBubble(event);
  };

  function deleteOrder(row, event) {
    console.log('删除订单信息');

    $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要删除吗？",
      function (param) {
        OrderService.deleteAssignedOrder(param._id)
          .then(function (data) {
            console.log(data);
            $state.go('order_follow', {}, {reload: true});
          }, function (err) {
            console.log(err);
          })
      }, row);

    stopBubble(event);
  };
  //</editor-fold>

  //</editor-fold desc='订单信息'>

  //<editor-fold desc='地图'>
  var iconSize = new BMap.Size(42, 33);
  var iconAnchorSize = new BMap.Size(14, 33);
  var myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_current.gif", iconSize, {anchor: iconAnchorSize});
  var currentMapLocationMarkers = [];

  function clearPointsNumber() {
    $scope.orderDetailInfo.gpsCount = 0;
    $scope.orderDetailInfo.ungpsCount = 0;
  }

  function startGetTheCurrentDriverLocation(bmapPoint) {
    if (bmapPoint) {
      var marker = new BMap.Marker(bmapPoint, {icon: myIcon});
      map.addOverlay(marker);
      currentMapLocationMarkers.push(marker);
    }
  }

  function drawTraceLineOnMap(onlyGps, callback) {
    OrderService.getTracesByOrderId($scope.orderDetailInfo.currentId, $scope.searchModule.currentLabel)
      .then(function (driversTraces) {
        console.log(driversTraces, 'driverTraces===========');
        if (driversTraces.err) {
          handleError(driversTraces.err.type);
          return callback();
        }

        var allDriverPoints = [];
        clearPointsNumber();
        var latestPoint = {
          trace: '',
          time: new Date('1988-1-10')
        };

        driversTraces.forEach(function (driverTraceObject) {
          var drawLineResult = BMapService.drawLine(map, driverTraceObject.traces, latestPoint, onlyGps);
          var driverPoints = drawLineResult.points;
          $scope.orderDetailInfo.gpsCount += drawLineResult.gpsCount;
          $scope.orderDetailInfo.ungpsCount += drawLineResult.ungpsCount;

          driverPoints.forEach(function (driverPoint) {
            allDriverPoints.push(driverPoint);
          });
        });

        //绘制当前位置
        var currentOrderDetail = $scope.orderDetailInfo.currentOrderDetail.orderDetail;
        if (currentOrderDetail.status != 'completed' && currentOrderDetail.status != 'unAssigned') {
          if (latestPoint.trace) {
            removeCurrentMarkers();

            startGetTheCurrentDriverLocation(new BMap.Point(latestPoint.trace.location[0], latestPoint.trace.location[1]));
          }
        }

        return callback(null, allDriverPoints);

      }, function (err) {
        console.log(err);
        return callback();
      });
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

  function addEventMarkerOnMap() {
    if (!$scope.orderDetailInfo.currentOrderEventInfo.events || $scope.orderDetailInfo.currentOrderEventInfo.events.length <= 0)
      return;
    $scope.orderDetailInfo.currentOrderEventInfo.events.forEach(function (event) {
      var html = generateTipHtml(event);
      BMapService.drawDriverEvent(map, event, html);
    });
  }

  function clearMap() {
    map.clearOverlays();
  }

  function removeCurrentMarkers() {
    if (currentMapLocationMarkers.length > 0) {
      currentMapLocationMarkers.forEach(function (marker) {
        map.removeOverlay(marker);
      });
    }
  }

  function eventTypeConvert(type) {
    return getStatusString(type);
  }

  function generateTipHtml(event) {
    var html = '<div class="event-tip">'
      + '<div class="event_type">' + eventTypeConvert(event.type) + '</div>'
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

  //</editor-fold desc='地图'>

  //<editor-fold desc='分享订单'>
  $scope.orderShare = {
    mainShareShow: false,  //显示分享页面
    editShareShow: true,   //显示运单信息，否则显示分享完成页面
    staffShareShow: true,  //显示员工分享，否则显示邮件分享
    count: 0,
    orders: '',
    batchShareInfo: {
      orders: []
    },
    suffix_customer: '',
    emailRecipients: '',  //单个Email
    staffRecipients: [],  //选择的员工Email
    allRecipients: '',    //收到分享的Email
    order_number_text: '',
    shareWithStaff: '',  //点击员工分享处理函数
    shareWithEmail: '',  //点击邮件分享处理函数
    closeSharePage: '',  //点击关闭运单分享页面
    clickShare: '',   //点击分享
    cooperateCompany: {
      allCompany: [],
      selectedCompanyStaffs: [],
      allSelectedCount: 0,
      isSelectedAll: false,
      isInvertSelected: false,
      clickSingleCompany: '',
      clickSingleStaff: '',
      clickSelectAll: '',
      clickInvertSelect: '',
      clickClearAll: '',
      currentCompanyName: ''
    }

  };

  $scope.batchWechatShareOrders = function () {
    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    displayWechatOrderShare($scope.orderShare.batchShareInfo.orders);
  };
  $scope.batchEmailShareOrders = function () {
    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    displayEmailOrderShare($scope.orderShare.batchShareInfo.orders);
  };
  $scope.orderShare.closeSharePage = function () {

    $scope.orderShare.mainShareShow = false;
    showMaskLayer(false);
  };
  $scope.orderShare.shareWithStaff = function () {
    $scope.orderShare.staffShareShow = true;
  };
  $scope.orderShare.shareWithEmail = function () {
    $scope.orderShare.staffShareShow = false;
  };
  $scope.orderShare.clickShare = function () {
    if (($scope.orderShare.staffShareShow && $scope.orderShare.staffRecipients.length <= 0) ||
      (!$scope.orderShare.staffShareShow && !$scope.orderShare.emailRecipients)) {
      //报错
      $scope.$emit(GlobalEvent.onShowAlert, "请选择员工或输入邮箱地址");
      return;
    }

    var recipientsArray = [];
    if ($scope.orderShare.staffShareShow)
      recipientsArray = $scope.orderShare.staffRecipients;
    else
      recipientsArray.push($scope.orderShare.emailRecipients);

    //正则表达式验证邮箱
    var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
    var allEmailRight = true;
    recipientsArray.every(function (emailAddress, index, arr) {
      if (!emailReg.test(emailAddress)) {
        console.log('invalid email address: ' + emailAddress);
        allEmailRight = false;
        return false;
      }
      else
        return true;
    });

    if (!allEmailRight) {
      $scope.$emit(GlobalEvent.onShowAlert, "邮箱地址不合法，请检查");
      return;
    }
    $scope.$emit(GlobalEvent.onShowLoading, true);

    if (!$scope.orderShare.staffShareShow) {
      $scope.orderShare.allRecipients = recipientsArray[0];
    }

    if (recipientsArray.length > 1)
      $scope.orderShare.suffix_customer = '等' + recipientsArray.length.toString() + '位客户';
    else
      $scope.orderShare.suffix_customer = '1位客户';

    OrderService.shareOrders(getOrderIds($scope.orderShare.orders), recipientsArray, !$scope.orderShare.staffShareShow)
      .then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);

        if (data.err) {
          if (data.err.data === '550 Mailbox not found or access denied') {
            $scope.$emit(GlobalEvent.onShowAlert, "您输入的邮箱可能不存在或者拒绝接受信件！请检查邮箱是否正确，重新输入。");
          } else {
            $scope.$emit(GlobalEvent.onShowAlert, "发送邮件失败！请检查邮箱是否正确，重新输入。");
          }
        } else {
          if (data.totalReceptionsCount === data.successReceptions.length) {
            $scope.orderShare.editShareShow = false;
          } else {
            var message = '';
            if (data.invalidEmailReceptionsCount > 0) {
              message += ('邮箱验证：' + data.invalidEmailReceptionsCount + '个失败！');
            }

            if (data.failedReceptions.length > 0) {
              message += ('用户分享：' + data.failedReceptions.length + '个失败！');
            }

            if (data.successReceptions.length > 0) {
              message += ('成功分享的邮箱有：' + data.successReceptionsString + '的' + data.successReceptions.length + '个！');
            }

            $scope.$emit(GlobalEvent.onShowAlert, message);
          }

        }
      }, function (err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        $scope.$emit(GlobalEvent.onShowAlert, "发送邮件失败");
      });
  };

  $scope.orderShare.cooperateCompany.clickSingleCompany = function (company) {
    $scope.orderShare.cooperateCompany.selectedCompanyStaffs = company.staffs;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;

    //当前选中的项
    $scope.orderShare.cooperateCompany.currentCompanyName = company.name;
  };
  $scope.orderShare.cooperateCompany.clickSingleStaff = function () {
    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;

  };
  $scope.orderShare.cooperateCompany.clickSelectAll = function () {
    //执行全选操作
    if (!$scope.orderShare.cooperateCompany.selectedCompanyStaffs || $scope.orderShare.cooperateCompany.selectedCompanyStaffs.length <= 0)
      return;

    $scope.orderShare.cooperateCompany.selectedCompanyStaffs.forEach(function (staff) {
      staff.isSelected = $scope.orderShare.cooperateCompany.isSelectedAll;
    });

    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;
  };
  $scope.orderShare.cooperateCompany.clickInvertSelect = function () {
    invertCurrentSelect($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);
  };
  $scope.orderShare.cooperateCompany.clickClearAll = function () {
    //清除所有选择
    clearAllSelectedStaff($scope.orderShare.cooperateCompany.allCompany);

    //计算全部选中的数量， 计算是否全选，去掉反选
    $scope.orderShare.cooperateCompany.clickSingleStaff();
  };

  function displayWechatOrderShare(orders, event) {
    var orderInfos = generateWechatShareOrderInfos(orders);
    shareOrderByWechat(orderInfos, event);
  };

  function generateWechatShareOrderInfos(orders) {
    if (orders.length <= 0) {
      return [];
    }
    var orderArray = [];
    for (var i = 0; i < orders.length; i++) {
      var order = {
        _id: orders[i]._id,
        order_number: orders[i].columns.order_number
      };
      orderArray.push(order);
    }
    return orderArray;
  };

  function shareOrderByWechat(orderInfoArray, event) {
    var param = JSON.stringify(orderInfoArray);
    param = encodeURIComponent(param);

    var url = config.serverAddress + '/wechat_share_qrcode?order_array=' + param;
    openNewScreenWindow(url);
    stopBubble(event);
  };


  function openNewScreenWindow(url, name) {
    if (name == null || name == '')
      name = "WechatShare";

    var win = window.open(url, name);
    win.focus();

    return win;
  };

  function shareOrderByEmail(rowInfo, event) {
    var orders = [];
    orders.push(rowInfo);

    displayEmailOrderShare(orders);

    stopBubble(event);
  }

  function displayEmailOrderShare(orders) {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    getCooperateCompanyInfo(function () {
      $scope.orderShare.orders = orders;
      $scope.orderShare.count = orders.length;
      $scope.orderShare.order_number_text = getOrderNumberText(orders);

      $scope.orderShare.mainShareShow = true;
      $scope.orderShare.editShareShow = true;
      $scope.orderShare.staffShareShow = true;
      $scope.orderShare.cooperateCompany.currentCompanyName = '';
      $scope.orderShare.cooperateCompany.selectedCompanyStaffs = '';

      showMaskLayer(true);
      $scope.$emit(GlobalEvent.onShowLoading, false);
    });
  }

  function getOrderNumberText(orders) {
    if (!orders.length || orders.length <= 0)
      return '';
    var orderNumberText = orders[0].columns.order_number;
    if (orders.length > 1)
      orderNumberText += '...';

    return orderNumberText;
  }

  function getOrderIds(orders) {
    if (!orders || orders.length <= 0)
      return '';

    var orderIds = [];
    for (var index = 0; index < orders.length; index++) {
      orderIds.push(orders[index]._id.toString());
    }

    return orderIds;
  }

  function calculateAllCompanySelectedStaffs(companys) {
    if (!companys || companys.length <= 0)
      return [];

    var staffs = [];
    $scope.orderShare.staffRecipients = [];
    $scope.orderShare.allRecipients = [];

    companys.forEach(function (company) {
      if (!company.staffs || company.staffs.length <= 0)
        return true;

      company.staffs.forEach(function (staff) {
        if (staff.isSelected) {
          staffs.push(staff);
          $scope.orderShare.staffRecipients.push(staff.username);
          $scope.orderShare.allRecipients.push(staff.nickname);
        }
      });
    });

    if ($scope.orderShare.allRecipients.length > 0) {
      $scope.orderShare.allRecipients = $scope.orderShare.allRecipients.join('、');
    }
    return staffs;
  }

  function calculateIsAllStaffSelected(companyStaffs) {
    if (!companyStaffs || companyStaffs.length <= 0)
      return false;

    var result = true;

    companyStaffs.every(function (staff, index, arr) {
      if (!staff.isSelected) {
        result = false;
        return false;
      }
      else
        return true;
    });

    return result;
  }

  function invertCurrentSelect(companyStaffs) {
    if (!companyStaffs || companyStaffs.length <= 0)
      return;

    companyStaffs.forEach(function (staff) {
      staff.isSelected = !staff.isSelected;
    });
  }

  function clearAllSelectedStaff(companys) {
    if (!companys || companys.length <= 0)
      return;

    companys.forEach(function (company) {
      if (!company.staffs || company.staffs.length <= 0)
        return true;

      company.staffs.forEach(function (staff) {
        staff.isSelected = false;
      });
    });

    return;
  }

  function getCooperateCompanyInfo(callback) {
    OrderService.getCooperateCompanys().then(function (data) {
      if (data.err)
        console.log(data.err);
      else {
        if (!data.companyIds || data.companyIds.length <= 0) {
          console.log('no cooperation companys');
          callback();
          return;
        }
        if (!data.staffs || data.staffs.length <= 0) {
          console.log('there are no users in cooperation companys');
          callback()
          return;
        }

        var allCompany = [];
        data.companyIds.forEach(function (partnerCompanyId) {
          var users = [];
          data.staffs.forEach(function (staff) {
            if (partnerCompanyId.toString() === staff.company._id.toString()) {
              staff.isSelected = false;
              users.push(staff);
            }
          });

          if (users.length > 0)
            allCompany.push({name: users[0].company.name, staffs: users});
        });

        $scope.orderShare.cooperateCompany.allCompany = allCompany;
      }
      callback();

    }, function (err) {
      console.log(err);
      callback();
    });
  }

  //</editor-fold desc='Share Order to others'>

  //搜素模块
  $scope.searchModule = {
    isShowHighSearch: false,
    showHighSearchHandle: '',
    hideHighSearchHandle: '',
    executeCompanyorDriver: '',
    receiver: '',
    goods_name: '',
    damaged: '不限',
    sender: '',
    description: '',
    order_number: '',
    searchHandle: '',
    isShowStatusSelect: false,
    isShowDamageSelect: false,
    showStatusSelect: '',
    showDamageSelect: '',
    statusItemClickHandle: '',
    damageItemClickHandle: '',

    createTimeRange: '',
    pickUpTimeRange: '',
    deliveryTimeRange: '',
    cleanDeliveryTime: '',
    cleanPickupTime: '',

    currentLabel: 'assign',
    changeLabel: '',
    statusOptions: [{name: '未分配', value: ['unAssigned', 'assigning'], isSelected: true},
      {name: '未提货', value: ['unPickupSigned', 'unPickuped'], isSelected: true},
      {name: '未交货', value: ['unDeliverySigned', 'unDeliveried'], isSelected: true},
      {name: '已完成', value: ['completed'], isSelected: true},
      {name: '已撤销', value: ['deleted'], isSelected: false}],

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
    $scope.orders.orderList.pagination.currentPage = 1;

    getOrderList();
  };

  $scope.searchModule.showStatusSelect = function (event) {
    $scope.searchModule.isShowStatusSelect = !$scope.searchModule.isShowStatusSelect;
    $scope.searchModule.isShowDamageSelect = false;

    stopBubble(event);
  };
  $scope.searchModule.showDamageSelect = function (event) {
    $scope.searchModule.isShowDamageSelect = !$scope.searchModule.isShowDamageSelect;
    $scope.searchModule.isShowStatusSelect = false;

    stopBubble(event);
  };

  $scope.searchModule.statusItemClickHandle = function (statusOption, event) {
    statusOption.isSelected = !statusOption.isSelected;

    if (statusOption.isSelected && statusOption.name === '已撤销') {
      $scope.searchModule.statusOptions.forEach(function (optionItem) {
        optionItem.isSelected = false;
      });

      statusOption.isSelected = true;
    }
    else if (statusOption.name !== '已撤销') {
      var deleteOption = $scope.searchModule.statusOptions.zzGetByAttribute('name', '已撤销');
      deleteOption[0].isSelected = false;
    }

    stopBubble(event);
  };
  $scope.searchModule.damageItemClickHandle = function (damageString) {
    $scope.searchModule.damaged = damageString;
  };

  $scope.searchModule.cleanDeliveryTime = function (event) {
    $scope.searchModule.deliveryTimeRange = '';

    stopBubble(event)
  };

  $scope.searchModule.cleanPickupTime = function (event) {
    $scope.searchModule.pickUpTimeRange = '';

    stopBubble(event)
  };

  $scope.searchModule.changeLabel = function (label) {
    if ($scope.searchModule.currentLabel === label) {
      return;
    }

    $scope.searchModule.currentLabel = label || 'assign';

    $scope.orders.orderList.pagination.currentPage = 1;

    getOrderList();
  };

  $scope.$on(GlobalEvent.onBodyClick, function () {
    $scope.searchModule.isShowStatusSelect = false;
    $scope.searchModule.isShowDamageSelect = false;
  });
  $scope.formatTime = function (time, format, defaultText) {
    if (!time) {
      return defaultText;
    }
    else {
      return new Date(time).Format(format);
    }
  };

  function getSearchCondition() {
    if (!$scope.searchModule)
      return;

    var searchArray = [];
    var statusArray = [];
    var isIncludeDeleteOrder = false;
    $scope.searchModule.statusOptions.forEach(function (statusOption) {
      if (statusOption.isSelected) {
        if (statusOption.name === '已撤销') {
          searchArray.push({
            key: 'isDeleted',
            value: true
          });

          isIncludeDeleteOrder = true;
        }
        else {
          statusArray = statusArray.concat(statusOption.value);
        }
      }
    });
    if (!isIncludeDeleteOrder) {
      searchArray.push({key: 'isDeleted', value: false});
    }

    if (statusArray.length > 0) {
      searchArray.push({key: 'order_status', value: statusArray});
    }

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
        key: 'deliveryTimeStart',
        value: moment($scope.searchModule.deliveryTimeRange.startDate).toISOString()
      });
      searchArray.push({
        key: 'deliveryTimeEnd',
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
        key: 'pickupTimeStart',
        value: moment($scope.searchModule.pickUpTimeRange.startDate).toISOString()
      });
      searchArray.push({
        key: 'pickupTimeEnd',
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

    if ($scope.searchModule.executeCompanyorDriver) {
      searchArray.push({
        key: 'executor',
        value: $scope.searchModule.executeCompanyorDriver
      });
    }
    if ($scope.searchModule.currentLabel) {
      searchArray.push({
        key: 'viewer',
        value: $scope.searchModule.currentLabel
      });
    }


    return searchArray;
  };

  getUserProfile(function () {
    var currentUser = Auth.getUser();
    if (currentUser && currentUser.roles) {
      if (currentUser.roles.indexOf('admin') > -1) {
        $scope.orderDetailInfo.isAdmin = true;
      }
    }

    fillDisplayFields();
    getOrderList(); //首次获取订单信息
  });

};