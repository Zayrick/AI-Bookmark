/**
 * popup/index.js - 弹出窗口脚本入口
 * 
 * 处理扩展的弹出窗口界面交互
 */

import { getConfig, saveConfig } from '../utils/storage.js'
import { NOTIFICATION_TYPES } from '../utils/constants.js'
import { getAllFolders, createBookmark } from '../utils/bookmarks.js'
import { classifyWebsite } from '../services/aiService.js'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init)

/**
 * 初始化函数，从本地存储加载配置并填充表单
 * 在窗口打开时执行
 */
async function init() {
  // 获取DOM元素引用
  const urlInput = document.getElementById('chatUrl')     // API URL输入框
  const keyInput = document.getElementById('apiKey')      // API KEY输入框
  const modelInput = document.getElementById('modelInput')     // 模型输入框
  const modelSelect = document.getElementById('modelSelect')   // 模型选择下拉框
  const systemNotification = document.getElementById('systemNotification')  // 系统通知单选框
  const browserNotification = document.getElementById('browserNotification')  // 浏览器通知单选框
  const bookmarkButton = document.getElementById('bookmarkButton')  // 收藏按钮
  
  // 从本地存储获取配置
  const config = await getConfig()
  
  // 使用存储的值填充表单字段
  urlInput.value = config.chatUrl || ''
  keyInput.value = config.apiKey || ''
  modelInput.value = config.model || ''
  
  // 设置通知类型选择
  const notificationType = config.notificationType || NOTIFICATION_TYPES.SYSTEM
  if (notificationType === NOTIFICATION_TYPES.SYSTEM) {
    systemNotification.checked = true
  } else if (notificationType === NOTIFICATION_TYPES.BROWSER) {
    browserNotification.checked = true
  }
  
  // 为各输入元素添加变更事件监听器
  urlInput.addEventListener('change', (e) => updateConfig('chatUrl', e.target.value))
  keyInput.addEventListener('change', (e) => updateConfig('apiKey', e.target.value))
  modelInput.addEventListener('change', (e) => updateConfig('model', e.target.value))
  
  // 为模型选择下拉框添加事件监听
  modelSelect.addEventListener('change', function() {
    if (this.value) {
      modelInput.value = this.value
      // 触发change事件以保存选择
      modelInput.dispatchEvent(new Event('change'))
      // 重置选择框
      this.value = ""
    }
  })
  
  // 为通知类型单选框添加事件监听
  systemNotification.addEventListener('change', () => {
    if (systemNotification.checked) {
      updateConfig('notificationType', NOTIFICATION_TYPES.SYSTEM)
    }
  })
  
  browserNotification.addEventListener('change', () => {
    if (browserNotification.checked) {
      updateConfig('notificationType', NOTIFICATION_TYPES.BROWSER)
    }
  })
  
  // 为收藏按钮添加点击事件
  bookmarkButton.addEventListener('click', handleBookmark)
}

/**
 * 处理收藏按钮点击事件
 */
async function handleBookmark() {
  try {
    console.log('开始处理收藏按钮点击事件');
    // 获取当前配置
    const config = await getConfig()
    console.log('获取到配置:', { 
      chatUrl: config.chatUrl ? '已设置' : '未设置', 
      apiKey: config.apiKey ? '已设置' : '未设置',
      model: config.model
    });
    
    // 验证必要配置
    if (!config.chatUrl) {
      showPopupMessage('请先设置 AI api 地址！', 'error')
      return
    } 
    
    if (!config.apiKey) {
      showPopupMessage('请先设置 AI api key！', 'error')
      return
    }
    
    if (!config.model) {
      showPopupMessage('请先设置 AI model！', 'error')
      return
    }
    
    console.log('准备获取当前标签页信息...');
    
    try {
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('chrome.tabs.query 返回结果:', tabs);
      
      if (!tabs || tabs.length === 0) {
        showPopupMessage('无法获取当前标签页信息', 'error');
        return;
      }
      
      const tab = tabs[0];
      
      // 检查tab对象的完整性
      console.log('获取到标签页对象:', {
        id: tab.id,
        title: tab.title, 
        url: tab.url,
        完整对象: tab
      });
      
      // 获取页面标题和URL并确保它们存在
      const title = tab.title || ''
      const url = tab.url || ''
      
      if (!url) {
        showPopupMessage('无法获取当前页面URL', 'error')
        return
      }
      
      console.log('当前页面信息:', { title, url })
      
      // 显示处理中消息
      showPopupMessage('正在处理...', 'info')
      
      // 获取所有书签文件夹
      console.log('准备获取书签文件夹...');
      const folders = await getAllFolders()
      if (!folders || folders.length === 0) {
        showPopupMessage('未找到任何书签文件夹', 'error')
        return
      }
      
      console.log('获取到的文件夹:', folders.length, '个');
      
      // 调用AI接口获取最合适的文件夹路径
      console.log('准备调用AI服务...');
      const path = await classifyWebsite(config, folders.map(i => i.path), title)
      if (!path) {
        showPopupMessage('AI无法确定合适的文件夹路径', 'error')
        return
      }
      
      console.log('AI推荐路径:', path)
      
      // 查找匹配的文件夹对象
      const folder = folders.find(i => i.path === path)
      console.log('匹配的文件夹:', folder);
      
      if (!folder) {
        showPopupMessage(`书签栏中未发现合适的网站目录，AI 推荐目录路径为: ${path}`, 'warning')
      } else {
        // 在popup中显示确认对话
        showBookmarkConfirmDialog(title, url, path, folder.id)
      }
    } catch (innerErr) {
      console.error('获取标签页信息时出错:', innerErr);
      showPopupMessage(`获取标签页信息失败: ${innerErr.message || innerErr.valueOf()}`, 'error');
    }
  } catch (err) {
    console.error('收藏过程发生错误:', err)
    showPopupMessage(`收藏失败！${err.message || err.valueOf()}`, 'error')
  }
}

