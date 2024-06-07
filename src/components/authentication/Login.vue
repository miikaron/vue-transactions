<template>
  <v-dialog v-model="modalStore.isOpen" max-width="600px">
    <v-card class="dialog-card">
      <v-card-title class="headline">
        {{ tab === "login" ? "Login" : "Register" }}
      </v-card-title>
      <div v-if="tab === 'login'">
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary">Login</v-btn>
        </v-form>
      </div>
      <!-- <div v-if="tab === 'register'">
        <v-form @submit.prevent="handleRegister">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary">Register</v-btn>
        </v-form>
      </div> -->
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useModalStore } from "../../stores/modal";
import { useToast } from "vue-toast-notification";

// Import Vuetify components explicitly
import {
  VDialog,
  VCard,
  VCardTitle,
  VTabs,
  VTab,
  VForm,
  VTextField,
  VBtn,
} from "vuetify/components";

const email = ref("");
const password = ref("");
const tab = ref("login");

const authStore = useAuthStore();
const modalStore = useModalStore();
const toast = useToast();

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    toast.success("Login successful");
  } catch (error) {
    toast.error("Login failed: " + error.message);
  } finally {
    modalStore.closeModal();
  }
};

// const handleRegister = async () => {
//   try {
//     await authStore.register(email.value, password.value);
//     toast.success("Registration successful");
//   } catch (error) {
//     toast.error("Registration failed: " + error.message);
//   } finally {
//     modalStore.closeModal();
//   }
// };
//
</script>

<style scoped>
.dialog-card {
  padding: 20px;
}

.headline {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  padding: 0 0 10px 5px;
}
/* Move the dialog card up on larger screens */
@media (min-width: 960px) {
  .v-dialog__content {
    display: flex;
    align-items: flex-start; /* Move dialog card up */
  }
}
</style>
