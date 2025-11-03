<template>
  <div class="form-engine">
    <el-form :model="formData" label-width="120px" label-position="top">
      <template v-for="(field, key) in formFields" :key="key">
        <FormField
          :field="field"
          :fieldName="key"
          :modelValue="formData[key]"
          :variables="variables"
          @update:modelValue="updateFieldValue(key, $event)"
          @field-focus="handleFieldFocus"
        />
      </template>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMappingStore } from '@/stores/mapping'
import FormField from './FormField.vue'

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

// 表单数据
const formData = ref({})

// 从 schema 中提取表单字段
const formFields = computed(() => {
  if (!props.schema?.objectSchema?.properties) {
    return {}
  }
  return props.schema.objectSchema.properties
})

// 更新字段值
const updateFieldValue = (fieldName, value) => {
  formData.value[fieldName] = value
  mappingStore.updateFormData(fieldName, value)

  // 判断输入模式，传入不同的参数调用addMapping
  const field = formFields.value[fieldName]
  if (!field) return

  // 视字段是否可切换固定/表达式模式，默认固定值对应库存储需要的映射
  // 此处简化判断，字段选择固定值即为FIXED_VALUE，表达式即EXPRESSION
  if (field.inputMode === 'fixed') {
    mappingStore.addMapping(fieldName, value, { source: 'FIXED_VALUE' })
  } else {
    mappingStore.addMapping(fieldName, value, { source: 'EXPRESSION' })
  }
}

// 处理字段聚焦事件
const handleFieldFocus = (fieldInfo) => {
  mappingStore.setActiveField(fieldInfo)
}

// 初始化表单数据
const initFormData = () => {
  const fields = formFields.value
  const initialData = {}
  
  Object.keys(fields).forEach(key => {
    const field = fields[key]
    // 设置默认值
    if (field.defaultValue !== undefined) {
      initialData[key] = field.defaultValue
    } else if (field.schemaType === 'number_input' || field.type === 'number') {
      initialData[key] = null
    } else if (field.multiple) {
      initialData[key] = []
    } else {
      initialData[key] = ''
    }
  })
  
  formData.value = initialData
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.form-engine {
  padding: 20px;
}

.el-form {
  max-width: 1200px;
}
</style>