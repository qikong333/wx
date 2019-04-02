// pages/search/search.js
let reLogin = require('../../utils/reLogin.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    record: [], //热门搜索词列表
    focus: false, //搜索框是否获取焦点
    search: false, //是否是搜索状态，非搜索状态时显示热门搜索词，搜索状态时显示搜索列表
    result: false, //是否有符合搜索条件的商品，若无则显示相关提示
    show: 0, //是否显示商品详情页
    array: 0, //显示商品详情时，在商品详情页该物品的序号
    mess: {}, //打开商品详情时物品的属性
    saddress: '', //打开商品详情页时显示的门店地址
    sphone: '0769-21662613', //打开商品详情页时显示的门店电话
    Num: 0, //加入购物车的总商品数
    Sum: 0, //加入购物车的总价格
    list: [], //当前显示的搜索商品列表
    pack: [], //加入购物车的商品列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.hideShareMenu();
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
    wx.setNavigationBarTitle({
      title: this.data.name
    });
    wx.request({ // 请求热门搜索词
      url: app.globalData.url + '/api/shop/search/prodSeachKeyword/searchHotWrod',
      success: res => {
        if (res.data.code === 200) {
          if (res.data.data && res.data.data.length > 0) {
            this.setData({
              record: res.data.data
            });
          }
        }
      }
    })

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() { //从其他页面返回此页面，更新pack数据
    this.GetPack();
  },

  /**
   * 请求购物车数据
   */
  GetPack() {
    this.setData({ // 清空原有购物车数据再重新获取
      cart: []
    });
    wx.showLoading({
      title: '加载中',
      mask: true
    });
    wx.request({
      url: app.globalData.url + '/api/shop/shopcar/odShopcarDetail/list',
      data: {
        tokenid: this.data.tokenid,
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
            let ctype = 'pack[' + i + '].ctype'; // 商品一级分类
            let pid = 'pack[' + i + '].pid'; // 商品id
            let itemid = 'pack[' + i + '].itemid'; // 商品编码
            let pcode = 'pack[' + i + '].pcode'; // 产品编码
            let image = 'pack[' + i + '].image'; // 图片
            let name = 'pack[' + i + '].name'; // 产品名
            let ctitle = 'pack[' + i + '].ctitle'; // 产品副标题
            let price = 'pack[' + i + '].price'; // 产品价格
            let stocknum = 'pack[' + i + '].stocknum'; // 产品库存
            let productQty = 'pack[' + i + '].productQty'; // 产品数量
            this.setData({
              [ctype]: prod.ctype.substr(0, 2),
              [pid]: prod.pid,
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
            Num: totalNum,
            Sum: totalPrice.toFixed(2)
          });
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

  // clear: function () {//清空搜索框
  //   this.setData({
  //     value: '',
  //   })
  // },

  /**
   * 点击【热门搜索词】或【键盘的搜索】时触发
   */
  Search(e) {
    this.setData({
      search: true,
      list: [],
    });
    wx.showLoading({
      title: '加载中',
      mask: true
    });
    wx.request({
      method: 'POST',
      url: app.globalData.url + '/api/shop/search/searchproduct/search',
      data: {
        shopId: this.data.shopid,
        querykey: e.detail.value || e.currentTarget.dataset.name,
        sortBySaleNum: 'desc',
        sortByDeScore: 'desc'
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: res => {
        console.log('搜索', res);
        if (res.data.code === 200) {
          if (res.data.data.docs.length > 0) {
            this.setData({
              result: true,
            })
            for (let i = 0; i < res.data.data.docs.length; i++) {
              var itemid = "list[" + i + "].itemid"; // 商品编码
              var pid = "list[" + i + "].pid"; // 产品id
              var image = "list[" + i + "].image"; //商品图片
              var name = "list[" + i + "].name"; //商品名称
              var size = "list[" + i + "].size"; //商品副标题
              var code = "list[" + i + "].code"; //产品分类
              var price = "list[" + i + "].price"; //产品价格
              var num = "list[" + i + "].num"; //
              var stock = "list[" + i + "].stock"; //
              var Price = [];
              Price[i] = res.data.data.docs[i].prices.split(",");
              this.setData({
                [itemid]: res.data.data.docs[i].docid,
                [pid]: res.data.data.docs[i].pid,
                [image]: res.data.data.docs[i].mainpic ? res.data.data.docs[i].mainpic : '../../images/item.png',
                [name]: res.data.data.docs[i].contents.name,
                [size]: res.data.data.docs[i].contents.ctitle,
                [code]: res.data.data.docs[i].ctype,
                [price]: parseFloat(Price[i][1]),
                [num]: 0,
                [stock]: res.data.data.docs[i].available,
              })
            }
            this.SetUnit();
          } else {
            this.setData({
              result: false,
            })
          }
        }
        wx.hideLoading();
      }
    })
  },

  /**
   * 对比商品列表与购物车列表，显示当前选择的数量
   */
  SetUnit() {
    for (let i = 0; i < this.data.pack.length; i++) {
      for (let j = 0; j < this.data.list.length; j++) {
        if (this.data.pack[i].itemid.toString() === this.data.list[j].itemid) {
          let num = 'list[' + j + '].num';
          this.setData({
            [num]: this.data.pack[i].productQty
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
    console.log('添加商品', e);
    let index = e.currentTarget.dataset.index;
    let itemid = this.data.list[index].itemid; // 商品编码
    let stock = this.data.list[index].stock; // 库存
    let num = this.data.list[index].num; // 商品已选数量
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
    let index = e.currentTarget.dataset.index;
    let itemid = this.data.list[index].itemid;
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
      }
    });
  },
  

  /**
   * 点击物品图片时触发，显示【商品详情】
   */
  PopOpen(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      show: 1,
      array: index,
      'mess.image': this.data.list[index].image,
      'mess.name': this.data.list[index].name,
      'mess.size': this.data.list[index].size,
      'mess.price': this.data.list[index].price,
      'mess.num': this.data.list[index].num,
    })
  },

  /**
   * 关闭商品详情页
   */
  PopClose: function() {
    this.setData({
      show: 0,
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
})