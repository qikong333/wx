const app = getApp()
Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    products: {
      type: Array,
      value: [],
    }
  },
  data: {
    // 这里是一些组件内部数据
    couponList: [],
    name: '',
    shopid: '',
    saddress: '',
    passIdStr: '',
    tokenid: '',
    userAgent: '',
    draw: [], // 优惠券列表
    draw2: [], // 优惠券列表
    page: 0, // 默认打开时显示的商品页数
    size: 10, // 每页加载商品数量
    last: '',
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
      this.GetCoupon()
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

    // GetCoupon() {
    //   wx.request({
    //     url: app.globalData.url + '/api/shop/couponActivity/couponActivityList',
    //     data: {
    //       shopId: this.data.shopid,
    //       tokenid: this.data.tokenid, //  与会话是否失效关联
    //       userAgent: this.data.userAgent,
    //       size: 10,
    //       page: 0,
    //     },
    //     success: res => {
    //       let that = this;
    //       console.log('领取优惠券', res);
    //       if (res.data.code === 200) {
    //         that.setData({
    //           couponList: res.data.data.content
    //         })
    //       }
    //     }
    //   })
    // },

    /**
     * 【点击领取】请求可领取的优惠券接口，获取当前可领的优惠券，赋值到data
     */
    GetCoupon() {
      let currentPage = this.data.page;
      let pageSize = this.data.size;
      wx.request({
        url: app.globalData.url + '/api/shop/couponActivity/couponActivityList',
        data: {
          shopId: this.data.shopid,
          tokenid: this.data.tokenid, //  与会话是否失效关联
          userAgent: this.data.userAgent,
          page: currentPage, //当前页
          size: pageSize //每页加载数量
        },
        success: res => {
          console.log('领取优惠券', res);
          if (res.data.code === 200) {
            res.data.data.content = (res.data.data.content).filter(r => r.couponShopStatus == 1)
            this.setData({
              last: res.data.data.last
            })
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
                    [value]: item.couponType == 0 ? item.amount : (item.discount2 * 10).toFixed(1),
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

                    console.log('drawArr', drawArr);
                    this.setData({
                      coupon: true,
                      draw2: [...this.data.draw2, ...drawArr]
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
     * 点击【优惠券】进行领取，若点击的是已领取则弹窗提示
     */
    GetDraw: function (e) {
      let index = e.currentTarget.dataset.index;

      if (this.data.draw2[index].taken == 0) { // 该优惠券未领取（0未领取，1已领取）
        wx.request({
          method: 'POST',
          url: app.globalData.url + '/api/shop/couponActivity/receiveCoupon',
          data: {
            tokenid: this.data.tokenid,
            userAgent: this.data.userAgent,
            couponIds: this.data.draw2[index].id,

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
                  let taken = 'draw2[' + index + '].taken';
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

    /**
     * 监听【右侧详情滚动】，滚动到商品最下方时触发，page加1，重新请求一次GetList，获取下一页商品。
     */
    MoreList: function () {
      if (!this.data.last) {
        this.setData({
          page: this.data.page + 1,
        });
        this.GetCoupon();
      } else {
        wx.showToast({
          title: '没有更多的了',
          icon: 'none',
          duration: 1000,
        })
      }
    },
    toNome(e) {
      return 0
    }

  }
})