'use strict';

var config = require('../../config/config');

var nodeMailer = require('nodemailer');

var smtpTransport = nodeMailer.createTransport('SMTP', {
  service: 'QQ',
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

exports.sendEmail = function (address, title, content, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  var mailOptions = {
    from: config.email.from,
    to: address,
    subject: title,
    html: '<b>' + content + '</b>'
  };

  smtpTransport.sendMail(mailOptions, function (err, response) {
    console.log('发送邮件');
    console.log(err);
    console.log(response);
    if (err) {
      callback(err);
    }
    else {
      callback(null, response.message);
    }
  });
};

