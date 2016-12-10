'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var InsuranceSchema = new Schema({
    object: {
      type: String,
      default: 'insurance'
    },
    order_id: {
      type: String
    },
    order_number: {
      type: String,
      default: ''
    },
    sender_name: {
      type: String,
      default: ''
    },
    goods_name: {
      type: String,
      default: ''
    },
    count: {
      type: Number,
      default: 0
    },
    weight: {
      type: Number,
      default: 0
    },
    volume: {
      type: Number,
      default: 0
    },
    count_unit: {
      type: String,
      default: '箱'
    },
    weight_unit: {
      type: String,
      default: '吨'
    },
    volume_unit: {
      type: String,
      default: '立方'
    },
    delivery_address: {
      type: String,
      default: ''
    },
    // 提货地址
    pickup_address: {
      type: String,
      default: ''
    },
    //保额，单位分
    coverage_unit: {
      type: Number,
      default: 0
    },
    //总保额,单位分
    coverage_total: {
      type: Number,
      default: 0
    },
    //单价,单位为分
    price_unit: {
      type: Number,
      default: 0
    },
    //总价,单位分
    price_total: {
      type: Number,
      default: 0
    },
    //数量
    buy_count: {
      type: Number,
      default: 0
    },
    pay_status: {
      type: String,
      enum: ['unpay', 'paying', 'payed'],
      default: 'unpay'
    },
    other_infos: {
      type: Schema.Types.Mixed,
      default: {}
    }
  });

  InsuranceSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  var Insurance = appDb.model('Insurance', InsuranceSchema);

  var AssignInfoSchema = new Schema({
    object: {
      type: String,
      default: 'assignInfo'
    },
    type: {
      type: String,
      enum: ['driver', 'company', 'warehouse']
    },
    driver_username: {
      type: String
    },
    driver_id: {
      type: String
    },
    company_id: {
      type: String
    },
    order_id: {
      type: String
    },
    is_assigned: {
      type: Boolean,
      default: false
    },
    pickup_contact_name: {
      type: String,
      default: ''
    },
    pickup_contact_phone: {
      type: String,
      default: ''
    },
    pickup_contact_mobile_phone: {
      type: String,
      default: ''
    },
    pickup_contact_email: {
      type: String,
      default: ''
    },
    pickup_contact_address: {
      type: String,
      default: ''
    },
    //地址代号
    pickup_contact_brief: {
      type: String,
      default: ''
    },
    pickup_contact_location: {
      type: [Number]
    },
    delivery_contact_name: {
      type: String,
      default: ''
    },
    delivery_contact_phone: {
      type: String,
      default: ''
    },
    delivery_contact_mobile_phone: {
      type: String,
      default: ''
    },
    delivery_contact_address: {
      type: String,
      default: ''
    },
    //地址代号
    delivery_contact_brief: {
      type: String,
      default: ''
    },
    delivery_contact_location: {
      type: [Number]
    },
    delivery_contact_email: {
      type: String,
      default: ''
    },
    pickup_start_time: {
      type: Date
    },
    pickup_end_time: {
      type: Date
    },
    //
    delivery_start_time: {
      type: Date
    },
    delivery_end_time: {
      type: Date
    },
    road_order_name: {
      type: String,
      default: ''
    },
    partner_name: {
      type: String,
      default: ''
    },
    is_wechat: {
      type: Boolean,
      default: false
    }
  });

  AssignInfoSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('AssignInfo', AssignInfoSchema);

  var OrderSchema = new Schema({
    object: {
      type: String,
      default: 'order'
    },
    order_numbers_for_search: {
      type: String
    },
    sender_name: {
      type: String,
      default: ''
    },
    sender_company: {
      type: Schema.Types.Mixed,
      default: {}
    },
    receiver_name: {
      type: String,
      default: ''
    },
    receiver_company: {
      type: Schema.Types.Mixed,
      default: {}
    },
    road_order: {
      type: Schema.Types.Mixed
    },
    order_detail: {
      type: Schema.Types.ObjectId,
      ref: 'OrderDetail',
      required: true
    },
    order_details: {
      type: Schema.Types.Mixed
    },
    parent_order: {  //子订单的上级订单id，大订单的此项为空
      type: Schema.Types.ObjectId,
      ref: 'order'
    },
    status: {
      type: String,
      enum: ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped', 'unDeliverySigned', 'unDeliveried', 'completed'],//未分配，分配中，未签到提货，未提货，未交货签到， 未交货，已完成
      default: 'unAssigned'
    },
    assign_status: {
      type: String,
      enum: ['unAssigned', 'assigning', 'completed'],
      default: 'unAssigned'
    },
    confirm_status: {
      type: String,
      enum: ['un_confirmed', 'confirmed'],
      default: 'un_confirmed'
    },
    //未确认运单时第一次的通知
    un_confirm_first_inform: {
      type: Boolean,
      default: false
    },
    un_confirm_second_inform: {
      type: Boolean,
      default: false
    },
    un_confirm_first_inform_time: {
      type: Date
    },
    un_confirm_second_inform_time: {
      type: Date
    },
    delete_status: {
      type: Boolean,
      default: false
    },
    total_assign_count: {
      type: Number,
      default: 0
    },
    assigned_count: {
      type: Number,
      default: 0
    },
    assigned_infos: {
      type: [{
        type: Schema.Types.Mixed
      }],
      default: []
    },
    customer_name: {
      type: String,
      default: ''
    },
    assign_time: {
      type: Date
    },
    pickup_sign_time: {
      type: Date
    },
    pickup_time: {
      type: Date
    },
    delivery_sign_time: {
      type: Date
    },
    delivery_time: {
      type: Date
    },
    damaged: {
      type: Boolean,
      default: false
    },
    //缺件(之前使用，现在不再使用，之后会删除)
    missing_packages: {
      type: Boolean,
      default: false
    },
    //缺件(实际提货件数不同于发货件数)
    pickup_missing_packages: {
      type: Boolean,
      default: false
    },
    //缺件(实际交货件数不同于发货件数)
    delivery_missing_packages: {
      type: Boolean,
      default: false
    },
    pickup_sign_deferred: {  //提货进场延迟
      type: Boolean,
      default: false
    },
    pickup_deferred: {  //提货延迟
      type: Boolean,
      default: false
    },
    delivery_sign_deferred: {  //交货进场延迟
      type: Boolean,
      default: false
    },
    delivery_deferred: {  //交货延迟
      type: Boolean,
      default: false
    },
    has_halfway: {
      type: Boolean,
      default: false
    },
    //提货地址偏差
    pickup_address_difference: {
      type: Boolean,
      default: false
    },
    pickup_address_difference_distance: {
      type: Number
    },
    //交货地址偏差
    delivery_address_difference: {
      type: Boolean,
      default: false
    },
    delivery_address_difference_distance: {
      type: Number
    },
    pickup_contact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact'
    },
    //用于查询搜索排序用  与pickup_contact属性一致
    pickup_contacts: {
      type: Schema.Types.Mixed
    },
    delivery_contact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact'
    },
    //用于查询搜索排序用  与delivery_contact属性一致
    delivery_contacts: {
      type: Schema.Types.Mixed
    },
    pickup_start_time: {
      type: Date
    },
    pickup_start_time_format: {
      type: String,
      default: ''
    },
    pickup_end_time_format: {
      type: String,
      default: ''
    },
    pickup_end_time: {
      type: Date
    },
    delivery_start_time: {
      type: Date
    },
    delivery_start_time_format: {
      type: String,
      default: ''
    },
    delivery_end_time_format: {
      type: String,
      default: ''
    },
    delivery_end_time: {
      type: Date
    },
    create_user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    create_company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    create_group: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    },
    execute_company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    execute_companies: [{
      type: Schema.Types.Mixed
    }],
    execute_driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    execute_drivers: [{
      type: Schema.Types.Mixed
    }],
    execute_group: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    },
    //创建运单时，对该运单提货前是否强制司机进场
    pickup_entrance_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单提货时是否强制司机拍照
    pickup_photo_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单交货前是否强制司机进场
    delivery_entrance_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单交货时是否强制司机拍照
    delivery_photo_force: {
      type: Boolean,
      default: true
    },
    //订单创建订单时的备注信息
    description: {
      type: String,
      default: ''
    },
    //用于司机备注
    remark: {
      type: String,
      default: ''
    },
    create_time: {
      type: Date,
      default: Date.now
    },
    update_time: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['driver', 'warehouse', 'company']
    },
    //司机评价
    //{_id, company_id, level, content_text}
    driver_evaluations: [{
      type: Schema.Types.Mixed
    }],
    //异常运单是否处理
    //已查看过用户的userId
    abnormal_handle_user_ids: [{
      type: String
    }],
    //订单来源，仅用于搜索排序使用
    source: {
      type: String,
      default: ''
    },
    //是否扫码交货
    delivery_by_qrcode: {
      type: Boolean,
      default: false
    },
    //确认事件
    confirm_events: [{
      type: Schema.Types.Mixed
    }],
    pickup_sign_events: [{
      type: Schema.Types.Mixed
    }],
    pickup_events: [{
      type: Schema.Types.Mixed
    }],
    delivery_sign_events: [{
      type: Schema.Types.Mixed
    }],
    delivery_events: [{
      type: Schema.Types.Mixed
    }],
    halfway_events: [{
      type: Schema.Types.Mixed
    }],
    insurance: {
      type: Schema.Types.Mixed,
      default: new Insurance({})
    },
    // 关注人salesmen表的username
    salesmen: [{
      type: Schema.Types.Mixed
    }],
    actual_delivery_goods: [{
      type: Schema.Types.Mixed
    }],
    company_configuration: {
      type: Schema.Types.Mixed
    },
    is_wechat: {
      type: Boolean,
      default: false
    },
    //提货司机车牌不匹配
    pickup_driver_plate_difference: {
      type: Boolean,
      default: false
    },
    //交货司机车牌不匹配
    delivery_driver_plate_difference: {
      type: Boolean,
      default: false
    },
    //提货送货车牌不匹配
    transport_plate_difference: {
      type: Boolean,
      default: false
    },
    tender: {
      type: Schema.Types.ObjectId,
      ref: 'Tender'
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: 'Bidder'
    },
    //提货违约
    pickup_breach: {
      type: Boolean,
      default: false
    },
    //交货违约
    delivery_breach: {
      type: Boolean,
      default: false
    },
    //创建运单推送
    create_push: {
      type: Boolean,
      default: false
    },
    //交货进场推送，即已经到达目的地并开始配送
    delivery_sign_push: {
      type: Boolean,
      default: false
    },
    // 发货／到货推送
    pickup_push: {
      type: Boolean,
      default: false
    },
    delivery_push: {
      type: Boolean,
      default: false
    },
    // 问题运单推送
    abnormal_push: {
      type: Boolean,
      default: false
    },
    // 提货滞留时间 小时
    pickup_deferred_duration: {
      type: Number
    },
    // = pickup_end_time + pickup_deferred_duration
    pickup_deferred_time: {
      type: Date
    },
    pickup_deferred_push: {
      type: Boolean,
      default: false
    },
    // 发货/到货推送 是否推送
    pickup_deferred_push_status: {
      type: Boolean,
      default: false
    },
    // 到货提前时间 小时
    delivery_early_duration: {
      type: Number
    },
    delivery_early_time: {
      type: Date
    },
    delivery_early_push: {
      type: Boolean,
      default: false
    },
    delivery_early_push_status: {
      type: Boolean,
      default: false
    },
    order_transport_type: {
      type: String,
      default: 'ltl',
      enum: ['ltl','tl'] //零担，整车
    },
    //已评价的用户，可以是关注人username，也可以是公司Id
    evaluation_users: {
      type: [String]
    }
  });

  OrderSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  OrderSchema.pre('save', function (next) {
    if (this.pickup_start_time) {
      this.pickup_start_time_format = moment(this.pickup_start_time).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.pickup_end_time) {
      this.pickup_end_time_format = moment(this.pickup_end_time).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.delivery_start_time) {
      this.delivery_start_time_format = moment(this.delivery_start_time).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.delivery_end_time) {
      this.delivery_end_time_format = moment(this.delivery_end_time).format('YYYY-MM-DD HH:mm:ss');
    }

    if (this.halfway_events && this.halfway_events.length > 0) {
      this.has_halfway = true;
    }

    this.order_numbers_for_search = this._id.toString().substr(0, 8) + this._id.toString().substr(18, 6);

    if (this.insurance && this.order_details) {
      this.insurance.order_number = this.order_details.order_number;
    }

    if (this.insurance) {
      this.insurance.order_id = this._id.toString();
    }

    if (this.confirm_events && this.confirm_events.length > 0) {
      this.confirm_status = 'confirmed';
    }

    if (this.pickup_push===true && this.pickup_deferred_duration && this.pickup_end_time) {
      this.pickup_deferred_push = true;
      this.pickup_deferred_time = new Date(this.pickup_end_time.getTime() + this.pickup_deferred_duration * 60 * 60 * 1000);
    }

    if (this.delivery_push===true && this.delivery_early_duration && this.delivery_start_time) {
      this.delivery_early_push = true;
      this.delivery_early_time = new Date(this.delivery_start_time.getTime() - this.delivery_early_duration * 60 * 60 * 1000);
    }

    this.un_confirm_first_inform_time = new Date(this.create_time.getTime() + 60 * 60 * 1000);
    this.un_confirm_second_inform_time = new Date(this.create_time.getTime() + 2 * 60 * 60 * 1000);

    next();
  });

  OrderSchema.pre('update', function (next) {
    if (this.insurance) {
      this.insurance.buy_count = parseInt(this.insurance.buy_count);
      this.insurance.count = parseInt(this.insurance.count);
      this.insurance.weight = parseInt(this.insurance.weight);
      this.insurance.volume = parseInt(this.insurance.volume);
    }
    next();
  });

  appDb.model('Order', OrderSchema);
};
