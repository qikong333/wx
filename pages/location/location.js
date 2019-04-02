//location.js
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    show: false, //是否显示其他门店
    near: 0, //最近门店的序号
    lat: '',
    lng: '',
    address: '',
    storelist: [], //门店列表
    tips: '查看更多门店', //提示显示信息
    getParam: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options) {
      this.data.getParam = options
    }
    // wx.hideShareMenu();
    try {
      wx.hideShareMenu();
      wx.getStorage({ // 取登录数据
        key: 'location',
        success: (res) => {
          this.setData({
            address: res.data.address,
            lat: res.data.lat,
            lng: res.data.lng,
          })
          this.GetStore();
        }
      })
    } catch (e) {
      console.log(e);

    }

    // try {
    //   var locationData = wx.getStorageSync('location');
    //   console.log(locationData)
    //   if (locationData) {
    //     this.setData({
    //       address: locationData.address,
    //       lat: locationData.lat,
    //       lng: locationData.lng,
    //     })
    //     this.GetStore();
    //   }
    // } catch (e) {
    //   console.log(e);

    // }
    wx.showLoading({
      title: '',
      mask: true
    });

  },

  /**
   * 【重新定位】
   */
  GetLocation() {
    wx.chooseLocation({
      success: res => {
        this.setData({
          address: res.name,
          lat: res.latitude,
          lng: res.longitude
        })
        // wx.setStorage({
        //   key: "location",
        //   data: {
        //     lat: res.latitude,
        //     lng: res.longitude,
        //     address: res.name,
        //   },
        //   success: res => {
        //     this.GetStore()
        //   }
        // })
      }
    })
  },

  /**
   * 调用小程序门店接口请求门店数据
   */
  GetStore() {
    var storelist = [];
    let lngStr = (this.data.lng * 1000000).toString().split('.')[0] / 1000000;
    let latStr = (this.data.lat * 1000000).toString().split('.')[0] / 1000000
    // 坐标转换
    wx.request({
      url: 'https://restapi.amap.com/v3/assistant/coordinate/convert',
      data: {
        key: 'e6b86d252ff55da0fda32a48564ca0d4',
        locations: lngStr + ',' + latStr,
        coordsys: 'gps',
      },
      success: r => {
        console.log(r);
        let centerStr = r.data.locations;
        wx.request({ // 请求门店基本信息
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
            console.log('门店数据', res);
            if (res.data.status === 1) { // 成功
              for (let i = 0; i < res.data.datas.length; i++) {
                var loca = [];
                loca[i] = res.data.datas[i]._location.split(",");
                storelist.push({
                  shopid: res.data.datas[i].shopid, // 门店id
                  name: res.data.datas[i]._name, // 门店名字
                  address: res.data.datas[i]._address, // 门店地址
                  opentime: res.data.datas[i].opentime,
                  tel: res.data.datas[i].telephone,
                  lat: loca[i][1], // 门店纬度
                  lng: loca[i][0], // 门店经度
                  // distance: this.GetDistance(this.data.lat, this.data.lng, loca[i][1], loca[i][0]), //门店距离
                  distance: (res.data.datas[i]._distance / 1000).toFixed(2),
                  status: true // 门店营业状态
                });
              }

              storelist.sort((a, b) => { //门店按距离升序排序
                return a.distance - b.distance;
              });

              this.setData({
                storelist: storelist
              });

              // wx.request({  // 请求门店营业时间？？？？？？？？？？？？？
              //   url: app.globalData.url + '/api/shop/shopInfo/shopInfoItem/getAllShopOpenTime',
              //   data: {},
              //   success: res => {
              //     console.log('门店营业时间', res);
              //     if (res.data.code === 200) {
              //       for (let j = 0; j < this.data.storelist.length; j++) {
              //         var opentime = "storelist[" + j + "].opentime";
              //         var closetime = "storelist[" + j + "].closetime";
              //         for (let k = 0; k < res.data.data.length; k++) {
              //           if (this.data.storelist[j].shopid == res.data.data[k].shopid) {
              //             this.setData({
              //               [opentime]: res.data.data[k].openTime ? res.data.data[k].openTime + ':00' : '8:00',
              //               [closetime]: res.data.data[k].closeTime ? res.data.data[k].closeTime + ':00' : '20:00',
              //             })
              //           }
              //         }
              //       }
              //     }
              //   }
              // });

              wx.request({ // 请求门店的营业状态
                url: app.globalData.url + '/api/shop/shopInfo/shopInfoItem/getOpenShop',
                data: {},
                success: res => {
                  console.log('门店营业状态', res);
                  if (res.data.code === 200) {
                    if (res.data.data.length) {
                      for (let j = 0; j < this.data.storelist.length; j++) {
                        let status = "storelist[" + j + "].status";
                        for (let k = 0; k < res.data.data.length; k++) {
                          if (this.data.storelist[j].shopid == res.data.data[k]) {
                            this.setData({
                              [status]: false,
                            })
                          }
                        }
                      }
                    }
                  }
                  wx.hideLoading();
                }
              })
            }
          }
        });
      }
    })

  },

  /**
   * 计算两个位置坐标距离
   */
  // GetDistance: function(lat1, lng1, lat2, lng2) {
  //   lat1 = lat1 || 0;
  //   lng1 = lng1 || 0;
  //   lat2 = lat2 || 0;
  //   lng2 = lng2 || 0;

  //   var rad1 = lat1 * Math.PI / 180.0;
  //   var rad2 = lat2 * Math.PI / 180.0;
  //   var a = rad1 - rad2;
  //   var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;

  //   var r = 6378137;
  //   return (r * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(rad1) * Math.cos(rad2) * Math.pow(Math.sin(b / 2), 2)) / 1000)).toFixed(2)
  // },

  /**
   * 点击【更多门店】触发，显示所有门店，赋值tips为'没有更多了'
   */
  toshow() {
    if (!this.data.show) {
      this.setData({
        show: true,
        tips: '没有更多了'
      })
    }
  },

  /**
   * 点击【某个门店】触发
   */
  tobuy(e) {
    var index = e.currentTarget.dataset.index;
    if (this.data.storelist[index].status) {
      wx.setStorage({
        key: "store",
        data: {
          shopid: this.data.storelist[index].shopid,
          name: this.data.storelist[index].name,
          address: this.data.storelist[index].address,
          distance: this.data.storelist[index].distance,
          lat: this.data.storelist[index].lat,
          lng: this.data.storelist[index].lng,
          opentime: this.data.storelist[index].opentime,
          tel: this.data.storelist[index].telephone,
          // closetime: this.data.storelist[index].closetime,
        },
        success: res => {
          if (this.data.getParam == 0) {
            wx.setStorage({
              key: "location",
              data: {
                lat: this.data.storelist[index].lat,
                lng: this.data.storelist[index].lng,
                address: this.data.storelist[index].address,
              },
              success: res => {
                this.GetStore()
              }
            })
          }

          wx.navigateTo({
            url: '../index/index?page=location& shopid=' + this.data.storelist[index].shopid + '&name=' + this.data.storelist[index].name + "&gbs=" + this.data.getParam['gbs']
          })
        }
      })
    } else {
      wx.showToast({
        title: '店铺休息中，暂不提供服务',
        icon: 'none',
        duration: 1000
      })
    }
  },
})