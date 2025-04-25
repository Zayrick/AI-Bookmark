/**
 * aiService.js - AI API调用服务
 * 
 * 封装了与AI API交互的核心功能
 */

import { 
  TEMPERATURE, 
  FUNCTION_NAME,
  FUNCTION_DESCRIPTION,
  PARAM_NAME,
  PARAM_DESCRIPTION,
  TITLE_PARAM_NAME,
  TITLE_PARAM_DESCRIPTION,
  SYSTEM_PROMPT,
  USER_PROMPT
} from '../utils/constants.js'

/**
 * 使用AI服务为网站标题推荐最合适的书签文件夹
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容
 * @param {boolean} allowNewPath - 是否允许生成新路径
 * @param {boolean} generateTitle - 是否同时生成标题
 * @returns {Promise<Object>} 返回包含路径和标题的对象
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function classifyWebsite(config, folderPaths, title, pageContent = '', allowNewPath = false, generateTitle = true) {
  try {
    // 生成请求负载
    const payload = generatePayload(config, folderPaths, title, pageContent, allowNewPath, generateTitle)
    // 发送API请求
    const response = await fetch(config.chatUrl, payload)
    // 解析响应并返回结果
    return await parseResponse(response, generateTitle)
  } catch (err) {
    // 向上层传递错误
    throw err
  }
}

/**
 * 使用AI服务为网站标题推荐最合适的书签文件夹，允许生成新路径
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容
 * @param {boolean} generateTitle - 是否同时生成标题
 * @returns {Promise<Object>} 返回包含路径和标题的对象
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function classifyWebsiteAllowNewPath(config, folderPaths, title, pageContent = '', generateTitle = true) {
  // 直接调用原有函数，但将 allowNewPath 设为 true
  return await classifyWebsite(config, folderPaths, title, pageContent, true, generateTitle)
}

/**
 * 获取API端点支持的模型列表
 * 
 * @param {string} apiUrl - API URL地址
 * @param {string} apiKey - API密钥
 * @returns {Promise<Array<Object>>} 返回模型列表
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function fetchModelsList(apiUrl, apiKey) {
  try {
    // 检查API URL是否以/chat/completions结尾
    if (!apiUrl.endsWith('/chat/completions')) {
      return []; // 如果不是以/chat/completions结尾，直接返回空数组
    }
    
    // 尝试替换为/models端点
    const modelsUrl = apiUrl.replace(/\/chat\/completions$/, '/models');
    
    // 构建请求配置
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      method: 'GET'
    };
    
    // 发送请求
    const response = await fetch(modelsUrl, requestConfig);
    
    // 如果响应不成功，返回空数组
    if (!response.ok) {
      return [];
    }
    
    // 解析响应
    const data = await response.json();
    
    // 如果返回了有效的数据数组，则返回该数组
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  } catch (err) {
    console.error('获取模型列表失败:', err);
    return []; // 遇到错误时返回空数组
  }
}

/**
 * 生成AI API请求的负载数据
 * 
 * @param {Object} config - 配置对象
 * @param {Array<string>} folderPaths - 书签文件夹路径数组
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容文本
 * @param {boolean} allowNewPath - 是否允许生成新路径
 * @param {boolean} generateTitle - 是否同时生成标题
 * @returns {Object} 包含请求头和体的完整请求配置
 */
function generatePayload(config, folderPaths, title, pageContent = '', allowNewPath = false, generateTitle = true) {
  const { apiKey, model } = config
  
  // 构建对话消息数组
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT  // 系统指令：告诉模型如何分类网站
    },
    {
      role: 'user',
      content: `${USER_PROMPT} ${title}\n\n${pageContent ? '网页内容：' + pageContent : ''}`  // 用户提问：提供网站标题和内容
    }
  ]
  
  // 构建属性对象
  const properties = {
    // 动态设置参数名称和允许的枚举值（可用的文件夹路径）
    [PARAM_NAME]: {
      description: PARAM_DESCRIPTION,
      type: 'string',
      enum: allowNewPath ? undefined : folderPaths
    }
  }
  
  // 如果需要生成标题，添加标题属性
  if (generateTitle) {
    properties[TITLE_PARAM_NAME] = {
      description: TITLE_PARAM_DESCRIPTION,
      type: 'string'
    }
  }
  
  // 构建必需参数数组
  const required = [PARAM_NAME]
  if (generateTitle) {
    required.push(TITLE_PARAM_NAME)
  }
  
  // 构建请求体
  const body = {
    model,             // 使用配置的模型
    temperature: TEMPERATURE,       // 设置温度参数
    messages,          // 对话消息
    // 定义函数工具
    tools: [{
      type: 'function',
      function: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
          type: 'object',
          properties: properties,
          required: required
        }
      }
    }],
    // 强制模型使用我们定义的函数
    tool_choice: {
      type: 'function',
      function: {
        name: FUNCTION_NAME
      }
    }
  }

  // 返回完整的请求配置
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    method: 'POST',
    body: JSON.stringify(body)
  }
}

/**
 * 解析AI API的响应
 * 
 * @param {Response} response - fetch API的响应对象
 * @param {boolean} generateTitle - 是否解析标题
 * @returns {Promise<Object|string>} 提取的文件夹路径和标题，或仅路径
 * @throws {Error} 如果响应包含错误或格式不符合预期
 */
async function parseResponse(response, generateTitle = true) {
  // 解析JSON响应
  const json = await response.json()
  
  // 检查API返回的错误
  if (json.error) throw new Error(`AI 调用失败：${json.error.message}`)
  
  try {
    // 提取函数调用结果
    const fn = json.choices[0].message.tool_calls[0].function
    // 解析函数参数
    const arg = JSON.parse(fn.arguments)
    
    // 验证函数名称和参数
    if (fn.name === FUNCTION_NAME && arg[PARAM_NAME]) {
      if (generateTitle && arg[TITLE_PARAM_NAME]) {
        // 返回包含路径和标题的对象
        return {
          path: arg[PARAM_NAME],
          title: arg[TITLE_PARAM_NAME]
        }
      } else {
        // 仅返回路径
        return arg[PARAM_NAME]
      }
    } else {
      throw new Error('没有函数调用结果')
    }
  } catch (err) {
    // 向上层传递错误
    throw err
  }
}

/**
 * 兼容层：使用新的联合API实现书签标题生成功能
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容
 * @returns {Promise<string>} 返回生成的书签标题
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function generateBookmarkTitle(config, title, pageContent = '') {
  try {
    // 使用空的文件夹路径数组（因为我们只关心标题）
    const result = await classifyWebsite(config, ['未分类'], title, pageContent, true, true)
    
    // 如果返回对象中有标题，则使用它
    if (result && typeof result === 'object' && result.title) {
      return result.title
    }
    
    // 如果无法获取标题，返回原始标题
    return title
  } catch (err) {
    console.error('生成标题失败:', err)
    return title
  }
}