import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMappingStore = defineStore('mapping', () => {
  // 当前活动的表单字段
  const activeField = ref(null)
  
  // 输入映射对象
  const inputMappings = ref({})
  
  // 表单数据
  const formData = ref({})
  
  // 设置活动字段
  const setActiveField = (fieldInfo) => {
    activeField.value = fieldInfo
  }
  
  // 清除活动字段
  const clearActiveField = () => {
    activeField.value = null
  }
  
  // 添加映射
  const addMapping = (fieldName, value, options = {}) => {
    if (!fieldName || value === undefined || value === null) return
  
    if (options.source === 'FIXED_VALUE') {
      inputMappings.value[fieldName] = {
        apiName: fieldName,
        source: 'FIXED_VALUE',
        fixedValue: value,
        expression: ''
      }
    } else {
      inputMappings.value[fieldName] = {
        apiName: fieldName,
        source: 'EXPRESSION',
        expression: value
      }
    }
  }
  
  // 移除映射
  const removeMapping = (fieldName) => {
    delete inputMappings.value[fieldName]
  }
  
  // 更新表单数据
  const updateFormData = (fieldName, value) => {
    formData.value[fieldName] = value
  }
  
  // 获取字段的映射表达式
  const getFieldMapping = (fieldName) => {
    return inputMappings.value[fieldName]?.expression || ''
  }
  
  // 计算属性：格式化的映射对象用于显示
  const formattedMappings = computed(() => {
    return JSON.stringify(inputMappings.value, null, 2)
  })
  
  return {
    activeField,
    inputMappings,
    formData,
    setActiveField,
    clearActiveField,
    addMapping,
    removeMapping,
    updateFormData,
    getFieldMapping,
    formattedMappings
  }
})