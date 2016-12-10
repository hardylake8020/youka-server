'use strict';
var async = require('async'),
  config = require('../../config/config'),
  companyError = require('../errors/company'),
  userError = require('../errors/user'),
  emailLib = require('../libraries/email'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  Driver = appDb.model('Driver'),
  CompanyPartner = appDb.model('CompanyPartner'),
  DriverCompany = appDb.model('DriverCompany'),
  InviteCompany = appDb.model('InviteCompany'),
  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  TempDriverVersion = appDb.model('TempDriverVersion'),
  News = appDb.model('News'),
  InviteDriver = appDb.model('InviteDriver');

var updatedCount = 0;
var ordersCount = 0;

function updateOrders(count, callback) {
  //Order
  //  .find({type: 'company'})
  //  .skip(count)
  //  .limit(10000)
  //  .exec(function (err, orders) {
  //    ordersCount += orders.length;
  //    console.log(ordersCount);
  //    async.each(orders, function (eachOrder, eachCallback) {
  //      var assign_status = 'unAssigned';
  //      if (eachOrder.total_assign_count !== 0) {
  //        if (eachOrder.total_assign_count === eachOrder.assigned_count) {
  //          assign_status = 'completed';
  //        }
  //        else if (eachOrder.total_assign_count > eachOrder.assigned_count) {
  //          assign_status = 'assigning';
  //        }
  //      }
  //      eachOrder.assign_status = assign_status;
  //      eachOrder.save(function (err) {
  //        console.log('updatedCount', updatedCount++);
  //        return eachCallback();
  //      });
  //    }, function (err) {
  //      return callback();
  //    });
  //  })

}

exports.insertOrderContacts = function (req, res, next) {
  //updateOrders(0, function () {
  //  updateOrders(10000, function () {
  //    updateOrders(20000, function () {
  //      updateOrders(30000, function () {
  //        console.log('over');
  //      })
  //    })
  //  })
  //})
  return res.send('ok');
};

exports.updateDrivers = function (req, res, next) {
  TempDriverVersion.find(function (err, allVersion) {
    if (err) {
      return res.send({err: {type:'system_db_err', message:'tempdriverversionfinderror'}});
    }
    if (!allVersion || allVersion.length === 0) {
      return res.send({err: {type:'no_driver_version', message:'no items found'}});
    }

    var errCount = 0;
    var successCount = 0;
    var startTime = new Date().getTime();
    async.each(allVersion, function (eachVersion, callback) {
      Driver.findOne({username: eachVersion.username}, function (err, driver) {
        if (err || !driver) {
          errCount++;
          return callback();
        }
        if (eachVersion.platform === 'android') {
          driver.android_version = eachVersion.version;
        }
        else {
          driver.ios_version = eachVersion.version;
        }

        driver.save(function (err, saveDriver) {
          if (err || !driver) {
            errCount++;
          }
          successCount++;
          return callback();
        });
      });
    }, function (err) {
      var takeTime = (new Date().getTime() - startTime);

      res.send({errCount: errCount, successCount: successCount, total_count: allVersion.length, takeTime: takeTime});
    });

  });
};

exports.addNews = function (req, res, next) {
  var currentUser = req.user || {};
  delete currentUser._doc.password;
  delete currentUser._doc.weichat_openid;
  delete currentUser._doc.salt;
  delete currentUser._doc.deleted;
  delete currentUser._doc.current_third_account;

  getNewsOne(currentUser, function (err, newsOne) {
    if (err) {
      return res.send(err);
    }

    getNewsTwo(currentUser, function (err, newsTwo) {
      if (err) {
        return res.send(err);
      }

      return res.send({success: true, message: 'insert two articles to db'});
    });
  });

};

function getNewsOne(currentUser, callback) {
  var newsOne = new News({
    html_title: '互联网+物流开始破冰，哪些才是真需求？【柱柱签收网】',
    html_keywords: '柱柱签收网，互联网物流，车货匹配，同城配送，物流服务意识',
    html_description: '物流互联网化，车货匹配、同城配送很火。柱柱签收网，帮助物流公司提供更专业的物流服务，真正解决物流市场存在的问题，为整个车货匹配的绽放期做好充分的准备。【柱柱签收网】',
    article_title: '互联网+物流开始破冰，哪些才是真需求？',
    article_keywords: '柱柱签收网，互联网物流，车货匹配，同城配送，物流服务意识',
    article_brief: '2014年以来，物流开始逐步被资本关注，主要以车货匹配、同城配送为主，互联网+物流已然破冰，哪些才是真需求？',
    type: ['industry_news'],
    cover: 'o_1a2f8hfv915ot9o01qsitf3g679.jpg',
    author: '柱子君',
    creator: currentUser
  });

  var paragraphArray = [];
  paragraphArray.push({
    serial_number: 1,
    text: '2014年以来，物流开始逐步被资本关注，主流的互联网物流模式都取得了不错的业绩（融资到位），主要以车货匹配、同城配送为主。冰封了二十多年的物流迎来了“不速之客”们高喊着改革口号，“开始破冰”！ 一片繁华景象，好不热闹，已然成为红海，恶性竞争。',
    photos: ['o_1a2f8hfv915ot9o01qsitf3g679.jpg']
  });
  paragraphArray.push({
    serial_number: 2,
    text: '车货匹配的未来？对于车货匹配，确实是个非常好的模式（否则投资人也不会投那么钱支持），发生在今天，却是非常糟糕！'
  });
  paragraphArray.push({
    serial_number: 3,
    text: '从外行人看物流：空载超过50%，信息不对称，服务不标准等；细看：（1）空载多是临时车，长期合作车辆很少存在这个情况；（2）信息的传递由很多环节传递，虽然都是通过电话，但是效率很高。举个亲身经历：一个客户随便找一个物流人发货，30分钟（上海）停车场关于这个货物的信息就会到处传递，且季节性时期，临时车随行就市。'
  });
  paragraphArray.push({
    serial_number: 4,
    text: '从投资人看物流：这么大的市场，一定要参与几个靠谱的团队分享这个蛋糕；细看：见过几个投资人，其中有2个投过物流的，其中一个尽然大言不惭的说投资行业很多人懂物流，真的想问，懂物流怎么投的项目后来方向都跑偏了？还有一直投资物流领域的翘楚投了一个物流行业内人士发起的项目，做了5年换了N多模式。到C轮的时候尽然投了另外两家物流团队。'
  });
  paragraphArray.push({
    serial_number: 5,
    text: '从内行人看物流：一片红海，恶性竞争。大单被电子商务拆零，没有生意做；内幕：物流的确现在到处恶性竞争，人情泛滥（吃喝玩乐），又被互联网物流地推一波一波的洗脑，在加上货物的确在减少，生存问题摆在眼前。'
  });
  paragraphArray.push({
    serial_number: 6,
    text: '车货匹配当下无法解决物流痛点，物流订单的交易仅是物流的开始，根本不是痛点。仅是被资本烧坏了脑子，靠地推、靠烧钱来的伪需求完成布局和业务发展。仅是为了获得资本的青睐！根本计划去掉中间层成了泡影。所以一切以改革物流，降低成本的噱头都是耍流氓！这些喝了洋墨水和有点光环背景的人出来就叫嚣要改革物流，中国物流只会告诉你，物流是做出来的，不是吹牛逼可以吹出来的。',
    photos: ['o_1a2f8oil31rt1shu14nvo0sjg9.jpg']
  });
  paragraphArray.push({
    serial_number: 7,
    text: '当下之际，我们可以做的就是提高整个行业的物流服务质量与意识。根据目前大环境内3PL、专线公司的现有服务模式，针对货物状态、路径监控，照片信息、关键节点信息反馈，运单分享等方面做出更专业的服务。'
  });
  paragraphArray.push({
    serial_number: 8,
    text: '只有将最广大的3PL，专线公司的物流服务质量与意识提升，为整个车货匹配的绽放期做好充分的准备，真正解决物流市场存在的问题，相信未来5年后车货匹配应该才是它绽放美丽的最佳时期。'
  });

  newsOne.paragraphs = paragraphArray;

  newsOne.save(function (err, saveNews) {
    if (err) {
      return callback({err: {type: 'internal_db_err', article: 'one'}});
    }
    if (!saveNews) {
      return callback({err: {type: 'internal_db_err', article: 'no save one initialize'}});
    }

    return callback(null, saveNews);
  });
}

function getNewsTwo(currentUser, callback) {
  var newsTwo = new News({
    html_title: '富士施乐-柱柱签收网助力企业解决货损问题【柱柱签收网】',
    html_keywords: '柱柱签收网，上海邦达物流，富士施乐，货损货差',
    html_description: '柱柱签收网，货物运输状态实时查询，运输数据一键调取，助力物流企业解决货损货差问题，帮助物流公司提供更专业的物流服务！【柱柱签收网】',
    article_title: '【合作】|富士施乐-柱柱签收网助力企业解决货损！',
    article_keywords: '柱柱签收网，上海邦达物流，富士施乐，货损货差',
    article_brief: '10月13日，柱柱签收网收到了合作企业—上海邦达物流发来的感谢邮件，感谢柱柱签收网提供货物状态信息，解决非己方造成的货损问题，并向我们分享了整个案例发生过程',
    type: ['company_news'],
    cover: 'o_1a2fa74mkf34u9p1f8q1h7jhjg9.jpg',
    author: '柱子君',
    creator: currentUser
  });

  var paragraphArray = [];
  paragraphArray.push({
    serial_number: 1,
    text: '10月13日，柱柱签收网收到了合作企业—上海邦达物流发来的感谢邮件，感谢柱柱签收网提供货物状态信息，解决非己方造成的货损问题，并向我们分享了整个案例发生过程。以下内容是我们据贾经理的分享整理而成，在此先感谢邦达物流对柱柱签收的支持！邦达物流于10月12日收到客户反馈，收货时发现货物箱体变形，客户并附上图片。',
    photos: ['o_1a2fa62koi9s1vj1s4g1g0f1okv9.png', 'o_1a2fa74mkf34u9p1f8q1h7jhjg9.jpg']
  });


  paragraphArray.push({
    serial_number: 2,
    text: '收到货损反馈邮件后，邦达立刻开始事故的调查,通过柱柱签收平台货物照片数据的抓取，了解货物在运输过程中的状态变化，并第一时间做出了回复。',
    photos:['o_1a2fa7rkk4d11aivugpustb8d9.png', 'o_1a2fa9vion101esd112sep014ko9.png']
  });

  paragraphArray.push({
    serial_number: 3,
    text: '客户方收到邦达的回复后，结合对事实情况的了解，认定责任方并非为邦达过错所为，因此做出了相对合理且公正的整改方案。',
    photos: ['o_1a2fab1mghcchi81tgh1eoginv9.png']
  });
  paragraphArray.push({
    serial_number: 4,
    text: '通过柱柱签收的数据调取，邦达较为及时的把握了整个事故的过程，并且能够在第一时间反馈至客户，提高了客户对邦达物流的信誉度和依赖度。'
  });
  paragraphArray.push({
    serial_number: 5,
    text: '同时也提高了整个运作流程的公开性和透明性，规范了之后在运作流程中的操作规范。对合作双方来讲，是一个非常有效的运营管控手段。'
  });
  paragraphArray.push({
    serial_number: 6,
    text: '收到合作企业的感谢反馈，我们很开心，同时也感谢合作企业对柱柱签收网的支持与鼓励！能够更好地服务好你们，是柱柱签收网一直坚持不懈的努力与奋斗方向。'
  });

  newsTwo.paragraphs = paragraphArray;

  newsTwo.save(function (err, saveNews) {
    if (err) {
      return callback({err: {type: 'internal_db_err', article: 'two'}});
    }
    if (!saveNews) {
      return callback({err: {type: 'internal_db_err', article: 'no save two initialize'}});
    }

    return callback(null, saveNews);
  });
}