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
 * @param {string} title - 页面标题或AI生成的标题
 * @param {string} url - 页面URL
 * @param {string} path - 收藏夹位置路径
 * @returns {Promise<Object>} 用户确认结果和编辑后的标题
 */
export function showConfirmDialog(tab, title, url, path) {
  return new Promise((resolve) => {
    // 首先尝试发送消息，如果失败则动态注入内容脚本后再次发送
    function sendMessage() {
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
            resolve({ confirmed: true, title: title })
          } else {
            resolve(response || { confirmed: false })
          }
        }
      )
    }

    chrome.tabs.sendMessage(tab.id, { ping: true }, (res) => {
      if (chrome.runtime.lastError) {
        // 说明内容脚本尚未注入，尝试注入
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['dist/content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('注入内容脚本失败:', chrome.runtime.lastError.message)
            // 注入失败时直接使用系统通知提示
            resolve({ confirmed: true, title: title })
          } else {
            // 注入成功后再次发送消息
            sendMessage()
          }
        })
      } else {
        // 已经有内容脚本，直接发送
        sendMessage()
      }
    })
  })
} 