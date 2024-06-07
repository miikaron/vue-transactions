import { defineStore } from 'pinia';
import { ref } from 'vue';

// Define the store
export const useNavbarModalStore = defineStore('navmodal', () => {
  // State variable to store the visibility status of the modal
  const isModalOpen = ref(false);

  // Action to open the modal
  const openModal = () => {
    isModalOpen.value = true;
  };

  // Action to close the modal
  const closeModal = () => {
    isModalOpen.value = false;
  };

  // Action to toggle the modal
  const toggleModal = () => {
    isModalOpen.value = !isModalOpen.value;
  };

  // Return the actions and state
  return {
    isModalOpen,
    openModal,
    closeModal,
    toggleModal
  };
});
