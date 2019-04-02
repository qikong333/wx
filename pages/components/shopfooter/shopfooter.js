// pages/confirm/confirm.js
const reLogin = require('../../../utils/reLogin.js');
// const util = require('../../utils/util.js');
const app = getApp()

Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    Sum: {
      type: Number,
      value: 0,
    },
    Num: {
      type: Number,
      value: 0,
    },

    products: {
      type: Array,
      value: [],
    }
  },
  data: {
    // 这里是一些组件内部数据
    name: '',
    shopid: '',
    saddress: '',
    passIdStr: '',
    tokenid: '',
    userAgent: '',
    cart: [],
    page: 0, // 购物车当前加载的页数
    size: 1999, // 购物车一次加载的条数
    stuta: false,
  },
  lifetimes: {
    created() {
      try {
        const storeData = wx.getStorageSync('store'); // 取店铺数据
        const logininfoData = wx.getStorageSync('logininfo'); // 取登录数据
        if (storeData && logininfoData) {
          this.setData({
            name: storeData.name,
            shopid: storeData.shopid,
            saddress: storeData.address,
            passIdStr: logininfoData.passIdStr,
            tokenid: logininfoData.tokenid,
            userAgent: logininfoData.userAgent
          });
        }
      } catch (e) {}
    }
  },
  methods: {
    // 这里是一个自定义方法
    customMethod: function () {
      console.log('customMethod')
    },

    /**
     * 跳转到购物车
     */
    tocart() {
      wx.navigateTo({
        url: '../cart/cart'
      });
    },
    // /**
    //  * 【去结算】
    //  */
    // bindConfirm() {

    //   console.log(this.data.products)
    //   let order = this.data.products.map(a => ({
    //     shopcarId: a.car.shopcarId, // 商品在购物车中的id
    //     ctype: a.prod.ctype, // 商品一级分类
    //     pid: a.prod.pid, // 商品id
    //     itemid: a.prod.itemid, // 商品编码
    //     pcode: a.prod.pcode, // 产品编码
    //     image: a.prod.mainpic, // 图片
    //     name: a.prod.name, // 产品名
    //     ctitle: a.prod.ctitle, // 产品副标题
    //     price: a.prod.price, // 产品价格
    //     stocknum: a.prod.stocknum, // 产品库存
    //     productQty: a.car.productQty, // 产品数量
    //     // check: a.prod.check // 产品是否被选中
    //   }))
    //   console.log('参数', {
    //     totalPrice: parseFloat(this.data.Sum),
    //     products: order
    //   })
    //   wx.setStorage({
    //     key: 'orderList',
    //     data: {
    //       totalPrice: parseFloat(this.data.Sum),
    //       products: order
    //     },
    //     success: res => {
    //       wx.navigateTo({
    //         url: '../confirm/confirm'
    //       })
    //     }
    //   });
    // },

    /**
     * 请求购物车数据
     */
    bindConfirm() {
      if (!this.data.Sum > 0) {
        return false
      }


      this.data.cart = []
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
            // var sum = 0; // 商品总价
            for (let i = 0; i < res.data.rows.length; i++) { // 遍历购物车商品计算商品总数及总价
              var car = res.data.rows[i].car;
              var prod = res.data.rows[i].prod;
              var index = i + this.data.page * this.data.size;
              // 商品价格使用优先级（活动价 > 折扣价 > 原价）
              usePrice = prod.aprice ? prod.aprice : prod.sprice ? prod.sprice : prod.price;
              // sum += usePrice * car.productQty;

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
              // if (stocknum > 0) {
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
                [check]: true, // 默认选中
                [isUseActivity]: prod.aprice ? 1 : 0,
                [shopActivityId]: prod.aprice ? prod.actid : ""
              });
              // }

            }
            // this.setData({
            //   Sum: sum.toFixed(2)
            // });
            let order = [];
            this.data.cart.forEach((elem, i) => {
              if (elem['stocknum'] > 0) {

                order.push(elem);
              } else {
                this.data.stuta = true
              }
            });

            let that = this
            if (!order.length > 0) {
              wx.showModal({
                title: '温馨提示',
                content: '部分商品没有库存或已下架，请问是否前往购物车清理？',
                confirmText: '确定',
                cancelText: '取消',
                success: res => {
                  if (res.confirm) {
                    wx.navigateTo({
                      url: '../cart/cart'
                    })
                  } else {
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
                  }
                }
              });
            } else {
              if (this.data.stuta) {
                wx.showToast({
                  title: '部分商品没有库存或已下架，可前往购物车查看',
                  icon: 'none',
                  duration: 5000
                })
              }
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
            }


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
  },

  toConfirm(Sum, order) {
    console.log('参数', {
      totalPrice: parseFloat(Sum),
      products: order
    })
    wx.navigateTo({
      url: '../confirm/confirm?params=' + JSON.stringify({
        totalPrice: parseFloat(Sum),
        products: order
      })
    })
  },

  ok() {
    wx.showModal({
      title: '温馨提示',
      content: '你选购的商品总额不满足配送条件只能导店自提，是否继续结算？',
      confirmText: '继续结算',
      cancelText: '去凑单',
      success: res => {

      },
      fail: r => false
    });
  }

})