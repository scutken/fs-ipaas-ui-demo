<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1>动态表单引擎 PoC</h1>
          <div class="header-info">
            <el-tag type="info">Vue 3 + Element Plus</el-tag>
            <el-tag type="success">概念验证</el-tag>
            <el-button-group class="edit-buttons">
              <el-button
                size="small"
                type="primary"
                @click="openSchemaEditor"
                icon="Edit"
              >
                编辑Schema
              </el-button>
              <el-button
                size="small"
                type="success"
                @click="openVariablesEditor"
                icon="Edit"
              >
                编辑Variables
              </el-button>
            </el-button-group>
          </div>
        </div>
      </el-header>
      
      <!-- 主体内容 -->
      <el-container class="main-container">
        <!-- 左侧变量选择器 -->
        <el-aside class="left-panel" width="400px">
          <VariablePicker :variables="variablesData" />
        </el-aside>
        
        <!-- 右侧表单展示区 -->
        <el-main class="right-panel">
          <FormDisplay :schema="schemaData" :variables="variablesData" />
        </el-main>
      </el-container>
      
      <!-- 底部状态栏 -->
      <el-footer class="app-footer" height="40px">
        <div class="footer-content">
          <span>状态: {{ connectionStatus }}</span>
          <span>活动字段: {{ activeFieldDisplay }}</span>
          <span>映射数量: {{ mappingCount }}</span>
        </div>
      </el-footer>
    </el-container>
    
    <!-- 加载遮罩 -->
    <div
      v-loading="loading"
      :element-loading-text="loadingText"
      element-loading-background="rgba(0, 0, 0, 0.7)"
      v-if="loading"
      class="loading-overlay"
    >
    </div>
    
    <!-- Schema编辑器模态框 -->
    <el-dialog
      v-model="schemaEditorVisible"
      title="Schema数据编辑器"
      width="80%"
      :before-close="handleSchemaEditorClose"
      destroy-on-close
      class="json-editor-dialog"
    >
      <JsonEditor
        v-if="schemaEditorVisible"
        title="Schema数据编辑"
        :model-value="schemaData"
        @save="handleSchemaSave"
        @cancel="schemaEditorVisible = false"
      />
    </el-dialog>
    
    <!-- Variables编辑器模态框 -->
    <el-dialog
      v-model="variablesEditorVisible"
      title="Variables数据编辑器"
      width="80%"
      :before-close="handleVariablesEditorClose"
      destroy-on-close
      class="json-editor-dialog"
    >
      <JsonEditor
        v-if="variablesEditorVisible"
        title="Variables数据编辑"
        :model-value="variablesData"
        @save="handleVariablesSave"
        @cancel="variablesEditorVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import VariablePicker from '@/components/VariablePicker.vue'
import FormDisplay from '@/components/FormDisplay.vue'
import JsonEditor from '@/components/JsonEditor.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(true)
const loadingText = ref('正在加载数据...')
const schemaData = ref({})
const variablesData = ref({})
const connectionStatus = ref('已连接')

// 编辑器状态
const schemaEditorVisible = ref(false)
const variablesEditorVisible = ref(false)

const mappingStore = useMappingStore()

// 计算属性
const activeFieldDisplay = computed(() => {
  const activeField = mappingStore.activeField
  if (!activeField) return '无'
  return activeField.field?.title || activeField.fieldName
})

const mappingCount = computed(() => {
  return Object.keys(mappingStore.inputMappings).length
})

// 加载 Schema 数据
const loadSchemaData = async () => {
  try {
    loadingText.value = '正在加载表单结构...'
    const response = await fetch('/example/schema.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    schemaData.value = data
    console.log('Schema 数据加载成功:', data)
  } catch (error) {
    console.error('加载 Schema 数据失败:', error)
    ElMessage.error('加载表单结构失败，请检查 schema.json 文件')
    // 使用默认数据
    schemaData.value = {
      objectSchema: {
        properties: {}
      }
    }
  }
}

// 加载变量数据
const loadVariablesData = async () => {
  try {
    loadingText.value = '正在加载变量数据...'
    const response = await fetch('/example/variables.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    variablesData.value = data
    console.log('Variables 数据加载成功:', data)
  } catch (error) {
    console.error('加载 Variables 数据失败:', error)
    ElMessage.warning('加载 Variables 数据失败')
  }
}

// 初始化应用
const initializeApp = async () => {
  try {
    loading.value = true
    
    // 并行加载数据
    await Promise.all([
      loadSchemaData(),
      loadVariablesData()
    ])
    
    // 验证数据完整性
    if (!schemaData.value.objectSchema?.properties) {
      throw new Error('Schema 数据格式不正确')
    }
    
    if (Object.keys(variablesData.value).length === 0) {
      console.warn('变量数据为空')
    }
    
    connectionStatus.value = '已连接'
    ElMessage.success('应用初始化成功')
    
  } catch (error) {
    console.error('应用初始化失败:', error)
    connectionStatus.value = '连接失败'
    ElMessage.error('应用初始化失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  initializeApp()
})

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
  ElMessage.error('发生未知错误，请查看控制台')
})

// 全局未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
  ElMessage.error('发生异步错误，请查看控制台')
})

