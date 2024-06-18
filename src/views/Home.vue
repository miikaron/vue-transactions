<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">Benvenuto nel diario debiti</h1>
      </v-col>
    </v-row>

    <v-btn
      @click.stop="drawer = !drawer"
      color="#42b983"
      class="mb-4 white--text"
    >
      AGGIUNGI TRANSAZIONE
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <v-navigation-drawer v-model="drawer" temporary right class="mr-0">
      <v-list dense>
        <v-list-subheader>Aggiungi transazione</v-list-subheader>
        <v-col cols="12">
          <TransactionForm />
        </v-col>
      </v-list>
    </v-navigation-drawer>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Elenco delle transazioni</v-card-title>
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
import { ref, computed } from "vue";
import { useDisplay } from "vuetify";

// Import Vuetify components explicitly
import {
  VContainer,
  VRow,
  VCol,
  VCard,
  VCardTitle,
  VCardText,
  VIcon,
  VNavigationDrawer,
  VList,
  VListSubheader,
} from "vuetify/components";

// Vuetify's display object to access breakpoints
const { threshold, mdAndDown } = useDisplay();

const drawer = ref(false);
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
