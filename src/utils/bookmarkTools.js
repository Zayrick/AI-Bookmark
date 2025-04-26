/**
 * bookmarkTools.js - AI Agent工具函数集
 * 
 * 提供书签整理相关的函数调用
 */

import { getAllFolders, ensureFolderPath } from './bookmarks.js'

/**
 * 查找重复的书签，通过URL匹配
 * @returns {Promise<Array<Object>>} 返回重复书签分组
 */
export async function findDuplicateBookmarks() {
  try {
    // 获取所有书签
    const tree = await chrome.bookmarks.getTree()
    
    // 提取所有书签项
    const bookmarks = []
    extractAllBookmarks(tree, bookmarks)
    
    // 按URL分组
    const bookmarksByUrl = {}
    bookmarks.forEach(bookmark => {
      // 忽略没有URL的项（可能是文件夹）
      if (!bookmark.url) return
      
      // 标准化URL
      const normalizedUrl = normalizeUrl(bookmark.url)
      
      if (!bookmarksByUrl[normalizedUrl]) {
        bookmarksByUrl[normalizedUrl] = []
      }
      
      bookmarksByUrl[normalizedUrl].push({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        path: bookmark.path
      })
    })
    
    // 找出重复的项（数量大于1的分组）
    const duplicates = []
    for (const url in bookmarksByUrl) {
      if (bookmarksByUrl[url].length > 1) {
        duplicates.push({
          url,
          count: bookmarksByUrl[url].length,
          items: bookmarksByUrl[url]
        })
      }
    }
    
    // 按数量排序，多的在前
    duplicates.sort((a, b) => b.count - a.count)
    
    return duplicates
  } catch (err) {
    console.error('查找重复书签失败:', err)
    throw err
  }
}

/**
 * 移动书签到指定文件夹路径
 * @param {string} bookmarkId 书签ID
 * @param {string} folderPath 目标文件夹路径，例如"技术/编程/JavaScript"
 * @returns {Promise<Object>} 返回移动结果
 */
export async function moveBookmark(bookmarkId, folderPath) {
  try {
    // 确保文件夹路径存在
    const newParentId = await ensureFolderPath(folderPath)
    
    // 移动书签
    const result = await chrome.bookmarks.move(bookmarkId, { parentId: newParentId })
    
    return {
      success: true,
      bookmarkId,
      title: result.title,
      newPath: folderPath
    }
  } catch (err) {
    console.error(`移动书签 ${bookmarkId} 失败:`, err)
    throw err
  }
}

/**
 * 重命名书签
 * @param {string} bookmarkId 书签ID
 * @param {string} newTitle 新标题
 * @returns {Promise<Object>} 返回重命名结果
 */
export async function renameBookmark(bookmarkId, newTitle) {
  try {
    const result = await chrome.bookmarks.update(bookmarkId, { title: newTitle })
    
    return {
      success: true,
      bookmarkId,
      oldTitle: result.title, // API实际上返回的是更新后的标题
      newTitle
    }
  } catch (err) {
    console.error(`重命名书签 ${bookmarkId} 失败:`, err)
    throw err
  }
}

/**
 * 删除书签
 * @param {string} bookmarkId 书签ID
 * @returns {Promise<Object>} 返回删除结果
 */
export async function deleteBookmark(bookmarkId) {
  try {
    // 先获取书签信息，用于返回结果
    const bookmarkInfo = await chrome.bookmarks.get(bookmarkId)
    
    // 删除书签
    await chrome.bookmarks.remove(bookmarkId)
    
    return {
      success: true,
      bookmarkId,
      title: bookmarkInfo[0].title
    }
  } catch (err) {
    console.error(`删除书签 ${bookmarkId} 失败:`, err)
    throw err
  }
}

/**
 * 批量更新书签
 * @param {Array<Object>} operations 操作数组
 * @returns {Promise<Object>} 返回批量更新结果
 */
export async function batchUpdateBookmarks(operations) {
  const results = {
    success: true,
    total: operations.length,
    completed: 0,
    failed: 0,
    details: []
  }
  
  for (const op of operations) {
    try {
      let result
      
      switch (op.action) {
        case 'move':
          result = await moveBookmark(op.bookmarkId, op.args.folderPath)
          break
        case 'rename':
          result = await renameBookmark(op.bookmarkId, op.args.newTitle)
          break
        case 'delete':
          result = await deleteBookmark(op.bookmarkId)
          break
        default:
          throw new Error(`未知操作: ${op.action}`)
      }
      
      results.completed++
      results.details.push({
        success: true,
        operation: op,
        result
      })
    } catch (err) {
      results.failed++
      results.details.push({
        success: false,
        operation: op,
        error: err.message || err.valueOf()
      })
    }
  }
  
  // 更新整体成功状态
  results.success = results.failed === 0
  
  return results
}

/**
 * 辅助函数：提取所有书签
 * @param {Array<chrome.bookmarks.BookmarkTreeNode>} nodes 书签树节点
 * @param {Array<Object>} results 结果存储数组
 * @param {string} path 当前路径
 */
function extractAllBookmarks(nodes, results, path = '') {
  for (const node of nodes) {
    // 计算当前节点的完整路径
    const currentPath = path + (node.title ? (path ? '/' : '') + node.title : '')
    
    // 添加当前节点的路径信息
    const nodeWithPath = { ...node, path: currentPath }
    
    // 添加到结果数组
    results.push(nodeWithPath)
    
    // 递归处理子节点
    if (node.children) {
      extractAllBookmarks(node.children, results, currentPath)
    }
  }
}

/**
 * 标准化URL，移除尾部斜杠、协议差异等
 * @param {string} url URL字符串
 * @returns {string} 标准化后的URL
 */
function normalizeUrl(url) {
  try {
    // 移除尾部斜杠
    let normalized = url.replace(/\/$/, '')
    
    // 标准化http和https的差异
    normalized = normalized.replace(/^https?:\/\//, '')
    
    // 移除www.
    normalized = normalized.replace(/^www\./, '')
    
    return normalized
  } catch (e) {
    // 如果有任何错误，返回原始URL
    return url
  }
} 