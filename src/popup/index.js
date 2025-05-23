/**
 * popup/index.js - 弹出窗口脚本入口
 * 
 * 处理扩展的弹出窗口界面交互
 */

import { getConfig, saveConfig } from '../utils/storage.js'
import { NOTIFICATION_TYPES } from '../utils/constants.js'
import { getAllFolders, createBookmark, ensureFolderPath } from '../utils/bookmarks.js'
import { classifyWebsite, fetchModelsList, generateBookmarkTitle, smartPathClassifyWebsite } from '../services/aiService.js'
import { validateAIConfig } from '../utils/validation.js'

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
  const modelSearch = document.getElementById('modelSearch')   // 模型搜索框
  const searchModelBtn = document.getElementById('searchModelBtn')  // 模型搜索按钮
  const modelList = document.getElementById('modelList')    // 模型列表容器
  const systemNotification = document.getElementById('systemNotification')  // 系统通知单选框
  const browserNotification = document.getElementById('browserNotification')  // 浏览器通知单选框
  const enableTitleGen = document.getElementById('enableTitleGen')  // 启用标题生成开关
  const enableSmartPath = document.getElementById('enableSmartPath')  // 启用智能路径推荐开关
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

  // 设置标题生成开关状态
  enableTitleGen.checked = config.enableTitleGen !== false  // 默认为true
  enableSmartPath.checked = config.enableSmartPath !== false // 默认为true
  
  // 为各输入元素添加变更事件监听器
  urlInput.addEventListener('change', (e) => updateConfig('chatUrl', e.target.value))
  keyInput.addEventListener('change', (e) => updateConfig('apiKey', e.target.value))
  modelInput.addEventListener('change', (e) => updateConfig('model', e.target.value))
  
  // 为模型搜索添加事件监听
  searchModelBtn.addEventListener('click', async () => {
    await searchModels(urlInput.value, keyInput.value, modelSearch.value);
  });
  
  // 为模型搜索框添加回车事件
  modelSearch.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      await searchModels(urlInput.value, keyInput.value, modelSearch.value);
    }
  });
  
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

  // 为标题生成开关添加事件监听
  enableTitleGen.addEventListener('change', () => {
    updateConfig('enableTitleGen', enableTitleGen.checked)
  })
  
  // 为智能路径推荐开关添加事件监听
  enableSmartPath.addEventListener('change', () => {
    updateConfig('enableSmartPath', enableSmartPath.checked)
  })
  
  // 为收藏按钮添加点击事件
  bookmarkButton.addEventListener('click', handleBookmark)

  // 也可能使用按钮点击事件来跳转页面
  document.getElementById('setupButton')?.addEventListener('click', () => {
    document.body.classList.add('page-transition');
    setTimeout(() => {
      window.location.href = 'settings.html';
    }, 400);
  });

  // 更多可能的按钮点击事件
  if (document.getElementById('settingsButton')) {
    document.getElementById('settingsButton').addEventListener('click', () => {
      document.body.classList.add('page-transition');
      setTimeout(() => {
        window.location.href = 'settings.html';
      }, 400);
    });
  }
}

/**
 * 搜索并显示可用模型列表
 * 
 * @param {string} apiUrl - API URL地址
 * @param {string} apiKey - API密钥
 * @param {string} searchTerm - 搜索关键词
 */
