/**
 * constants.js - 全局常量定义
 * 
 * 包含整个插件中使用的常量定义
 */

// 扩展程序的唯一标识符，用于右键菜单ID和本地存储的键名
export const MENU_ID = 'ai-bookmark'

// AI模型相关常量
export const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions'
export const DEFAULT_MODEL = 'gpt-3.5-turbo-1106'
export const DEFAULT_NOTIFICATION_TYPE = 'system'

// 书签路径默认根目录（书签栏 id 通常为 '1'）
export const DEFAULT_NEW_PATH_ROOT_ID = '1'

// 通知类型
export const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  BROWSER: 'browser'
}

// 温度参数，控制生成结果的随机性
export const TEMPERATURE = 0.2

// 函数调用配置
export const FUNCTION_NAME = 'classify_the_website'
export const FUNCTION_DESCRIPTION = 'Automatically match the best folder path based on the website title and content'
export const PARAM_NAME = 'folder_path'
export const PARAM_DESCRIPTION = 'Folder path separated by /'

// 提示词
export const SYSTEM_PROMPT = 'Please classify the website into the most appropriate folder path based on the title of the website, the website content, and the meaning of the folder name. The website content is more important than the title when determining the classification.'
export const USER_PROMPT = 'The website title is:' 