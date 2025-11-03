<template>
  <div class="form-display">
    <div class="display-header">
      <h3>动态表单</h3>
      <div class="header-actions">
        <el-button
          size="small"
          @click="clearAllMappings"
          :icon="Delete"
        >
          清除所有映射
        </el-button>
        <el-button
          size="small"
          @click="clearActiveField"
          :icon="Close"
        >
          取消选择
        </el-button>
      </div>
    </div>
    
    <div class="display-main">
      <div class="form-section">
        <FormEngine
          :schema="schema"
          :variables="variables"
          @field-focus="handleFieldFocus"
        />
      </div>
      <div class="mapping-section">
        <div class="mapping-summary">
          <h4>当前映射数量: {{ mappingCount }}</h4>
        </div>
        <div class="mapping-display">
          <el-input
            :model-value="formattedMappings"
            type="textarea"
            :rows="20"
            readonly
            placeholder="映射结果将在这里显示..."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import FormEngine from './FormEngine.vue'
import { Delete, Close, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  variables: {
    type: Object,
    default: () => ({})
  }
})

const mappingStore = useMappingStore()

// 计算属性
const inputMappings = computed(() => mappingStore.inputMappings)
const formattedMappings = computed(() => mappingStore.formattedMappings)
const mappingCount = computed(() => Object.keys(inputMappings.value).length)

// 映射表格数据
const mappingTableData = computed(() => {
  const formFields = props.schema?.objectSchema?.properties || {}
  
  return Object.keys(inputMappings.value).map(fieldName => {
    const mapping = inputMappings.value[fieldName]
    const field = formFields[fieldName]
    
    return {
      fieldName,
      fieldTitle: field?.title || fieldName,
      expression: mapping.expression,
      source: mapping.source,
      fixedValue: mapping.fixedValue || ''
    }
  })
})

// 处理字段聚焦
const handleFieldFocus = (fieldInfo) => {
  mappingStore.setActiveField(fieldInfo)
  ElMessage.info(`已选择字段: ${fieldInfo.field?.title || fieldInfo.fieldName}`)
}

// 清除活动字段
const clearActiveField = () => {
  mappingStore.clearActiveField()
  ElMessage.info('已取消字段选择')
}

// 移除单个映射
const removeMapping = (fieldName) => {
  mappingStore.removeMapping(fieldName)
  ElMessage.success(`已移除字段 "${fieldName}" 的映射`)
}

// 清除所有映射
const clearAllMappings = async () => {
  if (mappingCount.value === 0) {
    ElMessage.info('当前没有映射需要清除')
    return
  }
  
  try {
    
    // 清除所有映射
    Object.keys(inputMappings.value).forEach(fieldName => {
      mappingStore.removeMapping(fieldName)
    })
    
    ElMessage.success('已清除所有映射')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.form-display {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.display-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.display-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.display-main {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 0 16px 16px;
  overflow-y: auto;
}

.form-section {
  flex: 2;
  overflow-y: auto;
}

.mapping-section {
  flex: 1;
  border-left: 1px solid #e4e7ed;
  padding-left: 16px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.mapping-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mapping-summary h4 {
  margin: 0;
  color: #303133;
}

.mapping-display {
  flex: 1;
  margin-bottom: 16px;
  overflow-y: auto;
}

.mapping-list h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

:deep(.el-divider__text) {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

:deep(.el-table) {
  font-size: 12px;
}

:deep(.el-table .cell) {
  padding: 8px;
}
</style>