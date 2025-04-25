/**
 * bookmarks.js - 书签操作工具模块
 * 
 * 提供处理浏览器书签树的工具函数
 */

/**
 * 递归提取书签树中所有文件夹的路径信息
 * 
 * @param {string} prePath - 父级路径前缀
 * @param {Array} tree - 书签树节点数组
 * @returns {Array} 包含id和路径的文件夹对象数组
 */
export function getFolders(prePath, tree) {
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

/**
 * 获取完整的书签树结构并提取文件夹路径
 * 
 * @returns {Promise<Array>} 包含id和路径的文件夹对象数组
 */
export async function getAllFolders() {
  // 获取完整的书签树结构
  const tree = await chrome.bookmarks.getTree()
  
  // 提取所有书签文件夹的路径信息
  return getFolders('', tree)
}

/**
 * 创建新书签
 * 
 * @param {string} parentId - 父文件夹ID
 * @param {string} title - 书签标题
 * @param {string} url - 书签URL
 * @returns {Promise<Object>} 创建的书签对象
 */
export async function createBookmark(parentId, title, url) {
  return await chrome.bookmarks.create({
    parentId,
    title,
    url
  })
}

/**
 * 确保指定的文件夹路径存在，不存在则递归创建
 *
 * @param {string} path - 形如 "Frameworks/Libraries/JavaScript" 的文件夹路径
 * @param {string} baseFolderId - 基础文件夹ID（可选）
 * @returns {Promise<string>} 最终（最深层）文件夹的 ID
 */
export async function ensureFolderPath(path, baseFolderId = null) {
  if (!path) throw new Error('无效的文件夹路径')

  // 获取书签栏根节点 ID（或用户指定的根）
  if (!baseFolderId) {
    const tree = await chrome.bookmarks.getTree()
    // 通常 bookmark bar 的节点 id 为 '1'，也可以根据 title 判断
    const barNode = tree[0].children.find(n => n.id === '1' || /bookmarks?/i.test(n.title) || n.title === '书签栏')
    baseFolderId = barNode ? barNode.id : tree[0].children[0].id
  }

  let parentId = baseFolderId

  // 清理首尾斜杠并按 / 分割
  const segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)

  for (const segment of segments) {
    // 获取父节点下的所有子节点
    const children = await chrome.bookmarks.getChildren(parentId)
    // 尝试在子节点中查找同名文件夹
    let folder = children.find(i => !i.url && i.title === segment)

    if (!folder) {
      // 若不存在则创建
      folder = await chrome.bookmarks.create({ parentId, title: segment })
    }

    parentId = folder.id // 进入下一层
  }

  return parentId
}