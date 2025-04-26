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
  USER_PROMPT,
  SMART_PATH_SYSTEM_PROMPT
} from '../utils/constants.js'

/**
 * 根据网站标题和内容，为网站推荐最合适的书签文件夹
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容
 * @param {boolean} allowNewPath - 是否允许生成新路径
 * @param {boolean} generateTitle - 是否同时生成标题
 * @returns {Promise<Object|string>} 返回推荐的文件夹路径，或包含路径和标题的对象
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function classifyWebsite(config, folderPaths, title, pageContent = '', allowNewPath = false, generateTitle = true) {
  try {
    // 生成请求负载，使用标准提示词
    const payload = generatePayload(config, folderPaths, title, pageContent, allowNewPath, generateTitle, false)
    // 发送API请求
    const response = await fetch(config.chatUrl, payload)
    // 解析响应
    return await parseResponse(response, generateTitle, allowNewPath)
  } catch (err) {
    // 向上层传递错误
    throw err
  }
}

/**
 * 使用智能路径推荐算法为网站推荐最合适的书签文件夹
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @param {string} pageContent - 网页内容
 * @param {boolean} generateTitle - 是否同时生成标题
 * @returns {Promise<Object>} 返回包含路径和标题的对象
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function smartPathClassifyWebsite(config, folderPaths, title, pageContent = '', generateTitle = true) {
  try {
    // 生成请求负载，使用智能路径生成提示词，允许生成新路径
    const payload = generatePayload(config, folderPaths, title, pageContent, true, generateTitle, true)
    // 发送API请求
    const response = await fetch(config.chatUrl, payload)
    // 解析响应并返回结果
    return await parseResponse(response, generateTitle, true)
  } catch (err) {
    // 向上层传递错误
    throw err
  }
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
 * @param {boolean} useSmartPath - 是否使用智能路径生成提示词
 * @returns {Object} 包含请求头和体的完整请求配置
 */
