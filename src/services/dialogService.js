/**
 * dialogService.js - 对话框服务
 * 
 * 处理确认对话框的显示和用户交互
 */

import { MENU_ID } from '../utils/constants.js'
import { sendMessageWithInjection } from '../utils/messaging.js'

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
  return sendMessageWithInjection(tab.id, {
    id: MENU_ID,
    action: 'confirmBookmark',
    title,
    url,
    path
  }).then(response => {
    if (!response) {
      // 如果响应为空，表示无法显示对话框，直接添加书签
      return { confirmed: true, title }
    }
    return response
  })
} 