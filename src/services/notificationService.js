/**
 * notificationService.js - 通知服务
 * 
 * 处理系统通知和浏览器内通知的显示
 */

import { MENU_ID, NOTIFICATION_TYPES } from '../utils/constants.js'

/**
 * 显示通知消息
 * 
 * @param {Object} tab - 当前标签页信息
 * @param {string} message - 要显示的消息
 * @param {string} notificationType - 通知类型 (system 或 browser)
 */
export async function showNotification(tab, message, notificationType = NOTIFICATION_TYPES.SYSTEM) {
  if (notificationType === NOTIFICATION_TYPES.SYSTEM) {
    // 使用系统通知
    showSystemNotification(message)
  } else if (notificationType === NOTIFICATION_TYPES.BROWSER) {
    // 尝试使用浏览器内通知，如果失败则回退到系统通知
    try {
      // 检查标签页是否可用
      const tabInfo = await checkTabAvailability(tab.id)
      
      if (!tabInfo) {
        // 标签页不可用，使用系统通知
        showSystemNotification(message)
        return
      }
      
      // 尝试发送浏览器内通知消息
      await sendBrowserNotification(tab.id, message)
    } catch (error) {
      console.error('发送通知时出错:', error)
      // 仅当发生错误时才回退到系统通知
      showSystemNotification(message)
    }
  }
}

/**
 * 显示系统级通知
 * 
 * @param {string} message - 要显示的消息内容
 */
function showSystemNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('public/assets/icon.png'),
    title: '自动收藏',
    message: message
  })
}

/**
 * 检查标签页是否可用
 * 
 * @param {number} tabId - 标签页ID
 * @returns {Promise<Object|null>} - 标签页信息或null
 */
function checkTabAvailability(tabId) {
  return new Promise(resolve => {
    chrome.tabs.get(tabId, (info) => {
      if (chrome.runtime.lastError || !info || info.status !== 'complete') {
        resolve(null)
      } else {
        resolve(info)
      }
    })
  })
}

/**
 * 向标签页发送浏览器内通知
 * 
 * @param {number} tabId - 标签页ID
 * @param {string} message - 通知消息
 * @returns {Promise<any>} - 响应结果
 */
function sendBrowserNotification(tabId, message) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(
      tabId, 
      { id: MENU_ID, message }, 
      response => resolve(response)
    )
  })
} 