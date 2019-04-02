// pages/pay/pay.js
var md5 = require('../../utils/md5.js');
var RSA = require('../../utils/wxapp_rsa.js');
var util = require('../../utils/util.js');
const app = getApp();


/** 
 * 支付订单倒计时函数，30分钟内进行倒计时，时间结束提示"订单已超时"
 */
function count_down(that) {
  that.setData({
    clock: date_format(parseInt(that.data.count))
  });
  if (parseInt(that.data.count) <= 0) {
    that.setData({
      clock: "订单已超时",
      disabled: true
    });
    return; // timeout则跳出递归
  }
  // setTimeout(function () {  // 毫秒级倒计时
  //   that.data.count -= 10;
  //   count_down(that);
  // }, 10);
  setTimeout(function () { // 秒级倒计时
    that.data.count -= 1000;
    count_down(that);
  }, 1000);
}

/**
 * 将毫秒数渲染成倒计时时钟
 */
function date_format(micro_second) {
  // 秒数
  var second = Math.floor(micro_second / 1000);
  // 小时位
  var hr = Math.floor(second / 3600);
  // 分钟位
  var min = fill_zero_prefix(Math.floor((second - hr * 3600) / 60));
  // 秒位
  var sec = fill_zero_prefix((second - hr * 3600 - min * 60)); // equal to => var sec = second % 60;
  // 毫秒位，保留2位
  var micro_sec = fill_zero_prefix(Math.floor((micro_second % 1000) / 10));

  return hr + ":" + min + ":" + sec
  //+ " " + micro_sec;
}
/**
 * 数字低于10时，在数字前+0，例：‘9’->‘09’
 */
