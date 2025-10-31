<template>
  <div class="variable-picker">
    <div class="picker-header">
      <h3>变量选择器</h3>
      <el-input
        v-model="searchText"
        placeholder="搜索变量..."
        :prefix-icon="Search"
        clearable
        size="small"
      />
    </div>
    
    <div class="picker-content">
      <el-tree
        ref="treeRef"
        :data="filteredTreeData"
        :props="treeProps"
        :expand-on-click-node="false"
        :check-on-click-node="false"
        node-key="id"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node" :class="{ 'leaf-node': data.isLeaf }">
            <el-icon v-if="!data.isLeaf" class="node-icon">
              <Folder v-if="!node.expanded" />
              <FolderOpened v-else />
            </el-icon>
            <el-icon v-else class="node-icon" :style="{ color: getTypeIconColor(data.valueType) }">
              <component :is="getTypeIcon(data.valueType)" />
            </el-icon>
            <span class="node-label">{{ data.label }}</span>
            <el-tag
              v-if="data.isLeaf && data.valueType"
              size="small"
              :type="getTypeTagType(data.valueType)"
              class="value-tag"
            >
              {{ data.valueType }}
            </el-tag>
          </div>
        </template>
      </el-tree>
    </div>
    
    <div class="picker-footer">
      <el-alert
        v-if="activeFieldInfo"
        :title="`当前活动字段: ${activeFieldInfo.field?.title || activeFieldInfo.fieldName}`"
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else
        title="请先点击右侧表单中的输入框"
        type="warning"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import { buildTreeData, generateJsonPath, isLeafNode } from '@/utils/jsonPath'
import { Search, Folder, FolderOpened, Document, List, Key, Calendar, Switch, Collection, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  variables: {
    type: Object,
    required: true
  }
})

const mappingStore = useMappingStore()
const treeRef = ref()
const searchText = ref('')

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 构建树形数据
const treeData = computed(() => {
  return buildTreeData(props.variables)
})

// 过滤后的树形数据
const filteredTreeData = computed(() => {
  return treeData.value
})

// 当前活动字段信息
const activeFieldInfo = computed(() => {
  return mappingStore.activeField
})

// 处理节点点击
const handleNodeClick = (data, node) => {
  // 只有叶子节点才能被选择
  if (!isLeafNode(data)) {
    // 非叶子节点，切换展开/折叠状态
    node.expanded = !node.expanded
    return
  }
  
  // 检查是否有活动字段
  if (!activeFieldInfo.value) {
    ElMessage.warning('请先点击右侧表单中的输入框')
    return
  }
  
  // 生成 JSONPath
  const jsonPath = generateJsonPath(data.path)
  
  // 添加映射
  mappingStore.addMapping(activeFieldInfo.value.fieldName, jsonPath)
  
  // 显示成功消息
  ElMessage.success(`已将变量 "${jsonPath}" 映射到字段 "${activeFieldInfo.value.field?.title || activeFieldInfo.value.fieldName}"`)
}

// 过滤节点
const filterNode = (value, data) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

// 监听搜索文本变化
watch(searchText, (val) => {
  treeRef.value?.filter(val)
})

// 获取数据类型
const getValueType = (value) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'unknown'
}

// 根据数据类型获取图标
const getTypeIcon = (type) => {
  const iconMap = {
    'string': Document,
    'number': DataAnalysis,
    'boolean': Switch,
    'array': List,
    'object': Collection,
    'null': Key,
    'undefined': Key,
    'unknown': Document
  }
  return iconMap[type] || Document
}

// 根据数据类型获取图标颜色
const getTypeIconColor = (type) => {
  const colorMap = {
    'string': '#67C23A',     // 绿色
    'number': '#E6A23C',     // 橙色
    'boolean': '#F56C6C',    // 红色
    'array': '#409EFF',      // 蓝色
    'object': '#909399',     // 灰色
    'null': '#C0C4CC',       // 浅灰色
    'undefined': '#C0C4CC',  // 浅灰色
    'unknown': '#909399'     // 灰色
  }
  return colorMap[type] || '#909399'
}

// 根据数据类型获取标签类型
const getTypeTagType = (type) => {
  const tagTypeMap = {
    'string': 'success',
    'number': 'warning',
    'boolean': 'danger',
    'array': 'primary',
    'object': 'info',
    'null': '',
    'undefined': '',
    'unknown': 'info'
  }
  return tagTypeMap[type] || 'info'
}

// 展开所有节点（可选）
const expandAll = () => {
  const expandKeys = []
  const collectKeys = (nodes) => {
    nodes.forEach(node => {
      if (!node.isLeaf) {
        expandKeys.push(node.id)
        if (node.children) {
          collectKeys(node.children)
        }
      }
    })
  }
  collectKeys(treeData.value)
  treeRef.value?.setExpandedKeys(expandKeys)
}

// 折叠所有节点
const collapseAll = () => {
  treeRef.value?.setExpandedKeys([])
}

onMounted(() => {
  // 默认展开第一层
  nextTick(() => {
    const firstLevelKeys = treeData.value
      .filter(node => !node.isLeaf)
      .map(node => node.id)
    if (treeRef.value && typeof treeRef.value.setExpandedKeys === 'function') {
      treeRef.value.setExpandedKeys(firstLevelKeys)
    }
  })
})

// 暴露方法给父组件
defineExpose({
  expandAll,
  collapseAll
})
</script>

<style scoped>
.variable-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.picker-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.picker-header h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.picker-footer {
  padding: 12px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.tree-node.leaf-node {
  cursor: pointer;
}

.tree-node.leaf-node:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.node-icon {
  margin-right: 8px;
  color: #909399;
}

.node-label {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.leaf-node .node-label {
  color: #409eff;
  font-weight: 500;
}

.value-tag {
  margin-left: 8px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-tree-node__content) {
  height: auto;
  min-height: 32px;
  padding: 4px 8px;
}

:deep(.el-tree-node__expand-icon) {
  color: #c0c4cc;
}

:deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}
</style>