/**
 * 显示书签确认对话框
 * 
 * @param {string} title - 页面标题
 * @param {string} url - 页面URL
 * @param {string} path - 文件夹路径
 * @param {string} folderId - 文件夹ID
 */
function showBookmarkConfirmDialog(title, url, path, folderId) {
  try {
    // 确保所有参数都有值
    title = title || '无标题';
    url = url || '';
    path = path || '未知路径';
    
    if (!folderId) {
      showPopupMessage('无效的文件夹ID', 'error');
      return;
    }
    
    // 隐藏设置表单
    const formGroups = document.querySelectorAll('.form-group:not(:last-child)')
    formGroups.forEach(el => el.style.display = 'none')
    
    // 更改页面标题
    document.querySelector('h2').textContent = '确认收藏'
    
    // 创建确认对话框
    const dialogDiv = document.createElement('div')
    dialogDiv.className = 'confirm-dialog'
    dialogDiv.innerHTML = `
      <div class="form-group">
        <label class="form-label">收藏标题</label>
        <input id="bookmarkTitle" type="text" class="form-control" value="${escapeHTML(title)}">
      </div>
      <div class="form-group">
        <p class="form-hint">URL: ${escapeHTML(url)}</p>
        <p class="form-hint">将收藏到: ${escapeHTML(path)}</p>
      </div>
      <div class="form-group" style="display: flex; gap: 10px;">
        <button id="confirmButton" class="btn-primary" style="flex: 1;">确认</button>
        <button id="cancelButton" style="flex: 1; padding: 10px; background-color: #f1f1f1; color: #333; border: none; border-radius: 4px; cursor: pointer;">取消</button>
      </div>
    `
    
    // 隐藏原来的收藏按钮
    document.getElementById('bookmarkButton').style.display = 'none'
    
    // 添加确认对话框到页面
    document.body.insertBefore(dialogDiv, document.querySelector('script'))
    
    // 添加确认和取消按钮事件
    document.getElementById('confirmButton').addEventListener('click', async () => {
      const newTitle = document.getElementById('bookmarkTitle').value.trim()
      if (newTitle) {
        try {
          await createBookmark(folderId, newTitle, url)
          showPopupMessage(`已收藏至：${path}`, 'success')
          // 短暂延迟后关闭popup
          setTimeout(() => window.close(), 1500)
        } catch (err) {
          console.error('创建书签失败:', err)
          showPopupMessage(`收藏失败！${err.message || err.valueOf()}`, 'error')
          resetPopup()
        }
      } else {
        showPopupMessage('书签标题不能为空', 'error')
      }
    })
    
    document.getElementById('cancelButton').addEventListener('click', resetPopup)
  } catch (err) {
    console.error('显示确认对话框失败:', err)
    showPopupMessage(`操作失败：${err.message || err.valueOf()}`, 'error')
    resetPopup()
  }
}

/**
 * 重置popup页面到初始状态
 */
function resetPopup() {
  // 移除确认对话框
  const dialogDiv = document.querySelector('.confirm-dialog')
  if (dialogDiv) dialogDiv.remove()
  
  // 显示原表单
  const formGroups = document.querySelectorAll('.form-group')
  formGroups.forEach(el => el.style.display = '')
  
  // 恢复页面标题
  document.querySelector('h2').textContent = 'AI 书签助手设置'
  
  // 显示收藏按钮
  document.getElementById('bookmarkButton').style.display = ''
  
  // 移除任何消息提示
  const messageDiv = document.getElementById('messageDiv')
  if (messageDiv) messageDiv.remove()
}

/**
 * 显示popup内的消息提示
 * 
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (info, success, warning, error)
 */
function showPopupMessage(message, type = 'info') {
  // 移除现有消息
  const existingMsg = document.getElementById('messageDiv')
  if (existingMsg) existingMsg.remove()
  
  // 创建消息元素
  const messageDiv = document.createElement('div')
  messageDiv.id = 'messageDiv'
  messageDiv.style.padding = '10px'
  messageDiv.style.margin = '10px 0'
  messageDiv.style.borderRadius = '4px'
  messageDiv.style.textAlign = 'center'
  
  // 设置样式根据消息类型
  switch (type) {
    case 'success':
      messageDiv.style.backgroundColor = '#d4edda'
      messageDiv.style.color = '#155724'
      break
    case 'warning':
      messageDiv.style.backgroundColor = '#fff3cd'
      messageDiv.style.color = '#856404'
      break
    case 'error':
      messageDiv.style.backgroundColor = '#f8d7da'
      messageDiv.style.color = '#721c24'
      break
    default: // info
      messageDiv.style.backgroundColor = '#d1ecf1'
      messageDiv.style.color = '#0c5460'
  }
  
  messageDiv.textContent = message
  
  // 添加到页面顶部
  document.body.insertBefore(messageDiv, document.body.firstChild)
  
  // 如果是成功消息，设置自动消失
  if (type === 'success') {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, 3000)
  }
}

/**
 * 转义HTML特殊字符，防止XSS
 * 
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHTML(str) {
  if (str === undefined || str === null) {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 更新配置的函数
 * 
 * @param {string} key - 配置项的键名
 * @param {string} value - 新的配置值
 */
async function updateConfig(key, value) {
  // 获取当前配置
  const config = await getConfig()
  
  // 更新特定配置项
  config[key] = value
  
  // 保存配置到本地存储
  await saveConfig(config)
} 