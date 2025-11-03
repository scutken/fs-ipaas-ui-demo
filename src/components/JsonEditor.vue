<template>
  <div class="json-editor">
    <div class="editor-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <el-tag :type="isValid ? 'success' : 'danger'" size="small">
          {{ isValid ? '格式正确' : '格式错误' }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button
            size="small"
            @click="formatJson"
            :disabled="!isValid"
            icon="Document"
          >
            格式化
          </el-button>
          <el-button
            size="small"
            @click="resetToOriginal"
            icon="RefreshLeft"
          >
            重置
          </el-button>
          <el-button
            size="small"
            @click="copyToClipboard"
            icon="CopyDocument"
          >
            复制
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <div class="editor-body">
      <div class="editor-content" :class="{ 'with-history': showHistory }">
        <el-input
          v-model="jsonText"
          type="textarea"
          :rows="20"
          placeholder="请输入JSON数据..."
          class="json-textarea"
          @input="handleInput"
          resize="vertical"
        />
      </div>
      
    </div>
    
    <div v-if="errorMessage" class="error-message">
      <el-alert
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
      />
    </div>
    
    <div class="editor-footer">
      <div class="footer-info">
        <span>行数: {{ lineCount }}</span>
        <span>字符数: {{ charCount }}</span>
        <span>大小: {{ formatSize(charCount) }}</span>
      </div>
      <div class="footer-actions">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveJson"
          :disabled="!isValid || !hasChanges"
          :loading="saving"
        >
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, RefreshLeft, CopyDocument, Clock } from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    default: 'JSON编辑器'
  },
  modelValue: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// 响应式数据
const jsonText = ref('')
const originalJson = ref('')
const isValid = ref(true)
const errorMessage = ref('')
const saving = ref(false)
const showHistory = ref(false)
const currentData = ref({})
const historyRef = ref()

// 计算属性
const lineCount = computed(() => {
  return jsonText.value.split('\n').length
})

const charCount = computed(() => {
  return jsonText.value.length
})

const hasChanges = computed(() => {
  return jsonText.value !== originalJson.value
})

// 初始化
onMounted(() => {
  initializeEditor()
})

// 监听props变化
watch(() => props.modelValue, () => {
  initializeEditor()
}, { deep: true })

// 初始化编辑器
const initializeEditor = () => {
  try {
    const formatted = JSON.stringify(props.modelValue, null, 2)
    jsonText.value = formatted
    originalJson.value = formatted
    currentData.value = props.modelValue
    validateJson()
    
  } catch (error) {
    console.error('初始化JSON编辑器失败:', error)
    ElMessage.error('初始化编辑器失败')
  }
}

// 验证JSON格式
const validateJson = () => {
  try {
    if (!jsonText.value.trim()) {
      isValid.value = false
      errorMessage.value = 'JSON内容不能为空'
      return
    }
    
    const parsed = JSON.parse(jsonText.value)
    isValid.value = true
    errorMessage.value = ''
    currentData.value = parsed
  } catch (error) {
    isValid.value = false
    errorMessage.value = `JSON格式错误: ${error.message}`
  }
}

// 处理输入变化
const handleInput = () => {
  validateJson()
}


// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    ElMessage.success('JSON格式化成功')
  } catch (error) {
    ElMessage.error('格式化失败，请检查JSON格式')
  }
}

// 重置到原始状态
const resetToOriginal = () => {
  jsonText.value = originalJson.value
  validateJson()
  ElMessage.info('已重置到原始状态')
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(jsonText.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = jsonText.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('已复制到剪贴板')
  }
}

// 保存JSON
const saveJson = async () => {
  if (!isValid.value) {
    ElMessage.error('请修复JSON格式错误后再保存')
    return
  }
  
  try {
    saving.value = true
    const parsed = JSON.parse(jsonText.value)
    
    // 更新原始数据
    originalJson.value = jsonText.value
    
    // 触发保存事件
    emit('update:modelValue', parsed)
    emit('save', parsed)
    
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 暴露方法给父组件
defineExpose({
  formatJson,
  resetToOriginal,
  copyToClipboard,
  saveJson,
  isValid: () => isValid.value,
  hasChanges: () => hasChanges.value
})
</script>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.editor-content.with-history {
  flex: 0 0 60%;
}

.history-panel {
  flex: 0 0 40%;
  border-left: 1px solid #e4e7ed;
  background: #f8f9fa;
  overflow: hidden;
}

.json-textarea {
  height: 100%;
}

.json-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  min-height: 400px;
}

.json-textarea :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.error-message {
  padding: 0 16px 16px;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.footer-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-left,
  .header-right {
    justify-content: center;
  }
  
  .editor-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-info {
    justify-content: center;
  }
  
  .footer-actions {
    justify-content: center;
  }
}

/* 滚动条样式 */
.json-textarea :deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.json-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.json-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>