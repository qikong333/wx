// 【公共模块文件】生成订单的提货码和条形码
var barcode = require('./barcode');

function convert_length(length) {
  return Math.round(wx.getSystemInfoSync().windowWidth * length / 750);
}

/**
 * code.js 中的 barc() 函数
 * 【参数1】id: 画布id
 * 【参数2】code: 提货码
 */
function barc(id, code, width, height) {
  barcode.code128(wx.createCanvasContext(id), code, convert_length(width), convert_length(height))
}

// 对外暴露接口
module.exports = {
  barcode: barc,
}