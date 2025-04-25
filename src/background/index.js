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
import { getAllFolders, createBookmark } from '../utils/bookmarks.js'
import { classifyWebsite, generateBookmarkTitle } from '../services/aiService.js'
import { showNotification } from '../services/notificationService.js'
import { showConfirmDialog } from '../services/dialogService.js'

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
  try {
    // 尝试直接发送消息获取内容
    const response = await chrome.tabs.sendMessage(tabId, {
      id: MENU_ID,
      action: 'getPageContent'
    });
    return response && response.content ? response.content : '';
  } catch (error) {
    // 如果失败，可能是内容脚本未注入，尝试动态注入
    console.log('首次获取页面内容失败，尝试注入内容脚本:', error?.message);
    return new Promise((resolve) => {
      chrome.scripting.executeScript({ target: { tabId }, files: ['dist/content.js'] }, async () => {
        if (chrome.runtime.lastError) {
          console.log('注入内容脚本失败:', chrome.runtime.lastError.message);
          resolve('');
        } else {
          try {
            const resp = await chrome.tabs.sendMessage(tabId, { id: MENU_ID, action: 'getPageContent' });
            resolve(resp && resp.content ? resp.content : '');
          } catch (err) {
            console.error('再次获取页面内容失败:', err);
            resolve('');
          }
        }
      });
    });
  }
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
  let message = ''
  
  // 检查必要的配置是否已设置
  if (!config.chatUrl) {
    message = '请先设置 AI api 地址！'
    showNotification(tab, message, config.notificationType)
  } else if (!config.apiKey) {
    message = '请先设置 AI api key！'
    showNotification(tab, message, config.notificationType)
  } else if (!config.model) {
    message = '请先设置 AI model！'
    showNotification(tab, message, config.notificationType)
  } else {
    try {
      // 获取当前标签页的标题和URL
      const { title, url } = tab
      
      // 获取页面内容
      const pageContent = await getPageContent(tab.id)
      
      // 获取所有书签文件夹
      const folders = await getAllFolders()
      
      // 根据是否启用标题生成来决定API调用方式
      let path, bookmarkTitle;
      
      if (config.enableTitleGen !== false) {
        // 并行执行AI服务调用
        [path, bookmarkTitle] = await Promise.all([
          // 获取推荐路径
          classifyWebsite(config, folders.map(i => i.path), title, pageContent),
          // 生成书签标题
          generateBookmarkTitle(config, title, pageContent)
        ]);
      } else {
        // 只调用路径分类
        path = await classifyWebsite(config, folders.map(i => i.path), title, pageContent);
        bookmarkTitle = title; // 使用原始标题
      }
      
      // 查找匹配的文件夹对象
      const folder = folders.find(i => i.path === path)
      
      if (!folder) {
        // 如果找不到匹配的文件夹，返回AI推荐的路径
        message = `书签栏中未发现合适的网站目录，AI 推荐目录路径为: ${path}`
        showNotification(tab, message, config.notificationType)
      } else {
        // 找到匹配的文件夹，显示确认对话框让用户编辑标题
        const confirmed = await showConfirmDialog(tab, config.enableTitleGen !== false ? bookmarkTitle : title, url, path)
        
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
  }
}) 