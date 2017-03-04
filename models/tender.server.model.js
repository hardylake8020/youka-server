'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var TenderRecorder = new Schema({
    object: {
      type: String,
      default: 'tenderRecorder'
    },
    tender: {
      type: Schema.Types.ObjectId,
      ref: 'Tender'
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    price: {
      type: Number,
      default: 0
    }
  });

  TenderRecorder.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('TenderRecorder', TenderRecorder);


  var TenderSchema = new Schema({
    object: {
      type: String,
      default: 'tender'
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    tender_records: {
      type: [{
        type: Schema.Types.Mixed
      }],
      default: []
    },
    //标书号
    tender_number: {
      type: String,
    },
    order_number: {
      type: String,
      required: true,
      trim: true
    },
    refer_order_number: {
      type: String,
      default: ''
    },
    //发标单位
    sender_company: {
      type: String,
      default: ''
    },
    //发标方联系人电话
    sender_phone: {
      type: String,
      default: ''
    },
    //发标方联系人
    sender_name: {
      type: String,
      default: ''
    },
    //报价
    driver_price: {
      type: Number,
      default: 0
    },
    //付款审核人
    pay_approver: {
      type: String,
      default: ''
    },
    //财务负责人
    finance_officer: {
      type: String,
      default: ''
    },
    //comparing竞价中
    //compareEnd竞价结束
    //
    status: {
      type: String,
      enum: ['unStarted', 'comparing', 'compareEnd', 'unAssigned', 'inProgress', 'completed'],//未开始，进行中，已截止， 已完成，已过时，已删除。 'stop',  'obsolete', 'deleted'
      default: 'unStarted'
    },
    start_time: {
      type: Date,
      required: true
    },
    end_time: {
      type: Date,
      required: true
    },
    salesmen: [{
      type: Schema.Types.Mixed
    }],
    truck_type: {
      type: String,
      required: true
    },
    truck_count: {
      type: Number,
      default: 1
    },
    //自动截标时长，单位：分钟。标书结束后，在指定的时长内如果没有选标，则自动选取最低价的竞标人。
    auto_close_duration: {
      type: Number,
      default: 1
    },
    auto_close_time: {
      type: Date
    },
    //多货物的记录
    //货物名称name, 数量count, 单位unit, 数量count2, 单位unit2, 数量count3, 单位unit3
    goods: [{
      type: Schema.Types.Mixed
    }],
    mobile_goods: [{
      type: Schema.Types.Mixed
    }],
    remark: {
      type: String,
      default: ''
    },

    pickup_province: {
      type: String,
      require: true
    },
    pickup_city: {
      type: String,
      require: true
    },
    pickup_region: {
      type: String,
      default: ''
    },
    pickup_region_location: {
      type: [Number]
    },
    pickup_street: {
      type: String,
      require: true
    },
    pickup_address: {
      type: String,
      require: true
    },
    pickup_location: {
      type: [Number]
    },
    pickup_start_time: {
      type: Date
    },
    pickup_start_time_format: {
      type: String,
      default: ''
    },
    pickup_end_time: {
      type: Date
    },
    pickup_end_time_format: {
      type: String,
      default: ''
    },
    pickup_name: {
      type: String
    },
    pickup_mobile_phone: {
      type: String
    },
    pickup_tel_phone: {
      type: String
    },

    delivery_province: {
      type: String,
      require: true
    },
    delivery_city: {
      type: String,
      require: true
    },
    delivery_region: {
      type: String,
      default: ''
    },
    delivery_region_location: {
      type: [Number]
    },
    delivery_street: {
      type: String,
      require: true
    },
    delivery_address: {
      type: String,
      require: true
    },
    delivery_location: {
      type: [Number]
    },
    delivery_start_time: {
      type: Date
    },
    delivery_start_time_format: {
      type: String,
      default: ''
    },
    delivery_end_time: {
      type: Date
    },
    delivery_end_time_format: {
      type: String,
      default: ''
    },
    delivery_name: {
      type: String
    },
    delivery_mobile_phone: {
      type: String
    },
    delivery_tel_phone: {
      type: String
    },
    //可以支付首款
    can_pay_top: {
      type: Boolean,
      default: false
    },
    //实际现金支付首款
    real_pay_top_cash: {
      type: Number,
      default: 0
    },
    real_pay_top_cash_time: {
      type: Date,
      default: null
    },
    real_pay_top_cash_username: {
      type: String
    },
    //实际油卡支付首款
    real_pay_top_card: {
      type: Number,
      default: 0
    },
    real_pay_top_card_time: {
      type: Date,
      default: null
    },
    real_pay_top_card_username: {
      type: String
    },
    //可以支付回单
    can_pay_last: {
      type: Boolean,
      default: false
    },
    //实际现金支付回单
    real_pay_last_cash: {
      type: Number,
      default: 0
    },
    real_pay_last_cash_time: {
      type: Date,
      default: null
    },
    real_pay_last_cash_username: {
      type: String
    },
    //实际油卡支付回单
    real_pay_last_card: {
      type: Number,
      default: 0
    },
    real_pay_last_card_time: {
      type: Date,
      default: null
    },
    real_pay_last_card_username: {
      type: String
    },
    //可以支付尾单
    can_pay_tail: {
      type: Boolean,
      default: false
    },
    //实际现金支付尾款
    real_pay_tail_cash: {
      type: Number,
      default: 0
    },
    real_pay_tail_cash_time: {
      type: Date,
      default: null
    },
    real_pay_tail_cash_username: {
      type: String
    },
    //实际现金支付尾款
    real_pay_tail_card: {
      type: Number,
      default: 0
    },
    real_pay_tail_card_time: {
      type: Date,
      default: null
    },
    real_pay_tail_card_username: {
      type: String
    },
    payment_top_rate: {
      type: Number
    },
    payment_top_cash_rate: {
      type: Number
    },
    payment_top_card_rate: {
      type: Number
    },
    payment_tail_rate: {
      type: Number
    },
    payment_tail_cash_rate: {
      type: Number
    },
    payment_tail_card_rate: {
      type: Number
    },
    payment_last_rate: {
      type: Number
    },
    payment_last_cash_rate: {
      type: Number
    },
    payment_last_card_rate: {
      type: Number
    },

    assign_target: {
      type: String,
      enum: ['cooperation', 'all'],//合作中介，所有中介。
      default: 'all'
    },
    //选定的竞标人对象
    all_bidders: {
      type: [Schema.Types.Mixed],
      default: []
    },
    all_bidders_count: {
      type: Number,
      default: 0
    },
    has_participate_bidders_count: {
      type: Number,
      default: 0
    },
    bidder_winner: {
      type: Schema.Types.ObjectId,
      ref: 'Bidder'
    },
    driver_winner: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    execute_driver: {
      type: Schema.Types.Mixed
    },
    winner_price: {
      type: Number,
      default: 0
    },
    winner_reason: {
      type: String,
      default: ''
    },
    winner_time: {
      type: Date
    },
    carry_drivers: {
      type: [Schema.Types.Mixed]
    },

    create_user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    create_company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
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
    //是否有未处理违约
    untreated_breach: {
      type: Boolean,
      default: false
    },
    //违约扣款
    breach_deducted: {
      type: Boolean,
      default: false
    },
    //标书类型
    tender_type: {
      type: String,
      enum: ['grab', 'compare']//抢单，竞价。

    },
    //最低保护价
    lowest_protect_price: {
      type: Number,
      default: 0
    },
    //最高保护价
    highest_protect_price: {
      type: Number,
      default: 0
    },
    //押金
    ya_jin: {
      type: Number,
      default: 0
    },
    real_pay_ya_jin: {
      type: Number,
      default: 0
    },
    real_pay_ya_jin_time: {
      type: Date
    },
    //保证金
    deposit: {
      type: Number,
      default: 0
    },
    //抢单最低价
    lowest_grab_price: {
      type: Number,
      default: 0
    },
    //抢单最高价
    highest_grab_price: {
      type: Number,
      default: 0
    },
    //抢单时间窗
    grab_time_duration: {
      type: Number,
      default: 0
    },
    grab_increment_price: {
      type: Number,
      default: 0
    },
    current_grab_price: {
      type: Number,
      default: 0
    },
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card'
    },
    truck: {
      type: Schema.Types.ObjectId,
      ref: 'Truck'
    },
    truck_number: {
      type: String,
      default: ''
    },
    examined: {
      type: Boolean,
      default: false
    },
    examined_username: {
      type: String,
      default: ''
    },

  });

  TenderSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  TenderSchema.pre('save', function (next) {
    this.tender_number = this.order_number;
    if (this.pickup_start_time) {
      this.pickup_start_time_format = moment(this.pickup_start_time).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.pickup_end_time) {
      this.pickup_end_time_format = moment(this.pickup_end_time).format('YYYY-MM-DD HH:mm:ss');
    }
    this.pickup_address = [this.pickup_province, this.pickup_city, this.pickup_region, this.pickup_street].join('');

    if (this.delivery_start_time) {
      this.delivery_start_time_format = moment(this.delivery_start_time).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.delivery_end_time) {
      this.delivery_end_time_format = moment(this.delivery_end_time).format('YYYY-MM-DD HH:mm:ss');
    }
    this.delivery_address = [this.delivery_province, this.delivery_city, this.delivery_region, this.delivery_street].join('');

    if (this.all_bidders) {
      this.all_bidders_count = this.all_bidders.length;
    }

    if (this.end_time && this.auto_close_duration) {
      this.auto_close_time = new Date(this.end_time.getTime() + this.auto_close_duration * 60 * 1000);
    }

    this.current_grab_price = this.lowest_grab_price;


    next();
  });

  appDb.model('Tender', TenderSchema);
};
