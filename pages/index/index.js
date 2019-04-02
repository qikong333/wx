//index.js
const QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js');
const reLogin = require('../../utils/reLogin.js');
let MOBILE_REGEXP = /^1[3|4|5|7|8]\d{9}$/;

//获取应用实例
var app = getApp()




Page({
    data: {
        lat: '',
        lng: '',
        address: '需要开启地址位置权限',
        laddress: '',
        isRegisterShow: false, // 是否显示注册弹窗
        vCode: '', // 注册验证码
        second: 60, // 60s倒计时
        btnText: '发送验证码',
        isDisabled: false, //是否禁止点击发送验证码按钮
        mobile: '', //手机号码
        storelist: [], //门店列表

        // 这里是一些组件内部数据
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
            {
                show: '',
                name: '热销',
                image: '../../images/hotsale.png'
            }

        ],
        menu: [], // 物品一级分类列表
        kind: [], // 物品二级分类列表
        hots: [], // 热销商品列表
        pros: [], // 促销商品列表
        list: [], // [数组类型]当前显示的详细商品列表
        mess: {}, // 商品详情页---物品的属性
        saddress: '', // 商品详情页---门店地址
        sphone: '0769-21662613', // 商品详情页---门店电话
        carProductList: [], // 购物车商品列表
        opentime: '',
        couponList: [],
        userInfoBool: true,
        tokenid: '', //登陆凭证
        userAgent: '', //设备信息
        passIdStr: '',
        distributeDistance: '',
        distributePrice: '',
        bannerBoolen: true,
        showTitle: false,
        imgHeight: 0,
        getParam: "",
        loginErrCode: '',
    },


    onLoad(option) {
        this.data.getParam = option
        this.version();


        let that = this;
        wx.getSetting({
            success(res) {
                console.log("授权信息", res);

                if (res.authSetting['scope.userInfo']) {
                    // wx.getUserInfo
                    wx.getUserInfo({
                        success(res) {
                            console.log("用户信息", res);
                            wx.setStorage({
                                key: "useriInfo",
                                data: res.userInfo
                            });
                        }
                    })
                    that.setData({
                        userInfoBool: res.authSetting['scope.userInfo'],
                        hasLoadPack: true

                    })


                    function dealFunc() {
                        that.toloca(option.page);
                    }
                    // reLogin.login(dealFunc);
                    that.login(dealFunc); // 请求小程序登录接口

                } else {
                    that.setData({
                        userInfoBool: false
                    })
                }


            }

        })





        // 进程1，获取位置+店铺=>商品列表
        function c() {
            that.reqTransportFee(); // 配送距离
            that.GetListBanner(); // banner轮播图
            that.GetMenu(); // 获取菜单
            that.GetTransportTips(); // 请求起送价
            that.listTransportFree()
        }

        function b() {
            console.log(option);
            console.log("从店铺列表过来");

            if (option.page == "location") {
                console.log("从店铺列表过来");

                that.tobuy2(c) // 从店铺列表跳过来

            } else {

                that.tobuy(c); //  存储最近门店信息
            }
        }

        function a() {

            that.GetStore(b); // 获取店铺信息
        }

        this.getLoca(a); // 获取定位

        // 进程2，授权登录

        // wx.getStorage({
        //     key: 'useriInfo',
        //     success: res => {
        //         if (res.data) {
        //             this.setData({
        //                 userInfoBool: true,
        //                 hasLoadPack: true
        //             })
        //             this.GetPack();
        //             this.GetCoupon2();
        //         }
        //     }
        // })


    },

    version() {
        const res = wx.getSystemInfoSync();
        console.log('微信版本号', res.version);
        if (this.compareVersion(res.version, '7.0.0') >= 0) {
            console.log('7.0以上版本');
            this.setData({
                showTitle: true
            })
        } else {
            console.log('7.0以下版本');
            this.setData({
                showTitle: false
            })
        }
    },

    onShow() {
        if (this.data.hasLoadPack) {
            this.GetPack();
        }

    },



    /**
     * 根据坐标获取当前位置详细地址
     */
    getLoca: function (callback) {
        var qqmapsdk = new QQMapWX({ // 实例化腾讯地图API核心类
            key: '6F4BZ-PPEKQ-2KM5S-GCUGF-UCKHJ-2PBLR'
        });
        wx.getLocation({ //1、获取当前位置坐标
            type: 'gcj02',
            success: res => {
                if (!res.errCode) {
                    qqmapsdk.reverseGeocoder({ //2、根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
                        location: {
                            latitude: res.latitude,
                            longitude: res.longitude,
                        },
                        success: addressRes => {
                            console.log("定位信息", addressRes);

                            var address = addressRes.result.address;
                            this.setData({
                                laddress: address,
                                lat: res.latitude,
                                lng: res.longitude,
                            });
                            callback()
                        }
                    })
                } else {
                    console.log("获取位置信息失败", res);
                    let that = this
                    this.setloca(callback)

                }
            },
            fail: (res) => {
                if (this.data.getParam['gbs'] != 0) {
                    wx.showModal({
                        title: '温馨提示',
                        content: '获取位置信息失败请手动选择门店',
                        showCancel: false,
                        confirmText: '确定',
                        success: res => {
                            wx.navigateTo({
                                url: '../location/location?gbs=0'
                            })
                        }
                    })
                } else {
                    callback()
                }


                // console.log("获取位置信息失败", res);
                // let that = this
                // this.setloca(callback)
            }
        })
    },






    /**
     * 【定位地址栏】拒绝授权的情况下，再次点击时调用，弹框引导用户授权
     */
    setloca: function (callback) {
        console.log("位置未授权检测");

        var that = this;
        wx.getSetting({
            success: res => {
                console.log("位置授权信息", res);

                if (!res.authSetting['scope.userLocation']) { // 位置未授权
                    this.showAuth(callback);
                }
            }
        });
    },



    /**
     * 开启弹框引导用户授权
     */
    showAuth(callback) {
        wx.showModal({
            title: '温馨提示',
            content: '订单配送需要你的地理位置',
            confirmText: '去开启',
            success: res => {
                if (res.confirm) {
                    wx.openSetting({
                        success: res => {
                            if (res.authSetting["scope.userLocation"]) {
                                wx.showToast({
                                    title: '授权成功',
                                    icon: 'success',
                                    duration: 1000
                                });
                                this.getLoca(callback); //再次授权，调用wx.getLocation的API  
                            } else {
                                wx.showToast({
                                    title: '位置授权失败',
                                    icon: 'none',
                                    duration: 1000
                                })
                            }
                        },
                        fail: function (res) {
                            console.log(res);
                        }
                    });
                } else if (res.cancel) {
                    this.setloca()
                    wx.showToast({
                        title: '拒绝授权',
                        icon: 'none',
                        duration: 1000
                    })
                }
            }
        });
    },

    /**
     * 【登录--1.小程序wx.login登录】
     */
    login(func) {

        wx.login({
            success: res => {
                if (res.code) {
                    wx.showLoading({
                        title: '',
                        mask: true
                    })
                    wx.request({
                        url: app.globalData.url + '/api/shop/sns/wx/mpSessionKey',
                        data: {
                            code: res.code,
                        },
                        success: res => { // 登录成功，则将返回的数据openId, sessionKey, unionId赋值给全局数据
                            console.log('小程序wx.login登录', res);
                            if (res.data.code === 200) {
                                console.log(1);

                                app.globalData.openid = res.data.wxuser.openid;
                                app.globalData.session_key = res.data.wxuser.session_key;
                                app.globalData.unionid = res.data.wxuser.unionid;
                                let that = this;
                                wx.getStorage({
                                    key: 'useriInfo',
                                    success(value) {
                                        console.log(2);
                                        console.log(value.data)
                                        app.globalData.userInfo.nickName = value.data.nickName
                                        app.globalData.userInfo.gender = value.data.gender
                                        app.globalData.userInfo.avatarUrl = value.data.avatarUrl
                                        app.globalData.userInfo.city = value.data.city
                                        app.globalData.userInfo.province = value.data.province
                                        app.globalData.userInfo.country = value.data.country
                                        that.reqLoginUsersns(func);
                                    }
                                })

                            } else {
                                wx.hideLoading();
                            }
                        }
                    });
                } else {
                    console.log('登录失败！' + res.errMsg)
                    wx.hideLoading();
                }
            }
        });
    },


    /**
     * 【登录--2.用户信息登录】
     * 参数func：登录成功后的处理函数
     */
    reqLoginUsersns(func) {
        wx.request({
            method: 'POST',
            url: app.globalData.url + '/api/shop/sns/wx/wxAppletLogin',
            data: {
                nickname: app.globalData.userInfo.nickName,
                sex: app.globalData.userInfo.gender,
                headimg: app.globalData.userInfo.avatarUrl,
                unionid: app.globalData.unionid,
                openid: app.globalData.openid,
                city: app.globalData.userInfo.city,
                province: app.globalData.userInfo.province,
                country: app.globalData.userInfo.country,
                stype: 'WXG',
            },
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success: res => {
                console.log('新登录接口', res);
                if (res.data.code == 200) {
                    wx.setStorage({
                        key: "logininfo",
                        data: {
                            tokenid: res.data.tokenid, //登陆凭证
                            userAgent: res.data.userAgent, //设备信息
                            passIdStr: res.data.member.passIdStr, //通行证ID字符串
                        }
                    });
                    this.setData({
                        isRegisterShow: false,
                        tokenid: res.data.tokenid, //登陆凭证
                        userAgent: res.data.userAgent, //设备信息
                        passIdStr: res.data.member.passIdStr, //通行证ID字符串
                    })
                    func(res);
                } else if (res.data.code == 402) {
                    this.setData({
                        isRegisterShow: true,
                        loginErrCode: 402
                    });
                } else if (res.data.code == 207) {
                    this.setData({
                        isRegisterShow: true,
                        loginErrCode: 207

                    });

                }
                wx.hideLoading();
            },
            fail: res => {
                console.log('登录失败', res);
                wx.hideLoading();
            }
        })
    },

    /**
     * 【注册--手机号输入框】失去焦点获取输入值
     */
    bindlerMobileBlur(e) {
        this.setData({
            mobile: e.detail.value
        });
    },


    /**
     * 【注册--验证码input框】失去焦点获取输入值
     */
    bindlerVCodeBlur(e) {
        this.setData({
            vCode: e.detail.value
        });
    },


    /**
     * 【注册--发送验证码】
     */
    bindlerSend() {
        this.setData({
            isDisabled: true,
            btnText: this.data.second + 's后重发',
            second: this.data.second - 1
        });
        var intervalId = setInterval(() => {
            this.setData({
                btnText: this.data.second + 's后重发',
                second: this.data.second - 1
            });
            if (this.data.second < 0) {
                this.setData({
                    isDisabled: false,
                    second: 60,
                    btnText: '发送验证码'
                });
                clearInterval(intervalId);
            }
        }, 1000);
        this.reqRegisterAuthcode(); // 请求发送注册验证码
    },

    /**
     * 【注册--获取注册验证码】
     */
    reqRegisterAuthcode() {
        wx.request({
            url: app.globalData.url + '/api/shop/sns/wx/registerAuthcode',
            data: {
                mobile: this.data.mobile
            },
            success: res => {
                console.log('注册验证码', res);
                if (res.data.code === 200) {
                    wx.showToast({
                        title: '短信验证码已发送到您的手机，请注意查收',
                        icon: 'none',
                        duration: 2000
                    });
                } else if (res.data.code === 510) {
                    wx.showToast({
                        title: res.data.message,
                        icon: 'none'
                    });
                }
            }
        })
    },

    /**
     * 【注册--取消】
     */
    bindlerCancel() {
        this.setData({
            isRegisterShow: false
        });
    },

    /**
     * 【注册--确定】完成注册
     */
    bindlerConfirm() {
        if (this.data.mobile && this.data.vCode) {
            if (this.data.mobile.match(MOBILE_REGEXP)) {
                if (this.data.vCode) {
                    this.reqAppletregister(); // 请求注册
                } else {
                    wx.showToast({
                        title: '请输入验证码',
                        icon: 'none'
                    });
                }
            } else {
                wx.showToast({
                    title: '手机号格式有误，请重新输入',
                    icon: 'none'
                })
            }
        } else {
            wx.showToast({
                title: '手机号或验证码不能为空',
                icon: 'none'
            })
        }
    },

    /**
     * 【注册--请求注册】
     */
    reqAppletregister() {
        wx.showLoading({
            title: '',
            mask: true
        })
        let URL
        if (this.data.loginErrCode == 207) {
            URL = '/api/shop/sns/wx/bindMobile'
        } else if (this.data.loginErrCode == 402) {
            URL = '/api/shop/sns/wx/appletregister'
        }
        wx.request({
            method: 'POST',
            url: app.globalData.url + URL,
            data: {
                unionid: app.globalData.unionid,
                openid: app.globalData.openid,
                nickname: app.globalData.userInfo.nickName,
                sex: app.globalData.userInfo.gender,
                headimg: app.globalData.userInfo.avatarUrl,
                city: app.globalData.userInfo.city,
                province: app.globalData.userInfo.province,
                country: app.globalData.userInfo.country,
                mobile: this.data.mobile,
                authCode: this.data.vCode
            },
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success: res => {
                console.log('请求注册', res);
                if (res.data.code == 200) {
                    if (this.data.loginErrCode == 207) {
                        wx.showToast({
                            title: '绑定成功',
                            icon: 'none'
                        })
                        this.toloca(1)
                    } else if (this.data.loginErrCode == 402) {
                        wx.showToast({
                            title: '注册成功',
                            icon: 'none'
                        })
                    }
                    wx.setStorage({
                        key: "logininfo",
                        data: {
                            tokenid: res.data.tokenid, //登陆凭证
                            userAgent: res.data.userAgent, //设备信息
                            passIdStr: res.data.member.passIdStr, //通行证ID字符串
                        }
                    });
                    this.setData({
                        isRegisterShow: false,
                        tokenid: res.data.tokenid, //登陆凭证
                        userAgent: res.data.userAgent, //设备信息
                        passIdStr: res.data.member.passIdStr, //通行证ID字符串
                    });


                } else {
                    wx.showToast({
                        title: res.data.message,
                        icon: 'none'
                    })
                }
            },
            fail: res => {
                wx.hideLoading();
            }
        })
    },


    /**
     * 【马上下单】授权用户信息以及位置信息
     */
    bindleGetUserInfo(e) {
        console.log(e)
        if (e.detail.userInfo) {
            app.globalData.userInfo = e.detail.userInfo;
            console.log('用户信息', app.globalData.userInfo);
            var that = this;
            wx.setStorage({
                key: "useriInfo",
                data: app.globalData.userInfo
            });
            this.setData({
                userInfoBool: true
            })

            function dealFunc() {
                that.toloca(1);
            }
            // reLogin.login(dealFunc);
            this.login(dealFunc); // 请求小程序登录接口




        } else {
            wx.showToast({
                title: "为了您更好的体验,请先同意授权",
                icon: 'none',
                duration: 2000
            });
        }

    },

    /**
     * 点击【马上下单】判断是否已授权位置信息，若已有位置信息，跳转页面
     */
    toloca(e) {
        if (this.data.lat && this.data.lng) {
            if (e == "location") {
                this.GetPack();
                this.GetCoupon2();
                this.setData({ // 标记请求过购物车
                    hasLoadPack: true
                });
            } else {
                wx.setStorage({
                    key: "location",
                    data: {
                        lat: this.data.lat,
                        lng: this.data.lng,
                        address: this.data.laddress,
                    },
                    success: res => {
                        this.GetPack();
                        this.GetCoupon2();
                        this.setData({ // 标记请求过购物车
                            hasLoadPack: true
                        });
                    }
                })
            }

        } else {
            wx.showToast({
                title: "请先开启地址位置授权",
                icon: 'none',
                duration: 2000
            });
        }
    },




    /**
     * 调用小程序门店接口请求门店数据
     */
    GetStore(callback) {
        var storelist = [];
        let lngStr = (this.data.lng * 1000000).toString().split('.')[0] / 1000000;
        let latStr = (this.data.lat * 1000000).toString().split('.')[0] / 1000000
        let centerStr = lngStr + ',' + latStr;
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
                            lat: loca[i][1], // 门店纬度
                            lng: loca[i][0], // 门店经度
                            telephone: res.data.datas[i].telephone, // 门店电话
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
                                    console.log('门店数据2', this.data.storelist);
                                    this.data.storelist = this.data.storelist.filter(r => r.status == true);
                                    callback()
                                }
                            }
                            wx.hideLoading();
                        }
                    })
                }
            }
        });
    },
    /**
     * 点击【某个门店】触发
     */
    tobuy(callback) {
        console.log("app.globalData ", app.globalData);
        console.log("app.globalData.fromDemo ", app.globalData.fromDemo);

        if (app.globalData.fromDemo == 1) {
            console.log("卡盟跳转过来的");

            wx.setStorage({
                key: "store",
                data: {
                    shopid: app.globalData.shopInfo.shopid,
                    name: app.globalData.shopInfo.name,
                    address: app.globalData.shopInfo.address,
                    distance: app.globalData.shopInfo.distance,
                    lat: app.globalData.shopInfo.location,
                    lng: app.globalData.shopInfo.longitude,
                    opentime: app.globalData.shopInfo.opentime,
                },
                success: res => {
                    this.setData({
                        shopid: app.globalData.shopInfo.shopid,
                        name: app.globalData.shopInfo.name,
                        address: app.globalData.shopInfo.address,
                        distance: app.globalData.shopInfo.distance,
                        lat: app.globalData.shopInfo.location,
                        lng: app.globalData.shopInfo.longitude,
                        opentime: app.globalData.shopInfo.opentime,
                    })
                    console.log("存储成功");
                    callback();

                }
            })
        } else {
            var index = 0;
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
                        telephone: this.data.storelist[index].telephone,
                        // closetime: this.data.storelist[index].closetime,
                    },
                    success: res => {
                        this.setData({
                            shopid: this.data.storelist[index].shopid,
                            name: this.data.storelist[index].name,
                            address: this.data.storelist[index].address,
                            distance: this.data.storelist[index].distance,
                            lat: this.data.storelist[index].lat,
                            lng: this.data.storelist[index].lng,
                            opentime: this.data.storelist[index].opentime,
                            telephone: this.data.storelist[index].telephone,
                        })
                        console.log("存储成功");
                        callback();

                    }
                })
            } else {
                wx.showToast({
                    title: '店铺休息中，暂不提供服务',
                    icon: 'none',
                    duration: 1000
                })
            }
        }
    },

    tobuy2(callback) {
        wx.getStorage({
                key: "store",
                success: r => {
                    this.setData({
                        shopid: r.data.shopid,
                        name: r.data.name,
                        address: r.data.address,
                        distance: r.data.distance,
                        lat: r.data.lat,
                        lng: r.data.lng,
                        opentime: r.data.opentime,
                    })
                    callback();
                }

            }


        )
    },


    // ****************************商品******************************************//
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
     * 优惠券列表
     */
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
                    let cl = (res.data.data.content).filter(r => r.couponShopStatus == 1)
                    this.setData({
                        couponList: cl
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
                    // reLogin.login(dealFunc);
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
                    this.saleactivity(); // 请求促销
                } else if (res.data.code === 201) { // 没有热销产品
                    this.GetProS(); // 请求促销
                    this.saleactivity(); // 请求促销
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
     * 店铺活动
     */
    saleactivity: function () {
        wx.request({
            url: app.globalData.url + '/api/shop/home/list/saleactivity/' + this.data.shopid,
            data: {
                'type': 0,
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success: res => {
                console.log('新的促销商品', res);
                if (res.data.code === 200) {

                }
            }
        })

    },


    /**
     * 请求【促销】商品接口28
     */
    // , {
    //     show: '',
    //     name: '促销',
    //     image: '../../images/prosale.png'
    // }
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

                    // 栏目数据
                    if (res.data.data) { // 有促销产品
                        res.data.data = res.data.data.sort(function (a, b) {
                            return (a.sort - b.sort)
                        });
                        let cx = (res.data.data).map(r => ({
                            show: true,
                            name: r.name,
                            image: '../../images/prosale.png'
                        }))
                        let arr = [...this.data.main, ...cx];
                        this.setData({
                            main: arr
                        })

                        // 商品数据
                        let pord = (res.data.data).map(r =>
                            r['productInfoPage']['content'].map(d => ({
                                image: d.mainpic ? d.mainpic : '../../images/item.png',
                                name: d.name,
                                size: d.ctitle,
                                price: d.aprice ? d.aprice : d.sprice ? d.sprice : d.price,
                                oprice: d.sprice,
                                num: 0,
                                pcode: d.pcode,
                                ctype: d.ctype,
                                itemid: d.itemid,
                                pid: d.pid,
                                stock: d.stocknum,
                            }))
                        )

                        console.log(pord);
                        let pordarr = [...this.data.pros, ...pord]
                        console.log(pordarr);
                        this.setData({
                            pros: pordarr
                        })

                    }
                    // if (res.data.data) { // 可能有促销产品
                    //     for (let j = 0; j < res.data.data.length; j++) {
                    //         // 促销分类下的二级分类
                    //         let sname = "comm[" + j + "].name";
                    //         let id = "comm[" + j + "].id";
                    //         this.setData({
                    //             [sname]: res.data.data[j].name,
                    //             [id]: res.data.data[j].id,
                    //         })
                    //         if (res.data.data[j].productInfoPage.content.length > 0) { // 有促销商品
                    //             this.setData({
                    //                 'main[1].show': true
                    //             });
                    //             for (let k = 0; k < res.data.data[j].productInfoPage.content.length; k++) {
                    //                 console.log('有商品');
                    //                 let jkData = res.data.data[j].productInfoPage.content[k];

                    //                 // 商品价格使用优先级（活动价 > 折扣价 > 原价）
                    //                 let usePrice = jkData.aprice ? jkData.aprice : jkData.sprice ? jkData.sprice : jkData.price;

                    //                 let image = "pros[" + j + "][" + k + "].image";
                    //                 let name = "pros[" + j + "][" + k + "].name";
                    //                 let size = "pros[" + j + "][" + k + "].size";
                    //                 let price = "pros[" + j + "][" + k + "].price";
                    //                 let oprice = "pros[" + j + "][" + k + "].oprice";
                    //                 let num = "pros[" + j + "][" + k + "].num";
                    //                 let pcode = "pros[" + j + "][" + k + "].pcode";
                    //                 let ctype = "pros[" + j + "][" + k + "].ctype";
                    //                 let itemid = "pros[" + j + "][" + k + "].itemid";
                    //                 let pid = "pros[" + j + "][" + k + "].pid";
                    //                 let stock = "pros[" + j + "][" + k + "].stock";

                    //                 this.setData({
                    //                     [image]: jkData.mainpic ? jkData.mainpic : '../../images/item.png',
                    //                     [name]: jkData.name,
                    //                     [size]: jkData.ctitle,
                    //                     [price]: usePrice,
                    //                     [oprice]: jkData.sprice,
                    //                     [num]: 0,
                    //                     [pcode]: jkData.pcode,
                    //                     [ctype]: jkData.ctype,
                    //                     [itemid]: jkData.itemid,
                    //                     [pid]: jkData.pid,
                    //                     [stock]: jkData.stocknum,
                    //                 })


                    //             }
                    //         } else {
                    //             this.setData({
                    //                 'main[1].show': false
                    //             });
                    //             if (this.data.hots <= 0 && this.data.pros <= 0) { // 无热销、促销，显示普通分类下的第一个商品列表
                    //                 this.GetList();
                    //             } else { // 右侧商品列表list不为空，请求购物车信息
                    //                 // this.GetPack();
                    //                 // this.setData({ // 标记请求过购物车
                    //                 //     hasLoadPack: true
                    //                 // });
                    //             }
                    //         }
                    //     }
                    //     if (this.data.hots <= 0) { // 无热销商品
                    //         console.log('右侧为促销商品列表');
                    //         this.setData({
                    //             list: this.data.pros
                    //         });
                    //     }
                    //     // this.GetPack();
                    //     // this.setData({ // 标记已请求过购物车
                    //     //     hasLoadPack: true
                    //     // });
                    // } else { // 无促销商品
                    //     this.setData({
                    //         'main[1].show': false
                    //     })
                    //     if (this.data.hots <= 0 && this.data.pros <= 0) { // 无热销、促销，显示普通分类下的第一个商品列表
                    //         this.setData({ // 第一个一级分类被选中
                    //             MenuCurrent: 0
                    //         });
                    //         this.GetList();
                    //     } else { // 右侧商品列表list不为空，请求购物车信息
                    //         // this.GetPack();
                    //         // this.setData({ // 标记请求过购物车
                    //         //     hasLoadPack: true
                    //         // });
                    //     }
                    // }
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
                        // if (stocknum > 0) {
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
                        // }

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
                        that.GetCoupon2();
                    }
                    reLogin.login(dealFunc);
                }
                wx.hideLoading();
            }
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
                console.log("轮播图", res);

                if (res.data.code == 200) {
                    if (res.data.data.length) {
                        for (let i = 0; i < res.data.data.length; i++) {
                            let image = "swiper.imgUrls[" + i + "]";
                            this.setData({
                                [image]: res.data.data[i].bannerView
                            })
                        }
                    }
                }


            }
        });
    },
    /**
     * 跳去优惠券
     */
    toCouponList() {
        wx.navigateTo({
            url: '../couponListPage/couponListPage'
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
                    },
                    fail: res => {}
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
            },
            fail: res => {}
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
     * 点击【商品特殊分类（促销，热销）】时触发，切换特殊分类，把对应分类物品赋值给list
     */
    MainSelect: function (e) {
        console.log(e);

        let current = e.currentTarget.dataset.index;
        console.log(this.data.pros);

        this.setData({
            MainCurrent: current,
            MenuCurrent: null,
            list: [],
            bannerBoolen: true
            // appe: 1    // 是否显示专题页
        })
        if (current == 0) { // 热销
            this.setData({
                list: this.data.hots
            })
        } else { // 促销
            this.setData({
                list: this.data.pros[current - 1]
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
            bannerBoolen: false,
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
        wx.navigateTo({
            url: '../personalCenter/personalCenter',
        })
        // wx.showActionSheet({
        //     itemList: ['我的订单', '我的优惠券'],
        //     success: res => {
        //         if (res.tapIndex == 0) {
        //             wx.navigateTo({
        //                 url: '../order/order',
        //             })
        //         } else if (res.tapIndex == 1) {
        //             wx.navigateTo({
        //                 url: '../draw/draw',
        //             })
        //         }
        //     },
        //     fail: res => {}
        // })
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
     * 50.获取门店所有免运费接口
     */
    listTransportFree() {
        wx.request({
            url: app.globalData.url + '/api/shop/shopInfo/shopDistributionSet/listTransportFree',
            data: {
                shopId: this.data.shopid, //商品类号
            },

            success: res => {
                console.log("获取门店所有免运费接口", res);
                this.setData({
                    distributePrice: res.data.data[0].distributePrice,
                    distributeDistance: res.data.data[0].distributeDistance
                })
            }
        })
    },

    toLocation() {
        wx.navigateTo({
            url: '../location/location'
        })
    },

    /**
     * 设置背景图宽高
     */
    bindImgLoad(e) {
        try {
            const res = wx.getSystemInfoSync();
            let winWid = res.windowWidth; //获取当前屏幕的宽度
            let imgh = e.detail.height; //图片高度
            let imgw = e.detail.width; //图片宽度
            let swiperH = winWid * imgh / imgw + 'px';
            this.setData({
                imgHeight: swiperH //设置高度
            })
        } catch (e) {}
    },

    /**
     * 比较微信版本号
     */
    compareVersion(v1, v2) {
        v1 = v1.split('.')
        v2 = v2.split('.')
        var len = Math.max(v1.length, v2.length)

        while (v1.length < len) {
            v1.push('0')
        }
        while (v2.length < len) {
            v2.push('0')
        }

        for (var i = 0; i < len; i++) {
            var num1 = parseInt(v1[i])
            var num2 = parseInt(v2[i])

            if (num1 > num2) {
                return 1
            } else if (num1 < num2) {
                return -1
            }
        }
        return 0
    },



    //获取用户地理位置权限
    getPermission: function (callback) {
        var qqmapsdk = new QQMapWX({ // 实例化腾讯地图API核心类
            key: '6F4BZ-PPEKQ-2KM5S-GCUGF-UCKHJ-2PBLR'
        });
        wx.getLocation({
            type: 'gcj02',
            success: res => {
                qqmapsdk.reverseGeocoder({ //2、根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude,
                    },
                    success: addressRes => {
                        var address = addressRes.result.formatted_addresses.recommend;
                        this.setData({
                            address: address,
                            lat: res.latitude,
                            lng: res.longitude,
                        });
                        callback()
                    }
                })
            },
            fail: function () {
                wx.getSetting({
                    success: function (res) {
                        var statu = res.authSetting;
                        if (!statu['scope.userLocation']) {
                            wx.showModal({
                                title: '是否授权当前位置',
                                content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
                                success: function (tip) {
                                    if (tip.confirm) {
                                        wx.openSetting({
                                            success: function (data) {
                                                if (data.authSetting["scope.userLocation"] === true) {
                                                    wx.showToast({
                                                        title: '授权成功',
                                                        icon: 'success',
                                                        duration: 1000
                                                    })
                                                    //授权成功之后，再调用chooseLocation选择地方
                                                    wx.getLocation({
                                                        type: 'gcj02',
                                                        success: res => {
                                                            qqmapsdk.reverseGeocoder({ //2、根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
                                                                location: {
                                                                    latitude: res.latitude,
                                                                    longitude: res.longitude,
                                                                },
                                                                success: addressRes => {
                                                                    var address = addressRes.result.formatted_addresses.recommend;
                                                                    this.setData({
                                                                        address: address,
                                                                        lat: res.latitude,
                                                                        lng: res.longitude,
                                                                    });
                                                                    callback()
                                                                }
                                                            })
                                                        },
                                                    })
                                                } else {
                                                    wx.showToast({
                                                        title: '授权失败',
                                                        icon: 'success',
                                                        duration: 1000
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    },
                    fail: function (res) {
                        wx.showToast({
                            title: '调用授权窗口失败',
                            icon: 'success',
                            duration: 1000
                        })
                    }
                })
            }
        })
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