function generatePayload(config, folderPaths, title, pageContent = '', allowNewPath = false, generateTitle = true, useSmartPath = false) {
  const { apiKey, model } = config
  
  // 构建对话消息数组
  const messages = [
    {
      role: 'system',
      content: useSmartPath ? SMART_PATH_SYSTEM_PROMPT : SYSTEM_PROMPT  // 根据是否使用智能路径选择提示词
    },
    {
      role: 'user',
      content: `${USER_PROMPT} ${title}\n\n${pageContent ? '网页内容：' + pageContent : ''}${useSmartPath ? '\n\n用户现有书签路径列表：\n' + folderPaths.map((path, index) => `${index + 1}. ${path}`).join('\n') : ''}`  // 用户提问：提供网站标题、内容和现有路径
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
 * @param {boolean} allowNewPath - 是否允许生成新路径（智能路径推荐模式）
 * @returns {Promise<Object|string>} 提取的文件夹路径和标题，或仅路径
 * @throws {Error} 如果响应包含错误或格式不符合预期
 */
async function parseResponse(response, generateTitle = true, allowNewPath = false) {
  // 解析JSON响应
  const json = await response.json()
  
  // 检查API返回的错误
  if (json.error) throw new Error(`AI 调用失败：${json.error.message}`)
  
  try {
    // 提取函数调用结果
    const fn = json.choices[0].message.tool_calls[0].function
    // 解析函数参数
    let args = {};
    try {
      if (fn.arguments && fn.arguments.trim()) {
        args = JSON.parse(fn.arguments);
      }
    } catch (parseErr) {
      console.warn('解析 tool arguments 失败，使用空对象:', parseErr);
      args = {};
    }
    
    // 验证函数名称和参数
    if (fn.name === FUNCTION_NAME && args[PARAM_NAME]) {
      // 直接使用 AI 返回的路径
      const path = args[PARAM_NAME]
      
      if (generateTitle && args[TITLE_PARAM_NAME]) {
        // 返回包含路径和标题的对象
        return {
          path: path,
          title: args[TITLE_PARAM_NAME]
        }
      } else {
        // 仅返回路径
        return path
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

/**
 * AI 书签整理 Agent
 * 添加 agentLoop 和相关函数
 */

import {
  findDuplicateBookmarks,
  moveBookmark,
  renameBookmark,
  deleteBookmark,
  batchUpdateBookmarks
} from '../utils/bookmarkTools.js'

/**
 * 定义 Agent 使用的工具
 */
const BOOKMARK_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'find_duplicate_bookmarks',
      description: '查找重复 URL 的书签，返回重复组',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_bookmark',
      description: '移动指定 bookmarkId 到 folderPath',
      parameters: {
        type: 'object',
        properties: {
          bookmarkId: { type: 'string' },
          folderPath: { type: 'string' }
        },
        required: ['bookmarkId','folderPath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rename_bookmark',
      description: '重命名指定书签',
      parameters: {
        type: 'object',
        properties: {
          bookmarkId: { type: 'string' },
          newTitle: { type: 'string' }
        },
        required: ['bookmarkId','newTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_bookmark',
      description: '删除指定书签',
      parameters: {
        type: 'object',
        properties: {
          bookmarkId: { type: 'string' }
        },
        required: ['bookmarkId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'batch_update_bookmarks',
      description: '批量更新书签（移动/重命名/删除等）',
      parameters: {
        type: 'object',
        properties: {
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                bookmarkId: { type: 'string' },
                args: { type: 'object' }
              },
              required: ['action','bookmarkId']
            }
          }
        },
        required: ['operations']
      }
    }
  }
];

/**
 * 工具函数实现映射
 */
const BOOKMARK_TOOLS_FUNCTIONS = {
  find_duplicate_bookmarks: findDuplicateBookmarks,
  move_bookmark: moveBookmark,
  rename_bookmark: renameBookmark,
  delete_bookmark: deleteBookmark,
  batch_update_bookmarks: batchUpdateBookmarks
};

/**
 * 处理来自聊天界面的消息
 * 
 * @param {string} userMessage - 用户的聊天消息
 * @param {Object} config - 配置信息
 * @param {function} onPartialResponse - 部分响应回调函数
 * @returns {Promise<string>} - AI响应
 */
export async function processBookmarkOrganizing(userMessage, config, onPartialResponse = null) {
  const messages = [
    {
      role: 'system',
      content: `你是一个书签整理助手，会帮助用户查找和整理浏览器书签。
你可以调用工具函数来帮助用户完成整理工作，包括查找重复书签、移动书签到正确的文件夹、重命名书签使其更简洁、删除无用书签等。
当用户需要整理特定类型的书签时，你应首先找出这些书签，然后提出合理的整理建议并执行。
你的回应应当清晰、有礼貌，并解释你所做的每一个操作。`
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  return await agentLoop(messages, BOOKMARK_TOOLS, config, onPartialResponse);
}

/**
 * 实现 Agent 循环
 * 
 * @param {Array<Object>} messages - 消息数组
 * @param {Array<Object>} tools - 工具定义数组
 * @param {Object} config - 配置信息
 * @param {function} onPartialResponse - 部分响应回调函数
 * @returns {Promise<string>} - 最终响应
 */
async function agentLoop(messages, tools, config, onPartialResponse = null) {
  let partialMessage = ''; // 用于累积部分回复
  
  while (true) {
    try {
      // 构建请求
      const requestBody = {
        model: config.model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        stream: true
      };
      
      // 调用 API
      const response = await fetch(config.chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
      }
      
      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let toolCalls = [];
      let hasToolCalls = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解析 SSE
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              // 提取 JSON 数据
              const data = JSON.parse(line.substring(6));
              
              if (data.choices && data.choices.length > 0) {
                const choice = data.choices[0];
                
                // 处理 content
                if (choice.delta && choice.delta.content) {
                  content += choice.delta.content;
                  partialMessage += choice.delta.content;
                  
                  // 如果有回调则传递部分响应
                  if (onPartialResponse) {
                    onPartialResponse(partialMessage);
                  }
                }
                
                // 处理 tool_calls
                if (choice.delta && choice.delta.tool_calls) {
                  hasToolCalls = true;
                  
                  // 初始化工具调用
                  if (!toolCalls.length && choice.delta.tool_calls.length > 0) {
                    for (let i = 0; i < choice.delta.tool_calls.length; i++) {
                      toolCalls[i] = {
                        id: choice.delta.tool_calls[i].id || '',
                        type: choice.delta.tool_calls[i].type || '',
                        function: {
                          name: choice.delta.tool_calls[i].function?.name || '',
                          arguments: choice.delta.tool_calls[i].function?.arguments || ''
                        }
                      };
                    }
                  } else if (toolCalls.length > 0) {
                    // 更新现有工具调用
                    for (let i = 0; i < choice.delta.tool_calls.length; i++) {
                      if (choice.delta.tool_calls[i].function?.arguments) {
                        toolCalls[i].function.arguments += choice.delta.tool_calls[i].function.arguments;
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error('解析 SSE 数据失败:', err);
            }
          }
        }
      }
      
      // 如果有工具调用，则执行并继续循环
      if (hasToolCalls && toolCalls.length > 0) {
        // 添加助手消息
        messages.push({
          role: 'assistant',
          content,
          tool_calls: toolCalls
        });
        
        // 处理每个工具调用
        for (const toolCall of toolCalls) {
          try {
            // 更新回调，显示工具调用信息
            if (onPartialResponse) {
              partialMessage += `\n[正在调用: ${toolCall.function.name}]`;
              onPartialResponse(partialMessage);
            }
            
            // 解析参数，允许空或非法 JSON
            let args = {};
            try {
              if (toolCall.function.arguments && toolCall.function.arguments.trim()) {
                args = JSON.parse(toolCall.function.arguments);
              }
            } catch (parseErr) {
              console.warn('解析 tool arguments 失败，使用空对象:', parseErr);
              args = {};
            }
            
            // 执行函数
            const functionToCall = BOOKMARK_TOOLS_FUNCTIONS[toolCall.function.name];
            if (!functionToCall) {
              throw new Error(`未找到函数: ${toolCall.function.name}`);
            }
            
            const result = await functionToCall(
              toolCall.function.name === 'find_duplicate_bookmarks' ? null : 
                toolCall.function.name === 'batch_update_bookmarks' ? args.operations : 
                  toolCall.function.name === 'move_bookmark' ? args.bookmarkId && args.folderPath && { bookmarkId: args.bookmarkId, folderPath: args.folderPath } :
                    toolCall.function.name === 'rename_bookmark' ? args.bookmarkId && args.newTitle && { bookmarkId: args.bookmarkId, newTitle: args.newTitle } :
                      toolCall.function.name === 'delete_bookmark' ? args.bookmarkId :
                        args
            );
            
            // 添加工具响应消息
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
            
            // 更新回调，显示工具调用完成信息
            if (onPartialResponse) {
              partialMessage += `\n[完成: ${toolCall.function.name}]`;
              onPartialResponse(partialMessage);
            }
          } catch (err) {
            console.error(`执行工具 ${toolCall.function.name} 失败:`, err);
            
            // 添加错误响应消息
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: err.message || err.valueOf() })
            });
            
            // 更新回调，显示工具调用错误信息
            if (onPartialResponse) {
              partialMessage += `\n[错误: ${toolCall.function.name} - ${err.message || err.valueOf()}]`;
              onPartialResponse(partialMessage);
            }
          }
        }
        
        // 继续循环
        continue;
      }
      
      // 无工具调用，返回最终响应
      return content;
    } catch (err) {
      console.error('agentLoop 执行失败:', err);
      throw err;
    }
  }
}