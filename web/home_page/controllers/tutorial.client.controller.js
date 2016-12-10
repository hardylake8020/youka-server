$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      var aboutLink = bodyElement.find('.zz-home-header .link .tutorial');
      aboutLink.addClass('current');
      var menu = new initMenu();
      new Operation(bodyElement);
    });
  });

});

function Operation(bodyElement) {
  var allElement = {
    listVideo: bodyElement.find('.body-content .description .content .list-video'),
    template: bodyElement.find('#template'),
    playerContainer: bodyElement.find('.player-container'),
    playerWrapper: bodyElement.find('#player-wrapper')

  };
  var baseUrl = 'http://7xiwrb.com1.z0.glb.clouddn.com/';
  var videos = [
    {video_url: baseUrl + 'signin_one.mp4', video_title: '1.账号注册/登录', time_length: "03:55", video_cover: '../../home_page/images/tutorial/01.png', video_mask: '../../home_page/images/tutorial/01-h.png'},
    {video_url: baseUrl + 'partner_company_driver_two.mp4', video_title: '2.合作公司及司机', time_length: "03:35", video_cover: '../../home_page/images/tutorial/02.png', video_mask: '../../home_page/images/tutorial/02-h.png'},
    {video_url: baseUrl + 'app_download_three.mp4', video_title: '3.APP下载及介绍', time_length: "04:21", video_cover: '../../home_page/images/tutorial/03.png', video_mask: '../../home_page/images/tutorial/03-h.png'},
    {video_url: baseUrl + 'create_order_four.mp4', video_title: '4.单个运单创建', time_length: "06:14", video_cover: '../../home_page/images/tutorial/04.png', video_mask: '../../home_page/images/tutorial/04-h.png'},
    {video_url: baseUrl + 'assign_order_five.mp4', video_title: '5.分配运单', time_length: "06:03", video_cover: '../../home_page/images/tutorial/05.png', video_mask: '../../home_page/images/tutorial/05-h.png'},
    {video_url: baseUrl + 'app_operation_six.mp4', video_title: '6.APP操作介绍', time_length: "06:00", video_cover: '../../home_page/images/tutorial/06.png', video_mask: '../../home_page/images/tutorial/06-h.png'},
    {video_url: baseUrl + 'batch_createorder_seven.mp4', video_title: '7.批量创建', time_length: "03:17", video_cover: '../../home_page/images/tutorial/07.png', video_mask: '../../home_page/images/tutorial/07-h.png'},
    {video_url: baseUrl + 'modify_order_eight.mp4', video_title: '8.运单修改', time_length: "02:33", video_cover: '../../home_page/images/tutorial/08.png', video_mask: '../../home_page/images/tutorial/08-h.png'},
    {video_url: baseUrl + 'cheek_order_nine.mp4', video_title: '9.运单查看', time_length: "05:51", video_cover: '../../home_page/images/tutorial/09.png', video_mask: '../../home_page/images/tutorial/09-h.png'},
    {video_url: baseUrl + 'share_order_ten.mp4', video_title: '10.运单分享', time_length: "03:48", video_cover: '../../home_page/images/tutorial/10.png', video_mask: '../../home_page/images/tutorial/10-h.png'},
    {video_url: baseUrl + 'sender_receiver_cheek_eleven.mp4', video_title: '11.收/发货人查询物流', time_length: "02:33", video_cover: '../../home_page/images/tutorial/11.png', video_mask: '../../home_page/images/tutorial/11-h.png'},
    {video_url: baseUrl + 'wechat_twelve.mp4', video_title: '12.微信公众号功能', time_length: "06:26", video_cover: '../../home_page/images/tutorial/12.png', video_mask: '../../home_page/images/tutorial/12-h.png'},
    {video_url: baseUrl + 'dashboard_thirteen.mp4', video_title: '13.报表查看', time_length: "01:13", video_cover: '../../home_page/images/tutorial/13.png', video_mask: '../../home_page/images/tutorial/13-h.png'},
    {video_url: baseUrl + 'employee_group_fourteen.mp4', video_title: '14.内部员工分组', time_length: "05:31", video_cover: '../../home_page/images/tutorial/14.png', video_mask: '../../home_page/images/tutorial/14-h.png'},
    {video_url: baseUrl + 'company_auth_fifteen.mp4', video_title: '15.公司认证', time_length: "01:19", video_cover: '../../home_page/images/tutorial/15.png', video_mask: '../../home_page/images/tutorial/15-h.png'}
  ];

  allElement.template.tmpl(videos).appendTo(allElement.listVideo);
  var ivaInstance;

  $(".list-video li").click(function () {
    initIva($(this).attr('data-url'), $(this).attr('data-title'));
    showContainer(allElement.playerContainer);
    allElement.playerContainer.show();
    allElement.playerWrapper.show();
  });

  allElement.playerWrapper.click(function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    else {
      window.event.cancelBubble = true;
    }
  });

  allElement.playerContainer.click(function () {
    if (ivaInstance) {
      ivaInstance.destroy();
    }

    hideContainer();

    allElement.playerContainer.hide();
    allElement.playerWrapper.hide();
  });

  function initIva(url, title) {
    ivaInstance = new Iva(
      'player-wrapper',//父容器id或者父容器DOM对象，给父容器设置宽高640px*480px以上可以获得最佳的浏览体验；如果宽高在640px*480px以下，Iva会以弹窗形式呈现
      {
        appkey: '4yGP0NQ1e',//必填，请在控制台查看应用标识, 'NJdE21an'
        video: url,//必填，播放地址（http://www.tudou.com/programs/view/tM_vZCQy2uM/）或者资源地址（http://7xi4ig.com2.z0.glb.qiniucdn.com/shapuolang_ts.mp4）
        autoplay: true,
        title: title//选填
      });
  }

  function showContainer(videoContainer) {
    document.addEventListener('touchmove', preventScroll);
    document.body.style.overflow = 'hidden';

    videoContainer.css('top', $(window).scrollTop());

  }

  function hideContainer() {
    document.body.style.overflow = 'auto';
    document.removeEventListener('touchmove', preventScroll);
  }

  function preventScroll(event) {
    event.preventDefault();
  }

}