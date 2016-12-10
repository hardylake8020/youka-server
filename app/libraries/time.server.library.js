'use strict';

function formatTimeNumber(number) {
  return number > 10 ? number : '0' + number;
}

exports.DateToyyyyMMddHHmmss = function (datetime) {
  var info = {
    year: datetime.getFullYear(),
    month: (datetime.getMonth() + 1),
    date: datetime.getDate(),
    hour: datetime.getHours(),
    minute: datetime.getMinutes(),
    second: datetime.getSeconds()
  };

  var str = '';
  for (var pro in info) {
    str += formatTimeNumber(info[pro]);
  }
  return str;
};


