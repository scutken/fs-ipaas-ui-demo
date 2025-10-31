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
    
    <div class="display-content">
      <FormEngine 
        :schema="schema" 
        @field-focus="handleFieldFocus"
      />
    </div>
    
    <div class="display-footer">
      <el-divider>映射结果</el-divider>
      
      <div class="mapping-summary">
        <h4>当前映射数量: {{ mappingCount }}</h4>
        <el-button 
          v-if="mappingCount > 0"
          size="small" 
          type="primary" 
          @click="exportMappings"
          :icon="Download"
        >
          导出映射
        </el-button>
      </div>
      
      <div class="mapping-display">
        <el-input
          :model-value="formattedMappings"
          type="textarea"
          :rows="10"
          readonly
          placeholder="映射结果将在这里显示..."
        />
      </div>
      
      <div v-if="Object.keys(inputMappings).length > 0" class="mapping-list">
        <h4>映射列表:</h4>
        <el-table :data="mappingTableData" size="small" border>
          <el-table-column prop="fieldName" label="字段名" width="150" />
          <el-table-column prop="fieldTitle" label="字段标题" width="120" />
          <el-table-column prop="expression" label="映射表达式" min-width="200" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button 
                size="small" 
                type="danger" 
                @click="removeMapping(row.fieldName)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
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
      source: mapping.source
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
    await ElMessageBox.confirm(
      `确定要清除所有 ${mappingCount.value} 个映射吗？`,
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 清除所有映射
    Object.keys(inputMappings.value).forEach(fieldName => {
      mappingStore.removeMapping(fieldName)
    })
    
    ElMessage.success('已清除所有映射')
  } catch {
    // 用户取消操作
  }
}

// 导出映射
const exportMappings = () => {
  const mappingData = {
    timestamp: new Date().toISOString(),
    mappingCount: mappingCount.value,
    inputMappings: inputMappings.value
  }
  
  const dataStr = JSON.stringify(mappingData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `form-mappings-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  
  ElMessage.success('映射数据已导出')
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

.display-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.display-footer {
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
  padding: 16px;
  max-height: 50vh;
  overflow-y: auto;
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
  margin-bottom: 16px;
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