// pages/confirm/confirm.js
const reLogin = require('../../utils/reLogin.js');
const util = require('../../utils/util.js');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    passIdStr: '',
    tokenid: '',
    userAgent: '',
    Mode: 0, //订单类型【0配送，1自提】
    hasAddress: false, //是否有默认地址
    SaddressId: '', //收货地址ID
    Saddress: '', //收货地址
    Sname: '', //收货人姓名
    Sphone: '', //收货人电话
    Slat: '', //收货地址纬度
    Slng: '', //收货地址经度
    distance: 0, //配送距离（用户收货地址与门店的距离） 
    distributeDistance: 0, // 店铺支持配送的距离
    Pname: '', //提货人姓名
    Pphone: '', //提货人联系电话

    lat: '', //店铺纬度
    lng: '', //店铺经度
    shopid: '', //店铺id
    opentime: '', //店铺营业时间
    Pshop: '', //自提店铺名称
    Paddress: '', //自提店铺地址

    list: [], //订单商品列表
    Tip: 0, //店铺起送价
    Sum: 0, //订单商品总价
    tag: 0, //配送运费
    Total: 0, //实付总价

    pidStr: '', //商品pid序列
    numStr: '', //商品数量序列
    priceStr: '',


    showTag: true, //【运费栏】是否展示运费
    Show: false, //配送规则——是否显示运费说明
    ruleDistance: 0, //配送规则——送货距离
    weight: '', //配送规则——货物重量
    Readme: { //配送规则——规则说明
      fir: '1km免费配送，1~3km内，每增加1km配送费增加1元/单，3km以上，每增加1km配送费再加价2元/单。',
      sec: '夜间(22：00~23：59)，每单额外加收2元/单。',
      thr: '重量超过5kg，每增加1kg，额外加收2元。'
    },

    mark: '', //备注啊哈哈
    show: 0, //是否显示备注输入框
    areatext: '', //备注输入框内容
    word: 0, //备注输入框字数
    length: 50, //备注输入框字数限制

    coupon: { //使用的优惠券的属性
      id: '', // 优惠券id
      amount: 0, // 优惠券金额
      discount: 0, // 优惠券折扣
      couponType: 0, // 优惠类型(0:满减,1:折扣)
    },

    couponAmount: 0, // 使用的优惠券的金额或者折扣
    hasCoupon: false, // 是否有可用优惠券
    couponText: '', // 优惠券栏显示的文字

    disabled: true //是否可以提交订单 （disabled = true，不可提交订单）
  },


  // 离开
  onUnload() {
    wx.removeStorage({
      key: 'couponinfo',
      success(res) {
        console.log(res.data)
      }
    })
    wx.removeStorage({
      key: 'backstatus',
      success(res) {
        console.log(res.data)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);

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
      let storeData = wx.getStorageSync('store'); // 取门店数据
      if (storeData) {
        this.setData({
          Pshop: storeData.name,
          Paddress: storeData.address,
          shopid: storeData.shopid,
          lat: storeData.lat,
          lng: storeData.lng,
          opentime: storeData.opentime,
          // closetime: storeData.closetime
        })
      }
      let orderData = JSON.parse(options.params); // 取订单列表数据
      if (orderData) {
        this.setData({
          Sum: orderData.totalPrice.toFixed(2),
          list: orderData.products
        });

        let pidStr = '';
        let numStr = '';
        let priceStr = '';
        this.data.list.forEach((elem) => {
          if (pidStr && numStr && priceStr) {
            pidStr = pidStr + ',' + elem.pid;
            numStr = numStr + ',' + elem.productQty;
            priceStr = priceStr + ',' + elem.price;
          } else {
            pidStr = elem.pid;
            numStr = elem.productQty;
            priceStr = elem.price;
          }
        });
        this.setData({
          pidStr: pidStr, //商品pid序列
          numStr: numStr, //商品数量序列
          priceStr: priceStr //商品价格序列
        });
      }
      let tipData = wx.getStorageSync('tip'); // 取门店起送价
      if (tipData) {
        this.setData({
          Tip: tipData,
        })
      }
    } catch (e) {
      console.log(e);
    }

    this.getPickupMode(); // 判断是否配送
    this.reqCouponCandUsed(); // 请求可用优惠券

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

    wx.getStorage({ // 从页面进入的标记
      key: 'backstatus',
      success: res => {
        if (res.data === 'address') { // 从address.js进入
          this.reqAddress();
        } else if (res.data === 'coupon') { // 从coupon.js进入
          wx.getStorage({
            key: 'couponinfo',
            success: res => {
              console.log(res);

              var Id = "coupon.id";
              var Pid = "coupon.pid";
              var Icode = "coupon.icode";
              var Type = "coupon.type";
              var Amount = "coupon.amount";
              if (res.data) {
                this.setData({
                  [Id]: res.data.Id,
                  [Pid]: res.data.Pid,
                  [Icode]: res.data.Icode,
                  [Type]: res.data.Type,
                  [Amount]: res.data.Amount,
                  couponText: res.data.Type == 0 ? res.data.Amount.toFixed(2) + '元' : res.data.Amount.toFixed(1) + '折'
                })
                console.log(parseFloat(res.data.Amount).toFixed(1));
              } else {
                this.setData({
                  [Id]: null,
                  [Pid]: null,
                  [Icode]: null,
                  [Type]: null,
                  [Amount]: null,
                  couponText: '未使用优惠券'
                })
              }
              this.SetTotal()
            }
          })
        } else if (res.data === 'cart') { // 从cart.js进入

        }
      }
    })
  },

  /**
   * 价格判断【送货上门 & 到店自提】
   */
  getPickupMode() {
    if (parseFloat(this.data.Sum) < parseFloat(this.data.Tip)) { //不满起配价
      wx.showModal({
        title: '温馨提示',
        content: '你选购的商品总额不满足配送条件只能到店自提，是否继续结算？',
        confirmText: '继续结算',
        cancelText: '去凑单',
        success: res => {
          if (res.confirm) {
            this.setData({
              Mode: 1,
              disabled: false
            })
            this.reqTransportFee(); // 门店最大配送范围
          } else if (res.cancel) {
            wx.navigateBack({
              delta: 1
            })
          }

        },
        fail: r => {

        }
      })
    } else {
      this.reqTransportFee(); // 门店最大配送范围
    }

  },

  /**
   * 请求可用优惠券
   */
  reqCouponCandUsed() {
    wx.request({
      url: app.globalData.url + '/api/shop/couponActivity/findCouponCandUsed',
      data: {
        tokenid: this.data.tokenid,
        userAgent: this.data.userAgent,
        amount: parseFloat(this.data.Sum),
        shopId: this.data.shopid,
        pids: this.data.pidStr,
        pidNum: this.data.numStr,
        pidPrice: this.data.priceStr
      },
      success: res => {
        console.log('是否有可用优惠券', res);
        if (res.data.code === 200) {
          if (res.data.data.length > 0) { // 有优惠券列表
            for (let i = 0; i < res.data.data.length; i++) {
              if (res.data.data[i].couponActivity.canUsed) {
                this.setData({
                  hasCoupon: true,
                  couponText: '未使用优惠券'
                });
                break;
              }
            }
            if (!this.data.hasCoupon) {
              this.setData({
                hasCoupon: false,
                couponText: '无可用优惠券'
              });
            }
          } else {
            this.setData({
              hasCoupon: false,
              couponText: '无可用优惠券'
            });
          }
        } else if (res.data.code === 20020) {
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.reqCouponCandUsed();
          }
          reLogin.login(dealFunc);
        }
      }
    })
  },

  /**
   * 【请求--36.获取门店所有运费接口， 获取门店支持配送的最大距离】
   */
  reqTransportFee() {
    wx.showLoading({
      title: '',
      mask: true
    })
    wx.request({
      url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/listTransportFee',
      data: {
        shopId: this.data.shopid
      },
      success: (res) => {
        console.log('最大配送距离', res);
        if (res.data.code === 200) {
          let distributeDistance = 0;
          res.data.data.forEach((elem, index) => {
            if (elem.distributeDistance > distributeDistance) {
              distributeDistance = elem.distributeDistance;
            }
          });
          this.setData({
            distributeDistance: distributeDistance
          });
          this.reqAddress(); //请求默认地址
        } else {
          wx.hideLoading();
        }
      },
      fail: res => {
        wx.hideLoading();
      }
    })
  },

  /**
   * 【请求--16.获取默认地址】
   */
  reqAddress() {
    var that = this;
    wx.request({
      url: app.globalData.url + '/api/shop/address/msAddress/getAddressDefByPassId',
      data: {
        passId: this.data.passIdStr,
      },
      success: res => {
        console.log('默认地址', res);
        if (res.data.code === 200) {
          this.setData({
            hasAddress: true,
            SaddressId: res.data.addressId,
            Saddress: res.data.areaname + res.data.addressDetail,
            Sname: res.data.username,
            Sphone: res.data.mobileno,
            Slat: res.data.lat,
            Slng: res.data.lng,
            Pname: res.data.username,
            Pphone: res.data.mobileno,
          });
          this.reqCanTransport(); //判断是否在配送范围内
        } else if (res.data.code === 5001) { // 没有默认地址
          this.setData({
            hasAddress: false,
            tag: (0).toFixed(2),
            Total: this.data.Sum
          });
          wx.hideLoading();
        }
      }
    })
  },

  /**
   * 判断是否在配送范围内
   */
  reqCanTransport() {
    let lngStr = (this.data.Slng * 1000000).toString().split('.')[0] / 1000000;
    let latStr = (this.data.Slat * 1000000).toString().split('.')[0] / 1000000
    let centerStr = lngStr + ',' + latStr;
    wx.request({
      url: 'https://yuntuapi.amap.com/datasearch/around',
      data: {
        key: 'e6b86d252ff55da0fda32a48564ca0d4',
        tableid: '58e44e9aafdf520ea822b318',
        center: centerStr, // 规则：经度和纬度用","分割; 经纬度小数点后不得超过6位。
        keywords: '六沐便利店',
        radius: 50000, //规则：取值范围[0,50000]，单位：米。若超出取值范围按默认值
        sortrule: 'distance'
      },
      success: res => {
        console.log('配送距离', res);
        if (res.data.status === 1) {
          this.setData({
            distance: 0
          });
          for (let i = 0; i < res.data.datas.length > 0; i++) {
            if (res.data.datas[i].shopid == this.data.shopid) {
              this.setData({
                distance: parseFloat(res.data.datas[i]._distance) / 1000
              });
              break;
            }
          }
          if (!this.data.distance) { // 若没有找到对应店铺，即表示已超过50km（超过配送范围），设置距离为大于配送范围的值
            this.setData({
              distance: 1000
            });
          }
          this.GetTag(); // 请求达达运费
        }
      }
    })
  },

  /**
   * 41.获取运费接口（使用达达的运费减平台垫付5元）
   * 请求获取配送距离，商品重量，配送运费
   */
  GetTag() {
    wx.request({
      url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/queryTransportFee',
      data: {
        // lat: 22.98771,
        // lng: 113.748801,
        shopId: this.data.shopid,
        lat: this.data.Slat,
        lng: this.data.Slng,
        userName: this.data.Sname,
        userAddress: this.data.Saddress,
        userMobile: this.data.Sphone,
        totalPrice: this.data.Sum,
        pids: this.data.pidStr,
        pnum: this.data.numStr
      },
      success: res => {
        console.log('请求达达运费接口', res);
        if (res.data.code === 200) {
          this.setData({
            weight: res.data.data.cargoWeight.toFixed(2),
            ruleDistance: parseFloat(res.data.data.distance / 1000).toFixed(2),
            tag: parseFloat(res.data.data.transportFee).toFixed(2)
          });
          if (this.data.distance > this.data.distributeDistance) { // 超出配送范围
            this.setData({
              showTag: false
            });
            if (this.data.Mode == 0) { //‘送货上门’
              this.setData({
                disabled: true
              })
              console.log("收货地址超出配送范围", parseFloat(this.data.Sum), parseFloat(this.data.Tip));

              if (parseFloat(this.data.Sum) >= parseFloat(this.data.Tip)) { // ‘送货上门’，满起配价才提示超出配送范围
                wx.showModal({
                  title: '收货地址超出配送范围',
                  content: '请更换收货地址或选择到店自提',
                  confirmText: '我知道了',
                  showCancel: false,
                  success: res => {

                    if (res.confirm) {
                      this.setData({
                        Mode: 1,
                        disabled: false,
                        tag: (0).toFixed(2)
                      })
                      this.SetTotal(); // 计算总价
                    }
                  }
                })
              }
            } else { // ‘门店自提’
              this.setData({
                disabled: false
              })
              this.SetTotal(); // 计算总价
            }

          } else { // 在配送范围内
            if (parseFloat(this.data.Sum) >= parseFloat(this.data.Tip)) { // 满起配价
              this.setData({
                disabled: false,
                showTag: true,
                tag: parseFloat(res.data.data.transportFee).toFixed(2)
              });
            } else { // 不满起配价
              this.setData({
                showTag: true,
                tag: (0).toFixed(2)
              });
              if (this.data.Mode == 0) {
                this.setData({
                  disabled: true
                });
              } else {
                this.setData({
                  disabled: false
                });
              }
            }
            this.SetTotal(); // 计算总价
          }
        } else { // code = 202，"收货人、联系电话和收货地址不能为空"
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
        }
        wx.hideLoading();
      }
    })
  },

  /** 
   * 【切换提货方式】触发，切换订单类型，判断是否满足配送，重新计算订单总价
   */
  ModeChange(e) {
    this.setData({
      Mode: e.currentTarget.dataset.mode,
    })
    if (this.data.Mode == 0) { // 送货上门
      if (parseFloat(this.data.Sum) < parseFloat(this.data.Tip)) { //不满起配价
        this.setData({
          disabled: true
        })
        wx.showModal({
          title: '温馨提示',
          content: '商品总额未满足配送条件，请选择到店自提',
          confirmText: '我知道了',
          showCancel: false,
          success: res => {}
        })
      } else {
        if (this.data.hasAddress) { // 有默认地址
          if (parseFloat(this.data.distance) > this.data.distributeDistance) {
            this.setData({
              disabled: true
            })
            wx.showModal({
              title: '收货地址超出配送范围',
              content: '请更换收货地址或选择到店自提',
              confirmText: '我知道了',
              showCancel: false,
              success: res => {}
            })
          } else {
            this.setData({
              disabled: false
            })
          }
        } else { // 没默认地址
          this.setData({
            disabled: true
          })
        }
      }
    } else { // 门店自提
      this.setData({
        disabled: false
      })
    }
    this.SetTotal();
  },


  /**
   * 计算订单总价，商品价格+运费-优惠券
   */
  SetTotal() {
    let s = parseFloat(this.data.Sum);
    let a = parseFloat(this.data.coupon.amount);
    let t = parseFloat(this.data.tag);

    let d = 0; // 订单中可用优惠券的商品总价
    let total = 0; // 应付价格
    if (this.data.Mode == 1) {
      t = 0;
    }
    if (!this.data.coupon.id) { // 无优惠券
      total = s + t; // 总价+运费
    } else {
      if (!this.data.coupon.pid) { // 全部商品可用
        if (this.data.coupon.type == 0) { //优惠类型为0:满减
          total = s - a + t;
        } else if (this.data.coupon.type == 1) { //优惠类型为1:折扣
          total = s * a / 10 + t;
        }
      } else { // 部分商品可用
        for (let i in this.data.list) {
          if (this.data.coupon.pid.indexOf(this.data.list[i].pid) !== -1) {
            d += this.data.list[i].productQty * parseFloat(this.data.list[i].price);
          }
        }
        if (this.data.coupon.type == 0) { //优惠类型为0:满减
          console.log(s);
          console.log(d);
          console.log(a);
          console.log(t);

          total = (s - d) + (d - a) + t;
        } else if (this.data.coupon.type == 1) { //优惠类型为1:折扣
          total = (s - d) + (d * a / 10) + t;
        }
      }
    }
    this.setData({
      Total: parseFloat(total).toFixed(2)
    })

  },

  /**
   * 备注输入框字数限制
   */
  WordLimit: function (e) {
    let value = e.detail.value,
      len = parseInt(value.length);
    if (len > this.data.length) return;
    this.setData({
      word: len //当前字数  
    });
  },

  /**
   * 显示备注输入框
   */
  PopOpen: function () {
    this.setData({
      show: 1,
      areatext: this.data.mark,
    });
  },

  /**
   * 关闭备注输入框
   */
  PopClose: function () {
    this.setData({
      show: 0,
      areatext: null,
    });
  },

  /**
   * 备注输入框获取焦点
   */
  TextAreaBlur: function (e) {
    this.setData({
      areatext: e.detail.value.trim(),
    })
  },

  /**
   * 【确认添加备注】时触发，检查内容合法性，关闭窗口
   */
  PopSubmit: function (e) {
    this.setData({
      mark: this.data.areatext,
      show: 0
    });
    // var reg = /(^$)|^([a-zA-Z\u4e00-\u9fa5]|[\（\）\《\》\——\；\，\。\、\“\”\<\>\！])([a-zA-Z0-9\u4e00-\u9fa5]|[\（\）\《\》\——\；\，\。\、\“\”\<\>\！])*$/;
    // if (reg.test(this.data.areatext)) {
    //   this.setData({
    //     mark: this.data.areatext,
    //     show: 0,
    //   })
    // } else {
    //   wx.showToast({
    //     title: '包含非法字符',
    //     icon: 'none',
    //     duration: 2000
    //   })
    // }
  },

  TipOpen: function () { //显示运费窗口
    this.setData({
      Show: true
    })
  },

  TipClose: function () { //关闭运费窗口
    this.setData({
      Show: false
    })
  },

  /**
   * 有优惠券时，点击【优惠券栏】
   */
  tocoupon() {
    if (this.data.hasCoupon) {
      wx.setStorage({
        key: 'referData',
        data: {
          shopid: this.data.shopid,
          Sum: this.data.Sum,
          pids: this.data.pidStr,
          pidNum: this.data.numStr,
          pidPrice: this.data.priceStr
        },
        success: res => {
          wx.navigateTo({
            url: '../coupon/coupon',
          })
        }
      })
    }
  },

  /**
   * 点击【地址栏】触发，保存地址ID数据，跳转到收货地址列表页
   */
  toaddress: function () {
    wx.setStorage({
      key: 'addressid',
      data: {
        addressId: this.data.SaddressId
      },
      success: function (res) {
        wx.navigateTo({
          url: '../address/address',
        })
      }
    })
  },

  /**
   * 【没有默认地址时点击地址栏】触发，跳转到编辑地址页面
   */
  tonewaddress: function () {
    wx.navigateTo({
      url: '../edit/edit',
      success: function (res) {
        wx.setNavigationBarTitle({
          title: "新增地址",
        })
      }
    })
  },

  /**
   * 提交订单函数：先显示加载提示框，存储当前支付数据
   */
  GetOrder: function () {
    wx.showLoading({
      title: '正在提交订单',
    })
    var productlist = [];
    for (let i = 0; i < this.data.list.length; i++) {
      productlist.push({
        shopid: this.data.shopid,
        itemid: this.data.list[i].itemid,
        pid: this.data.list[i].pid,
        productName: this.data.list[i].name,
        productTitle: this.data.list[i].ctitle,
        productQty: this.data.list[i].productQty,
        salePrice: this.data.list[i].price,
        productTotleprice: this.data.list[i].productQty * parseFloat(this.data.list[i].price),
        isUseActivity: this.data.list[i].isUseActivity, // 是否是活动价（0否1是）
        shopActivityId: this.data.list[i].shopActivityId
      })
    };
    wx.request({ // 请求提交订单接口
      method: 'POST',
      url: app.globalData.url + '/api/shop/order/submitOrder',
      data: JSON.stringify({
        odBase: {
          shopid: this.data.shopid,
          transportType: this.data.Mode,
          couponId: this.data.coupon.id,
          couponMsPassRelationId: this.data.coupon.icode,
          orderTotalprice: parseFloat(this.data.Sum),
          payType: '1',
          receivable: this.data.Total,
          usedCouponAmount: this.data.coupon.type == 0 ? this.data.coupon.amount : 0,
          userAddress: this.data.Saddress,
          userMobile: this.data.Mode == 0 ? this.data.Sphone : this.data.Pphone,
          userName: this.data.Mode == 0 ? this.data.Sname : this.data.Pname,
          orderMessage: this.data.mark,
          isUseCoupon: this.data.coupon.id ? '1' : '0',
          lng: this.data.Mode == 0 ? this.data.Slng : null,
          lat: this.data.Mode == 0 ? this.data.Slat : null,
          distance: this.data.Mode == 0 ? this.data.distance : 0,
          transportCosts: this.data.Mode == 0 ? this.data.tag : 0,
        },
        odProductList: productlist,
        tokenid: this.data.tokenid
      }),
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log('提交订单', res);
        if (res.data.code == 200) {
          wx.setStorage({ //存支付数据
            key: 'pay',
            data: {
              Sum: this.data.Total,
              tokenid: this.data.tokenid,
              shopid: this.data.shopid,
            },
          })
          wx.setStorage({ // 存订单数据
            key: 'order',
            data: {
              orderNo: res.data.orderNo,
              createTime: res.data.createtime
            },
          })
          wx.setStorage({
            key: 'pids',
            data: this.data.pidStr
          })
          wx.redirectTo({ // 跳转到支付页面
            url: '../pay/pay',
          })
          wx.hideLoading();
        } else if (res.data.code === 5005) { // 库存异常
          wx.hideLoading();
          wx.showModal({
            title: '温馨提示',
            content: res.data.msg,
            showCancel: false,
            confirmText: '去修改',
            success: res => {
              if (res.confirm) {
                wx.navigateBack({
                  url: '../cart/cart'
                })
              }
            }
          })
        } else if (res.data.code === 5006) { // 价格发生变动
          wx.showToast({
            title: res.data.msg,
            icon: 'none'
          })
        } else if (res.data.code === 5001) { // 收货人不能为空
          wx.showToast({
            title: res.data.msg,
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 点击【提交订单】时触发
   */
  toorder: function () {
    this.GetOrder();
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