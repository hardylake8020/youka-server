/**
 * Created by ZhangXuedong on 2016/8/25.
 */

var userFilter = require('../filters/user'),
  charts = require('../controllers/charts'),
  order_salesmen = require('../controllers/order_salesmen');

module.exports = function (app) {
  app.route('/charts/chart1-download').get(userFilter.requireUser, charts.chart1Download);
  app.route('/charts/chart1-data').get(userFilter.requireUser, charts.chart1Data);
  app.route('/charts/chart2-download').get(userFilter.requireUser, charts.chart2Download);
  app.route('/charts/chart2-data').get(userFilter.requireUser, charts.chart2Data);
  app.route('/charts/chart3-download').get(userFilter.requireUser, charts.chart3Download);
  app.route('/charts/chart3-data').get(userFilter.requireUser, charts.chart3Data);
  app.route('/charts/chart4-data').post(userFilter.requireUser, order_salesmen.chart4Data);
  app.route('/charts/chart4-download').get(userFilter.requireUser, order_salesmen.chart4Download);
};