// pages/personalCenter/personalCenter.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    clientName: '',
    clientImg: '',
    telephone: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.getStorage({
      key: 'useriInfo',
      success: res => {
        if (res.data) {
          this.setData({
            clientName: res.data.nickName,
            clientImg: res.data.avatarUrl,
          })
        }
      }
    })

    wx.getStorage({
      key: 'store',
      success: res => {
        if (res.data) {
          this.setData({
            telephone: res.data.telephone,
          })
        }
      }
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

  toCoupen() {
    wx.navigateTo({
      url: '../draw/draw',
    })
  },

  help() {
    wx.showModal({
      title: '拨打门店电话',
      content: this.data.telephone,
      showCancel: true,
      cancelText: '取消',
      confirmText: '拨打',
      success(res) {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: this.data.telephone, // 仅为示例，并非真实的电话号码
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  toOrder(e) {
    console.log(e.currentTarget.dataset.index);
    let n = e.currentTarget.dataset.index
    wx.navigateTo({
      url: '../order/order?ordertype=' + n,
    })

  },

  back() {
    wx.navigateBack({
      url: '../index/index'
    })
  }


})