// 编辑器相关函数
// 打开Schema编辑器
const openSchemaEditor = () => {
  schemaEditorVisible.value = true
}

// 打开Variables编辑器
const openVariablesEditor = () => {
  variablesEditorVisible.value = true
}

// 处理Schema编辑器关闭
const handleSchemaEditorClose = (done) => {
  ElMessageBox.confirm(
    '确定要关闭编辑器吗？未保存的更改将丢失。',
    '确认关闭',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}

// 处理Variables编辑器关闭
const handleVariablesEditorClose = (done) => {
  ElMessageBox.confirm(
    '确定要关闭编辑器吗？未保存的更改将丢失。',
    '确认关闭',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}

// 处理Schema保存
const handleSchemaSave = async (newSchemaData) => {
  try {
    // 验证Schema数据格式
    if (!newSchemaData.objectSchema?.properties) {
      throw new Error('Schema数据格式不正确，缺少objectSchema.properties')
    }
    
    // 更新本地数据
    schemaData.value = newSchemaData
    
    // 这里可以添加保存到服务器的逻辑
    // await saveSchemaToServer(newSchemaData)
    
    // 关闭编辑器
    schemaEditorVisible.value = false
    
    // 重新初始化映射存储（因为Schema可能发生变化）
    mappingStore.clearMappings()
    
    ElMessage.success('Schema数据保存成功')
    console.log('Schema数据已更新:', newSchemaData)
    
  } catch (error) {
    console.error('保存Schema数据失败:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

// 处理Variables保存
const handleVariablesSave = async (newVariablesData) => {
  try {
    // 验证Variables数据格式
    if (typeof newVariablesData !== 'object' || newVariablesData === null) {
      throw new Error('Variables数据格式不正确，必须是对象类型')
    }
    
    // 更新本地数据
    variablesData.value = newVariablesData
    
    // 这里可以添加保存到服务器的逻辑
    // await saveVariablesToServer(newVariablesData)
    
    // 关闭编辑器
    variablesEditorVisible.value = false
    
    ElMessage.success('Variables数据保存成功')
    console.log('Variables数据已更新:', newVariablesData)
    
  } catch (error) {
    console.error('保存Variables数据失败:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

// 保存到服务器的函数（可选实现）
const saveSchemaToServer = async (schemaData) => {
  // 这里可以实现保存到服务器的逻辑
  // 例如：
  // const response = await fetch('/api/schema', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(schemaData)
  // })
  // if (!response.ok) throw new Error('保存到服务器失败')
}

const saveVariablesToServer = async (variablesData) => {
  // 这里可以实现保存到服务器的逻辑
  // 例如：
  // const response = await fetch('/api/variables', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(variablesData)
  // })
  // if (!response.ok) throw new Error('保存到服务器失败')
}
</script>

<style scoped>
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-buttons {
  margin-left: 12px;
}

.edit-buttons .el-button {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.edit-buttons .el-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.main-container {
  height: calc(100vh - 100px);
}

.left-panel {
  background-color: #f8f9fa;
  border-right: 1px solid #e4e7ed;
}

.right-panel {
  background-color: white;
  padding: 0;
}

.app-footer {
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 12px;
  color: #909399;
}

.footer-content span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel {
    width: 350px !important;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 8px;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .left-panel {
    width: 300px !important;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-track) {
  background: #f1f1f1;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-track) {
  background: #f1f1f1;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
}

/* JSON编辑器模态框样式 */
.json-editor-dialog {
  --el-dialog-padding-primary: 0;
}

.json-editor-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 70vh;
  overflow: hidden;
}

.json-editor-dialog :deep(.el-dialog__header) {
  padding: 20px 20px 0;
  margin-bottom: 0;
}

.json-editor-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 响应式编辑器模态框 */
@media (max-width: 768px) {
  .json-editor-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .json-editor-dialog :deep(.el-dialog__body) {
    height: 60vh;
  }
  
  .edit-buttons {
    margin-left: 8px;
  }
  
  .edit-buttons .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .header-info {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .edit-buttons {
    margin-left: 0;
    justify-content: center;
  }
  
  .edit-buttons .el-button {
    flex: 1;
  }
}
</style>