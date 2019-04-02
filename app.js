//app.js

// const KMurl = 'https://appapi.lmchaoshi.com'
// const url = 'https://api.lmchaoshi.com'

const url = 'http://121.40.188.31:8080'
const KMurl = 'http://47.106.36.211:8066'


App({

  globalData: { // 全局数据
    userInfo: {

    },
    openid: '',
    session_key: '',
    unionid: '',

    url: url,
    KMurl: KMurl,
    extraData: {
      token: '',
      userCode: '',
      userAgent: ''
    },
    shopInfo: {
      address: '',
      distance: '',
      location: '',
      longitude: '',
      name: '',
      opentime: '',
      shopid: '',
      telephone: ''
    },
    fromDemo: ''
  },
  onLaunch(option) {
    console.log('onLaunch小程序跳转', option);

    // if (option.referrerInfo && option.referrerInfo.appId) {
    //   let extraDataObj = option.referrerInfo.extraData;
    //   this.globalData.extraData.mobile = extraDataObj.mobile;
    //   this.globalData.extraData.token = extraDataObj.token;
    //   this.globalData.extraData.userAgent = extraDataObj.userAgent;
    //   this.globalData.extraData.userCode = extraDataObj.userCode;
    // }




  },
  onShow(option) {
    console.log('onShow小程序跳转', option);
    if (option.referrerInfo && option.referrerInfo.appId) {
      let store = option.referrerInfo.extraData.store

      this.globalData.shopInfo.address = store.address
      this.globalData.shopInfo.distance = store.distance
      this.globalData.shopInfo.location = store.location
      this.globalData.shopInfo.longitude = store.longitude
      this.globalData.shopInfo.name = store.name
      this.globalData.shopInfo.opentime = store.opentime
      this.globalData.shopInfo.shopid = store.shopid
      this.globalData.shopInfo.telephone = store.telephone
      this.globalData.fromDemo = option.referrerInfo.extraData.fromDemo

    }

    console.log("app.globalData ", this.globalData);
  },


})