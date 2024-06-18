<template>
  <v-app-bar app>
    <v-container>
      <v-row align="center" justify="space-between" class="flex-nowrap">
        <!-- Brand and Toggler -->
        <v-col class="d-flex align-center" cols="auto">
          <v-toolbar-title v-if="!authStore.user" class="ml-2"
            >Tabaccheria</v-toolbar-title
          >
          <v-btn v-else icon @click="toggleNavbar" class="d-md-none">
            <v-icon>{{ collapseNav ? "mdi-menu-open" : "mdi-menu" }}</v-icon>
          </v-btn>
        </v-col>

        <!-- Links and Buttons for Large Screens -->
        <v-col
          cols="auto"
          class="d-none d-md-flex align-center justify-start"
          style="padding-left: 16px"
        >
          <template v-if="authStore.user">
            <nav class="d-flex">
              <v-btn text to="/home">Home</v-btn>
              <v-btn text to="/">Foglio debiti</v-btn>
              <v-btn text to="/add-customer">Aggiungi nuovo cliente</v-btn>
            </nav>
          </template>
        </v-col>

        <!-- Right content -->
        <v-col
          cols="auto"
          class="d-none d-md-flex align-center justify-end"
          style="padding-right: 16px"
        >
          <v-btn text @click="logout" v-if="authStore.user">Logout</v-btn>
          <v-btn text @click="openAuthModal" v-else>Login</v-btn>
        </v-col>

        <!-- Mobile Right content -->
        <v-col class="d-flex justify-end align-center d-md-none" cols="auto">
          <v-btn text @click="openAuthModal" v-if="!authStore.user"
            >Login</v-btn
          >
          <v-btn text @click="logout" v-else>Logout</v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Mobile Menu for Small/Medium Screens -->
    <v-dialog
      v-model="collapseNav"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <v-sheet
        @click="toggleNavbar"
        class="d-flex flex-column align-center justify-center"
        height="100%"
      >
        <v-btn text to="/home" class="modal-btn">Home</v-btn>
        <v-btn text to="/" class="modal-btn">Transaction Summary</v-btn>
        <v-btn text to="/add-customer" class="modal-btn"
          >Add New Customer</v-btn
        >
        <v-btn text @click="logout" class="modal-btn">Logout</v-btn>
      </v-sheet>
    </v-dialog>
  </v-app-bar>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useModalStore } from "../stores/modal";

// Import Vuetify components explicitly
import {
  VAppBar,
  VToolbarTitle,
  VContainer,
  VRow,
  VCol,
  VBtn,
  VDialog,
  VIcon,
  VSheet,
} from "vuetify/components";

const modalStore = useModalStore();
const authStore = useAuthStore();

const collapseNav = ref(false);

const toggleNavbar = () => {
  collapseNav.value = !collapseNav.value;
};

const openAuthModal = () => {
  modalStore.openModal();
};

const logout = async () => {
  await authStore.logout();
  collapseNav.value = false; // Close the navbar menu on logout
};
</script>

<style scoped>
nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap; /* Ensure items wrap on smaller screens */
}

/* Utility classes for responsive design */
@media (max-width: 960px) {
  .d-md-none {
    display: block !important;
  }
  .d-md-flex {
    display: none !important;
  }
}

@media (min-width: 961px) {
  .d-md-none {
    display: none !important;
  }
  .d-md-flex {
    display: flex !important;
  }
}

.modal-btn {
  height: 10%;
  width: 100%;
  border-top: 1px solid white;
  border-bottom: 1px solid white;
  justify-content: center;
}

/* Ensure modal background is dark, and text is visible */
.modal-background {
  background-color: #333;
}

.v-btn__content {
  justify-content: center;
}
</style>
