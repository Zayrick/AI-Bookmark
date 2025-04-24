/// <reference path="../../node_modules/chrome-types/index.d.ts" />
/**
 * content/index.js - 内容脚本入口
 * 
 * 这个文件作为内容脚本注入到网页中执行
 * 主要功能是处理浏览器内通知和确认对话框，以及提取网页内容
 */

import { MENU_ID } from '../utils/constants.js'
import { createNotification } from './notification.js'
import { createConfirmDialog } from './dialog.js'

/**
 * 提取网页的主要文本内容
 * 
 * @returns {string} 提取的网页文本内容
 */
function extractPageContent() {
  try {
    // 获取页面主体内容
    const body = document.body
    
    // 需要排除的不相关元素
    const elementsToSkip = [
      'script', 'style', 'noscript', 'iframe', 'header', 'footer', 
      'nav', 'aside', 'svg', 'form', 'input', 'button'
    ]
    
    // 创建一个新的body副本，以便我们可以安全地修改它
    const bodyClone = body.cloneNode(true)
    
    // 移除不需要的元素
    elementsToSkip.forEach(tag => {
      const elements = bodyClone.querySelectorAll(tag)
      elements.forEach(el => el.remove())
    })
    
    // 提取文本内容
    let content = bodyClone.innerText || bodyClone.textContent || ''
    
    // 清理文本内容（移除多余空白、限制长度等）
    content = content.replace(/\s+/g, ' ').trim()
    
    // 限制内容长度，防止数据过大（约2000字或4000字节）
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...'
    }
    
    return content
  } catch (error) {
    console.error('提取网页内容时出错:', error)
    return ''
  }
}

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
      } else if (request.action === 'getPageContent') {
        // 提取并返回网页内容
        const content = extractPageContent()
        sendResponse({ content })
        return false
      } else if (request.message) {
        // 显示浏览器内通知
        createNotification(request.message)
      }
    }
  })
})() 