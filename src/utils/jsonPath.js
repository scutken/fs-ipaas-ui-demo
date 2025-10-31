/**
 * 生成 JSONPath 表达式
 * @param {Array} path - 路径数组，例如 ['querySfOrder', 'OrderItems', 'records', 0, 'Id']
 * @returns {string} JSONPath 表达式，例如 '$.querySfOrder.OrderItems.records[0].Id'
 */
export function generateJsonPath(path) {
  if (!Array.isArray(path) || path.length === 0) {
    return '$'
  }
  
  let jsonPath = '$'
  
  for (const segment of path) {
    if (typeof segment === 'number') {
      // 数组索引
      jsonPath += `[${segment}]`
    } else {
      // 对象属性
      jsonPath += `.${segment}`
    }
  }
  
  return jsonPath
}

/**
 * 获取数据类型
 * @param {*} value - 要检测类型的值
 * @returns {string} 数据类型
 */
function getValueType(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'unknown'
}

/**
 * 从嵌套对象构建树形数据结构
 * @param {Object} obj - 原始对象
 * @param {string} parentKey - 父级键名
 * @param {Array} parentPath - 父级路径
 * @returns {Array} 树形数据结构
 */
export function buildTreeData(obj, parentKey = '', parentPath = []) {
  const result = []
  
  if (obj === null || obj === undefined) {
    return result
  }
  
  if (Array.isArray(obj)) {
    // 处理数组
    obj.forEach((item, index) => {
      const currentPath = [...parentPath, index]
      const node = {
        id: generateJsonPath(currentPath),
        label: `[${index}]`,
        path: currentPath,
        isLeaf: false,
        children: []
      }
      
      if (typeof item === 'object' && item !== null) {
        node.children = buildTreeData(item, `[${index}]`, currentPath)
        node.isLeaf = node.children.length === 0
      } else {
        // 基础类型值
        node.isLeaf = true
        node.value = item
        node.valueType = getValueType(item)
        node.label = `[${index}]`
      }
      
      result.push(node)
    })
  } else if (typeof obj === 'object') {
    // 处理对象
    Object.keys(obj).forEach(key => {
      const value = obj[key]
      const currentPath = [...parentPath, key]
      const node = {
        id: generateJsonPath(currentPath),
        label: key,
        path: currentPath,
        isLeaf: false,
        children: []
      }
      
      if (typeof value === 'object' && value !== null) {
        node.children = buildTreeData(value, key, currentPath)
        node.isLeaf = node.children.length === 0
      } else {
        // 基础类型值
        node.isLeaf = true
        node.value = value
        node.valueType = getValueType(value)
        node.label = key
      }
      
      result.push(node)
    })
  }
  
  return result
}

/**
 * 检查节点是否为叶子节点（可点击的值节点）
 * @param {Object} node - 树节点
 * @returns {boolean} 是否为叶子节点
 */
export function isLeafNode(node) {
  return node.isLeaf === true
}

/**
 * 获取节点的完整路径描述
 * @param {Object} node - 树节点
 * @returns {string} 路径描述
 */
export function getNodePathDescription(node) {
  if (!node.path || node.path.length === 0) {
    return 'Root'
  }
  
  return node.path.join(' → ')
}