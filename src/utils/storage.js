/**
 * storage.js - 存储工具模块
 * 
 * 提供操作Chrome本地存储的工具函数
 */

import { MENU_ID, DEFAULT_API_URL, DEFAULT_MODEL, DEFAULT_NOTIFICATION_TYPE, DEFAULT_NEW_PATH_ROOT_ID } from './constants.js'

/**
 * 从Chrome本地存储中获取扩展配置
 * 
 * @returns {Promise<Object>} 返回存储的配置对象，若不存在则返回默认配置
 */
export async function getConfig() {
  // 使用Chrome存储API获取数据
  const res = await chrome.storage.local.get(MENU_ID)
  // 如果数据不存在，返回默认配置
  const config = res[MENU_ID] || {}
  
  // 设置默认值
  if (!config.chatUrl) config.chatUrl = DEFAULT_API_URL
  if (!config.model) config.model = DEFAULT_MODEL
  if (config.notificationType === undefined) config.notificationType = DEFAULT_NOTIFICATION_TYPE
  if (!config.newPathRootId) config.newPathRootId = DEFAULT_NEW_PATH_ROOT_ID
  if (config.enableTitleGen === undefined) config.enableTitleGen = true
  if (config.enableSmartPath === undefined) config.enableSmartPath = true
  
  return config
}

/**
 * 将配置保存到Chrome本地存储
 * 
 * @param {Object} config - 要保存的配置对象
 * @returns {Promise<void>} 存储操作的Promise
 */
export async function saveConfig(config) {
  // 使用Chrome存储API保存数据，以MENU_ID为键
  return await chrome.storage.local.set({ [MENU_ID]: config })
} 