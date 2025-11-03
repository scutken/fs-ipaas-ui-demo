<template>
  <div class="form-field">
    <!-- 普通类型 -->
    <el-form-item :class="{ 'active-field': isActiveField }" @focus="handleFocus"
      v-if="field.schemaType !== 'object' & field.schemaType !== 'array'">
      <!-- 切换固定值和表达式 -->
      <template #label>
        <div class="label-wrapper">
          <span>{{ field.title }}</span>
          <div class="mode-toggle">
            <el-button-group size="small">
              <el-button :type="inputMode === 'fixed' ? 'primary' : ''" @click="setInputMode('fixed')" size="small">
                固定值
              </el-button>
              <el-button :type="inputMode === 'expression' ? 'primary' : ''" @click="setInputMode('expression')"
                size="small">
                表达式
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 字段输入框 -->
      <div class="field-wrapper">
        <div class="input-container">
          <!-- 表达式输入 -->
          <ExpressionInput v-if="inputMode === 'expression'" :model-value="modelValue" @focus="handleFocus"
            @update:model-value="$emit('update:modelValue', $event)" :variables="variables"
            :placeholder="'输入JSONPath表达式，如：$.querySfOrder.TotalAmount'" />

          <!-- 文本输入 -->
          <el-input v-else-if="field.schemaType === 'string_input'" :model-value="modelValue" @focus="handleFocus"
            @update:model-value="$emit('update:modelValue', $event)"
            :placeholder="field.placeholder"
            :show-password="field.showPassword"
            :type="field.multiline ? 'textarea' : 'text'"
            :rows="field.multiline ? 4 : undefined"
            style="width: 100%" />

          <!-- 数字输入 -->
          <el-input-number v-else-if="field.schemaType === 'number_input'" :model-value="modelValue" @focus="handleFocus"
            @update:model-value="$emit('update:modelValue', $event)" style="width: 100%" />

          <!-- 选择器 -->
          <el-select v-else-if="field.schemaType === 'select'" :model-value="modelValue" @focus="handleFocus"
            @update:model-value="$emit('update:modelValue', $event)" :multiple="field.multiple" style="width: 100%"
            :placeholder="`请选择${field.title}`">
            <el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value"
              :disabled="option.disabled" />
          </el-select>
        </div>
      </div>
    </el-form-item>


    <!-- 对象类型 - 嵌套表单 -->
    <el-form-item v-else-if="field.schemaType === 'object'" :label="field.title">
      <el-card class="nested-form">
        <template v-for="(subField, subKey) in field.properties" :key="subKey">
          <FormField :field="subField" :fieldName="`${fieldName}.${subKey}`" :modelValue="getNestedValue(subKey)"
            @update:modelValue="updateNestedValue(subKey, $event)" @field-focus="$emit('field-focus', $event)" />
        </template>
      </el-card>
    </el-form-item>

    <!-- 数组类型 - 动态列表 -->
    <el-form-item v-else-if="field.schemaType === 'array'" :label="field.title">
      <div class="array-form">
        <div v-for="(item, index) in arrayValue" :key="index" class="array-item">
          <el-card>
            <template #header>
              <div class="array-item-header">
                <span>{{ field.title }} #{{ index + 1 }}</span>
                <el-button type="danger" size="small" @click="removeArrayItem(index)" :icon="Delete">
                  删除
                </el-button>
              </div>
            </template>
            <template v-for="(subField, subKey) in field.items.properties" :key="subKey">
              <FormField :field="subField" :fieldName="`${fieldName}[${index}].${subKey}`"
                :modelValue="getArrayItemValue(index, subKey)"
                @update:modelValue="updateArrayItemValue(index, subKey, $event)"
                @field-focus="$emit('field-focus', $event)" />
            </template>
          </el-card>
        </div>
        <el-button type="primary" @click="addArrayItem" :icon="Plus">
          {{ field.addText || '添加' }}
        </el-button>
      </div>
    </el-form-item>

  </div>
</template>

<script setup>
import { useMappingStore } from '@/stores/mapping'
import { Delete, Plus } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import ExpressionInput from './ExpressionInput.vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  fieldName: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, Number, Array, Object],
    default: ''
  },
  variables: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'field-focus'])

const mappingStore = useMappingStore()

// 输入模式：'fixed' 固定值，'expression' 表达式
const inputMode = ref('fixed')

const setInputMode = (mode) => {
  inputMode.value = mode
  handleFocus()
}

// 检查是否为当前活动字段
const isActiveField = computed(() => {
  return mappingStore.activeField?.fieldName === props.fieldName
})

// 数组值处理
const arrayValue = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

// 处理字段聚焦
const handleFocus = () => {
  emit('field-focus', {
    fieldName: props.fieldName,
    field: props.field,
    inputMode: inputMode.value
  })
}

// 嵌套对象值处理
const getNestedValue = (subKey) => {
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return props.modelValue[subKey]
  }
  return ''
}

const updateNestedValue = (subKey, value) => {
  const newValue = { ...props.modelValue }
  newValue[subKey] = value
  emit('update:modelValue', newValue)
}

// 数组项值处理
const getArrayItemValue = (index, subKey) => {
  const item = arrayValue.value[index]
  if (typeof item === 'object' && item !== null) {
    return item[subKey]
  }
  return ''
}

const updateArrayItemValue = (index, subKey, value) => {
  const newArray = [...arrayValue.value]
  if (!newArray[index]) {
    newArray[index] = {}
  }
  newArray[index] = { ...newArray[index], [subKey]: value }
  emit('update:modelValue', newArray)
}

// 添加数组项
const addArrayItem = () => {
  const newArray = [...arrayValue.value]
  const newItem = {}

  // 初始化新项的字段
  if (props.field.items?.properties) {
    Object.keys(props.field.items.properties).forEach(key => {
      const subField = props.field.items.properties[key]
      if (subField.type === 'number') {
        newItem[key] = null
      } else if (subField.multiple) {
        newItem[key] = []
      } else {
        newItem[key] = ''
      }
    })
  }

  newArray.push(newItem)
  emit('update:modelValue', newArray)
}

// 删除数组项
const removeArrayItem = (index) => {
  const newArray = [...arrayValue.value]
  newArray.splice(index, 1)
  emit('update:modelValue', newArray)
}
</script>

<style scoped>
.form-field {
  margin-bottom: 16px;
}

.active-field {
  border: 2px solid #409eff;
  border-radius: 4px;
  padding: 8px;
  background-color: #f0f9ff;
}

.label-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.field-wrapper {
  position: relative;
}

.input-container {
  width: 100%;
}

.mode-toggle {
  flex-shrink: 0;
}

.mode-toggle .el-button-group {
  display: flex;
}

.mode-toggle .el-button {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
}

.mode-toggle .el-button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.mode-toggle .el-button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.mapping-indicator {
  margin-top: 4px;
}

.nested-form {
  margin-top: 8px;
}

.array-form {
  width: 100%;
}

.array-item {
  margin-bottom: 16px;
}

.array-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .label-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .mode-toggle {
    align-self: flex-start;
  }
}
</style>