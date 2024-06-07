<template>
  <v-app>
    <Navbar />
    <main class="main-container">
      <router-view />
    </main>
    <Login />
  </v-app>
</template>

<script setup>
import Navbar from "./components/Navbar.vue";
import Login from "./components/authentication/Login.vue";
</script>

<style>
/* Global styles for layout */
.main-container {
  margin-top: 64px; /* Adjust based on actual navbar height */
  padding: 16px;
}
</style>
