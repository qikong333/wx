// pages/refund/refund.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    state: ['待审核', '待退货', '退货中', '质检中', '退款中', '已退款', '已驳回', '已取消'],//退款进度列表
    status: '',//退款进度序号
    total: '',//订单总价
    flow: ['提交申请', '商家审核', '退款', '完成'],//流程图内容列表
    step: 4,//流程图进度数
    list: [{//退款订单信息
      tip:'订单号',
      con:''
    },{
      tip: '联系人',
      con: ''
    },{
      tip: '联系电话',
      con: ''
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {//获取登陆数据，订单ID数据
    var that = this;
    wx.getStorage({
      key: 'logininfo',
      success: function (res) {
        that.setData({
          tokenid: res.data.tokenid,
          userAgent: res.data.userAgent,
        })
      }
    })
    wx.getStorage({
      key: 'orderid',
      success: function (res) {
        that.setData({
          orderId: res.data.orderId,
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {//请求退款详情接口37，若成功返回，则获取进度序号，价格，订单信息数据
    var that = this;
    wx.request({
      url: app.globalData.url + '/api/shop/orderReturn/getOdReturn',
      data: {
        orderId: that.data.orderId,
        tokenid: that.data.tokenid,
        userAgent: that.data.userAgent,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        that.setData({
          status: res.data.data.status,
          total: res.data.data.salePrice,
          'list[0].con': res.data.data.orderNo,
          'list[1].con': res.data.data.link,
          'list[2].con': res.data.data.linktel,
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})