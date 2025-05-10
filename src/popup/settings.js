/**
 * popup/settings.js - 设置页面脚本
 * 
 * 处理扩展的设置页面交互
 */

import { getConfig, saveConfig } from '../utils/storage.js'
import { NOTIFICATION_TYPES } from '../utils/constants.js'
import { fetchModelsList } from '../services/aiService.js'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init)

/**
 * 初始化函数，从本地存储加载配置并填充表单
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
  const browserNotificationHint = document.getElementById('browserNotificationHint') // 浏览器通知提示
  const enableTitleGen = document.getElementById('enableTitleGen')  // 启用标题生成开关
  const enableSmartPath = document.getElementById('enableSmartPath')  // 启用智能路径推荐开关
  const saveSettingsButton = document.getElementById('saveSettingsButton')  // 保存设置按钮
  const backButton = document.getElementById('backButton')  // 返回按钮
  
  // 为当前页面添加页面加载动画
  document.body.classList.add('page-loading');
  
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
    // 确保提示隐藏
    browserNotificationHint.style.display = 'none'
    browserNotificationHint.style.height = '0'
    browserNotificationHint.style.opacity = '0'
  } else if (notificationType === NOTIFICATION_TYPES.BROWSER) {
    browserNotification.checked = true
    // 显示提示
    showBrowserNotificationHint()
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
      // 隐藏提示
      hideBrowserNotificationHint()
    }
  })
  
  browserNotification.addEventListener('change', () => {
    if (browserNotification.checked) {
      updateConfig('notificationType', NOTIFICATION_TYPES.BROWSER)
      // 显示提示
      showBrowserNotificationHint()
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
  
  // 添加保存设置按钮事件
  saveSettingsButton.addEventListener('click', handleSaveSettings)
  
  // 添加返回按钮事件
  backButton.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('popup.html');
  })
  
  // 添加密码显示/隐藏切换功能
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const apiKey = document.getElementById('apiKey');
      const eyeOpen = document.getElementById('eyeOpen');
      const eyeClosed = document.getElementById('eyeClosed');
      
      // 切换密码可见性
      if (apiKey.type === 'password') {
        apiKey.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
      } else {
        apiKey.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
      }
    });
  }
}

/**
 * 页面导航函数，处理页面切换动画
 * 
 * @param {string} url - 目标页面URL
 */
function navigateTo(url) {
  // 添加过渡动画
  document.body.classList.add('page-transition');
  
  // 短暂延迟后跳转，让过渡动画有时间执行
  setTimeout(() => {
    window.location.href = url;
  }, 120);
}

/**
 * 处理保存设置按钮点击事件
 */
async function handleSaveSettings() {
  try {
    // 显示按钮加载状态
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const originalText = saveSettingsButton.textContent;
    
    // 使用AI处理动画
    saveSettingsButton.innerHTML = `
      <div class="ai-processing">
        <div class="ai-processing-dots">
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
        </div>
      </div>
      <span>保存中</span>
    `;
    saveSettingsButton.disabled = true;
    
    // 获取所有设置值
    const config = {
      chatUrl: document.getElementById('chatUrl').value,
      apiKey: document.getElementById('apiKey').value,
      model: document.getElementById('modelInput').value,
      notificationType: document.querySelector('input[name="notificationType"]:checked').value,
      enableTitleGen: document.getElementById('enableTitleGen').checked,
      enableSmartPath: document.getElementById('enableSmartPath').checked,
      isConfigured: true
    }
    
    // 验证必填项
    if (!config.chatUrl) {
      showPopupMessage('请填写API地址', 'error');
      saveSettingsButton.innerHTML = originalText;
      saveSettingsButton.disabled = false;
      return;
    }
    
    if (!config.apiKey) {
      showPopupMessage('请填写API密钥', 'error');
      saveSettingsButton.innerHTML = originalText;
      saveSettingsButton.disabled = false;
      return;
    }
    
    if (!config.model) {
      showPopupMessage('请选择AI模型', 'error');
      saveSettingsButton.innerHTML = originalText;
      saveSettingsButton.disabled = false;
      return;
    }
    
    // 保存配置
    await saveConfig(config);
    
    // 显示成功消息
    showPopupMessage('设置已保存', 'success');
    
    // 恢复按钮状态
    saveSettingsButton.innerHTML = originalText;
    saveSettingsButton.disabled = false;
    
    // 延迟后返回主页，添加平滑过渡动画
    setTimeout(() => {
      navigateTo('popup.html');
    }, 1000);
    
  } catch (err) {
    console.error('保存设置失败:', err);
    showPopupMessage(`保存失败: ${err.message || err}`, 'error');
    
    // 恢复按钮状态
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    saveSettingsButton.innerHTML = originalText || '保存设置';
    saveSettingsButton.disabled = false;
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

/**
 * 在页面上显示消息提示
 * 
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型 (info, success, error)
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
  
  // 如果是设置保存成功，使用定时通知样式（带进度条，居中）
  const useFancyNotification = type === 'success' && message === '设置已保存';
  
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
 * 显示浏览器通知提示，并添加简单淡入效果
 */
function showBrowserNotificationHint() {
  const hint = document.getElementById('browserNotificationHint')
  if (!hint) return
  
  // 首先显示元素
  hint.style.display = 'block'
  
  // 获取文本内容的实际高度
  const height = hint.scrollHeight
  
  // 动画展开
  setTimeout(() => {
    hint.style.height = height + 'px'
    hint.style.opacity = '1'
  }, 10)
}

/**
 * 隐藏浏览器通知提示
 */
function hideBrowserNotificationHint() {
  const hint = document.getElementById('browserNotificationHint')
  if (!hint) return
  
  // 动画收起
  hint.style.height = '0'
  hint.style.opacity = '0'
  
  // 完成后隐藏
  setTimeout(() => {
    hint.style.display = 'none'
  }, 300)
}