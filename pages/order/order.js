// pages/order/order.js
let reLogin = require('../../utils/reLogin.js');
var util = require('../../utils/util.js');
var wxbarcode = require('../../utils/code.js');

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    Order: true, //是否有订单记录
    menu: ['全部订单', '待付款', '待收货', '已完成', '退货/款'], //选项卡列表
    status: [0, 1, 3, 5, 15], //订单状态(0:全部订单,1:待付款,3:待收货,5:已完成,15:已退货)
    current: 0, //选项卡序号
    size: 10, //请求每页加载的订单数量
    page: 0, //当前订单记录所在页数
    last: false, //是否是最后一页
    blank: false, //当前订单记录是否为空
    state: ['待付款', '待发货', '待收货', '待确认', '已完成', '待自提', '退款中', '已退款', '已取消', '已删除', '已支付，待商家确认', '待系统确认', '换货中', '已换货', '已退货', '', '', '', '订单超时', '待接单'], //订单类型列表
    list: [], //订单记录列表
    show: false, //是否显示条码和提货码
    code: '', //选中订单的提货码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);

    if (options.ordertype) {
      this.setData({
        current: options.ordertype
      })

    }
    wx.hideShareMenu();
    try {
      let logininfoData = wx.getStorageSync('logininfo'); // 取登录数据
      if (logininfoData) {
        this.setData({
          passIdStr: logininfoData.passIdStr,
          tokenid: logininfoData.tokenid,
          userAgent: logininfoData.userAgent,
        })
      }
    } catch (e) {
      console.log(e);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getorder();
  },

  /**
   * 切换选项卡时触发，清空订单列表
   */
  menuselect(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      current: index,
      page: 0,
      list: []
    })
    this.getorder()
  },

  /**
   * 请求订单列表接口10
   * 获取当前类型的订单列表
   */
  getorder() {
    console.log(this.data.current);

    wx.showLoading({
      title: '',
      mask: true
    })
    var pageSize = this.data.size;
    var currentPage = this.data.page;
    wx.request({
      url: app.globalData.url + '/api/shop/order/queryOrders',
      data: {
        tokenid: this.data.tokenid,
        userAgent: this.data.userAgent,
        eq_orderStatus: this.data.status[this.data.current], // 订单状态
        page: currentPage,
        size: pageSize,
      },
      success: res => {
        console.log('查询订单', res);

        if (res.data.code === 20020) { // 会话失效，重新登录
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.getorder();
          }
          reLogin.login(dealFunc);
        }

        this.setData({
          last: res.data.last,
          blank: false
        })
        if (res.data.totalElements > 0) { //有订单
          for (let i = 0; i < res.data.content.length; i++) {
            var orderNo = "list[" + (pageSize * currentPage + i) + "].orderNo";
            var orderId = "list[" + (pageSize * currentPage + i) + "].orderId";
            var shopid = "list[" + (pageSize * currentPage + i) + "].shopid";
            var name = "list[" + (pageSize * currentPage + i) + "].name";
            var address = "list[" + (pageSize * currentPage + i) + "].address";
            var phone = "list[" + (pageSize * currentPage + i) + "].phone";
            var date = "list[" + (pageSize * currentPage + i) + "].date";
            var status = "list[" + (pageSize * currentPage + i) + "].status";
            var sum = "list[" + (pageSize * currentPage + i) + "].sum";
            var num = "list[" + (pageSize * currentPage + i) + "].num";
            var time = "list[" + (pageSize * currentPage + i) + "].time";
            var code = "list[" + (pageSize * currentPage + i) + "].code";
            var n = 0;
            this.setData({
              [orderNo]: res.data.content[i].orderNo,
              [orderId]: res.data.content[i].orderId,
              [shopid]: res.data.content[i].shopid,
              [name]: res.data.content[i].shopName,
              [address]: res.data.content[i].shopAddress,
              [phone]: res.data.content[i].shopTel,
              [date]: res.data.content[i].createtime.substr(0, 10),
              [status]: res.data.content[i].orderStatus,
              [sum]: parseFloat(res.data.content[i].receivable).toFixed(2),
              [time]: res.data.content[i].createtime,
              [code]: res.data.content[i].receiveCode == null ? 0 : res.data.content[i].receiveCode,
            })
            for (let j = 0; j < res.data.content[i].odProductList.length; j++) {
              var image = "list[" + (pageSize * currentPage + i) + "].image[" + j + "]";
              var proNum = "list[" + (pageSize * currentPage + i) + "].proNum[" + j + "]";
              n += res.data.content[i].odProductList[j].productQty;
              this.setData({
                [image]: res.data.content[i].odProductList[j].webImgPath,
                [proNum]: res.data.content[i].odProductList[j].productQty,
                [num]: n,
              })
            }

            console.log("list", this.data.list);

          }
        } else { //无订单
          this.setData({
            last: false, // 设置last为false，表示是最后一页
            blank: true, //blank为true，表示当前订单记录为空
          });
          if (this.data.current == 0) {
            this.setData({
              Order: false
            })
          }
        }
        wx.hideLoading();
      },
      fail: res => {
        wx.hideLoading();
      }
    })
  },
  /**
   * 订单列表滚动触底触发
   * last不为true，不是最后一页，当前页数加1，继续请求下一页数据
   */
  moreorder() {
    if (!this.data.last) {
      this.setData({
        page: this.data.page + 1,
      });
      this.getorder();
    }
  },

  /**
   * 点击【提货码】,获取当前选中订单的提货码和条形码并显示
   */
  tocode(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      code: this.data.list[index].code,
      show: true
    })
    wxbarcode.barcode('barcode', this.data.list[index].code, 550, 150);
  },

  tohide() { //关闭提货码弹窗
    this.setData({
      show: false
    })
  },

  /**
   * 点击【订单进度】触发，存储当前订单下单店铺的数据
   */
  toprogress(e) {
    var index = e.currentTarget.dataset.index;
    wx.setStorage({
      key: 'shop',
      data: {
        name: this.data.list[index].name,
        address: this.data.list[index].address,
        phone: this.data.list[index].phone,
      },
      success: function (res) {}
    })
    wx.setStorage({
      key: 'orderno',
      data: {
        orderNo: this.data.list[index].orderNo,
      },
      success: function (res) {}
    })
    wx.navigateTo({
      url: '../progress/progress'
    })
  },

  /**
   * 点击【申请退款】，提供当前订单号码，弹窗引导用户致电店铺进行退款
   */
  GetRefund(e) {
    var index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '温馨提示',
      content: '申请退款请联系商家' + this.data.list[index].phone + '，并提供订单号',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          console.log('知道了')
        }
      }
    })
  },

  /**
   * 点击【退款详情】，存储当前订单ID数据，并跳转到退款详情页
   */
  torefund(e) {
    var index = e.currentTarget.dataset.index;
    wx.setStorage({
      key: 'orderid',
      data: {
        orderId: this.data.list[index].orderId,
      },
      success: function (res) {
        wx.navigateTo({
          url: '../refund/refund'
        })
      }
    })
  },

  todetail: function (e) { //点击【订单详情】触发，存储当前订单编号数据，并跳转到订单详情页
    var index = e.currentTarget.dataset.index;
    wx.setStorage({
      key: 'orderno',
      data: {
        orderNo: this.data.list[index].orderNo,
      },
      success: function (res) {
        wx.navigateTo({
          url: '../detail/detail'
        })
      }
    })
  },

  topay(e) { //点击【去支付】触发，存储当前店铺数据，订单数据，并跳转到支付订单页面
    var index = e.currentTarget.dataset.index;
    wx.setStorage({
      key: 'pay',
      data: {
        Sum: this.data.list[index].sum,
        tokenid: this.data.tokenid,
        shopid: this.data.list[index].shopid,
      },
    });
    wx.setStorage({
      key: 'order',
      data: {
        orderNo: this.data.list[index].orderNo,
        createTime: this.data.list[index].time,
      },
    });
    wx.redirectTo({
      url: '../pay/pay',
    });
  },

  tofinish(e) { //点击【确认收货】触发，打开弹窗询问用户是否确认
    var that = this;
    var index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认收货',
      content: '确认已经收到商品吗',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            method: 'POST',
            url: app.globalData.url + '/api/shop/order/confirmOrder',
            data: {
              orderNo: that.data.list[index].orderNo,
              tokenid: that.data.tokenid,
              userAgent: that.data.userAgent,
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {

              wx.showToast({
                title: res.data.msg,
                icon: 'success',
                duration: 1000
              })
              that.getorder();
            }
          })
        } else if (res.cancel) {}
      }
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
  cencel(e) { //点击【去支付】触发，存储当前店铺数据，订单数据，并跳转到支付订单页面
    var index = e.currentTarget.dataset.index;
    let that = this;
    wx.showModal({
      title: '温馨提示',
      content: '确定取消订单吗？',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            method: 'POST',
            url: app.globalData.url + '/api/shop/order/cancelOrder',
            data: {
              orderNo: that.data.list[index].orderNo,
              tokenid: that.data.tokenid,
              userAgent: that.data.userAgent,
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {

              wx.showToast({
                title: res.data.msg,
                icon: 'success',
                duration: 1000
              })
              that.getorder();
            }
          })
        }
      }
    })
    // wx.setStorage({
    //   key: 'pay',
    //   data: {
    //     Sum: this.data.list[index].sum,
    //     tokenid: this.data.tokenid,
    //     shopid: this.data.list[index].shopid,
    //   },
    // });
    // wx.setStorage({
    //   key: 'order',
    //   data: {
    //     orderNo: this.data.list[index].orderNo,
    //     createTime: this.data.list[index].time,
    //   },
    // });
    // wx.redirectTo({
    //   url: '../pay/pay',
    // });


  },

  //   /**
  //  * 点击【申请退款】，提供当前订单号码，弹窗引导用户致电店铺进行退款
  //  */
  // GetRefund(e) {
  //   var index = e.currentTarget.dataset.index;
  //   wx.showModal({
  //     title: '温馨提示',
  //     content: '申请退款请联系商家' + this.data.list[index].phone + '，并提供订单号',
  //     showCancel: false,
  //     success: function (res) {
  //       if (res.confirm) {
  //         console.log('知道了')
  //       }
  //     }
  //   })
  // },
})