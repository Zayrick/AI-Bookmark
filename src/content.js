/// <reference path="../node_modules/chrome-types/index.d.ts" />
/**
 * content.js - 内容脚本
 * 
 * 这个文件作为内容脚本注入到网页中执行。
 * 主要功能是接收来自后台脚本的消息，并在网页上显示操作结果。
 */

// 导入插件标识常量
import { MENU_ID } from './js/utils'

/**
 * 立即执行函数，创建一个独立的作用域
 * 防止变量污染网页的全局命名空间
 */
(() => {
  /**
   * 注册消息监听器，处理来自后台脚本的消息
   * 
   * @param {Object} request - 接收到的消息对象
   * @param {Object} sender - 消息发送者信息
   * @param {Function} sendResponse - 回复消息的函数
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 验证消息是否来自我们的插件并且包含正确的ID
    if (request && request.id === MENU_ID) {
      // 使用浏览器的alert函数显示消息
      window.alert(request.message)
    }
  })
})()