<template>
  <div class="expression-input">
    <div class="expression-input-wrapper">
      <el-input
        ref="inputRef"
        v-model="localValue"
        @update:model-value="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        :placeholder="placeholder"
        type="textarea"
        :rows="2"
        resize="none"
        class="expression-textarea"
      />
    </div>
    
    <!-- JSONPath 值预览 -->
    <!-- 预览值功能已移除 -->
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { evaluateJsonPath } from '@/utils/jsonPath'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '输入JSONPath表达式，如：$.querySfOrder.TotalAmount'
  },
  variables: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const inputRef = ref()
const localValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 计算预览值
const previewValue = computed(() => {
  if (!localValue.value || !localValue.value.trim()) {
    return null
  }
  
  try {
    return evaluateJsonPath(props.variables, localValue.value)
  } catch (error) {
    return undefined // 表示路径无效
  }
})

// 处理输入
const handleInput = (value) => {
  localValue.value = value
  emit('update:modelValue', value)
}

// 处理聚焦
const handleFocus = () => {
  emit('focus')
}

// 处理失焦
const handleBlur = () => {
  emit('blur')
}

// 暴露方法给父组件
defineExpose({
  focus: () => {
    inputRef.value?.focus()
  },
  blur: () => {
    inputRef.value?.blur()
  }
})
</script>

<style scoped>
.expression-input {
  width: 100%;
}

.expression-input-wrapper {
  width: 100%;
}

.expression-textarea {
  width: 100%;
}

.preview-section {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 12px;
}

.preview-label {
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.preview-value {
  display: flex;
  align-items: center;
}

:deep(.el-textarea__inner) {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
}
</style>