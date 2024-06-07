<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">Welcome to the Transaction Manager</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6" lg="4">
        <v-card class="mb-4">
          <v-card-title>Transaction Form</v-card-title>
          <v-card-text>
            <TransactionForm />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="isMediumOrBelow" cols="12">
        <v-card class="mb-4">
          <v-card-title>Transaction List</v-card-title>
          <v-card-text>
            <TransactionList />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-else cols="12" md="6" lg="8">
        <v-card class="mb-4">
          <v-card-title>Transaction List</v-card-title>
          <v-card-text>
            <TransactionList />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import TransactionForm from "../components/transaction/TransactionForm.vue";
import TransactionList from "../components/transaction/TransactionList.vue";
import { computed } from "vue";
import { useDisplay } from "vuetify";

// Import Vuetify components explicitly
import {
  VContainer,
  VRow,
  VCol,
  VCard,
  VCardTitle,
  VCardText,
} from "vuetify/components";

// Vuetify's display object to access breakpoints
const { threshold, mdAndDown } = useDisplay();

const isMediumOrBelow = computed(() => mdAndDown.value);
</script>

<style scoped>
.text-center {
  text-align: center;
}
.mb-4 {
  margin-bottom: 1rem;
}
</style>
