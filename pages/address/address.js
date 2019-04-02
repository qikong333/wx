// pages/address/address.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    Address: true, //是否有收货地址
    ListCurrent: 0, //当前选中地址的序号
    list: [], //收货地址列表
    call: ['先生', '女士'], //收货人称呼列表
    mark: ['家里', '公司', '学校'] //地址备注列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) { //获取登录数据，请求用户收货地址接口
    var that = this;
    wx.getStorage({ // 取登录数据
      key: 'logininfo',
      success: function (res) {
        that.setData({
          passIdStr: res.data.passIdStr,
          tokenid: res.data.tokenid,
        })
        wx.request({ // 请求用户收货地址数据
          url: app.globalData.url + '/api/shop/address/msAddress/search',
          data: {
            eq_passId: res.data.passIdStr
          },
          header: {
            'content-type': 'application/json' // 默认值
          },
          success: function (res) {
            console.log('收货地址', res);
            for (let i = 0; i < res.data.length; i++) {
              var addressId = "list[" + i + "].addressId";
              var name = "list[" + i + "].name";
              var sex = "list[" + i + "].sex";
              var phone = "list[" + i + "].phone";
              var label = "list[" + i + "].label";
              var areaname = "list[" + i + "].areaname";
              var addressDetail = "list[" + i + "].addressDetail";
              var lat = "list[" + i + "].lat";
              var lng = "list[" + i + "].lng";
              that.setData({
                [addressId]: res.data[i].addressId,
                [name]: res.data[i].username,
                [sex]: res.data[i].sex,
                [phone]: res.data[i].mobileno,
                [label]: res.data[i].label,
                [areaname]: res.data[i].areaname,
                [addressDetail]: res.data[i].addressDetail,
                [lat]: res.data[i].lat,
                [lng]: res.data[i].lng,
              })
            }
            wx.getStorage({
              key: 'addressid',
              success: function (res) {
                for (let l = 0; l < that.data.list.length; l++) {
                  if (res.data.addressId == that.data.list[l].addressId) {
                    that.setData({
                      ListCurrent: l, // 当前选中的地址序号
                    })
                  }
                }
              }
            })
          }
        })
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
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.setStorage({ // 离开‘选择地址’页面时，存储backstatus数据状态为0
      key: 'backstatus',
      data: 'address'
    })
  },

  SelectAddress: function (e) { // 点击【地址列表中某个地址】触发
    var current = e.currentTarget.dataset.index;
    this.setData({
      ListCurrent: current,
    });
    wx.request({ // 发送当前选中的地址输据到服务器，更新服务器默认地址数据
      method: 'POST',
      url: app.globalData.url + '/api/shop/address/msAddress/updateAddressDef',
      data: {
        passId: this.data.passIdStr,
        addressId: this.data.list[current].addressId
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        wx.navigateBack({
          url: '../confirm/confirm'
        })
      }
    })
  },

  EditAddress: function (e) { //点击【编辑图标】触发，对该地址进行编辑
    var current = e.currentTarget.dataset.index;
    wx.setStorage({ // 缓存将被编辑的地址数据，以便在编辑地址页面展示
      key: 'editaddress',
      data: {
        addressId: this.data.list[current].addressId,
        name: this.data.list[current].name,
        sex: this.data.list[current].sex,
        phone: this.data.list[current].phone,
        areaname: this.data.list[current].areaname,
        addressDetail: this.data.list[current].addressDetail,
        label: this.data.list[current].label,
        lat: this.data.list[current].lat,
        lng: this.data.list[current].lng,
      },
      success: function (res) {
        wx.redirectTo({
          url: '../edit/edit'
        })
      }
    })
  },

  toedit: function () { //点击【新建地址】触发，把存储地址的数据清空，并跳转到编辑地址页面
    wx.setStorage({
      key: 'editaddress',
      data: null,
      success: function (res) {
        wx.redirectTo({
          url: '../edit/edit'
        })
      },
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