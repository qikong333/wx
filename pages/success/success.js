// pages/success/success.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    point: '', //积分数值
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) { //获取支付数据，获取订单数据
    var that = this;
    wx.getStorage({
      key: 'pay',
      success: function (res) {
        that.setData({
          point: parseInt(res.data.Sum),
        })
      },
    })
    wx.getStorage({
      key: 'order',
      success: function (res) {
        that.setData({
          orderNo: res.data.orderNo
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.hideShareMenu()
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
    return {
      title: '一公里免费配送到家~',
      path: "pages/index/index",
      imageUrl: '/images/share.png' // 图片 URL
    }
  },

  todetail: function () { //存储当前订单号数据，跳转到订单详情页
    wx.setStorage({
      key: 'orderno',
      data: {
        orderNo: this.data.orderNo,
      },
      success: function (res) {
        wx.navigateTo({
          url: '../detail/detail'
        })
      }
    })
  }
})