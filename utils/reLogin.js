let appData = getApp().globalData;
/**
 * 小程序wx.login登录
 */
function reLogin(func) {
  wx.login({
    success: res => {
      if (res.code) {
        wx.request({
          url: appData.url + '/api/shop/sns/wx/mpSessionKey',
          data: {
            code: res.code,
          },
          success: res => { // 登录成功，则将返回的数据openId, sessionKey, unionId赋值给全局数据
            console.log('重新登录', res);
            if (res.data.wxuser) {
              appData.openid = res.data.wxuser.openid;
              appData.session_key = res.data.wxuser.session_key;
              appData.unionid = res.data.wxuser.unionid;
              reqLoginUsersns(func);

            }
          }
        });
      } else {
        console.log('登录失败！' + res.errMsg)
      }
    }
  });
}

/**
 * 用户信息登录
 * 参数func：登录成功后的处理函数
 */
function reqLoginUsersns(func) {

  wx.request({
    method: 'POST',
    url: appData.url + '/api/shop/sns/wx/wxAppletLogin',
    data: {
      nickname: appData.userInfo.nickName,
      sex: appData.userInfo.gender,
      headimg: appData.userInfo.avatarUrl,
      unionid: appData.unionid,
      openid: appData.openid,
      city: appData.userInfo.city,
      province: appData.userInfo.province,
      country: appData.userInfo.country,
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
        func(res);
      }
    }
  })



  /** 旧登录接口---不用 */
  // wx.request({
  //   url: appData.url + '/api/shop/sns/wx/loginUsersns',
  //   data: {
  //     nickname: appData.userInfo.nickName,
  //     sex: appData.userInfo.gender,
  //     headimg: appData.userInfo.avatarUrl,
  //     unionid: appData.unionid,
  //     openid: appData.openid,
  //     city: appData.userInfo.city,
  //     province: appData.userInfo.province,
  //     country: appData.userInfo.China,
  //     stype: 'WXG',
  //   },
  //   method: 'POST',
  //   header: {
  //     'content-type': 'application/x-www-form-urlencoded'
  //   },
  //   success: res => {
  //     console.log('loginUsersns登录：', res);
  //     console.log('loginUsersns登录【tokenid】值：', res.data.tokenid);
  //     if (res.data.code === 200) {
  //       wx.setStorage({
  //         key: "logininfo",
  //         data: {
  //           tokenid: res.data.tokenid,    //登陆凭证
  //           userAgent: res.data.userAgent,  //设备信息
  //           passIdStr: res.data.member.passIdStr, //通行证ID字符串
  //         }
  //       });
  //       func(res);
  //     }
  //   }
  // });


}
module.exports = {
  login: reLogin,
  loginUsersns: reqLoginUsersns
}