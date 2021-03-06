/**
 * Created by Wayne on 15/12/11.
 */
tender.factory('OrderHelper',
  ['$rootScope', 'config', 'OrderError', function ($rootScope, config,OrderError) {

    var currentPlayAudio;

    function onAudioPlay(element) {
      if (element === currentPlayAudio) {
        return;
      }

      if (currentPlayAudio) {
        currentPlayAudio.pause();
      }

      currentPlayAudio = element;
    }

    function getAudioConfig(voiceKey) {
      voiceKey = voiceKey || '';
      var voiceUrl = voiceKey;
      if (voiceUrl.indexOf('http') === -1) {
        voiceUrl = config.qiniuServerAddress + voiceKey;
      }

      return {
        audioKey: voiceKey,
        audioSrc: voiceUrl,
        onPlay: onAudioPlay
      };
    }

    function getOrderGoodsName(order) {
      var goodsName = '';
      if (order.goods && order.goods.length > 0) {
        order.goods.forEach(function (item) {
          goodsName += ((item.name || '未知') + ',');
        });
        goodsName = goodsName.substr(0, goodsName.length - 1);
      }
      else {
        goodsName = order.goods_name || '未知';
      }
      return goodsName;
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

    function getOrderCountVolumeWeight(orderDetail) {
      var sText = '';
      sText += (orderDetail.count ? orderDetail.count : '未填') + '/';//(orderDetail.count_unit ? orderDetail.count_unit : '件') + '/';
      sText += (orderDetail.weight ? orderDetail.weight : '未填') + '/';//(orderDetail.weight_unit ? orderDetail.weight_unit : '吨') + '/';
      sText += (orderDetail.volume ? orderDetail.volume : '未填');// + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方');

      return sText;
    }

    function getOrderCountDetail(order) {
      var countDetail = '';
      if (order.goods && order.goods.length > 0) {
        order.goods.forEach(function (item) {
          countDetail += (getOrderGoodsSingleCountDetail(item) + ',');
        });
        countDetail = countDetail.substr(0, countDetail.length - 1);
      }
      else {
        countDetail = getOrderCountVolumeWeight(order);
      }
      return countDetail;
    }

    function getOrderGoodsSingleCountDetail(goodsItem) {
      if (!goodsItem) {
        return '未知数量';
      }

      var itemDetail = '';
      if (goodsItem.count) {
        itemDetail += myFixed(goodsItem.count) + goodsItem.unit;
      }
      if (goodsItem.count2) {
        itemDetail += '/';
        itemDetail += myFixed(goodsItem.count2) + goodsItem.unit2;
      }
      if (goodsItem.count3) {
        itemDetail += '/';
        itemDetail += myFixed(goodsItem.count3) + goodsItem.unit3;
      }
      // itemDetail += (goodsItem.count ? (goodsItem.count + goodsItem.unit) : '');
      // itemDetail += (goodsItem.count2 ? ('/' + goodsItem.count2 + goodsItem.unit2) : '');
      // itemDetail += (goodsItem.count3 ? ('/' + goodsItem.count3 + goodsItem.unit3) : '');
      itemDetail = itemDetail || '未知数量';

      if (itemDetail.indexOf('/') === 0) {
        itemDetail = itemDetail.substring(1);
      }

      return itemDetail;
    }

    function getCompanyAssignOption(companyPartner) {
      return {
        key: companyPartner.partner._id ? companyPartner.partner._id : companyPartner.company._id,
        value: companyPartner.partner.name ? companyPartner.partner.name : companyPartner.company.name,
        authed: companyPartner.partner.auth_status ? (companyPartner.partner.auth_status === 'authed') : (companyPartner.company.auth_status === 'authed'),
        group_type: 'company'
      };
    }

    function getDriverNickname(driver, defaultName) {
      return driver.nickname || (driver.wechat_profile ? driver.wechat_profile.nickname : '') || defaultName;
    }

    function getDriverAssignOption(driver, type) {
      return {
        key: driver._id,
        value: (getDriverNickname(driver, '匿名') + '(' + driver.all_count.orderCount + '单)') + '/'
        + (driver.plate_numbers.length > 0 ? driver.plate_numbers[0] : '未知车牌') + '/'
        + driver.username,
        goodEvaluation: driver.goodEvaluation,
        group_type: type
      }
    }

    function getWechatDriverAssignOption(driver, type) {
      var option = getDriverAssignOption(driver, type);
      delete option.goodEvaluation;
      option.value = '(微信)' + option.value;
      option.is_wechat = true;
      return option;
    }

    function generatePhotoUrl(photoKey) {
      return config.qiniuServerAddress + photoKey;
    }
    function handleError(errType) {
      if (OrderError[errType]) {
        $rootScope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
      }
      else {
        $rootScope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
      }
    }

    return {
      getGoodsNameString: getOrderGoodsName,
      getCountDetail: getOrderCountDetail,
      getSingleCountDetail: getOrderGoodsSingleCountDetail,
      getOrderCountVolumeWeight: getOrderCountVolumeWeight,
      getCompanyAssignOption: getCompanyAssignOption,
      getDriverAssignOption: getDriverAssignOption,
      getWechatDriverAssignOption: getWechatDriverAssignOption,
      getAudioConfig: getAudioConfig,
      getStatusString: getStatusString,
      generatePhotoUrl:generatePhotoUrl,
      handleError:handleError
    };
  }]);