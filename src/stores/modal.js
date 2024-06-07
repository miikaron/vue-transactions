import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false);

  const hiddenClass = computed(() => {
    return !isOpen.value ? 'hidden' : '';
  });

  const openModal = () => {
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
  };

  return {
    isOpen,
    hiddenClass,
    openModal,
    closeModal
  };
});
