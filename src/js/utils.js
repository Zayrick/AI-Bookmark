/**
 * utils.js - 工具函数模块
 * 
 * 这个文件提供了扩展程序的通用工具函数和常量，包括:
 * - 插件唯一标识符
 * - 本地存储读写函数
 */

/**
 * 扩展程序的唯一标识符
 * 用于右键菜单ID和本地存储的键名
 */
export const MENU_ID = 'auto-mark'

/**
 * 从Chrome本地存储中获取扩展配置
 * 
 * @returns {Promise<Object>} 返回存储的配置对象，若不存在则返回空对象
 */
export async function getLocal() {
  // 使用Chrome存储API获取数据
  const res = await chrome.storage.local.get(MENU_ID)
  // 如果数据不存在，返回空对象
  return res[MENU_ID] || {}
}

/**
 * 将配置保存到Chrome本地存储
 * 
 * @param {Object} local - 要保存的配置对象
 * @returns {Promise<void>} 存储操作的Promise
 */
export async function setLocal(local) {
  // 使用Chrome存储API保存数据，以MENU_ID为键
  return await chrome.storage.local.set({ [MENU_ID]: local })
}
