// pages/coupon/coupon.js
const reLogin = require('../../utils/reLogin.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    passIdStr: '',
    tokenid: '',
    userAgent: '',

    shopid: '',
    sum: 0,
    pids: '',
    pidNum: '',
    pidPrice: '',

    draw: [], //可用优惠券列表
    lost: [], //不可用优惠券列表
    canuseCoupon: false, // 是否选择了可用优惠券
    couponList: {}, // 领取的优惠券信息，存缓存
    // Pid: [], //商品ID序列
    // Num: [], //商品数量序列
    // Price: [] //商品价格序列
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) { //获取登录数据，赋值到data，获取下单商品数据

    try { // 取登录信息
      const logininfo = wx.getStorageSync('logininfo');
      if (logininfo) {
        this.setData({
          passIdStr: logininfo.passIdStr,
          tokenid: logininfo.tokenid,
          userAgent: logininfo.userAgent,
        })
      }
    } catch (e) {}

    wx.getStorage({
      key: 'referData',
      success: res => {
        console.log('referData', res);
        this.setData({
          shopid: res.data.shopid,
          sum: res.data.Sum,
          pids: res.data.pids,
          pidNum: res.data.pidNum,
          pidPrice: res.data.pidPrice
        });
        this.reqCouponCandUsed();
      },
    })
  },

  /**
   * 请求可用优惠券接口，获取当前优惠券的可用状态
   */
  reqCouponCandUsed() {
    wx.request({
      url: app.globalData.url + '/api/shop/couponActivity/findCouponCandUsed',
      data: {
        tokenid: this.data.tokenid,
        userAgent: this.data.userAgent,
        shopId: this.data.shopid,
        amount: this.data.sum,
        pids: this.data.pids,
        pidNum: this.data.pidNum,
        pidPrice: this.data.pidPrice
      },
      success: res => {
        console.log('可用优惠券', res);
        if (res.data.code === 200) {
          var Draw = [];
          var Lost = [];
          for (let i = 0; i < res.data.data.length; i++) {
            if (res.data.data[i].couponActivity.canUsed) {
              Draw.push(res.data.data[i])
            } else {
              Lost.push(res.data.data[i])
            }
          }
          if (Draw.length > 0) { // 可用优惠券
            for (let j = 0; j < Draw.length; j++) {
              var id = "draw[" + j + "].id"; // 优惠券id
              var pid = "draw[" + j + "].pid"; // 优惠商品PID
              var icode = "draw[" + j + "].icode"; // 优惠券列表id 
              var value = "draw[" + j + "].value"; // 优惠金额 或者 优惠折扣
              var limit = "draw[" + j + "].limit"; // 优惠券使用的条件
              var valid = "draw[" + j + "].valid"; // 有效期
              var style = "draw[" + j + "].style"; // 优惠类型(0:满减,1:折扣)
              var itype = "draw[" + j + "].itype"; // 优惠范围(0-全部,1-指定商品，旧数据该字段为空也是全部)
              var iname = "draw[" + j + "].iname"; // 优惠商品名称
              var stype = "draw[" + j + "].stype"; // 门店范围(0-全部,1-指定门店，旧数据该字段为空也是全部)
              var sname = "draw[" + j + "].sname"; // 指定门店名称
              var model = "draw[" + j + "].model"; // 是否展开使用规则
              this.setData({
                [id]: Draw[j].couponActivity.id,
                [pid]: Draw[j].couponActivity.couponItemType == 0 ? null : Draw[j].couponActivity.couponItem,
                [icode]: Draw[j].id,
                [value]: Draw[j].couponActivity.couponType == 0 ? Draw[j].couponActivity.amount : Draw[j].couponActivity.discount2 * 100 / 10,
                [limit]: Draw[j].couponActivity.threshold,
                [valid]: Draw[j].lifeStartTime.substr(0, 10) + '~' + Draw[j].lifeEndTime.substr(0, 10),
                [style]: Draw[j].couponActivity.couponType,
                [itype]: Draw[j].couponActivity.couponItemType,
                [iname]: Draw[j].couponActivity.couponItemType == 0 ? null : Draw[j].couponActivity.couponItemName,
                [stype]: Draw[j].couponActivity.couponShopType,
                [sname]: Draw[j].couponActivity.couponShopType == 0 ? null : Draw[j].couponActivity.couponShopNames,
                [model]: false
              })
            }
          } else {
            wx.showToast({
              title: '暂无可用优惠券',
              icon: 'none',
              duration: 2000
            })
          }
          if (Lost.length > 0) {
            for (let k = 0; k < Lost.length; k++) {
              var id = "lost[" + k + "].id";
              var icode = "lost[" + k + "].icode";
              var value = "lost[" + k + "].value";
              var limit = "lost[" + k + "].limit";
              var valid = "lost[" + k + "].valid";
              var style = "lost[" + k + "].style";
              var itype = "lost[" + k + "].itype";
              var iname = "lost[" + k + "].iname";
              var stype = "lost[" + k + "].stype";
              var sname = "lost[" + k + "].sname";
              var model = "lost[" + k + "].model";
              this.setData({
                [id]: Lost[k].couponActivity.id,
                [icode]: Lost[k].id,
                [value]: Lost[k].couponActivity.couponType == 0 ? Lost[k].couponActivity.amount : Lost[k].couponActivity.discount2 * 100 / 10,
                [limit]: Lost[k].couponActivity.threshold,
                [valid]: Lost[k].lifeStartTime.substr(0, 10) + '~' + Draw[k].lifeEndTime.substr(0, 10),
                [style]: Lost[k].couponActivity.couponType,
                [itype]: Lost[k].couponActivity.couponItemType,
                [iname]: Lost[k].couponActivity.couponItemType == 0 ? null : Lost[k].couponActivity.couponItemName,
                [stype]: Lost[k].couponActivity.couponShopType,
                [sname]: Lost[k].couponActivity.couponShopType == 0 ? null : Lost[k].couponActivity.couponShopNames,
                [model]: false
              })
            }
          }
        } else if (res.data.code === 20020) {
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.reqCouponCandUsed();
          }
          reLogin.login(dealFunc);
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() { //离开该页面返回确认订单页时，存储backstatus数据状态为'coupon'
    wx.setStorage({
      key: 'backstatus',
      data: 'coupon'
    })
    wx.setStorage({ //缓存当前选中的优惠券信息
      key: 'couponinfo',
      data: this.data.canuseCoupon ? {
        Id: this.data.couponList.id,
        Pid: this.data.couponList.pid,
        Icode: this.data.couponList.icode,
        Type: this.data.couponList.style,
        Amount: this.data.couponList.value,
      } : null,
      success: res => {}
    })
  },

  drawshow(e) { //可用优惠券展开/收起【更多使用规则】
    var index = e.currentTarget.dataset.index;
    var model = "draw[" + index + "].model";
    if (this.data.draw[index].model) {
      this.setData({
        [model]: false
      })
    } else {
      this.setData({
        [model]: true
      })
    }
  },

  lostshow(e) { //不可用优惠券展开/收起【更多使用规则】
    var index = e.currentTarget.dataset.index;
    var model = "lost[" + index + "].model";
    if (this.data.lost[index].model) {
      this.setData({
        [model]: false
      })
    } else {
      this.setData({
        [model]: true
      })
    }
  },

  SelectCoupon(e) { //点击某个【可用优惠券】时触发，存储当前选中的优惠券信息数据，并返回确认订单页
    var index = e.currentTarget.dataset.index;
    console.log('id优惠券id', this.data.draw[index].id);
    console.log('pid可用商品的pid', this.data.draw[index].pid);
    console.log('icode优惠券列表id ', this.data.draw[index].icode);
    console.log('style优惠类型(0:满减,1:折扣)', this.data.draw[index].style);
    console.log('value优惠金额、折扣', this.data.draw[index].value);
    this.setData({
      canuseCoupon: true,
      'couponList.id': this.data.draw[index].id,
      'couponList.pid': this.data.draw[index].pid,
      'couponList.icode': this.data.draw[index].icode,
      'couponList.style': this.data.draw[index].style,
      'couponList.value': this.data.draw[index].value
    });
    wx.navigateBack({
      // url: '../confirm/confirm?page=coupon'
    });
  },

  NoCoupon() { //点击不使用优惠券按钮时触发，存储优惠券信息数据为空，并返回确认订单页
    this.setData({
      canuseCoupon: false
    });
    wx.navigateBack({
      // url: '../confirm/confirm'
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '一公里免费配送到家~',
      path: "pages/index/index",
      imageUrl: '/images/share.png' // 图片 URL
    }
  },
})