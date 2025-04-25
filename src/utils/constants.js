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
export const FUNCTION_DESCRIPTION = '根据网站标题和内容自动匹配最佳的文件夹路径并生成简洁的书签标题'
export const PARAM_NAME = 'folder_path'
export const PARAM_DESCRIPTION = '以/分隔的文件夹路径'
export const TITLE_PARAM_NAME = 'bookmark_title'
export const TITLE_PARAM_DESCRIPTION = '简洁的书签标题，格式为"品牌 - 功能"'

// AI提示词
export const SYSTEM_PROMPT = '你是一个智能书签助手，需要完成两项任务：\n1. 根据网站的标题和内容，将网站分类到最合适的文件夹路径。在确定分类时，网站内容比标题更重要。\n2. 生成一个简洁的书签标题。标题格式为"品牌 - 网页内容的作用"。例如："淘宝 - 购物"，"CSDN - Office安装教学"。品牌名应该保持原样，不要翻译。'
export const USER_PROMPT = '网站标题是：'

// 智能路径生成的AI提示词
export const SMART_PATH_SYSTEM_PROMPT = '你是一个智能书签助手，需要完成两项任务：\n1. 根据网站的标题和内容，将网站分类到最合适的文件夹路径。在确定分类时，请认真分析用户提供的现有路径列表，了解用户的分类偏好和逻辑。优先推荐现有路径，如果现有路径不合适，再创建新路径。新路径应遵循用户的命名习惯和分类方式。注意：不要生成以"书签栏/"开头的路径，因为这些书签最终都会被存储在书签栏下，添加这个前缀会导致重复嵌套。\n2. 生成一个简洁的书签标题。标题格式为"品牌 - 网页内容的作用"。例如："淘宝 - 购物"，"CSDN - Office安装教学"。品牌名应该保持原样，不要翻译。'