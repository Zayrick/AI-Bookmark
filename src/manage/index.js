// src/manage/index.js
// 书签整理页入口脚本
import { getConfig } from '../utils/storage.js'
import { processBookmarkOrganizing } from '../services/aiService.js'

// 全局变量
let bookmarkNodes = []; // 保存完整书签树数据
let allBookmarks = []; // 所有书签的扁平数组，用于搜索

/**
 * 递归生成书签树 HTML
 * @param {Array<chrome.bookmarks.BookmarkTreeNode>} nodes
 * @param {number} depth
 * @returns {string}
 */
function renderTree(nodes, depth = 0) {
  if (!nodes) return ''
  
  return nodes.map(node => {
    const indent = '&nbsp;'.repeat(depth * 2)
    const id = `node-${node.id}`
    
    if (node.url) {
      // 普通书签
      return `<div class="bookmark-item" id="${id}" data-id="${node.id}" data-url="${escapeHTML(node.url)}">${indent}<span class="url">🔗</span> ${escapeHTML(node.title || node.url)}</div>`
    }
    
    // 文件夹
    const childrenHtml = node.children ? renderTree(node.children, depth + 1) : ''
    return `<div class="folder-item" id="${id}" data-id="${node.id}" data-expanded="true">${indent}<span class="folder">📁</span> ${escapeHTML(node.title || '未命名文件夹')}</div>${childrenHtml}`
  }).join('')
}

/**
 * 添加书签树事件监听
 */
function addTreeEventListeners() {
  // 获取所有书签和文件夹项
  const items = document.querySelectorAll('.bookmark-item, .folder-item')
  
  // 为每个项目添加点击事件
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      
      // 移除之前的选中
      document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
      
      // 添加选中效果
      item.classList.add('selected')
      
      // 如果是书签，显示URL
      if (item.classList.contains('bookmark-item')) {
        console.log('选中书签:', item.textContent.trim(), item.dataset.url)
      }
      
      // 如果是文件夹，切换展开/折叠状态（未实现）
    })
  })
  
  // 添加搜索框功能
  const searchBox = document.getElementById('searchBox')
  if (searchBox) {
    searchBox.addEventListener('input', () => {
      const searchTerm = searchBox.value.toLowerCase().trim()
      filterBookmarks(searchTerm)
    })
  }
}

/**
 * 过滤书签显示
 * @param {string} searchTerm
 */
function filterBookmarks(searchTerm) {
  const treeContainer = document.querySelector('.tree-container')
  
  // 如果搜索词为空，显示完整树
  if (!searchTerm) {
    treeContainer.innerHTML = `<div class="tree-root">${renderTree(bookmarkNodes)}</div>`
    addTreeEventListeners()
    return
  }
  
  // 搜索书签
  const results = allBookmarks.filter(bookmark => 
    (bookmark.title && bookmark.title.toLowerCase().includes(searchTerm)) || 
    (bookmark.url && bookmark.url.toLowerCase().includes(searchTerm))
  )
  
  // 构建搜索结果HTML
  if (results.length > 0) {
    const resultsHtml = results.map(bookmark => 
      `<div class="bookmark-item" id="node-${bookmark.id}" data-id="${bookmark.id}" data-url="${escapeHTML(bookmark.url)}">
        <span class="url">🔍</span> ${escapeHTML(bookmark.title || bookmark.url)}
        <div style="font-size:12px;color:#666;margin-left:24px;">${escapeHTML(bookmark.url)}</div>
       </div>`
    ).join('')
    
    treeContainer.innerHTML = `
      <div class="search-results">
        <div style="font-size:14px;margin-bottom:10px;color:#666;">找到 ${results.length} 个结果：</div>
        ${resultsHtml}
      </div>
    `
  } else {
    treeContainer.innerHTML = `<div class="no-results">没有找到匹配"${escapeHTML(searchTerm)}"的书签</div>`
  }
  
  addTreeEventListeners()
}

/**
 * 递归收集所有书签节点到扁平数组
 * @param {Array<chrome.bookmarks.BookmarkTreeNode>} nodes
 */
function collectAllBookmarks(nodes) {
  if (!nodes) return
  
  nodes.forEach(node => {
    if (node.url) {
      // 仅添加书签，不添加文件夹
      allBookmarks.push(node)
    }
    
    if (node.children) {
      collectAllBookmarks(node.children)
    }
  })
}

/**
 * 初始化函数
 */
async function init() {
  // 获取书签树容器
  const treeContainer = document.querySelector('.tree-container')
  
  try {
    // 获取书签树
    bookmarkNodes = await chrome.bookmarks.getTree()
    
    // 收集所有书签到扁平数组
    collectAllBookmarks(bookmarkNodes)
    
    // 渲染树
    treeContainer.innerHTML = `<div class="tree-root">${renderTree(bookmarkNodes)}</div>`
    
    // 添加事件监听
    addTreeEventListeners()
    
    // 初始化聊天功能
    initChatUI()
  } catch (err) {
    console.error('加载书签树失败', err)
    treeContainer.innerHTML = `<div class="error">无法加载书签树: ${err.message || err.valueOf()}</div>`
  }
}