async function searchModels(apiUrl, apiKey, searchTerm = '') {
  const modelList = document.getElementById('modelList');
  const modelInput = document.getElementById('modelInput');
  
  // 检查API URL和KEY是否已设置
  if (!apiUrl) {
    showPopupMessage('请先设置API地址！', 'error');
    return;
  }
  
  if (!apiKey) {
    showPopupMessage('请先设置API密钥！', 'error');
    return;
  }
  
  // 显示模型列表（带动画）
  modelList.style.display = 'block';
  modelList.classList.remove('hide');
  modelList.classList.add('visible');
  
  // 显示加载中
  modelList.innerHTML = `
    <div class="model-loading">
      <div class="ai-processing-dots">
        <div class="ai-dot"></div>
        <div class="ai-dot"></div>
        <div class="ai-dot"></div>
      </div>
      <span>正在加载模型列表...</span>
    </div>
  `;
  
  try {
    // 获取模型列表
    const models = await fetchModelsList(apiUrl, apiKey);
    
    // 如果没有返回模型或返回空数组
    if (!models || models.length === 0) {
      modelList.innerHTML = `
        <div class="model-loading">
          <span>未找到可用模型，请确认API地址格式正确</span>
        </div>
      `;
      return;
    }
    
    // 根据搜索词过滤模型
    let filteredModels = models;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredModels = models.filter(model => 
        (model.id && model.id.toLowerCase().includes(lowerSearchTerm)) || 
        (model.name && model.name.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // 如果过滤后没有模型
    if (filteredModels.length === 0) {
      modelList.innerHTML = `
        <div class="model-loading">
          <span>未找到匹配 "${searchTerm}" 的模型</span>
        </div>
      `;
      return;
    }
    
    // 生成模型列表HTML
    let html = '';
    filteredModels.forEach(model => {
      const modelId = model.id;
      const modelName = model.name || modelId;
      html += `
        <div class="model-item" data-model-id="${escapeHTML(modelId)}">
          <div class="model-name">${escapeHTML(modelName)}</div>
          <div class="model-id">${escapeHTML(modelId)}</div>
        </div>
      `;
    });
    
    modelList.innerHTML = html;
    
    // 为每个模型项添加点击事件
    document.querySelectorAll('.model-item').forEach(item => {
      item.addEventListener('click', () => {
        const modelId = item.getAttribute('data-model-id');
        // 设置选中的模型到输入框
        modelInput.value = modelId;
        // 触发change事件保存选择
        modelInput.dispatchEvent(new Event('change'));
        // 隐藏模型列表（带动画）
        modelList.classList.remove('visible');
        modelList.classList.add('hide');
        // 监听动画结束后移除显示
        modelList.addEventListener('animationend', function hideList() {
          modelList.style.display = 'none';
          modelList.removeEventListener('animationend', hideList);
        }, {once: true});
        // 清空搜索框
        document.getElementById('modelSearch').value = '';
      });
    });
    
  } catch (err) {
    console.error('获取模型列表失败:', err);
    modelList.innerHTML = `
      <div class="model-loading">
        <div class="ai-processing-dots">
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
        </div>
        <span>获取模型列表失败: ${err.message || err.valueOf()}</span>
      </div>
    `;
  }
}

/**
 * 处理收藏按钮点击事件
 */
async function handleBookmark() {
  try {
    // 显示按钮加载状态
    const bookmarkButton = document.getElementById('bookmarkButton');
    const originalText = bookmarkButton.textContent;
    
    // 使用AI思考动画替代原来的加载动画
    bookmarkButton.innerHTML = `
      <div class="ai-thinking">
        <div class="ai-thinking-circle"></div>
        <div class="ai-thinking-circle"></div>
      </div>
      <span>AI分析中</span>
    `;
    bookmarkButton.disabled = true;
    
    // 验证API配置
    const config = await getConfig()
    const validationMessage = validateAIConfig(config)
    
    if (validationMessage) {
      showPopupMessage(validationMessage, 'error')
      // 恢复按钮状态
      bookmarkButton.innerHTML = originalText;
      bookmarkButton.disabled = false;
      return
    }
    
    // 获取当前标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!tabs || tabs.length === 0) {
      showPopupMessage('无法获取当前标签页信息', 'error')
      // 恢复按钮状态
      bookmarkButton.innerHTML = originalText;
      bookmarkButton.disabled = false;
      return
    }
    
    try {
      const tab = tabs[0]
      const { title, url } = tab
      
      // 获取所有书签文件夹
      const folders = await getAllFolders()
      
      if (!folders || folders.length === 0) {
        showPopupMessage('未找到任何书签文件夹', 'error')
        // 恢复按钮状态
        bookmarkButton.innerHTML = originalText;
        bookmarkButton.disabled = false;
        return
      }
      
      console.log('获取到的文件夹:', folders.length, '个');
      
      // 更新按钮为AI处理动画
      bookmarkButton.innerHTML = `
        <div class="ai-processing">
          <div class="ai-processing-dots">
            <div class="ai-dot"></div>
            <div class="ai-dot"></div>
            <div class="ai-dot"></div>
            <div class="ai-dot"></div>
          </div>
        </div>
        <span>AI智能分类中</span>
      `;
      
      // 调用AI分类服务
      console.log('准备调用AI服务...');
      
      // 调用分类API，根据是否启用智能路径推荐来选择调用方式
      let result;
      if (config.enableSmartPath !== false) {
        // 启用智能路径推荐，允许生成新路径
        result = await smartPathClassifyWebsite(config, folders.map(i => i.path), title, '', config.enableTitleGen !== false);
      } else {
        // 禁用智能路径推荐，仅在现有路径中选择
        result = await classifyWebsite(config, folders.map(i => i.path), title, '', false, config.enableTitleGen !== false);
      }
      
      let path, aiGeneratedTitle;
      
      // 检查结果格式并提取路径和标题
      if (typeof result === 'object' && result.path) {
        // 新格式：{path, title}
        path = result.path;
        aiGeneratedTitle = result.title || title;
      } else {
        // 旧格式：直接是路径字符串
        path = result;
        // 如果启用了标题生成，则单独调用标题生成服务
        aiGeneratedTitle = config.enableTitleGen !== false 
          ? await generateBookmarkTitle(config, title)
          : title;
      }
      
      if (!path) {
        showPopupMessage('AI无法确定合适的文件夹路径', 'error')
        // 恢复按钮状态
        bookmarkButton.innerHTML = originalText;
        bookmarkButton.disabled = false;
        return
      }
      
      console.log('AI处理结果:', {
        推荐路径: path,
        生成标题: aiGeneratedTitle,
        是否启用标题生成: config.enableTitleGen !== false,
        是否启用智能路径: config.enableSmartPath !== false
      });
      
      // 查找匹配的文件夹对象
      const folder = folders.find(i => i.path === path)
      console.log('匹配的文件夹:', folder);
      
      // 恢复按钮状态（虽然即将隐藏）
      bookmarkButton.innerHTML = originalText;
      bookmarkButton.disabled = false;
      
      if (!folder) {
        if (config.enableSmartPath !== false) {
          // 不立即创建目录，直接进入确认流程，folderId 传 null
          showBookmarkConfirmDialog(title, url, path, null, aiGeneratedTitle)
        } else {
          showPopupMessage(`书签栏中未发现合适的网站目录，AI 推荐目录路径为: ${path}`, 'warning')
        }
      } else {
        // 在popup中显示确认对话
        showBookmarkConfirmDialog(title, url, path, folder.id, aiGeneratedTitle)
      }
    } catch (innerErr) {
      console.error('获取标签页信息时出错:', innerErr);
      showPopupMessage(`获取标签页信息失败: ${innerErr.message || innerErr.valueOf()}`, 'error');
      // 恢复按钮状态
      bookmarkButton.innerHTML = originalText;
      bookmarkButton.disabled = false;
    }
  } catch (err) {
    console.error('收藏过程发生错误:', err)
    showPopupMessage(`收藏失败！${err.message || err.valueOf()}`, 'error')
    // 恢复按钮状态
    const bookmarkButton = document.getElementById('bookmarkButton');
    bookmarkButton.innerHTML = originalText || '收藏当前标签页';
    bookmarkButton.disabled = false;
  }
}

/**
 * 显示书签确认对话框
 * 
 * @param {string} title - 页面标题
 * @param {string} url - 页面URL
 * @param {string} path - 文件夹路径
 * @param {string} folderId - 文件夹ID
 * @param {string} aiGeneratedTitle - AI生成的标题建议
 */
function showBookmarkConfirmDialog(title, url, path, folderId, aiGeneratedTitle) {
  try {
    // 确保所有参数都有值
    title = title || '无标题';
    url = url || '';
    path = path || '未知路径';
    aiGeneratedTitle = aiGeneratedTitle || title;
    
    // folderId 允许为空（当需要新建路径时由确认逻辑生成）
    
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
        <input id="bookmarkTitle" type="text" class="form-control" value="${escapeHTML(aiGeneratedTitle)}">
        <p class="form-hint" style="margin-top: 5px; font-size: 12px; color: #666;">
          原始标题: ${escapeHTML(title)}
        </p>
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
      if (!newTitle) {
        showPopupMessage('书签标题不能为空', 'error')
        return
      }

      try {
        // 添加确认按钮的加载状态
        const confirmButton = document.getElementById('confirmButton');
        const originalConfirmText = confirmButton.textContent;
        
        // 使用AI处理动画
        confirmButton.innerHTML = `
          <div class="ai-processing">
            <div class="ai-processing-dots">
              <div class="ai-dot"></div>
              <div class="ai-dot"></div>
              <div class="ai-dot"></div>
            </div>
          </div>
          <span>保存中</span>
        `;
        confirmButton.disabled = true;
        
        let targetFolderId = folderId
        if (!targetFolderId) {
          targetFolderId = await ensureFolderPath(path)
        }
        await createBookmark(targetFolderId, newTitle, url)
        
        // 创建更优雅的成功通知
        showBookmarkSuccessMessage(path);
        
        // 添加页面过渡动画
        setTimeout(() => {
          document.body.classList.add('page-transition');
          setTimeout(() => window.close(), 400);
        }, 1500);
      } catch (err) {
        console.error('创建书签失败:', err)
        showPopupMessage(`收藏失败！${err.message || err.valueOf()}`, 'error')
        
        // 恢复确认按钮状态
        const confirmButton = document.getElementById('confirmButton');
        if (confirmButton) {
          confirmButton.innerHTML = originalConfirmText || '确认';
          confirmButton.disabled = false;
        }
        
        resetPopup()
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
 * 显示收藏成功的特殊消息
 * 
 * @param {string} path - 书签保存路径
 */
function showBookmarkSuccessMessage(path) {
  // 删除现有的消息元素
  const existingMessage = document.querySelector('.popup-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // 创建新的消息元素
  const messageElement = document.createElement('div');
  messageElement.className = 'popup-message timed-notification success notification';
  
  messageElement.innerHTML = `
    <div style="margin-bottom: 8px; display: flex; justify-content: center; align-items: center;">
      <span class="message-icon">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z M9.999,13.587L7.7,11.292l-1.412,1.416l3.713,3.705l6.706-6.706l-1.414-1.414L9.999,13.587z"/>
        </svg>
      </span>
      <span class="message-text" style="font-weight: 600;">收藏成功</span>
    </div>
    <div style="font-size: 13px; opacity: 0.9; word-break: break-word; line-height: 1.4;">
      已保存至：${path}
    </div>
    <div class="progress-bar"></div>
  `;
  
  // 添加到页面
  document.body.appendChild(messageElement);
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
  const message = document.querySelector('.popup-message')
  if (message) message.remove()
}

/**
 * 在页面上显示消息提示
 * 
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型 (info, success, error, warning)
 */
function showPopupMessage(message, type = 'info') {
  // 删除现有的消息元素
  const existingMessage = document.querySelector('.popup-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // 图标定义
  const icons = {
    success: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z M9.999,13.587L7.7,11.292l-1.412,1.416l3.713,3.705l6.706-6.706l-1.414-1.414L9.999,13.587z"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.953,2C6.465,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.493,2,11.953,2z M12,20c-4.411,0-8-3.589-8-8 s3.567-8,8-8c4.412,0,8,3.589,8,8S16.413,20,12,20z M13,7h-2v6h2V7z M13,15h-2v2h2V15z"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2C6.486,2,2,6.486,2,12c0,5.514,4.486,10,10,10c5.514,0,10-4.486,10-10C22,6.486,17.514,2,12,2z M12,20 c-4.411,0-8-3.589-8-8s3.589-8,8-8s8,3.589,8,8S16.411,20,12,20z M11,11h2v6h-2V11z M11,7h2v2h-2V7z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z M13,13h-2V7h2V13z M13,17h-2v-2h2V17z"/></svg>'
  };
  
  // 如果是特定成功消息，使用定时通知样式（带进度条，居中）
  const useFancyNotification = type === 'success' && (
    message.includes('设置已保存') || 
    message.includes('收藏成功')
  );
  
  // 创建新的消息元素
  const messageElement = document.createElement('div');
  
  if (useFancyNotification) {
    // 使用居中、带进度条的样式
    messageElement.className = `popup-message timed-notification ${type} notification`;
    messageElement.innerHTML = `
      <div style="margin-bottom: 8px; display: flex; justify-content: center; align-items: center;">
        <span class="message-icon">
          ${icons[type] || icons.info}
        </span>
        <span class="message-text" style="font-weight: 600;">${message}</span>
      </div>
      <div class="progress-bar"></div>
    `;
  } else {
    // 使用常规样式（左侧边栏样式）
    messageElement.className = `popup-message ${type} notification`;
    messageElement.innerHTML = `
      <span class="message-icon">
        ${icons[type] || icons.info}
      </span>
      <span class="message-text">${message}</span>
    `;
  }
  
  // 添加到页面
  document.body.appendChild(messageElement);
  
  // 添加动画结束监听器，自动移除消息元素
  messageElement.addEventListener('animationend', () => {
    messageElement.remove();
  });
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