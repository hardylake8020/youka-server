/**
 * Created by zenghong on 2017/4/26.
 */
var baseUrl = 'http://' + window.location.host;

$(function () {
  $('.detail-back').click(function () {
    window.history.back();
  });
  
  
  
  console.log(window.localStorage.getItem('tender_id'));
  var tenderId = window.localStorage.getItem('tender_id');
  getTenderDetail();
  function getTenderDetail(){
    $.ajax({
      url:baseUrl+'/tender/user/getTenderByTenderId',
      method:'post',
      data:{tender_id:tenderId},
      success:function (data) {
        console.log(data);
        if(!data.err){
          
        }
      }
    });
  }

});