/**
 * 初始化聊天界面
 */
function initChatUI() {
  const chatInput = document.getElementById('chatInput')
  const sendButton = document.getElementById('sendButton')
  const chatMessages = document.getElementById('chatMessages')
  
  // 检查元素是否存在
  if (!chatInput || !sendButton || !chatMessages) {
    console.error('聊天UI元素不存在')
    return
  }
  
  // 发送按钮点击事件
  sendButton.addEventListener('click', () => sendMessage())
  
  // 输入框回车发送，Shift+回车换行
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // 阻止换行
      sendMessage()
    }
  })
  
  /**
   * 发送消息
   */
  async function sendMessage() {
    const message = chatInput.value.trim()
    if (!message) return
    
    // 清空输入框
    chatInput.value = ''
    
    // 添加用户消息到界面
    appendMessage(message, 'user')
    
    // 调用AI处理消息
    try {
      // 临时禁用输入
      chatInput.disabled = true
      sendButton.disabled = true
      
      // 配置检查
      const config = await getConfig()
      if (!config.apiKey || !config.model) {
        appendMessage('无法连接AI，请先在扩展设置中配置API参数（点击右上角设置图标）', 'ai')
        // 恢复输入
        chatInput.disabled = false
        sendButton.disabled = false
        return
      }
      
      // 显示加载中...
      const loadingId = showLoading()
    
      try {
        // 调用后台的agentLoop处理对话
        const response = await processBookmarkOrganizing(message, config, (partialResponse) => {
          // 部分响应回调，移除加载状态并显示部分回复
          removeLoading(loadingId);
          
          // 更新界面上最后一条AI消息，或添加新消息
          const lastAiMessage = chatMessages.querySelector('.message-ai:last-child');
          if (lastAiMessage && lastAiMessage.id !== 'loading-message') {
            const content = lastAiMessage.querySelector('.message-content');
            if (content) {
              content.innerHTML = escapeForHTML(partialResponse);
              return;
            }
          }
          
          // 如果没有最后一条消息，添加新消息
          appendMessage(partialResponse, 'ai');
        });
        
        // 完全处理完成，确保移除加载状态
        removeLoading(loadingId)
        
        // 如果回调过程中已显示了消息，这里就不再显示
        const lastAiMessage = chatMessages.querySelector('.message-ai:last-child');
        if (!lastAiMessage || lastAiMessage.id === 'loading-message') {
          appendMessage(response, 'ai')
        }
      } catch (error) {
        removeLoading(loadingId)
        appendMessage(`处理失败: ${error.message || error.valueOf()}`, 'ai')
      } finally {
        // 恢复输入状态
        chatInput.disabled = false
        sendButton.disabled = false
      }
    } catch (err) {
      console.error('处理消息失败', err)
      appendMessage(`处理失败: ${err.message || err.valueOf()}`, 'ai')
      
      // 恢复输入
      chatInput.disabled = false
      sendButton.disabled = false
    }
  }
  
  /**
   * 添加消息到界面
   * @param {string} content 消息内容
   * @param {string} sender 发送者 ('user'|'ai')
   */
  function appendMessage(content, sender) {
    const messageDiv = document.createElement('div')
    messageDiv.className = `message message-${sender}`
    messageDiv.innerHTML = `<p class="message-content">${escapeForHTML(content)}</p>`
    chatMessages.appendChild(messageDiv)
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
  
  /**
   * 显示加载中动画，返回唯一ID
   * @returns {string} 加载项ID
   */
  function showLoading() {
    const id = 'loading-' + Date.now()
    const loadingDiv = document.createElement('div')
    loadingDiv.className = 'message message-ai'
    loadingDiv.setAttribute('id', 'loading-message')
    loadingDiv.dataset.uniqueId = id
    loadingDiv.innerHTML = `<p class="message-content">思考中<span class="loading-dots">...</span></p>`
    chatMessages.appendChild(loadingDiv)
    
    // 动画效果
    let dots = 0
    const dotsElement = loadingDiv.querySelector('.loading-dots')
    const interval = setInterval(() => {
      dots = (dots + 1) % 4
      dotsElement.textContent = '.'.repeat(dots)
    }, 500)
    
    // 保存interval ID
    loadingDiv.dataset.interval = interval
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight
    
    return id
  }
  
  /**
   * 移除加载中动画
   * @param {string} id 加载项ID
   */
  function removeLoading(id) {
    const loadingDiv = document.getElementById('loading-message')
    if (loadingDiv) {
      // 清除动画interval
      clearInterval(loadingDiv.dataset.interval)
      loadingDiv.remove()
    }
  }
}

/**
 * HTML转义函数，防止XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 转义文本用于HTML显示，保留换行符
 * @param {string} str
 * @returns {string}
 */
function escapeForHTML(str) {
  if (!str) return ''
  return escapeHTML(str).replace(/\n/g, '<br>')
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init) 