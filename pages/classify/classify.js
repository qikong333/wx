// pages/classify/classify.js
let reLogin = require('../../utils/reLogin.js');
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    passIdStr: '',
    tokenid: '',
    userAgent: '',
    cart: [], // 购物车商品列表
    hasLoadPack: false, // 是否已请求过购物车信息
    HasItem: true, // 门店是否有商品
    shopid: '', // 门店ID
    name: '', // 门店名称
    swiper: { // banner滑动导航组件属性
      imgUrls: [],
      indicatorDots: true,
      autoplay: true,
      circular: true,
      interval: 5000,
      duration: 1000
    },
    coupon: false, // 是否显示优惠券列表
    draw: [], // 优惠券列表
    code: 0, // 默认打开时显示的商品类号
    page: 0, // 默认打开时显示的商品页数
    size: 10, // 每页加载商品数量
    last: '', // 商品列表是否是到底部
    MainCurrent: 0, // 特殊分类选中的序号（0-热销，1-促销，与main数组下标对应）
    MenuCurrent: null, // 普通商品分类选中的序号(与渲染的列表下标对应)
    KindCurrent: 0, // 二级分类选中的序号
    Num: 0, // 购物车商品总数
    Sum: 0, // 购物车商品总价
    Tip: 0, // 起送价
    show: 0, // 是否显示商品详情
    array: 0, // 显示商品详情时，在商品详情页该物品的序号
    main: [ // 特殊分类详细属性
      // {
      //   show: true,
      //   name: '专题',
      // }, 
      {
        show: '',
        name: '热销',
        image: '../../images/hotsale.png'
      }, {
        show: '',
        name: '促销',
        image: '../../images/prosale.png'
      }
    ],
    // acty: [],  // 专题页列表
    // appe: 0,   // 是否显示专题页
    menu: [], // 物品一级分类列表
    kind: [], // 物品二级分类列表
    hots: [], // 热销商品列表
    pros: [], // 促销商品列表
    list: [], // [数组类型]当前显示的详细商品列表
    mess: {}, // 商品详情页---物品的属性
    saddress: '', // 商品详情页---门店地址
    sphone: '0769-21662613', // 商品详情页---门店电话
    carProductList: [], // 购物车商品列表
    openTime: '',
    couponList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    var that = this
    wx.getStorage({
      key: 'store',
      success: function (res) {
        that.setData({
          openTime: res.data.opentime
        })

      }
    })

    this.reqTransportFee() // 配送距离
    this.GetListBanner(); // banner轮播图
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

    wx.showLoading({
      title: '加载中',
      mask: true
    });
    this.GetMenu(); // 获取菜单
    this.GetTransportTips(); // 请求起送价
    this.GetCoupon2() // 领取优惠券 

    // wx.request({  // 请求专题页[暂无该需求]
    //   url: app.globalData.url + '/api/shop/type/shopIndexType/listAllType', 
    //   data: {
    //   },
    //   header: {
    //     'content-type': 'application/json' // 默认值
    //   },
    //   success: res => {
    //     for (let i = 0; i < res.data.data.length; i++){
    //       let image = "acty[" + i + "].image";
    //       let typeid = "acty[" + i + "].typeid";
    //       this.setData({
    //         [typeid]: res.data.data[i].id,
    //         [image]: res.data.data[i].picUrlView
    //       })
    //     }
    //   }
    // })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() { //从其他页面返回本页时，获取更新后的购物车数据并展示
    wx.hideShareMenu();
    if (this.data.list.length > 0) {
      this.GetPack(); // 请求购物车数据
      // wx.getStorage({
      //   key: 'logininfo',
      //   success: res => {
      //     this.setData({
      //       passIdStr: res.data.passIdStr,
      //       tokenid: res.data.tokenid,
      //       userAgent: res.data.userAgent
      //     });
      //   }
      // });
    }
  },

  /**
   * 请求【轮播图】
   */
  GetListBanner() {
    wx.request({
      url: app.globalData.url + '/api/shop/banner/shopBanner/listBanner',
      data: {
        showType: 0,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: res => {
        for (let i = 0; i < res.data.data.length; i++) {
          let image = "swiper.imgUrls[" + i + "]";
          this.setData({
            [image]: res.data.data[i].bannerView
          })
        }
      }
    });
  },

  /**
   * 请求【商品分类】接口2，获取商品【一级分类】和【二级分类】
   */
  GetMenu: function () {
    wx.request({
      url: app.globalData.url + '/api/shop/home/product/' + this.data.shopid,
      data: {},
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: res => {
        console.log('请求商品分类', res);
        if (res.data.categoryItem && res.data.categoryItem.length) { // 门店有商品
          this.setData({
            HasItem: true
          })
          for (let i = 0; i < res.data.categoryItem.length; i++) { // 一级分类
            let name = "menu[" + i + "].name";
            let code = "menu[" + i + "].code";
            let mark = "menu[" + i + "].mark";
            this.setData({
              [name]: res.data.categoryItem[i].name,
              [code]: res.data.categoryItem[i].code,
              [mark]: 0,
            })
            for (let j = 0; j < res.data.categoryItem[i].items.length; j++) { // 二级分类
              let name = "kind[" + i + "][" + j + "].name";
              let code = "kind[" + i + "][" + j + "].code";
              this.setData({
                [name]: res.data.categoryItem[i].items[j].name,
                [code]: res.data.categoryItem[i].items[j].code,
              })
            }
          }
          if (res.data.categoryItem[0].items[0]) { // 第一个一级分类有二级分类
            this.setData({
              code: res.data.categoryItem[0].items[0].code
            });
          } else { // 第一个一级分类无二级分类
            this.setData({
              code: res.data.categoryItem[0].code
            });
          }
          this.GetHotS(); // 请求热销
        } else { // 门店无商品
          this.setData({
            HasItem: false,
          })
          wx.hideLoading();
        }
      }
    })
  },

  /**
   * 请求【热销】商品接口30
   */
  GetHotS: function () {
    wx.request({
      url: app.globalData.url + '/api/shop/product/shopItem/listHotItem',
      data: {
        shopId: this.data.shopid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: res => {
        console.log('请求热销', res);
        if (res.data.code == 200) {
          this.setData({
            'main[0].show': true
          })
          for (let k = 0; k < res.data.data.length; k++) {
            let kData = res.data.data[k];

            // 商品价格使用优先级（活动价 > 折扣价 > 原价）
            let usePrice = kData.aprice ? kData.aprice : kData.sprice ? kData.sprice : kData.price;

            let image = "hots[" + k + "].image";
            let name = "hots[" + k + "].name";
            let size = "hots[" + k + "].size";
            let price = "hots[" + k + "].price";
            let num = "hots[" + k + "].num";
            let pcode = "hots[" + k + "].pcode";
            let ctype = "hots[" + k + "].ctype";
            let itemid = "hots[" + k + "].itemid";
            let pid = "hots[" + k + "].pid";
            let stock = "hots[" + k + "].stock";

            this.setData({
              [image]: kData.mainpic ? kData.mainpic : '../../images/item.png',
              [name]: kData.name,
              [size]: kData.ctitle,
              [price]: usePrice,
              [num]: 0,
              [pcode]: kData.pcode,
              [ctype]: kData.ctype,
              [itemid]: kData.itemid,
              [pid]: kData.pid,
              [stock]: kData.stocknum,
            })
          }
          this.setData({
            list: this.data.hots
          });
          this.GetProS(); // 请求促销
        } else if (res.data.code === 201) { // 没有热销产品
          this.GetProS(); // 请求促销
        } else {
          this.setData({
            'main[0].show': false
          });
          wx.hideLoading({
            success: () => {
              wx.showToast({
                title: '数据加载失败，请重新获取！',
                icon: 'none'
              });
            }
          });
        }
      }
    })
  },

  /**
   * 请求【促销】商品接口28
   */
  GetProS: function () {
    wx.request({
      url: app.globalData.url + '/api/shop/home/list/recommend/' + this.data.shopid,
      data: {
        'type': 0,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: res => {
        console.log('请求促销', res);
        if (res.data.code === 200) {
          if (res.data.data) { // 可能有促销产品
            for (let j = 0; j < res.data.data.length; j++) {
              // 促销分类下的二级分类
              let sname = "comm[" + j + "].name";
              let id = "comm[" + j + "].id";
              this.setData({
                [sname]: res.data.data[j].name,
                [id]: res.data.data[j].id,
              })
              if (res.data.data[j].productInfoPage.content.length > 0) { // 有促销商品
                this.setData({
                  'main[1].show': true
                });
                for (let k = 0; k < res.data.data[j].productInfoPage.content.length; k++) {
                  console.log('有商品');
                  let jkData = res.data.data[j].productInfoPage.content[k];

                  // 商品价格使用优先级（活动价 > 折扣价 > 原价）
                  let usePrice = jkData.aprice ? jkData.aprice : jkData.sprice ? jkData.sprice : jkData.price;

                  let image = "pros[" + j + "][" + k + "].image";
                  let name = "pros[" + j + "][" + k + "].name";
                  let size = "pros[" + j + "][" + k + "].size";
                  let price = "pros[" + j + "][" + k + "].price";
                  let oprice = "pros[" + j + "][" + k + "].oprice";
                  let num = "pros[" + j + "][" + k + "].num";
                  let pcode = "pros[" + j + "][" + k + "].pcode";
                  let ctype = "pros[" + j + "][" + k + "].ctype";
                  let itemid = "pros[" + j + "][" + k + "].itemid";
                  let pid = "pros[" + j + "][" + k + "].pid";
                  let stock = "pros[" + j + "][" + k + "].stock";

                  this.setData({
                    [image]: jkData.mainpic ? jkData.mainpic : '../../images/item.png',
                    [name]: jkData.name,
                    [size]: jkData.ctitle,
                    [price]: usePrice,
                    [oprice]: jkData.sprice,
                    [num]: 0,
                    [pcode]: jkData.pcode,
                    [ctype]: jkData.ctype,
                    [itemid]: jkData.itemid,
                    [pid]: jkData.pid,
                    [stock]: jkData.stocknum,
                  })
                }
              } else {
                this.setData({
                  'main[1].show': false
                });
                if (this.data.hots <= 0 && this.data.pros <= 0) { // 无热销、促销，显示普通分类下的第一个商品列表
                  this.GetList();
                } else { // 右侧商品列表list不为空，请求购物车信息
                  this.GetPack();
                  this.setData({ // 标记请求过购物车
                    hasLoadPack: true
                  });
                }
              }
            }
            if (this.data.hots <= 0) { // 无热销商品
              console.log('右侧为促销商品列表');
              this.setData({
                list: this.data.pros
              });
            }
            this.GetPack();
            this.setData({ // 标记已请求过购物车
              hasLoadPack: true
            });
          } else { // 无促销商品
            this.setData({
              'main[1].show': false
            })
            if (this.data.hots <= 0 && this.data.pros <= 0) { // 无热销、促销，显示普通分类下的第一个商品列表
              this.setData({ // 第一个一级分类被选中
                MenuCurrent: 0
              });
              this.GetList();
            } else { // 右侧商品列表list不为空，请求购物车信息
              this.GetPack();
              this.setData({ // 标记请求过购物车
                hasLoadPack: true
              });
            }
          }
        } else {
          wx.hideLoading({
            success: () => {
              wx.showToast({
                title: '数据加载失败，请重新获取！',
                icon: 'none'
              });
            }
          });
        }
      }
    })
  },

  /**
   * 请求【分类下的商品】接口3
   */
  GetList: function () {
    let currentPage = this.data.page;
    let pageSize = this.data.size;
    wx.request({
      url: app.globalData.url + '/api/shop/home/list/' + this.data.shopid,
      data: {
        code: this.data.code, //商品类号
        page: currentPage, //当前页
        size: pageSize //每页加载数量
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: res => {
        if (res.data.code === 200) {
          console.log('分类下的商品列表', res);
          this.setData({
            last: res.data.data.last
          })
          for (let k = 0; k < res.data.data.content.length; k++) {
            let ckData = res.data.data.content[k];
            let usePrice = 0;
            // 商品价格使用优先级（活动价 > 折扣价 > 原价）
            usePrice = ckData.aprice ? ckData.aprice : ckData.sprice ? ckData.sprice : ckData.price;

            let image = "list[" + (pageSize * currentPage + k) + "].image";
            let name = "list[" + (pageSize * currentPage + k) + "].name";
            let size = "list[" + (pageSize * currentPage + k) + "].size";
            let price = "list[" + (pageSize * currentPage + k) + "].price";
            let num = "list[" + (pageSize * currentPage + k) + "].num";
            let pcode = "list[" + (pageSize * currentPage + k) + "].pcode"; // 产品编码
            let ctype = "list[" + (pageSize * currentPage + k) + "].ctype"; // 产品分类
            let itemid = "list[" + (pageSize * currentPage + k) + "].itemid"; // 商品编码
            let pid = "list[" + (pageSize * currentPage + k) + "].pid"; // 产品主键
            let stock = "list[" + (pageSize * currentPage + k) + "].stock"; // 库存

            this.setData({
              [image]: ckData.mainpic ? ckData.mainpic : '../../images/item.png',
              [name]: ckData.name,
              [size]: ckData.ctitle,
              [price]: usePrice,
              [num]: 0,
              [pcode]: ckData.pcode,
              [ctype]: ckData.ctype,
              [itemid]: ckData.itemid,
              [pid]: ckData.pid,
              [stock]: ckData.stocknum,
            })
          }

          if (!this.data.hasLoadPack) { // 如果没有请求过购物车数据
            this.GetPack();
          } else {
            this.matchList(); // 更新商品列表中选择的商品数量
          }
          wx.hideLoading();
        } else {
          wx.hideLoading({
            success: () => {
              wx.showToast({
                title: '数据加载失败，请重新获取！',
                icon: 'none'
              });
            }
          });
        }
      }
    })
  },

  /**
   * 32.获取满XX元配送接口
   * 请求起送价格
   */
  GetTransportTips() {
    wx.request({
      url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/queryTransportTips',
      data: {
        shopId: this.data.shopid,
      },
      success: res => {
        console.log('起送价', res);
        if (res.data.code === 200) {
          this.setData({
            Tip: parseFloat(res.data.data)
          })
          wx.setStorage({
            key: 'tip',
            data: parseFloat(res.data.data)
          })
        } else {
          wx.showToast({
            title: '数据加载失败，请重新获取！',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 请求购物车数据
   */
  GetPack() {
    this.setData({ // 清空原有购物车数据再重新获取
      cart: []
    });
    wx.request({
      url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/list',
      data: {
        tokenid: this.data.tokenid, //  与会话是否失效关联
        userAgent: this.data.userAgent,
        shopid: this.data.shopid,
        page: 0,
        size: 1999 // 一次请求的商品种类
      },
      success: res => {
        console.log('购物车信息', res);
        if (res.data.code === 200) {
          let usePrice = 0; // 商品使用的价格
          let totalNum = 0; // 商品总件数
          let totalPrice = 0; // 商品总价
          for (let i = 0; i < res.data.rows.length; i++) { // 遍历购物车商品计算商品总数及总价
            let car = res.data.rows[i].car;
            let prod = res.data.rows[i].prod;
            // 商品价格使用优先级（活动价 > 折扣价 > 原价）
            usePrice = prod.aprice ? prod.aprice : prod.sprice ? prod.sprice : prod.price;
            totalNum += car.productQty;
            totalPrice += car.productQty * usePrice;

            // 购物车列表
            let ctype = 'cart[' + i + '].ctype'; // 商品一级分类
            let itemid = 'cart[' + i + '].itemid'; // 商品编码
            let pcode = 'cart[' + i + '].pcode'; // 产品编码
            let image = 'cart[' + i + '].image'; // 图片
            let name = 'cart[' + i + '].name'; // 产品名
            let ctitle = 'cart[' + i + '].ctitle'; // 产品副标题
            let price = 'cart[' + i + '].price'; // 产品价格
            let stocknum = 'cart[' + i + '].stocknum'; // 产品库存
            let productQty = 'cart[' + i + '].productQty'; // 产品数量
            this.setData({
              [ctype]: prod.ctype.substr(0, 2),
              [itemid]: car.itemid,
              [pcode]: prod.pcode,
              [image]: prod.mainpic ? prod.mainpic : '../../images/item.png',
              [name]: prod.name,
              [ctitle]: prod.ctitle,
              [price]: usePrice,
              [stocknum]: prod.stocknum,
              [productQty]: car.productQty
            });
          }
          this.setData({
            carProductList: res.data.rows,
            total: res.data.total, // 总种数
            Num: totalNum, // 总件数
            Sum: totalPrice.toFixed(2) // 总价
          });
          this.matchMenu(); // 一级分类右上角的mark
          this.matchList(); // 商品列表中选择的商品数量
        } else if (res.data.code === 20019) { // 会话失效，重新登录
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.GetPack();
          }
          reLogin.login(dealFunc);
        }
        wx.hideLoading();
      }
    });
  },

  /**
   * 将购物车商品类别与一级分类进行匹配，显示一级分类右上角的mark
   */
  matchMenu() {

    for (let k = 0; k < this.data.menu.length; k++) { // 清零右上角mark
      let mark = 'menu[' + k + '].mark';
      if (this.data.menu[k].mark > 0) {
        this.setData({
          [mark]: 0
        });
      }
    }

    for (let i = 0; i < this.data.cart.length; i++) { // 重新标记右上角mark
      for (let j = 0; j < this.data.menu.length; j++) {
        let mark = 'menu[' + j + '].mark';
        if (this.data.cart[i].ctype === this.data.menu[j].code) {
          this.setData({
            [mark]: this.data.menu[j].mark + this.data.cart[i].productQty
          });
          break;
        }
      }
    }
  },

  /**
   * 将购物车商品类别与展示的商品列表进行比对，更新商品列表中选择的商品数量
   */
  matchList() {
    for (let i = 0; i < this.data.list.length; i++) {
      let listNum = 'list[' + i + '].num';
      this.setData({
        [listNum]: 0
      });
    }
    for (let j = 0; j < this.data.cart.length; j++) {
      for (let m = 0; m < this.data.list.length; m++) {
        let listNum = 'list[' + m + '].num';
        if (this.data.cart[j].pcode === this.data.list[m].pcode) {
          this.setData({
            [listNum]: this.data.cart[j].productQty
          });
          break;
        }
      }
    }
  },


  /**
   * 向购物车【+】商品
   */
  catchAddNum(e) {
    wx.showLoading({
      title: '',
      mask: true
    })
    let index = e.currentTarget.dataset.index;
    let itemid = this.data.list[index].itemid; // 商品编码
    let proType = this.data.list[index].ctype.substr(0, 2); // 产品一级分类
    let stock = this.data.list[index].stock; // 库存
    let num = this.data.list[index].num; // 商品已选数量
    console.log('商品已选数量', num);
    if (stock > 0) {
      if (stock > num) {
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
            console.log('添加商品', res);
            if (res.data.code === 200) {
              // 1.更新商品的数量
              let productNum = 'list[' + index + '].num';
              this.setData({
                [productNum]: this.data.list[index].num + 1,
                'mess.num': this.data.mess.num ? this.data.mess.num + 1 : 1
              });
              // 2.更新购物车的商品总数及总价
              this.setData({
                Sum: res.data.data.totalPrice.toFixed(2),
                Num: res.data.data.totalCount
              });
              // 3.更新cart中对应的商品数量
              let cartHasPro = false; // 购物车中是否已有该商品
              let i;
              for (i = 0; i < this.data.cart.length; i++) { // 如果 （添加的是购物车中已有的商品）
                let productQty = 'cart[' + i + '].productQty';
                if (itemid === this.data.cart[i].itemid) {
                  cartHasPro = true;
                  this.setData({
                    [productQty]: this.data.list[index].num
                  });
                }
              }
              let newProductQty = 'cart[' + i + '].productQty'; // 否则
              let newItemid = 'cart[' + i + '].itemid';
              let newPcode = 'cart[' + i + '].pcode';
              if (!cartHasPro) {
                this.setData({
                  [newProductQty]: 1,
                  [newItemid]: itemid,
                  [newPcode]: this.data.list[index].pcode
                });
              }
              // 4.更新一级分类右上角的mark
              for (let j = 0; j < this.data.menu.length; j++) {
                let mark = 'menu[' + j + '].mark';
                if (proType === this.data.menu[j].code) {
                  if (this.data.menu[j].mark) {
                    this.setData({
                      [mark]: this.data.menu[j].mark + 1
                    });
                  } else { // 如果是没有标记过的一级分类
                    this.setData({
                      [mark]: 1
                    });
                  }
                  break;
                }
              }
            } else if (res.data.code === 20020) { // 会话失效，重新登录
              let that = this;

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
          },
          fail: res => {
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
   * 向购物车【-】商品
   */
  catchSubNum(e) {
    wx.showLoading({
      title: '',
      mask: true
    })
    let index = e.currentTarget.dataset.index;
    let itemid = this.data.list[index].itemid;
    let proType = this.data.list[index].ctype.substr(0, 2);
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
          // 1.更新商品选中的数量
          let productNum = 'list[' + index + '].num';
          if (this.data.list[index].num > 0) {
            this.setData({
              [productNum]: this.data.list[index].num - 1,
              'mess.num': this.data.mess.num - 1
            });
          }
          // 2.更新购物车的商品总数及总价
          this.setData({
            Sum: res.data.data.totalPrice.toFixed(2),
            Num: res.data.data.totalCount
          });
          // 3.更新购物车cart的数据
          for (let i = 0; i < this.data.cart.length; i++) {
            let productQty = 'cart[' + i + '].productQty';
            if (itemid === this.data.cart[i].itemid) {
              this.setData({
                [productQty]: this.data.list[index].num
              });
              break;
            }
          }
          // 4.更新一级分类右上角的mark
          for (let j = 0; j < this.data.menu.length; j++) {
            let mark = 'menu[' + j + '].mark';
            if (proType === this.data.menu[j].code) {
              this.setData({
                [mark]: this.data.menu[j].mark - 1
              });
              break;
            }
          }
        } else if (res.data.code === 20020) { // 会话失效，重新登录
          let that = this;

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
      },
      fail: res => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 监听【右侧详情滚动】，滚动到商品最下方时触发，page加1，重新请求一次GetList，获取下一页商品。
   */
  MoreList: function () {
    if (this.data.MenuCurrent != null) {
      if (!this.data.last) {
        this.setData({
          page: this.data.page + 1,
        });
        this.GetList();
      } else {
        wx.showToast({
          title: '没有更多的了',
          icon: 'none',
          duration: 1000,
        })
      }
    }
  },


  /**
   * 【点击领取】请求可领取的优惠券接口，获取当前可领的优惠券，赋值到data
   */
  GetCoupon() {
    wx.request({
      url: app.globalData.url + '/api/shop/couponActivity/couponActivityList',
      data: {
        shopId: this.data.shopid,
        tokenid: this.data.tokenid, //  与会话是否失效关联
        userAgent: this.data.userAgent,
        size: 10,
        page: 0,
      },
      success: res => {
        console.log('领取优惠券', res);
        if (res.data.code === 200) {
          if (res.data.data) {
            if (res.data.data.content) { //判断有无优惠券
              for (let m = 0; m < res.data.data.content.length; m++) {
                let item = res.data.data.content[m];
                var validStr;
                if (item.isReceive == 0) { // 未领取
                  if (item.liveStartTime) {
                    validStr = item.liveStartTime.substr(0, 10) + '~' + item.liveEndTime.substr(0, 10);
                  } else {
                    validStr = item.liveDays + '天';
                  }
                } else { // 已领取
                  if (item.liveStartTime2) {
                    validStr = item.liveStartTime2.substr(0, 10) + '~' + item.liveEndTime2.substr(0, 10);
                  } else {
                    validStr = item.liveDays + '天';
                  }
                }
                let id = "draw[" + m + "].id"; // 优惠券id
                let mod = "draw[" + m + "].mod"; // 有效结束时间
                let value = "draw[" + m + "].value"; // 优惠金额或折扣
                let limit = "draw[" + m + "].limit"; // 使用的条件（满足的金额）
                let valid = "draw[" + m + "].valid"; // 有效期
                let style = "draw[" + m + "].style"; // 优惠类型(0:满减,1:折扣)
                let taken = "draw[" + m + "].taken"; // 是否已领取（0-未领取，1-已领取）
                let model = "draw[" + m + "].model"; // 展开&收起优惠券更多说明
                let itype = "draw[" + m + "].itype"; // 优惠范围(0-全部,1-指定商品，旧数据该字段为空也是全部)
                let iname = "draw[" + m + "].iname"; // 优惠商品名称(当couponItemType为1时才有)
                let stype = "draw[" + m + "].stype"; // 门店范围(0-全部,1-指定门店，旧数据该字段为空也是全部)
                let sname = "draw[" + m + "].sname"; // 指定门店名称(当couponShopType为1时才有)
                let state = "draw[" + m + "].state"; // 优惠券门店显示状态(0-不显示,1-显示)
                this.setData({
                  [id]: item.id,
                  [mod]: item.liveEndTime ? 0 : 1,
                  [value]: item.couponType == 0 ? item.amount : item.discount2 * 10,
                  [limit]: item.threshold,
                  // [valid]: item.isReceive == 1 ? item.liveEndTime2.substr(0, 10) : item.liveEndTime ? item.liveEndTime.substr(0, 10) : item.liveDays,
                  [valid]: validStr,
                  [style]: item.couponType,
                  [taken]: item.isReceive,
                  [itype]: item.couponItemType,
                  [iname]: item.couponItemType == 0 ? null : item.couponItemName,
                  [stype]: item.couponShopType,
                  [sname]: item.couponShopType == 0 ? null : item.couponShopNames,
                  [state]: item.couponShopStatus, // 门店是否显示该优惠券（0不显示，1显示）
                  [model]: false
                });
              }
              let drawArr = this.data.draw;
              let isAllHide;
              for (let i = 0; i < drawArr.length; i++) {
                isAllHide = false;
                if (drawArr[i].state) {
                  isAllHide = false;
                  this.setData({
                    coupon: true
                  });
                  break;
                } else {
                  isAllHide = true;
                }
              }
              if (isAllHide) {
                this.setData({
                  coupon: false
                });
                wx.showToast({
                  title: '本店暂无优惠券，更多优惠活动敬请期待~',
                  icon: 'none'
                });
              }
            } else {
              wx.showToast({
                title: '本店暂无优惠券，更多优惠活动敬请期待~',
                icon: 'none'
              });
            }
          } else {
            wx.showToast({
              title: '本店暂无优惠券，更多优惠活动敬请期待~',
              icon: 'none'
            });
          }
        } else if (res.data.code === 20020) { // 会话失效,重新登录
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.GetCoupon();
          }
          reLogin.login(dealFunc);
        }
      }
    })
  },

  /**
   * 显示与收起优惠券的说明信息
   */
  toshow: function (e) {
    let index = e.currentTarget.dataset.index;
    let model = "draw[" + index + "].model";
    if (this.data.draw[index].model) {
      this.setData({
        [model]: false
      })
    } else {
      this.setData({
        [model]: true
      })
    }
  },

  /**
   * 点击【优惠券】进行领取，若点击的是已领取则弹窗提示
   */
  GetDraw: function (e) {
    let index = e.currentTarget.dataset.index;
    if (this.data.draw[index].taken == 0) { // 该优惠券未领取（0未领取，1已领取）
      wx.request({
        method: 'POST',
        url: app.globalData.url + '/api/shop/couponActivity/receiveCoupon',
        data: {
          tokenid: this.data.tokenid,
          userAgent: this.data.userAgent,
          couponIds: this.data.draw[index].id
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: res => {
          if (res.data.code === 20020) { // 会话失效，需重新登录
            let that = this;

            function dealFunc(res) {
              that.setData({
                tokenid: res.data.tokenid,
                userAgent: res.data.userAgent,
                passIdStr: res.data.member.passIdStr
              })
              that.GetDraw(e);
            }
            reLogin.login(dealFunc); // 重新登录
          } else if (res.data.code === 200) {
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 2000,
              success: res => {
                let taken = 'draw[' + index + '].taken';
                this.setData({
                  [taken]: 1
                });
              }
            })
          }
        }
      })
    } else {
      wx.showToast({
        title: '你已领取过此券，不能重复领取',
        icon: 'none',
        duration: 2000,
      })
    }
  },

  DrawOpen: function () { //打开优惠券列表
    this.setData({
      coupon: true,
    });
  },

  DrawClose: function () { //关闭优惠券列表
    this.setData({
      coupon: false,
    });
  },

  // GetActy:function(e){ // 专题页点击事件，【暂无专题页需求，暂无作用】
  //   let index = e.currentTarget.dataset.index;
  //   wx.request({
  //     url: app.globalData.url + '/api/shop/type/shopIndexType/listTypeProduct',
  //     data: {
  //       shopid: this.data.shopid,
  //       typeid: this.data.acty[index].typeid,
  //       page:this.data.apage,
  //       size:20
  //     },
  //     header: {
  //       'content-type': 'application/json' // 默认值
  //     },
  //     success: res => {
  //       if (res.data.code==200){
  //         this.setData({
  //           last: res.data.data.last,
  //           list:[],
  //           appe:1
  //         })
  //         for (let k = 0; k < res.data.data.content.length; k++){
  //           let image = "list[" + (20 * this.data.page + k) + "].image";
  //           let name = "list[" + (20 * this.data.page + k) + "].name";
  //           let size = "list[" + (20 * this.data.page + k) + "].size";
  //           let price = "list[" + (20 * this.data.page + k) + "].price";
  //           let num = "list[" + (20 * this.data.page + k) + "].num";
  //           let pcode = "list[" + (20 * this.data.page + k) + "].pcode";
  //           let scode = "list[" + (20 * this.data.page + k) + "].scode";
  //           let itemid = "list[" + (20 * this.data.page + k) + "].itemid";
  //           let pid = "list[" + (20 * this.data.page + k) + "].pid";
  //           let stock = "list[" + (20 * this.data.page + k) + "].stock";
  //           this.setData({
  //             [image]: res.data.data.content[k].mainpic ? res.data.data.content[k].mainpic : '../../images/item.png',
  //             [name]: res.data.data.content[k].name,
  //             [size]: res.data.data.content[k].ctitle,
  //             [price]: parseFloat((res.data.data.content[k].aprice ? res.data.data.content[k].aprice : res.data.data.content[k].sprice)),
  //             [num]: 0,
  //             [pcode]: res.data.data.content[k].pcode,
  //             [scode]: res.data.data.content[k].pcode.substr(0, 4),
  //             [itemid]: res.data.data.content[k].itemid,
  //             [pid]: res.data.data.content[k].pid,
  //             [stock]: res.data.data.content[k].stocknum,
  //           })
  //         }
  //         this.SetUnit()
  //       }
  //     }
  //   })
  // },

  /**
   * 点击【商品特殊分类（促销，热销）】时触发，切换特殊分类，把对应分类物品赋值给list
   */
  MainSelect: function (e) {
    let current = e.currentTarget.dataset.index;
    this.setData({
      MainCurrent: current,
      MenuCurrent: null,
      list: [],
      // appe: 1    // 是否显示专题页
    })
    if (current == 0) { // 热销
      this.setData({
        list: this.data.hots
      })
    } else if (current == 1) { // 促销
      this.setData({
        list: this.data.pros[0]
      })
    }
    this.matchList(); // 更新商品列表中选择的商品数量
  },

  /**
   * 点击【一级分类】，切换一级分类，获取对应分类序号，清空并更新list
   */
  MenuSelect: function (e) {
    let current = e.currentTarget.dataset.index;
    this.setData({
      MainCurrent: null,
      MenuCurrent: current,
      KindCurrent: 0,
      code: this.data.kind[current][0].code,
      page: 0,
      last: '',
      list: [],
      appe: 1
    })
    this.GetList();
  },

  /**
   * 点击【二级分类】，先判断是属于特殊分类还是一级分类，再根据情况获取对应分类赋值到list
   */
  KindSelect: function (e) {
    let current = e.currentTarget.dataset.index;
    this.setData({
      KindCurrent: current,
      page: 0,
      list: [],
    })
    if (this.data.MainCurrent == 1) { // 如果是促销
      this.setData({
        list: this.data.pros[current]
      })
    } else if (this.data.MenuCurrent) {
      this.setData({
        code: this.data.kind[this.data.MenuCurrent][current].code,
      });
      this.GetList();
    };
  },

  /**
   * 点击【物品图片】，显示商品详情。
   */
  PopOpen: function (e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      show: 1,
      array: index,
      mess: {}
    })
    wx.request({
      url: app.globalData.url + '/api/shop/product/goods/' + this.data.list[index].itemid,
      data: {},
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log('物品详情', res);
        if (res.data.code === 200) {
          this.setData({
            'mess.image': res.data.carouselpcis[0] ? res.data.carouselpcis[0] : res.data.mainpic ? res.data.mainpic : '../../images/item.png',
            'mess.name': res.data.name,
            'mess.size': res.data.ctitle,
            'mess.price': res.data.aprice ? res.data.aprice : res.data.sprice,
            'mess.num': this.data.list[index].num,
          })
        }
      }
    })
  },

  /**
   * 图片加载异常的处理
   */
  bindImgLoadErr(e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      'mess.image': '../../images/item.png'
    });
  },

  /**
   * 关闭【商品详情】
   */
  PopClose: function () {
    this.setData({
      show: 0,
    })
  },

  /**
   * 【个人图标】打开我的个人菜单
   */
  GetMine() {
    wx.showActionSheet({
      itemList: ['我的订单', '我的优惠券'],
      success: res => {
        if (res.tapIndex == 0) {
          wx.navigateTo({
            url: '../order/order',
          })
        } else if (res.tapIndex == 1) {
          wx.navigateTo({
            url: '../draw/draw',
          })
        }
      },
      fail: res => {}
    })
  },

  /**
   * 跳转到购物车
   */
  tocart() {
    wx.navigateTo({
      url: '../cart/cart'
    });
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

  GetCoupon2() {
    wx.request({
      url: app.globalData.url + '/api/shop/couponActivity/couponActivityList',
      data: {
        shopId: this.data.shopid,
        tokenid: this.data.tokenid, //  与会话是否失效关联
        userAgent: this.data.userAgent,
        size: 10,
        page: 0,
      },
      success: res => {
        let that = this;
        console.log('领取优惠券', res);
        if (res.data.code === 200) {
          that.setData({
            couponList: res.data.data.content
          })
        } else if (res.data.code === 20020) { // 会话失效,重新登录
          let that = this;

          function dealFunc(res) {
            that.setData({
              tokenid: res.data.tokenid,
              userAgent: res.data.userAgent,
              passIdStr: res.data.member.passIdStr
            })
            that.GetCoupon2();
          }
          reLogin.login(dealFunc);
        }
      }
    })
  },

  toCouponList() {
    wx.navigateTo({
      url: '../couponListPage/couponListPage'
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