function fill_zero_prefix(num) {
  return num < 10 ? "0" + num : num
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    shopid: '',
    Sum: '', //订单总价
    orderNo: '', //订单编号
    Current: 0, //支付方式序号
    clock: '', //倒计时显示栏
    count: 30 * 60 * 1000, //倒计时总秒数
    Method: [ //支付方式
      {
        image: '../../images/wechat.png',
        name: '微信支付',
        check: true
      },
      {
        show: true,
        image: '../../images/icon_mcard.png',
        name: 'M卡支付',
        items: [{
            name: '普卡',
            type: '余额',
            typeId: '',
            balance: 0,
            check: false
          },
          {
            name: '普卡积分',
            type: '积分',
            typeId: '',
            balance: 0,
            check: false
          }
        ]
      }
    ],
    hasCard: false, //是否有m卡支付（是否是从卡盟小程序跳转进入）
    disabled: false, //是否可支付

    paymentType: 3, // M卡支付类型（3-M卡余额支付，4-M卡积分支付）

    isMPay: false, // 是否选择M卡支付
    Length: 6, //输入框个数 
    isFocus: true, //聚焦 
    Value: '', //输入的内容 
    ispassword: true, //是否密文显示 true为密文， false为明文。
    pidStr: '',
    kamenInfo: {
      userToken: '',
      userCode: '',
      userAgent: ''
    },
    userPayInfo: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) { //获取支付数据，获取订单数据

    wx.showLoading({
      title: '',
      mask: true
    })
    wx.hideShareMenu();

    wx.getStorage({ // 取门店数据
      key: 'store',
      success: res => {
        this.setData({
          shopid: res.data.shopid
        });
      }
    })
    wx.getStorage({ // 取产品序列号
      key: 'pids',
      success: res => {
        this.setData({
          pidStr: res.data
        });
      }
    })
    wx.getStorage({ // 取支付数据
      key: 'pay',
      success: res => {
        this.setData({
          Sum: parseFloat(res.data.Sum).toFixed(2), // 应付金额
        })
      },
    })
    wx.getStorage({ //取订单数据
      key: 'order',
      success: res => {
        this.setData({
          orderNo: res.data.orderNo,
          createTime: res.data.createTime,
        })
        var nowtime = Date.parse(util.formatTime(new Date()).replace(/-/g, '/'));
        var createtime = Date.parse(this.data.createTime.replace(/-/g, '/'));
        var ms = parseInt(nowtime - createtime);
        if (ms >= 1800000) { // 1800000是30分钟的毫秒数
          this.setData({
            count: 0,
          })
        } else {
          this.setData({
            count: 1800000 - ms,
          })
        }
      },
    })

    wx.getStorage({ //取订单数据
      key: 'useriInfo',
      success: e => {
        wx.login({
          success: res => {
            if (res.code) {
              e.data['nickname'] = e.data.nickName
              e.data['sex'] = e.data.gender
              e.data['headimgurl'] = e.data.avatarUrl
              console.log(e);
              this.kmLogin(res.code, e.data)
            }
          }
        })
      }
    })


    // this.reqPayType();
    // if (app.globalData.extraData.token && app.globalData.extraData.userCode && app.globalData.extraData.userAgent) {
    //   // if (1) {
    //   console.log('从卡盟小程序进入');
    //   this.setData({
    //     hasCard: true
    //   });
    //   this.reqPayType();
    // }
    // let that = this

    // function a(x) {
    //   that.kmLogin(x)
    // }
    // this.loginToGetPay(a)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() { //运行count_down函数，进行支付时间倒计时
    count_down(this);
  },


  /**
   * 请求余额汇总信息
   */
  reqPayType(userToken, userCode) {
    wx.request({
      url: app.globalData.url + '/api/shop/lmcard/getBalanceAll',
      data: {
        userToken,
        userCode,
        userAgent: 'Wx'
        // userToken: app.globalData.extraData.token,
        // userCode: app.globalData.extraData.userCode,
        // userAgent: app.globalData.extraData.userAgent
        // userToken: 'b45681ec23e44981b17db3b5544aafa4',
        // userCode: '026OK86AVsfKQvXd6o',
        // userAgent: 'Wx'
      },
      success: res => {
        wx.hideLoading();
        console.log('支付方式及余额', res);
        if (res.data.resultCode === 200) {
          var balance = res.data.dataList[2].balance; // 消费m卡余额
          var typeId = res.data.dataList[2].typeId; // 消费m卡余额类型
          var pointBalance = res.data.dataList[3].balance; // 消费m卡积分
          var pointTypeId = res.data.dataList[3].typeId; // 消费m卡积分类型
          if (balance === -1) { // 没有购买过M卡
            balance = 0;
          } else {
            balance = (balance * 0.01);
          }
          if (pointBalance === -1) {
            pointBalance = 0;
          }
          this.setData({
            'Method[1].items[0].balance': balance.toFixed(2),
            'Method[1].items[0].typeId': typeId,
            'Method[1].items[1].balance': pointBalance.toFixed(2),
            'Method[1].items[1].typeId': pointTypeId
          });
        } else if (res.data.resultCode === 403) { //登录已经失效,请重新登录
          wx.showModal({
            title: '温馨提示',
            content: '登录已失效，请返回‘六沐智慧便利店’重新登录',
            showCancel: false,
            confirmText: '确定',
            success: res => {
              if (res.confirm) {
                wx.navigateBackMiniProgram({
                  success: res => {
                    console.log('跳转成功', res);
                  }
                });
              }
            }
          })
        }
      },
      fail: res => {
        console.log('请求失败', res.errMsg);
      }
    });
  },


  /**
   * 展开/收起 —— 支付列表
   */
  catchShow(e) {
    let index = e.currentTarget.dataset.index;
    let show = 'Method[' + index + '].show';
    this.setData({
      [show]: !this.data.Method[index].show
    });
  },

  /**
   * 选择支付方式
   */
  catchSelect(e) {
    let index = e.currentTarget.dataset.index;
    let idx = e.currentTarget.dataset.idx;

    if (idx >= 0) { //点击展开的支付方式
      if (Number(this.data.Method[index].items[idx].balance) > Number(this.data.Sum)) { // 判断余额或积分，为0不允许选择
        let iCheck = 'Method[' + index + '].items[' + idx + '].check';
        this.setData({
          [iCheck]: true
        });
        this.data.Method.forEach((method, i) => { //将展开的其他支付方式全部设为不选择
          if (method.items) {
            method.items.forEach((elem, ind) => {
              if (ind != idx) {
                let itemCheck = 'Method[' + i + '].items[' + ind + '].check';
                this.setData({
                  [itemCheck]: false
                });
              } else {

              }
            });
          }
        });
        this.data.Method.forEach((method, k) => { //将其他一级支付方式设为不选择
          let mCheck = 'Method[' + k + '].check';
          this.setData({
            [mCheck]: false
          });
        });
      }
    } else { // 点击一级支付方式
      let methodCheck = 'Method[' + index + '].check';
      this.setData({
        [methodCheck]: true
      });

      this.data.Method.forEach((method, k) => { //将其他一级支付方式设为不选择
        if (k != index) {
          let mCheck = 'Method[' + k + '].check';
          this.setData({
            [mCheck]: false
          });
        }
      });

      this.data.Method.forEach((method, i) => { //将展开的支付方式全部设为不选择
        if (method.items) {
          method.items.forEach((elem, ind) => {
            let itemCheck = 'Method[' + i + '].items[' + ind + '].check';
            this.setData({
              [itemCheck]: false
            });
          });
        }
      });

    }
  },

  /**
   * 点击【确认支付】
   */
  getpay() {
    // if (this.data.hasCard) { // 从卡盟小程序进入
    if (this.data.Method[0].check) { //微信支付
      this.setData({
        isMPay: false
      });
      this.reqWxPay();
    } else {
      this.setData({
        isMPay: true
      });
      if (this.data.Method[1].items[0].check) {
        console.log('普卡支付');
        this.setData({
          paymentType: this.data.Method[1].items[0].typeId
        });
      } else if (this.data.Method[1].items[1].check) {
        console.log('普卡积分支付');
        this.setData({
          paymentType: this.data.Method[1].items[1].typeId
        });
      }

    }
    // } else {
    //   this.reqWxPay();
    // }
  },

  /**
   * 请求微信支付
   */
  reqWxPay() {
    wx.request({ //请求支付接口
      url: app.globalData.url + '/api/shop/lmcard/lmWxPay',
      data: {
        openid: app.globalData.openid,
        orderno: this.data.orderNo
      },
      success: res => {
        console.log('请求微信支付', res);
        if (res.data.resultCode == 200) {
          wx.requestPayment({
            'timeStamp': res.data.data.timeStamp,
            'nonceStr': res.data.data.nonce_str,
            'package': 'prepay_id=' + res.data.data.prepay_id,
            'signType': 'MD5',
            'paySign': res.data.data.paySign,
            'success': res => {
              wx.showToast({
                title: '支付成功',
                icon: 'success',
                duration: 2000
              })
              wx.redirectTo({
                url: '../success/success',
              })
            },
            'fail': res => {}
          })
        } else { //res.data.resultCode为601时，订单号有误
          wx.showToast({
            title: res.data.resultMsg,
            icon: 'none'
          })
        }
      },
      fail: res => {}
    })
  },

  /**
   * 请求M卡支付
   */
  reqGeneratePayment() {
    wx.showLoading({
      title: '',
      mask: true
    })
    wx.request({ // 生成预支付信息
      url: app.globalData.url + '/api/shop/lmcard/generatePayment',
      data: {
        orderno: this.data.orderNo,
        amount: this.data.Sum //支付金额
      },
      success: res => {
        console.log('M卡支付接口(校验生成预支付信息)', res);
        if (res.data.resultCode === 200) {
          let prepayNo = res.data.data.prepayNo; //预支付id
          let publicKey = res.data.data.publicKey; //RSA公钥
          let sign = res.data.data.sign; //签名
          let systemTime = res.data.systemTime; //生成预支付信息的时间，即支付时间
          let md5Value = md5.hexMd5(this.data.Value);

          let userPayInfo = {
            'userCode': this.data.userPayInfo.userCode,
            'userToken': this.data.userPayInfo.token,
            // 'userAgent': app.globalData.extraData.userAgent,
            // 'userToken': 'b45681ec23e44981b17db3b5544aafa4',
            // 'userCode': '026OK86AVsfKQvXd6o',
            'userAgent': 'Wx',
            'paymentPassword': md5Value,
            'paymentType': this.data.paymentType,
            'timestamp': systemTime,
            'prepayNo': prepayNo
          }
          let rsaUserPayInfo = this.RSAEncrypt(publicKey, userPayInfo);

          wx.request({ // 店铺是否有M卡活动
            url: app.globalData.url + '/api/shop/product/prodProduct/isDiscounts',
            data: {
              productIds: this.data.pidStr,
              shopId: this.data.shopid
            },
            success: res => {
              let discountAmount;
              if (res.data.code == 200) {
                wx.request({ // 店铺M卡折扣
                  url: app.globalData.url + '/api/shop/shopActivity/activity/getDiscountRatio',
                  data: {
                    shopId: this.data.shopid
                  },
                  success: res => {
                    if (res.data.code == 200) {
                      let discountAmount = res.data.data === 0 ? 0 : (parseFloat(res.data.Sum) * (1 - res.data.data) * 10).toFixed(2);
                      this.confirmPay(prepayNo, sign, rsaUserPayInfo, discountAmount);
                    }
                  }
                });
              } else {
                discountAmount = 0;
                this.confirmPay(prepayNo, sign, rsaUserPayInfo, discountAmount);
              }
            }
          })
        } else {
          wx.hideLoading();
        }
      }
    })
  },

  /**
   * 请求M卡支付
   */
  confirmPay(prepayNo, sign, rsaUserPayInfo, discountAmount) {
    wx.request({
      url: app.globalData.url + '/api/shop/lmcard/confirmPay',
      data: {
        prepayNo: prepayNo,
        sign: sign,
        timestamp: this.data.createTime,
        userPayInfo: rsaUserPayInfo,
        discountAmount: parseFloat(discountAmount), // 折扣金额
        orderNo: this.data.orderNo
      },
      success: res => {
        console.log('M卡支付接口', res);
        if (res.data.resultCode === 200) {
          this.setData({
            isMPay: false
          });
          wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          })
          wx.redirectTo({
            url: '../success/success',
          })
        } else if (res.data.resultCode == 518) { //支付密码错误
          this.setData({
            Value: null
          });
          wx.showToast({
            title: res.data.resultMsg,
            icon: 'none',
            success: res => {}
          })
        } else if (res.data.resultCode === 500) { //resultMsg: "M卡折扣已超过有效期"
          this.setData({
            isMPay: false
          });
          wx.showToast({
            title: res.data.resultMsg,
            icon: 'none'
          })
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data.resultMsg,
            icon: 'none',
            duration: 2000
          })

        }
      }
    })
  },

  /**
   * RSA加密方法
   */
  RSAEncrypt(publicKey, userPayInfo) {
    var encrypt_rsa = new RSA.RSAKey();
    encrypt_rsa = RSA.KEYUTIL.getKey('-----BEGIN PUBLIC KEY-----' + publicKey + '-----END PUBLIC KEY-----');
    var encStr = encrypt_rsa.encryptLong(JSON.stringify(userPayInfo)); //【加密字段长度不大于117】
    return encStr;
  },

  /**
   * 关闭密码输入框
   */
  bindCloseIpt() {
    this.setData({
      isMPay: false
    });
  },

  /**
   * 【密码输入框】输入事件，密码达到6位，验证密码，验证通过跳转页面，验证失败提示密码错误
   */
  bindInput(e) {
    this.setData({
      Value: e.detail.value,
    });
    if (this.data.Value.length === 6) {
      this.reqGeneratePayment();
    }
  },

  Tap() {
    this.setData({
      isFocus: true,
    });
  },

  /**
   * 51,所有余额接口
   */
  getWXappletLogin(code, userInfo, callback) {
    wx.getStorage({
      key: 'store',
      success: function (res) {

        const userAgent = res.data.userAgent
        wx.login({
          success: res => {
            if (res.code) {
              wx.request({
                url: app.globalData.url + '/api/shop/lmcard/getWXappletLogin',
                data: {
                  code,
                  userInfo,
                  userAgent: userAgent
                },
                success: res => {
                  console.log("卡盟信息", res);

                  callback()
                }
              })
            }
          }
        })

      }
    })



  },


  /**
   * 【登录--1.小程序wx.login登录】
   */
  loginToGetPay(callback) {
    wx.login({
      success: res => {
        if (res.code) {
          console.log("code", res);

          const rcode = res.code
          wx.showLoading({
            title: '',
            mask: true
          })
          wx.getStorage({
            key: 'useriInfo',
            success: a => {
              console.log("用户信息", a);
              callback(rcode)
            }
          })

          // wx.request({
          //   url: app.globalData.url + '/api/shop/sns/wx/mpSessionKey',
          //   data: {
          //     code: res.code,
          //   },
          //   success: res => { // 登录成功，则将返回的数据openId, sessionKey, unionId赋值给全局数据
          //     console.log('小程序wx.login登录', res);
          //     if (res.data.code === 200) {
          //       const userInfo = res.data.wxuser
          //       wx.getStorage({
          //         key: 'store',
          //         success: function (res) {
          //           wx.login({
          //             success: d => {
          //               if (d.code) {
          //                 let p = {
          //                   code: d.code,
          //                   userInfo: userInfo,
          //                   userAgent: "Wx"
          //                 }
          //                 console.log("参数", p)

          //                 // wx.request({
          //                 //   url: app.globalData.url + '/api/shop/lmcard/getWXappletLogin',
          //                 //   data: {
          //                 //     code: d.code,
          //                 //     userInfo: userInfo,
          //                 //     userAgent: "Wx"
          //                 //   },
          //                 //   success: d => {
          //                 //     console.log("卡盟信息", res);

          //                 //     // callback()
          //                 //   }
          //                 // })
          //               }
          //             }
          //           })

          //         }
          //       })
          //     } else {
          //       wx.hideLoading();
          //     }
          //   }
          // });
        } else {
          wx.hideLoading();
        }
      }
    });
  },


  /**
   * 卡盟登录
   */


  kmLogin(code, userInfo) {
    let a = {
      code,
      userAgent: "Wx"
    }
    let b = userInfo
    let c = {}
    for (let attr in a) {
      c[attr] = a[attr];
    }
    for (let attr in b) {
      c[attr] = b[attr];
    }

    wx.request({
      // url: app.globalData.url + '/api/shop/lmcard/getWXappletLogin',
      url: app.globalData.KMurl + '/wxapplet/csappletlogin',
      data: c,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: res => {
        console.log("卡盟信息", res);
        this.data.userPayInfo = res.data.data
        this.reqPayType(res.data.data.token, res.data.data.userCode);
        // wx.request({
        //     url: app.globalData.url + '/api/shop/lmcard/getBalanceAll',
        //     data: {
        //         userToken: r.data.data.token,
        //         userCode: r.data.data.userCode,
        //         // userAgent: app.globalData.extraData.userAgent
        //         // userToken: 'b45681ec23e44981b17db3b5544aafa4',
        //         // userCode: '026OK86AVsfKQvXd6o',
        //         userAgent: 'Wx'
        //     },
        //     success: d => {
        //         console.log("金额", d);

        //     }
        // })

      }
    })
  }
})