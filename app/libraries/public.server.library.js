/**
 * Created by elinaguo on 15/3/18.
 */
'use strict';

exports.isNullOrEmpty = function (value) {
  return (value === undefined || value === null || value === '');
};
exports.isTrue = function(value){

  if (this.isNullOrEmpty(value))
        return false;

  return (value.toString().toLowerCase() === 'true');
};
