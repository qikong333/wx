// pages/draw/draw.js
let reLogin = require('../../utils/reLogin.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    current: 0, //选项卡序号，状态(0:未使用,1:已使用,2:已过期)
    menu: ['未使用', '已使用', '已过期'], //选项卡列表
    list: [] //优惠券列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.hideShareMenu();
    wx.getStorage({ //获取登录数据
      key: 'logininfo',
      success: res => {
        this.setData({
          passIdStr: res.data.passIdStr,
          tokenid: res.data.tokenid,
          userAgent: res.data.userAgent,
        })
        this.getdraw();
      }
    })
  },


  /**
   * 切换选项卡，清空优惠券列表，并重新请求优惠券
   */
  menuselect(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      current: index,
      list: []
    })
    this.getdraw();
  },

  /**
   * 4、个人中心，查询我已领取的优惠券
   * 请求某一选项类型的优惠券，并赋值到data。若无数据则提示暂无优惠券
   */
  getdraw() {
    wx.request({
      url: app.globalData.url + '/api/shop/couponActivity/couponActivityListByPassId',
      data: {
        size: 20,
        page: 0,
        status: this.data.current, // 状态(0:未使用,1:已使用,2:已过期)
        tokenid: this.data.tokenid,
        userAgent: this.data.userAgent
      },
      success: res => {
        console.log('优惠券', res);
        if (res.data.code === 200) {
          if (res.data.data.content.length > 0) {
            for (let i = 0; i < res.data.data.content.length; i++) {
              let item = res.data.data.content[i];
              let validStr = item.lifeStartTime.substr(0, 10) + '~' + item.lifeEndTime.substr(0, 10);

              var id = "list[" + i + "].id";
              var value = "list[" + i + "].value";
              var limit = "list[" + i + "].limit";
              var valid = "list[" + i + "].valid";
              var style = "list[" + i + "].style";
              var model = "list[" + i + "].model";
              var itype = "list[" + i + "].itype";
              var iname = "list[" + i + "].iname";
              var stype = "list[" + i + "].stype";
              var sname = "list[" + i + "].sname";
              this.setData({
                [id]: item.id,
                [value]: item.couponActivity.couponType == 0 ? item.couponActivity.amount : (item.couponActivity.discount2 * 10).toFixed(1),
                [limit]: item.couponActivity.threshold,
                // [valid]: item.lifeEndTime.substr(0, 10),
                [valid]: validStr,
                [style]: item.couponActivity.couponType,
                [itype]: item.couponActivity.couponItemType,
                [iname]: item.couponActivity.couponItemType == 0 ? null : item.couponActivity.couponItemName,
                [stype]: item.couponActivity.couponShopType,
                [sname]: item.couponActivity.couponShopType == 0 ? null : item.couponActivity.couponShopNames,
                [model]: false
              })
            }
            console.log(this.data.list);

          } else {
            wx.showToast({
              title: '暂无优惠券',
              icon: 'none',
              duration: 1000
            })
          }
        } else if (res.data.code === 20020) { // 会话失效，重新登录
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.getdraw();
          }
          reLogin.login(dealFunc);
        }
      }
    })
  },

  /**
   * 点击【更多使用规则】，打开或收起优惠券的说明内容
   */
  toshow(e) {
    var index = e.currentTarget.dataset.index;
    var model = "list[" + index + "].model";
    if (this.data.list[index].model) {
      this.setData({
        [model]: false
      })
    } else {
      this.setData({
        [model]: true
      })
    }
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