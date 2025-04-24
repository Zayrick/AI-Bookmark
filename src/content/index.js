/// <reference path="../../node_modules/chrome-types/index.d.ts" />
/**
 * content/index.js - 内容脚本入口
 * 
 * 这个文件作为内容脚本注入到网页中执行
 * 主要功能是处理浏览器内通知和确认对话框
 */

import { MENU_ID } from '../utils/constants.js'
import { createNotification } from './notification.js'
import { createConfirmDialog } from './dialog.js'

/**
 * 立即执行函数，创建一个独立的作用域
 * 防止变量污染网页的全局命名空间
 */
(() => {
  /**
   * 注册消息监听器，处理来自后台脚本的消息
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 验证消息是否来自我们的插件并且包含正确的ID
    if (request && request.id === MENU_ID) {
      if (request.action === 'confirmBookmark') {
        // 显示自定义对话框让用户确认并编辑标题
        createConfirmDialog(request.title, request.url, request.path, sendResponse)
        return true // 保持通道开放，等待异步响应
      } else if (request.message) {
        // 显示浏览器内通知
        createNotification(request.message)
      }
    }
  })
})() 