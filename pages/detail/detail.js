// pages/detail/detail.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    status: 0, //订单状态序号
    Mode: 0, //订单类型，0为配送，1为自提
    state: ['待付款', '待发货', '待收货', '待确认', '已完成', '待自提', '退款中', '已退款', '已取消', '已删除', '已支付，待商家确认', '待系统确认', '换货中', '已换货', '已退货', '', '', '', '订单超时', '待接单'], //订单状态列表
    tips: ['请在30分钟内完成支付', '我们会尽快为你送货', '请注意查收你的货品', '请对我们的服务提出建议和打分', '感谢你的支持，欢迎再次光临', '请在预定的时间内上门提取货品'], //提示信息列表
    pickStore: '', //提货店铺
    pickAddress: '', //提货地址
    sum: '', //商品总价
    coupon: '', //优惠券抵扣价格
    tag: '', //配送费用
    total: '', //实付订单总价
    pay: true, //是否显示支付按钮
    list: [], //订单商品列表
    order: [{ //订单信息列表
      store: '',
      state: ['送货上门', '自提', '商家配送', '达达配送'],
      address: '',
      name: '',
      phone: '',
      mark: '',
      time: '',
      ID: '',
    }],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) { //获取登录数据，订单编号数据
    wx.getStorage({
      key: 'logininfo',
      success: res => {
        this.setData({
          tokenid: res.data.tokenid,
          userAgent: res.data.userAgent,
        })
      },
    })
    wx.getStorage({
      key: 'orderno',
      success: res => {
        this.setData({
          orderNo: res.data.orderNo,
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { //请求订单详情接口15，获取订单详细信息，订单物品详细信息
    var that = this;
    wx.request({
      url: app.globalData.url + '/api/shop/order/orderBaseInfo',
      data: {
        orderNo: that.data.orderNo,
        tokenid: that.data.tokenid,
        userAgent: that.data.userAgent,
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        that.setData({
          status: res.data.orderStatus,
          Mode: res.data.transportType,
          sum: parseFloat(res.data.orderTotalprice).toFixed(2),
          coupon: res.data.isUseCoupon == 0 ? '0.00' : (parseFloat(res.data.orderTotalprice) + parseFloat(res.data.transportCosts) - parseFloat(res.data.receivable)).toFixed(2),
          tag: parseFloat(res.data.transportCosts).toFixed(2),
          total: parseFloat(res.data.receivable).toFixed(2),
          pickStore: res.data.shopName,
          pickAddress: res.data.shopAddress,
          'order[0].shopid': res.data.shopid,
          'order[0].store': res.data.shopName,
          'order[0].address': res.data.userAddress,
          'order[0].name': res.data.userName,
          'order[0].phone': res.data.userMobile,
          'order[0].mark': res.data.orderMessage ? res.data.orderMessage : '',
          'order[0].time': res.data.createtime,
          'order[0].ID': res.data.orderNo,
        })
        for (let i = 0; i < res.data.odProductList.length; i++) {
          var itemid = "list[" + i + "].itemid";
          var name = "list[" + i + "].name";
          var size = "list[" + i + "].size";
          var num = "list[" + i + "].num";
          var sum = "list[" + i + "].sum";
          that.setData({
            [itemid]: res.data.odProductList[i].itemid,
            [name]: res.data.odProductList[i].productName,
            [size]: res.data.odProductList[i].productTitle,
            [num]: res.data.odProductList[i].productQty,
            [sum]: parseFloat(res.data.odProductList[i].productTotleprice).toFixed(1),
          })
        }
      }
    })
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

  },

  topay: function (e) { //点击【去支付】触发，存储当前店铺数据，订单数据，并跳转到支付订单页面
    var index = e.currentTarget.dataset.index;
    wx.setStorage({
      key: 'pay',
      data: {
        Sum: this.data.total,
        tokenid: this.data.tokenid,
        shopid: this.data.order[0].shopid,
      },
    })
    wx.setStorage({
      key: 'order',
      data: {
        orderNo: this.data.orderNo,
        createTime: this.data.order[0].time,
      },
    })
    wx.redirectTo({
      url: '../pay/pay',
    })
  },

  service: function () { //点击【联系客服】时触发，调用makePhoneCall呼出客服号码
    wx.makePhoneCall({
      phoneNumber: '4008383448'
    })
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