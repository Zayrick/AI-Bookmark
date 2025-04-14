/// <reference path="../node_modules/chrome-types/index.d.ts" />
/**
 * background.js - 扩展的后台脚本
 * 
 * 这个文件是扩展的核心，作为后台服务运行，负责：
 * 1. 创建右键菜单
 * 2. 处理菜单点击事件
 * 3. 获取书签树结构
 * 4. 调用AI接口进行分类
 * 5. 创建新的书签
 */

// 导入AI聊天功能模块
import { chat } from './js/chat'
// 导入工具函数和常量
import { MENU_ID, getLocal, setLocal } from './js/utils'

/**
 * 扩展安装或更新时触发的事件
 * 执行初始化操作：设置默认API地址和模型，创建右键菜单
 */
chrome.runtime.onInstalled.addListener(async () => {
  // 获取本地存储的配置
  const local = await getLocal()
  // 设置默认的API地址（如果未设置）
  if (!local.chatUrl) local.chatUrl = 'https://api.openai.com/v1/chat/completions'
  // 设置默认的模型（如果未设置）
  if (!local.model) local.model = 'gpt-3.5-turbo-1106'
  // 保存配置到本地存储
  await setLocal(local)
  
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: MENU_ID,          // 菜单项ID
    title: '自动收藏',     // 显示的菜单文字
    type: 'normal'        // 菜单类型
  })
})

/**
 * 响应右键菜单点击事件的监听器
 * 处理自动收藏功能的核心逻辑
 * 
 * @param {Object} item - 被点击的菜单项信息
 * @param {Object} tab - 当前标签页信息
 */
chrome.contextMenus.onClicked.addListener(async (item, tab) => {
  // 检查是否是我们的菜单项，且有有效的标签页
  if (item.menuItemId !== MENU_ID || !tab) return
  
  // 获取存储的配置信息
  const local = await getLocal()
  let message = ''
  
  // 检查必要的配置是否已设置
  if (!local.chatUrl) {
    message = '请先设置 chatgpt api 地址！'
  } else if (!local.apiKey) {
    message = '请先设置 chatgpt api key！'
  } else if (!local.model) {
    message = '请先设置 chatgpt model！'
  } else {
    try {
      // 获取当前标签页的标题和URL
      const { title, url } = tab
      
      // 获取完整的书签树结构
      const tree = await chrome.bookmarks.getTree()
      
      // 提取所有书签文件夹的路径信息
      const folders = getFolders('', tree)
      
      // 调用AI接口获取最合适的文件夹路径
      const path = await chat(local, folders.map(i => i.path), title)
      
      // 查找匹配的文件夹对象
      const folder = folders.find(i => i.path === path)
      
      if (!folder) {
        // 如果找不到匹配的文件夹，返回AI推荐的路径
        message = `书签栏中未发现合适的网站目录，ChatGPT 推荐目录路径为: ${path}`
      } else {
        // 找到匹配的文件夹，创建新书签
        const id = folder.id
        await chrome.bookmarks.create({
          parentId: id,    // 父文件夹ID
          title,           // 书签标题
          url              // 书签URL
        })
        message = `已收藏至：${path}`  // 操作成功消息
      }
    } catch (err) {
      // 处理错误情况
      console.error(err)
      message = `收藏失败！\n${err.valueOf()}`
    }
  }
  
  // 向内容脚本发送消息，显示操作结果
  chrome.tabs.sendMessage(tab.id, { id: MENU_ID, message })
})

/**
 * 递归提取书签树中所有文件夹的路径信息
 * 
 * @param {string} prePath - 父级路径前缀
 * @param {Array} tree - 书签树节点数组
 * @returns {Array} 包含id和路径的文件夹对象数组
 */
function getFolders(prePath, tree) {
  const folders = []
  
  // 遍历树节点
  tree.forEach(i => {
    // 跳过非文件夹项（有URL的是书签而非文件夹）
    if (i.url) return
    
    // 构建完整路径
    const path = prePath + i.title
    
    // 添加当前文件夹到结果数组
    if (path) folders.push({ id: i.id, path })
    
    // 递归处理子文件夹
    if (i.children) folders.push(...getFolders(path && path + '/', i.children))
  })
  
  return folders
}
