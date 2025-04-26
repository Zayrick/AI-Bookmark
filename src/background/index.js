/// <reference path="../../node_modules/chrome-types/index.d.ts" />
/**
 * background/index.js - 扩展的后台脚本入口
 * 
 * 这个文件是扩展的核心，作为后台服务运行，负责：
 * 1. 创建右键菜单
 * 2. 处理菜单点击事件
 * 3. 调用AI服务进行分类
 * 4. 创建新的书签
 */

import { MENU_ID } from '../utils/constants.js'
import { getConfig, saveConfig } from '../utils/storage.js'
import { getAllFolders, createBookmark, ensureFolderPath } from '../utils/bookmarks.js'
import { classifyWebsite, generateBookmarkTitle, smartPathClassifyWebsite } from '../services/aiService.js'
import { showNotification } from '../services/notificationService.js'
import { showConfirmDialog } from '../services/dialogService.js'
import { sendMessageWithInjection } from '../utils/messaging.js'
import { validateAIConfig } from '../utils/validation.js'

/**
 * 扩展安装或更新时触发的事件
 * 执行初始化操作：设置默认配置，创建右键菜单
 */
chrome.runtime.onInstalled.addListener(async () => {
  // 获取本地存储的配置并初始化默认值
  const config = await getConfig()
  await saveConfig(config)
  
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: MENU_ID,         
    title: '自动收藏',     
    type: 'normal'        
  })
})

/**
 * 获取当前标签页的页面内容
 * 
 * @param {number} tabId - 标签页ID
 * @returns {Promise<string>} 页面内容
 */
async function getPageContent(tabId) {
  const response = await sendMessageWithInjection(tabId, {
    id: MENU_ID,
    action: 'getPageContent'
  });
  return response && response.content ? response.content : '';
}

/**
 * 响应右键菜单点击事件的监听器
 * 处理自动收藏功能的核心逻辑
 */
chrome.contextMenus.onClicked.addListener(async (item, tab) => {
  // 检查是否是我们的菜单项，且有有效的标签页
  if (item.menuItemId !== MENU_ID || !tab) return
  
  // 获取存储的配置信息
  const config = await getConfig()
  const validationMessage = validateAIConfig(config)
  
  if (validationMessage) {
    showNotification(tab, validationMessage, config.notificationType)
    return
  }
  
  let message = ''
  
  try {
    // 获取当前标签页的标题和URL
    const { title, url } = tab
    
    // 获取页面内容
    const pageContent = await getPageContent(tab.id)
    
    // 获取所有书签文件夹
    const folders = await getAllFolders()
    
    // 调用AI分类服务，根据是否启用智能路径推荐来选择调用方式
    let result;
    if (config.enableSmartPath !== false) {
      // 启用智能路径推荐，允许生成新路径
      result = await smartPathClassifyWebsite(config, folders.map(i => i.path), title, pageContent, config.enableTitleGen !== false);
    } else {
      // 禁用智能路径推荐，仅在现有路径中选择
      result = await classifyWebsite(config, folders.map(i => i.path), title, pageContent, false, config.enableTitleGen !== false);
    }
    
    let path, bookmarkTitle;
    
    // 检查结果格式并提取路径和标题
    if (typeof result === 'object' && result.path) {
      // 新格式：{path, title}
      path = result.path;
      bookmarkTitle = result.title || title;
    } else {
      // 旧格式：直接是路径字符串
      path = result;
      // 如果启用了标题生成，则单独调用标题生成服务
      bookmarkTitle = config.enableTitleGen !== false 
        ? await generateBookmarkTitle(config, title, pageContent)
        : title;
    }
    
    // 查找匹配的文件夹对象
    const folder = folders.find(i => i.path === path)
    
    if (!folder) {
      if (config.enableSmartPath !== false) {
        try {
          const confirmed = await showConfirmDialog(tab, bookmarkTitle, url, path)
          if (confirmed.confirmed) {
            const newFolderId = await ensureFolderPath(path)
            await createBookmark(newFolderId, confirmed.title, url)
            message = `已收藏至：${path}`
            showNotification(tab, message, config.notificationType)
          }
        } catch (errCreate) {
          message = `无法创建新的文件夹路径: ${errCreate.message || errCreate.valueOf()}`
          showNotification(tab, message, config.notificationType)
        }
      } else {
        // 如果找不到匹配的文件夹，返回AI推荐的路径
        message = `书签栏中未发现合适的网站目录，AI 推荐目录路径为: ${path}`
        showNotification(tab, message, config.notificationType)
      }
    } else {
      // 找到匹配的文件夹，显示确认对话框让用户编辑标题
      const confirmed = await showConfirmDialog(tab, bookmarkTitle, url, path)
      
      if (confirmed.confirmed) {
        // 用户确认添加，使用可能编辑过的标题
        await createBookmark(folder.id, confirmed.title, url)
        message = `已收藏至：${path}`
        showNotification(tab, message, config.notificationType)
      }
    }
  } catch (err) {
    // 处理错误情况
    console.error(err)
    message = `收藏失败！\n${err.valueOf()}`
    showNotification(tab, message, config.notificationType)
  }
}) 