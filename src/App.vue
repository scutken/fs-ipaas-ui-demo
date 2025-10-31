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
          <FormDisplay :schema="schemaData" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import VariablePicker from '@/components/VariablePicker.vue'
import FormDisplay from '@/components/FormDisplay.vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const loading = ref(true)
const loadingText = ref('正在加载数据...')
const schemaData = ref({})
const variablesData = ref({})
const connectionStatus = ref('已连接')

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
    ElMessage.warning('使用演示数据替代')
    // 使用演示数据
    variablesData.value = {
      user: {
        name: "张三",
        email: "zhangsan@example.com",
        details: {
          address: "北京市朝阳区",
          phone: "13800138000"
        }
      },
      order: {
        id: "ORD001",
        amount: 1000,
        status: "已完成",
        items: [
          { name: "商品A", price: 500 },
          { name: "商品B", price: 500 }
        ]
      },
      system: {
        timestamp: "2024-01-01T00:00:00Z",
        version: "1.0.0"
      }
    }
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
  gap: 8px;
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
</style>