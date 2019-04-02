// pages/edit/edit.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    HasAddress: false, //是否已有默认地址
    passIdStr: '',  //用户登录ID
    addressId: '',  //当前编辑地址ID
    NameValue: '',  //用户名输入框内容
    PhoneValue: '',  //联系电话输入框内容
    AreaValue: '请选择地址',  //选择地址输入框内容
    SiteValue: '',  //详细地址输入框内容
    call: ['先生', '女士'], //称呼列表
    callcurrent: 0,   //称呼选择序号
    mark: ["家", "公司", "学校"], //备注列表
    markcurrent: 0, //备注选择序号
    disabled: true, //保存地址按钮是否可点击
    CanSave: true,  //是否可保存，用于防止用户多次点击保存按钮
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      CanSave: true //赋值CanSave为ture，进入可保存状态
    })
    wx.getStorage({ //取登录数据
      key: 'logininfo',
      success: res => {
        this.setData({
          passIdStr: res.data.passIdStr
        })
      }
    }),
    wx.getStorage({ //取被编辑的地址数据
      key: 'editaddress',
      success: res => {
        if(res.data){
          this.setData({
            HasAddress:true,
            addressId: res.data.addressId,
            NameValue: res.data.name,
            PhoneValue: res.data.phone,
            AreaValue: res.data.areaname,
            SiteValue: res.data.addressDetail,
            callcurrent: parseInt(res.data.sex)-1,
            markcurrent: parseInt(res.data.label)-1,
            lat:res.data.lat,
            lng:res.data.lng,
            disabled: false
          })
        }else{
          this.setData({
            HasAddress: false,
            addressId: '',
            NameValue: '',
            PhoneValue: '',
            AreaValue:'',
            SiteValue: '',
            lat:'',
            lng:'',
            disabled: true
          })
          wx.setNavigationBarTitle({
            title: '新增地址',
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

  GetArea: function () {//点击【选择地址栏】触发，选择地址
    wx.chooseLocation({
      success: res => {
        this.setData({
          AreaValue: res.address+'-'+res.name,
          lat: res.latitude,
          lng: res.longitude
        })
      }
    })
  },

  CallChange: function (e) {//点击【先生、女士】触发，切换称呼
    var index = e.currentTarget.dataset.index;
    this.setData({
      callcurrent: index,
    });
  },

  MarkChange: function (e) {//点击【标签】触发，切换标签
    var index = e.currentTarget.dataset.index;
    this.setData({
      markcurrent: index,
    });
  },

  // NameClear: function (e) {//清空用户名输入框
  //   this.setData({
  //     NameValue: '',
  //     disabled: true,
  //   });
  // },

  // PhoneClear: function (e) {//清空联系电话输入框
  //   this.setData({
  //     PhoneValue: '',
  //     disabled: true,
  //   });
  // },

  // SiteClear: function (e) {//清空详细地址输入框
  //   this.setData({
  //     SiteValue: '',
  //     disabled: true,
  //   });
  // },

  bindnameInput: function (e) {//【联系人】输入时触发，赋值到data，进行是否可保存检测
    this.setData({
      NameValue: e.detail.value
    })
    this.InputCheck();
  },

  bindphoneInput: function (e) {//【手机号】输入时触发，赋值到data，进行是否可保存检测
    this.setData({
      PhoneValue: e.detail.value
    })
    this.InputCheck();
  },

  bindsiteInput: function (e) {//【详细信息】输入时触发，赋值到data，进行是否可保存检测
    this.setData({
      SiteValue: e.detail.value
    })
    this.InputCheck();
  },

  InputCheck: function () {//是否可保存检测函数，姓名，电话和地址都不为空时保存按钮可点击
    if (this.data.NameValue && this.data.PhoneValue && this.data.SiteValue) {
      this.setData({
        disabled: false
      })
    }else{
      this.setData({
        disabled: true
      })
    }
  },

  addaddress: function () {//点击【新增地址】触发，对新增地址保存的函数
    if(this.data.CanSave){
      this.setData({
        CanSave:false
      })
      wx.request({  // 发送新增地址数据到服务器
        url: app.globalData.url + '/api/shop/address/msAddress/addOrUpdateAddress2',
        data:
          JSON.stringify({
            passId: this.data.passIdStr,
            areaname: this.data.AreaValue,
            addressDetail: this.data.SiteValue,
            mobileno: this.data.PhoneValue,
            username: this.data.NameValue,
            lat: this.data.lat,
            lng: this.data.lng,
            sex: parseInt(this.data.callcurrent) + 1,
            label: parseInt(this.data.markcurrent) + 1,
            def: '1'
          }),
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          if (res.data.code == 200) {
            wx.showToast({
              title: res.data.message,
              icon: 'success',
              duration: 2000,
              success: function (res) {
                setTimeout(function () {
                  wx.redirectTo({
                    url: '../address/address'
                  })
                }, 2000);
              },
            })
          } else {
            wx.showToast({
              title: res.data.message,
              icon: 'none',
              duration: 2000,
            })
          }
        }
      })
    }
  },

  updateaddress: function () {//点击【保存地址】触发，对编辑地址保存的函数
    if (this.data.CanSave){
      this.setData({
        CanSave: false
      })
      wx.request({  //发送修改后的地址到服务器
        url: app.globalData.url + '/api/shop/address/msAddress/addOrUpdateAddress2',
        data:
          JSON.stringify({
            passId: this.data.passIdStr,
            addressId: this.data.addressId,
            areaname: this.data.AreaValue,
            addressDetail: this.data.SiteValue,
            mobileno: this.data.PhoneValue,
            username: this.data.NameValue,
            lat: this.data.lat,
            lng: this.data.lng,
            sex: parseInt(this.data.callcurrent) + 1,
            label: parseInt(this.data.markcurrent) + 1,
            def: '1'
          }),
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          if (res.data.code == 200) {
            wx.showToast({
              title: res.data.message,
              icon: 'success',
              duration: 2000,
              success: function (res) {
                setTimeout(function () {
                  wx.redirectTo({
                    url: '../address/address'
                  })
                }, 2000);
              },
            })
          } else {
            wx.showToast({
              title: res.data.message,
              icon: 'none',
              duration: 2000,
            })
          }
        }
      })
    }
  },
})