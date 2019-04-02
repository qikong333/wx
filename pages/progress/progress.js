// pages/progress/progress.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop: {//配送店铺信息
      name: '南城天安店',
      address:'黄金路1号天安数码城'
    },
    sending: false,//是否配送中
    send: {//配送信息
      name:'达达配送',
      style:'配送服务'
    },
    list: [],//配送进度信息列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {//获取登陆数据，订单编号数据，下单店铺数据
    var that = this;
    wx: wx.getStorage({
      key: 'logininfo',
      success: function (res) {
        that.setData({
          tokenid: res.data.tokenid,
          userAgent: res.data.userAgent,
        })
      },
    })
    wx: wx.getStorage({
      key: 'orderno',
      success: function (res) {
        that.setData({
          orderNo: res.data.orderNo,
        })
      },
    })
    wx: wx.getStorage({
      key: 'shop',
      success: function (res) {
        var name = "shop.name";
        var address = "shop.address";
        var phone = "shop.phone";
        that.setData({
          [name]: res.data.name,
          [address]: res.data.address,
          [phone]: res.data.phone,
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {//请求订单进度接口34，若成功返回，则逆向获取订单进度数据
    var that = this;
    wx.request({
      url: app.globalData.url + '/api/shop/orderBaseStatusLog/queryOrderProgress',
      data: {
        orderNo: that.data.orderNo,
      },
      success: function (res) {   
        if (res.data.data.length){
          var l = res.data.data.length;
          for (let i = 0; i < l; i++) {
            var mess = "list[" + i + "].mess";
            var time = "list[" + i + "].time";
            that.setData({
              [mess]: res.data.data[l - 1 - i].remark,
              [time]: res.data.data[l - 1 - i].creaTime,
            })
          }
        }
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
  
  },

  tocall: function () {//点击【联系商家】触发，调用makePhoneCall呼出商家号码
    wx.makePhoneCall({
      phoneNumber: this.data.shop.phone,
    })
  },
})