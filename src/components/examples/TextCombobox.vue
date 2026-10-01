<template>
  <v-select
    :style="textComboboxStyle"
    class="combo-box text-combobox"
    variant="outlined"
    density="compact"
    :items="values"
    item-title="text"
    item-value="id"
    :model-value="modelValue"
    hide-details
    return-object
    @update:modelValue="emit('update:modelValue', $event)"></v-select>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { TextComboboxItem } from "./text-combobox-item";

const props = defineProps({
  values: Array<TextComboboxItem>,
  modelValue: Object as PropType<TextComboboxItem>,
  width: Number
});

const emit = defineEmits(["update:modelValue"]);

const textComboboxStyle = computed(() => {
  return {
    width: `${props.width}px`
  };
});
</script>

<style lang="scss" scoped>
.text-combobox {
  display: inline-block;
}
.combo-box {
  height: 26px;
  flex: 0 1 auto;
  border-radius: 5px;
  border: 2px solid #999999;
}
.combo-box :deep(.v-input__control) {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0px !important;
  border-radius: 3px;
}
.combo-box :deep(.v-field) {
  width: 100%;
  height: 100%;
  -webkit-padding-end: 0px;
}
.combo-box :deep(.v-field__input) {
  min-height: 22px !important;
  max-height: 22px !important;
  width: 100%;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 0 0 5px !important;
  opacity: 1 !important;
}
.combo-box :deep(.v-field__field) {
  background-color: #ffffff;
}
.combo-box :deep(.v-field__input input) {
  min-height: 22px !important;
  max-height: 22px !important;
}
.combo-box :deep(.v-field__outline) {
  width: 0px;
  height: 0px;
  visibility: hidden;
  --v-field-border-width: 0px;
}
.combo-box :deep(.v-input__append-inner) {
  margin: 3px 0 0 0px !important;
  padding: 0px !important;
}
.combo-box :deep(.v-select__selection) {
  min-height: 16px !important;
  max-height: 16px !important;
  height: 16px !important;
  display: flex !important;
  align-items: center !important;
  margin: 0px !important;
}
.combo-box :deep(.v-field__append-inner) {
  padding: 0 !important;
  -webkit-margin-start: 0px;
  background-color: #e9e9e9;
  border-left: 2px solid #999999;
}
.combo-box :deep(.v-field__append-inner .v-icon) {
  margin-left: 0px;
  width: 22px;
  height: 22px;
}
.combo-box :deep(.v-select__selection-text) {
  text-transform: capitalize;
  font-family: "Roboto", sans-serif;
  font-size: 0.8em;
  color: #000000ff;
}
</style>
