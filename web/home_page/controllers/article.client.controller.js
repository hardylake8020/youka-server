/**
 * Created by zhuzhu on 15/10/14.
 */

$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      var articleLink = bodyElement.find('.zz-home-header .link .news');
      articleLink.addClass('current');

      new Article(bodyElement);
    });
  });
});

function Article(bodyElement) {
  var allElement = {
    companyNewsCount: bodyElement.find('.description .classification .company-news .count'),
    industryNewsCount: bodyElement.find('.description .classification .industry-news .count'),
    mediaReportCount: bodyElement.find('.description .classification .media-report .count'),
    articleContainer: bodyElement.find('.description .description-container .article-container'),
    template: bodyElement.find('#template')
  };

  function getAllCount() {
    $.ajax({
      data: {},
      type: 'get',
      url: '/news/count/all',
      dataType: 'json'
    })
      .done(function (result) {
        var allCount;
        if (!result || result.err) {
          return console.log('get article count failed');
          allCount = {
            companyNewsCount: 0,
            industryNewsCount: 0,
            mediaReportCount: 0
          };
        }
        else {
          allCount = result;
        }

        refreshCount(allCount);
      })
      .fail(function (err) {
        console.log('get article count failed');
      });
  }

  function refreshCount(allCount) {
    allElement.companyNewsCount.text(allCount.companyNewsCount);
    allElement.industryNewsCount.text(allCount.industryNewsCount);
    allElement.mediaReportCount.text(allCount.mediaReportCount);
  }

  function renderParagraphs(paragraphs) {
    if (!paragraphs || !(paragraphs instanceof Array) || paragraphs.length === 0) {
      console.log('invalid paragraphs');
      return;
    }

    paragraphs.forEach(function (item) {
      if (item.photos && item.photos.length > 0) {
        for (var i = 0; i < item.photos.length; i++) {
          item.photos[i] = 'http://7xiwrb.com1.z0.glb.clouddn.com/' + item.photos[i];
        }
      }
    });

    allElement.template.tmpl(paragraphs).appendTo(allElement.articleContainer);
  }

  function init() {
    getAllCount();

    var paragraphs = document.getElementById('error3').getAttribute('data-value');
    renderParagraphs(JSON.parse(paragraphs));
  }

  init();

  var menu = new initMenu();
}