/**
 * dialogService.js - 对话框服务
 * 
 * 处理确认对话框的显示和用户交互
 */

import { MENU_ID } from '../utils/constants.js'

/**
 * 显示确认对话框，允许用户确认并编辑书签标题
 * 
 * @param {Object} tab - 当前标签页信息 
 * @param {string} title - 页面标题
 * @param {string} url - 页面URL
 * @param {string} path - 收藏夹位置路径
 * @returns {Promise<Object>} 用户确认结果和编辑后的标题
 */
export function showConfirmDialog(tab, title, url, path) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tab.id,
      { 
        id: MENU_ID, 
        action: 'confirmBookmark',
        title: title,
        url: url,
        path: path
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log('消息发送失败:', chrome.runtime.lastError.message)
          // 如果无法发送消息，默认为确认添加
          resolve({ confirmed: true, title: title })
        } else {
          resolve(response || { confirmed: false })
        }
      }
    )
  })
} 