// pages/cart/cart.js
//获取应用实例
var reLogin = require('../../utils/reLogin.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '', // 店铺名称
    shopid: null, // 店铺id
    passIdStr: '', //通行证ID
    tokenid: '', //登陆凭证
    userAgent: '', //设备信息
    height: 0, // 设备高度
    page: 0, // 购物车当前加载的页数
    size: 1999, // 购物车一次加载的条数
    cart: [], // 购物车商品列表
    Sum: 0, //购物车商品总价
    Tip: 0, //起送价
    items: [], // 购物车库存不足的商品数组
    checkAll: true, //是否选中全部商品
    isEdit: false, // 是否点击编辑
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
    this.setData({
      height: wx.getSystemInfoSync().windowHeight
    });
    wx.showLoading({
      title: '',
    })
    try {
      const storeData = wx.getStorageSync('store');
      const logininfoData = wx.getStorageSync('logininfo');
      if (storeData) {
        this.setData({
          name: storeData.name,
          shopid: storeData.shopid
        });
      }
      if (logininfoData) {
        this.setData({
          passIdStr: logininfoData.passIdStr,
          tokenid: logininfoData.tokenid,
          userAgent: logininfoData.userAgent
        });
      }
    } catch (e) {
      console.log(e);
    }
    wx.getStorage({ // 取起送价
      key: 'tip',
      success: res => {
        this.setData({
          Tip: res.data,
        });
      }
    });

  },

  onShow() {
    this.reqPack();
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onHide() { //离开该页面返回确认订单页时，存储backstatus数据状态为1
    wx.setStorage({
      key: 'backstatus',
      data: 'cart'
    })
  },

  /**
   * 请求购物车数据
   */
  reqPack() {
    this.setData({
      cart: null,
      Sum: 0
    });
    wx.request({
      url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/list',
      data: {
        tokenid: this.data.tokenid, //  与会话是否失效关联
        userAgent: this.data.userAgent,
        shopid: this.data.shopid,
        page: this.data.page,
        size: this.data.size // 一次请求的商品种类
      },
      success: res => {
        wx.hideLoading();
        console.log('购物车信息', res);
        if (res.data.code === 200) {
          var usePrice = 0; // 商品使用的价格
          var sum = 0; // 商品总价
          for (let i = 0; i < res.data.rows.length; i++) { // 遍历购物车商品计算商品总数及总价
            var car = res.data.rows[i].car;
            var prod = res.data.rows[i].prod;
            var index = i + this.data.page * this.data.size;
            // 商品价格使用优先级（活动价 > 折扣价 > 原价）
            usePrice = prod.aprice ? prod.aprice : prod.sprice ? prod.sprice : prod.price;
            if (prod.stocknum > 0) {
              sum += usePrice * car.productQty;
            }


            // 购物车列表
            var shopcarId = 'cart[' + index + '].shopcarId'; // 商品在购物车中的id
            var ctype = 'cart[' + index + '].ctype'; // 商品一级分类
            var pid = 'cart[' + index + '].pid'; // 商品id
            var itemid = 'cart[' + index + '].itemid'; // 商品编码
            var pcode = 'cart[' + index + '].pcode'; // 产品编码
            var image = 'cart[' + index + '].image'; // 图片
            var name = 'cart[' + index + '].name'; // 产品名
            var ctitle = 'cart[' + index + '].ctitle'; // 产品副标题
            var price = 'cart[' + index + '].price'; // 产品价格
            var stocknum = 'cart[' + index + '].stocknum'; // 产品库存
            var productQty = 'cart[' + index + '].productQty'; // 产品数量
            var check = 'cart[' + index + '].check'; // 产品是否被选中
            var isUseActivity = 'cart[' + index + '].isUseActivity'; //  
            var shopActivityId = 'cart[' + index + '].shopActivityId'; //  
            let isCheck
            console.log(prod.stocknum);

            if (prod.stocknum > 0) {
              isCheck = true
            } else {
              isCheck = false
            }
            this.setData({
              [shopcarId]: car.shopcarId,
              [ctype]: prod.ctype.substr(0, 2),
              [pid]: prod.pid,
              [itemid]: car.itemid,
              [pcode]: prod.pcode,
              [image]: prod.mainpic ? prod.mainpic : '../../images/item.png',
              [name]: prod.name,
              [ctitle]: prod.ctitle,
              [price]: usePrice,
              [stocknum]: prod.stocknum,
              [productQty]: car.productQty,
              [check]: isCheck,
              [isUseActivity]: prod.aprice ? 1 : 0,
              [shopActivityId]: prod.aprice ? prod.actid : ""
            });

          }
          console.log(this.data.cart);

          this.setData({
            Sum: sum.toFixed(2)
          });
        } else if (res.data.code === 20019) { // 会话失效，重新登录
          var that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.reqPack();
          }
          reLogin.login(dealFunc);
        }
      }
    });
  },

  /**
   * 图片加载异常时触发【如：图片url出错导致的图片加载失败】
   */
  bindImgLoadError(e) {
    let index = e.currentTarget.dataset.index;
    let image = 'cart[' + index + '].image';
    this.setData({
      [image]: '../../images/item.png'
    });
  },

  /**
   * 向购物车【+】商品
   */
  catchAddNum(e) {
    wx.showLoading({
      title: '',
      mask: true
    })
    var index = e.currentTarget.dataset.index;
    var itemid = this.data.cart[index].itemid; // 商品编码
    var proType = this.data.cart[index].ctype; // 产品一级分类
    var stocknum = this.data.cart[index].stocknum; // 库存
    if (stocknum > 0) {
      if (stocknum > this.data.cart[index].productQty) {
        wx.request({
          method: 'POST',
          url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/add',
          data: {
            tokenid: this.data.tokenid,
            userAgent: this.data.userAgent,
            itemid: itemid, // 商品编码
            productQty: 1, // 商品数量
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success: res => {
            if (res.data.code === 200) {
              // 1.更新商品的数量
              var productQty = 'cart[' + index + '].productQty';
              this.setData({
                [productQty]: this.data.cart[index].productQty + 1
              });
              // 2.更新购物车的商品总价
              var check = 'cart[' + index + '].check';
              if (this.data.cart[index].check) { // 当前商品是被选中的状态
                this.setData({
                  Sum: (parseFloat(this.data.Sum) + this.data.cart[index].price).toFixed(2)
                });
              } else { // 当前商品是未被选中的状态
                this.setData({
                  Sum: (parseFloat(this.data.Sum) + this.data.cart[index].price * this.data.cart[index].productQty).toFixed(2),
                  [check]: true
                });
              }
            } else if (res.data.code === 20020) { // 会话失效，重新登录
              var that = this;

              function dealFunc(res) {
                that.setData({
                  tokenid: res.data.tokenid,
                  userAgent: res.data.userAgent,
                  passIdStr: res.data.member.passIdStr
                })
                that.catchAddNum(e);
              }
              reLogin.login(dealFunc);
            }
            wx.hideLoading();
          }
        });
      } else {
        wx.showToast({
          title: '超出库存',
          icon: 'none'
        });
      }
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      });
    }
  },

  /**
   * 向购物车【-】商品, 商品减到0时，选择按钮设置为不选中状态
   */
  catchSubNum(e) {
    wx.showLoading({
      title: '',
      mask: true
    })
    var index = e.currentTarget.dataset.index;
    var itemid = this.data.cart[index].itemid;
    if (this.data.cart[index].productQty != 1) {
      wx.request({
        method: 'POST',
        url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/add?method=decrease',
        data: {
          tokenid: this.data.tokenid,
          userAgent: this.data.userAgent,
          itemid: itemid, // 商品编码
          productQty: 1, // 商品数量
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: res => {
          if (res.data.code === 200) {
            console.log('减少成功', res);
            // 1.更新商品选中的数量
            var productQty = 'cart[' + index + '].productQty';
            this.setData({
              [productQty]: this.data.cart[index].productQty - 1
            });
            // 2.更新购物车的商品总数及总价
            if (this.data.cart[index].check) {
              this.setData({
                Sum: (parseFloat(this.data.Sum) - this.data.cart[index].price).toFixed(2)
              });
            }
          } else if (res.data.code === 20020) { // 会话失效，重新登录
            var that = this;

            function dealFunc(res) {
              that.setData({
                tokenid: res.data.tokenid,
                userAgent: res.data.userAgent,
                passIdStr: res.data.member.passIdStr
              })
              that.catchSubNum(e);
            }
            reLogin.login(dealFunc);
          }
          wx.hideLoading();
        }
      });
    } else {
      wx.showToast({
        title: '该商品不能再减少了~',
        icon: 'none'
      })
    }
  },

  /**
   * 点击【商品选中按钮】，更改按钮状态，重新计算价格
   */
  catchCheckIn(e) {
    let index = e.currentTarget.dataset.index;
    let cartItem = this.data.cart[index];
    let itemid = cartItem.itemid;
    let check = 'cart[' + index + '].check';
    console.log(cartItem["stocknum"], this.data.isEdit);

    if (!(cartItem["stocknum"] > 0) && this.data.isEdit == false) {
      return
    }
    this.setData({
      [check]: !cartItem.check
    });
    let changePrice = cartItem.price * cartItem.productQty;
    if (cartItem.check) {
      this.setData({
        Sum: (parseFloat(this.data.Sum) + changePrice).toFixed(2)
      });
    } else {
      this.setData({
        Sum: (parseFloat(this.data.Sum) - changePrice).toFixed(2)
      });
    }
    // 改变全选按钮的选中状态
    let all = true;
    for (let i = 0; i < this.data.cart.length; i++) {
      if (!this.data.cart[i].check && this.data.cart[i].productQty > 0) {
        all = false;
        break;
      }
    }
    if (all) {
      this.setData({
        checkAll: true
      });
    } else {
      this.setData({
        checkAll: false
      });
    }
  },

  /**
   * 点击【全选按钮】，更改全部商品为选中或取消状态，并重新计算数量和价格
   */
  catchCheckAll() {
    // 1.设置全选或全不选
    this.setData({
      checkAll: !this.data.checkAll
    });
    if (this.data.checkAll) { // 全不选-->全选
      let newSum = parseFloat(this.data.Sum);
      for (let i = 0; i < this.data.cart.length; i++) {
        let check = 'cart[' + i + '].check';
        if (!this.data.cart[i].check && this.data.cart[i].stocknum > 0) { // 没有被选中的商品
          // if (!this.data.cart[i].check) { // 没有被选中的商品
          this.setData({
            [check]: true
          });
          newSum = newSum + this.data.cart[i].price * this.data.cart[i].productQty;
        }
      }
      this.setData({
        Sum: newSum.toFixed(2)
      });
    } else { // 全选-->全不选
      this.setData({
        Sum: (0).toFixed(2)
      });
      for (let i = 0; i < this.data.cart.length; i++) {
        var check = 'cart[' + i + '].check';
        this.setData({
          [check]: false
        });
      }
    }
  },

  /**
   * 【去结算】
   */
  bindConfirm() {
    let order = [];
    this.data.cart.forEach((elem, i) => {
      if (elem.check) {
        order.push(elem);
      }
    });
    console.log('参数', {
      totalPrice: parseFloat(this.data.Sum),
      products: order
    })
    wx.navigateTo({
      url: '../confirm/confirm?params=' + JSON.stringify({
        totalPrice: parseFloat(this.data.Sum),
        products: order
      })
    })

    // wx.setStorage({
    //   key: 'orderList',
    //   data: {
    //     totalPrice: parseFloat(this.data.Sum),
    //     products: order
    //   },
    //   success: res => {
    //     wx.navigateTo({
    //       url: '../confirm/confirm?params='+JSON.stringify(this.data.Sum)
    //     })
    //   }
    // });


    // let itemArr = [];
    // for (let i = 0; i < this.data.cart.length; i++) {
    //   wx.request({  // 请求商品库存接口35，获取购物车内商品库存
    //     url: app.globalData.url + '/api/shop/product/shopItem/getItemByShopIdAndItemId',
    //     data: {
    //       shopId: this.data.shopid,
    //       itemId: this.data.cart[i].itemid
    //     },
    //     success: res => {
    //       let productQty = this.data.cart[i].productQty; // 购物车某商品数量
    //       let occupied = res.data.data.occupied; // 被占用库存
    //       let available = res.data.data.available; // 可用库存
    //       let stocknum = res.data.data.stocknum; // 总库存
    //       if (occupied === 0) { // 被占用库存为0，直接使用available判断库存
    //         if (productQty > available) {
    //           itemArr.push(this.data.cart[i].name);
    //         }
    //       } else if (occupied > 0) { // 被占用库存>0，使用【occupied+购物车提交数量】与stockNum总库存进行比较
    //         let totalNum = productQty + occupied;
    //         if (totalNum > stocknum) {
    //           itemArr.push(this.data.cart[i].name);
    //         }
    //       }
    //       if (i === this.data.cart.length - 1) { // 最后一次循环，将库存不足的商品赋值到items数组
    //         this.setData({
    //           items: itemArr
    //         });
    //         if (this.data.items.length) {
    //           wx.showModal({
    //             title: '温馨提示',
    //             content: '商品"' + this.data.items + '"库存不足，请修改购买数量',
    //             showCancel: false
    //           });
    //         } else {
    //           let order = [];
    //           this.data.cart.forEach((elem,i) => {
    //             if (elem.check){
    //               order.push(elem);
    //             }
    //           });
    //           wx.setStorage({
    //             key: 'orderData',
    //             data: {
    //               totalPrice: parseFloat(this.data.Sum),
    //               products: order
    //             },
    //             success: res => {
    //               wx.navigateTo({
    //                 url: '../confirm/confirm'
    //               })
    //             }
    //           });
    //         }
    //       }
    //     }
    //   })
    // }
  },

  /**
   * 【编辑】
   */
  bindEdit(e) {
    this.setData({
      isEdit: true
    });
  },

  /**
   * 【取消编辑】
   */
  bindCancel(e) {
    for (let i = 0; i < this.data.cart.length; i++) { // 遍历购物车商品计算商品总数及总价
      var index = i + this.data.page * this.data.size;
      // 商品价格使用优先级（活动价 > 折扣价 > 原价）

      // 购物车列表
      var check = 'cart[' + index + '].check'; // 产品是否被选中
      let isCheck = this.data.cart[index].check
      if (!this.data.cart[index].stocknum > 0) {
        isCheck = false
      } else {

      }
      this.setData({
        [check]: isCheck
      });

    }

    this.setData({
      isEdit: false
    });
  },

  /**
   * 【删除】
   */
  bindDelete(e) {
    wx.showModal({
      title: '',
      content: '确定要从购物车删除该商品吗',
      confirmText: '删除',
      success: res => {
        if (res.confirm) {
          for (let i = 0; i < this.data.cart.length; i++) {
            let cartItem = this.data.cart[i];
            if (cartItem.check) {
              let itemid = cartItem.itemid;
              this.reqDeleteProduct(i, itemid);
            }
          }
        } else if (res.cancel) {
          this.setData({
            isEdit: false
          });
        }
      }
    })
  },

  /**
   * 【请求-删除购物车】
   */
  reqDeleteProduct(i, itemid) {
    let cartItem = this.data.cart[i];
    wx.request({
      method: 'POST',
      url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/delete/' + cartItem.shopcarId,
      data: {
        tokenid: this.data.tokenid,
        userAgent: this.data.userAgent
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: res => {
        console.log(res);
        if (res.data.code === 200) {
          // 重新计算总价，关闭编辑栏，从购物车列表中删除该商品
          this.data.cart.forEach((elem, index, ) => {
            if (elem.itemid === itemid) {
              this.data.cart.splice(index, 1);
            }
          });
          this.setData({
            cart: this.data.cart,
            Sum: (parseFloat(this.data.Sum) - cartItem.price * cartItem.productQty).toFixed(2),
            isEdit: false
          });
        } else if (res.data.code === 20020) { // 会话失效，重新登录
          var that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.reqDeleteProduct(i);
          }
          reLogin.login(dealFunc);
        }
      }
    });
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