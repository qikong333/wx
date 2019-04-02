// pages/confirm/confirm.js
// const reLogin = require('../../utils/reLogin.js');
// const util = require('../../utils/util.js');
const app = getApp()

Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定

  },
  data: {
    // 这里是一些组件内部数据
    shopName: '',
    shopid: '',
    saddress: '',
    passIdStr: '',
    tokenid: '',
    userAgent: '',
    openTime: '',
    distributePrice: '',
    distributeDistance: '',
    shopName2: '',
  },
  lifetimes: {
    created() {
      let that = this
      try {
        const storeData = wx.getStorageSync('store'); // 取店铺数据
        const logininfoData = wx.getStorageSync('logininfo'); // 取登录数据

        if (storeData && logininfoData) {
          that.setData({
            shopName: storeData.name,
            shopid: storeData.shopid,
            saddress: storeData.address,
            passIdStr: logininfoData.passIdStr,
            tokenid: logininfoData.tokenid,
            userAgent: logininfoData.userAgent,
            openTime: storeData.opentime
          });
        }
      } catch (e) {}

      this.customMethod();
      this.listTransportFree();
    }



  },
  methods: {
    // 这里是一个自定义方法
    customMethod: function () {
      console.log('customMethod')
    },
    /**
     * 【请求--36.获取门店所有运费接口， 获取门店支持配送的最大距离】
     */
    reqTransportFee() {
      wx.request({
        url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/listTransportFee',
        data: {
          shopId: this.data.shopid
        },
        success: (res) => {
          console.log('最大配送距离', res);
          if (res.data.code === 200) {

          }
        },

      })
    },
    /**
     * 50.获取门店所有免运费接口
     */
    listTransportFree: function () {
      wx.request({
        url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/listTransportFree',
        data: {
          shopId: this.data.shopid, //商品类号
        },

        success: res => {
          console.log("获取门店所有免运费接口", res);
          this.setData({
            distributePrice: res.data.data[0].distributePrice,
            distributeDistance: res.data.data[0].distributeDistance,
            shopName: this.data.shopName,
            openTime: this.data.openTime,
          })
        }
      })
    },
  },

})