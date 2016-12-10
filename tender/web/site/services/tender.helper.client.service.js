/**
 * Created by Wayne on 15/10/9.
 */

tender.factory('TenderHelper', ['http', function (http) {
  function getOrderGoodsSingleCountDetail(goodsItem) {
    if (!goodsItem) {
      return '未知数量';
    }

    var itemDetail = '';
    itemDetail += (goodsItem.count ? (goodsItem.count + goodsItem.unit) : '');
    itemDetail += (goodsItem.count2 ? ('/' + goodsItem.count2 + goodsItem.unit2) : '');
    itemDetail += (goodsItem.count3 ? ('/' + goodsItem.count3 + goodsItem.unit3) : '');
    itemDetail = itemDetail || '未知数量';

    if (itemDetail.indexOf('/') === 0) {
      itemDetail = itemDetail.substring(1);
    }

    return itemDetail;
  }

  function getOrderCountVolumeWeight(orderDetail) {
    var sText = '';
    sText += (orderDetail.count ? orderDetail.count : '未填') + (orderDetail.count_unit ? orderDetail.count_unit : '件') + '/';
    sText += (orderDetail.weight ? orderDetail.weight : '未填') + (orderDetail.weight_unit ? orderDetail.weight_unit : '吨') + '/';
    sText += (orderDetail.volume ? orderDetail.volume : '未填') + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方');

    return sText;
  }

  function formatRemainTime(ms) {
    if (ms <= 0) {
      return '00:00:00';
    }
    var dd = parseInt(ms / 1000 / 60 /60 / 24, 10);
    var hh = checkTime(parseInt(ms / 1000 / 60 /60 % 24, 10));
    var mm = checkTime(parseInt(ms / 1000 / 60 % 60, 10));
    var ss = checkTime(parseInt(ms / 1000 % 60, 10));

    var hms = [hh, mm, ss].join(':');
    if (dd > 0) {
      return dd + '天 ' + hms;
    }
    else {
      return hms;
    }
  }

  function checkTime(i) {
    if (i < 10) {
      i = '0' + i;
    }
    return i;
  }

  var tenderHelper = {
    getGoodsName: function (deltail) {
      var goodsName = '';
      if (deltail.goods && deltail.goods.length > 0) {
        deltail.goods.forEach(function (item) {
          goodsName += ((item.name || '未知') + ',');
        });
        goodsName = goodsName.substr(0, goodsName.length - 1);
      }
      else {
        goodsName = deltail.goods_name || '未知';
      }
      return goodsName;
    },
    getOrderCountDetail: function (detail) {
      var countDetail = '';
      if (detail.goods && detail.goods.length > 0) {
        detail.goods.forEach(function (item) {
          countDetail += (getOrderGoodsSingleCountDetail(item) + ',');
        });
        countDetail = countDetail.substr(0, countDetail.length - 1);
      }
      else {
        countDetail = getOrderCountVolumeWeight(detail);
      }
      return countDetail;
    },
    createOrderGoodsDetail: function (orderDetail) {
      var goods = [];
      if (orderDetail.goods && orderDetail.goods.length > 0) {
        for (var i = 0; i < orderDetail.goods.length; i++) {
          goods.push({
            title: '货物' + (i + 1),
            name: orderDetail.goods[i].name || '未知名称',
            value: getOrderGoodsSingleCountDetail(orderDetail.goods[i]),
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
          value: getOrderCountVolumeWeight(orderDetail),
          sum: 0
        });
      }
      return goods;
    },
    getRemainTime: function (endTime) {
      var remainTime = new Date(endTime).getTime() - Date.now();
      return formatRemainTime(remainTime);
    }
  };

  return tenderHelper;
}]);