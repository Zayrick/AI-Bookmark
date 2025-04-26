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
  const enableTitleGen = document.getElementById('enableTitleGen')  // 启用标题生成开关
  const enableSmartPath = document.getElementById('enableSmartPath')  // 启用智能路径推荐开关
  const saveSettingsButton = document.getElementById('saveSettingsButton')  // 保存设置按钮
  const backButton = document.getElementById('backButton')  // 返回按钮
  
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
  
  // 添加保存设置按钮事件
  saveSettingsButton.addEventListener('click', handleSaveSettings)
  
  // 添加返回按钮事件
  backButton.addEventListener('click', () => {
    window.location.href = 'popup.html'
  })
}

/**
 * 处理保存设置按钮点击事件
 */
async function handleSaveSettings() {
  try {
    // 显示按钮加载状态
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const originalText = saveSettingsButton.textContent;
    saveSettingsButton.innerHTML = `<span class="loading-spinner"></span> 保存中...`;
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
    
    // 延迟后返回主页
    setTimeout(() => {
      window.location.href = 'popup.html';
    }, 1500);
    
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
  
  // 显示模型列表
  modelList.style.display = 'block';
  
  // 显示加载中
  modelList.innerHTML = '<div class="model-loading">正在加载模型列表...</div>';
  
  try {
    // 获取模型列表
    const models = await fetchModelsList(apiUrl, apiKey);
    
    // 如果没有返回模型或返回空数组
    if (!models || models.length === 0) {
      modelList.innerHTML = '<div class="model-loading">未找到可用模型，请确认API地址格式正确</div>';
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
      modelList.innerHTML = `<div class="model-loading">未找到匹配 "${searchTerm}" 的模型</div>`;
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
        // 隐藏模型列表
        modelList.style.display = 'none';
        // 清空搜索框
        document.getElementById('modelSearch').value = '';
      });
    });
    
  } catch (err) {
    console.error('获取模型列表失败:', err);
    modelList.innerHTML = `<div class="model-loading">获取模型列表失败: ${err.message || err.valueOf()}</div>`;
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