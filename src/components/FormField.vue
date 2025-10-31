<template>
  <div class="form-field">
    <!-- 字符串输入框 -->
    <el-form-item 
      v-if="field.schemaType === 'string_input'" 
      :label="field.title"
      :class="{ 'active-field': isActiveField }"
    >
      <el-input
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @focus="handleFocus"
        :placeholder="field.placeholder"
        :show-password="field.showPassword"
        :type="field.multiline ? 'textarea' : 'text'"
        :rows="field.multiline ? 4 : undefined"
      />
      <div v-if="mappedExpression" class="mapping-indicator">
        <el-tag size="small" type="info">{{ mappedExpression }}</el-tag>
      </div>
    </el-form-item>

    <!-- 数字输入框 -->
    <el-form-item 
      v-else-if="field.schemaType === 'number_input'" 
      :label="field.title"
      :class="{ 'active-field': isActiveField }"
    >
      <el-input-number
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @focus="handleFocus"
        style="width: 100%"
      />
      <div v-if="mappedExpression" class="mapping-indicator">
        <el-tag size="small" type="info">{{ mappedExpression }}</el-tag>
      </div>
    </el-form-item>

    <!-- 选择框 -->
    <el-form-item 
      v-else-if="field.schemaType === 'select'" 
      :label="field.title"
      :class="{ 'active-field': isActiveField }"
    >
      <el-select
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @focus="handleFocus"
        :multiple="field.multiple"
        style="width: 100%"
        :placeholder="`请选择${field.title}`"
      >
        <el-option
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
          :disabled="option.disabled"
        />
      </el-select>
      <div v-if="mappedExpression" class="mapping-indicator">
        <el-tag size="small" type="info">{{ mappedExpression }}</el-tag>
      </div>
    </el-form-item>

    <!-- 对象类型 - 嵌套表单 -->
    <el-form-item 
      v-else-if="field.schemaType === 'object'" 
      :label="field.title"
    >
      <el-card class="nested-form">
        <template v-for="(subField, subKey) in field.properties" :key="subKey">
          <FormField
            :field="subField"
            :fieldName="`${fieldName}.${subKey}`"
            :modelValue="getNestedValue(subKey)"
            @update:modelValue="updateNestedValue(subKey, $event)"
            @field-focus="$emit('field-focus', $event)"
          />
        </template>
      </el-card>
    </el-form-item>

    <!-- 数组类型 - 动态列表 -->
    <el-form-item 
      v-else-if="field.schemaType === 'array'" 
      :label="field.title"
    >
      <div class="array-form">
        <div v-for="(item, index) in arrayValue" :key="index" class="array-item">
          <el-card>
            <template #header>
              <div class="array-item-header">
                <span>{{ field.title }} #{{ index + 1 }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeArrayItem(index)"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </template>
            <template v-for="(subField, subKey) in field.items.properties" :key="subKey">
              <FormField
                :field="subField"
                :fieldName="`${fieldName}[${index}].${subKey}`"
                :modelValue="getArrayItemValue(index, subKey)"
                @update:modelValue="updateArrayItemValue(index, subKey, $event)"
                @field-focus="$emit('field-focus', $event)"
              />
            </template>
          </el-card>
        </div>
        <el-button 
          type="primary" 
          @click="addArrayItem"
          :icon="Plus"
        >
          {{ field.addText || '添加' }}
        </el-button>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import { Delete, Plus } from '@element-plus/icons-vue'

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
  }
})

const emit = defineEmits(['update:modelValue', 'field-focus'])

const mappingStore = useMappingStore()

// 检查是否为当前活动字段
const isActiveField = computed(() => {
  return mappingStore.activeField?.fieldName === props.fieldName
})

// 获取字段的映射表达式
const mappedExpression = computed(() => {
  return mappingStore.getFieldMapping(props.fieldName)
})

// 数组值处理
const arrayValue = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

// 处理字段聚焦
const handleFocus = () => {
  emit('field-focus', {
    fieldName: props.fieldName,
    field: props.field
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
</style>