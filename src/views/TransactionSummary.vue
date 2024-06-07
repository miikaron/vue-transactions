<template>
  <v-container>
    <v-row v-if="authStore.user">
      <v-col cols="12">
        <h1>Transaction Summary</h1>
        <v-checkbox
          v-model="hideZeroAmount"
          label="Hide customers with Total Amount of zero"
        ></v-checkbox>
        <button
          color="primary"
          @click="downloadExcel"
          class="download-btn"
          small
        >
          Download as Excel
        </button>
        <Grid :columns="headers" :data="filteredCustomerSummaries" />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-card class="mx-auto" max-width="344">
        <v-img
          height="200px"
          src="https://i.pinimg.com/originals/4c/55/8c/4c558c5dbff1828f2b87582dc49526e8.gif"
          cover
        ></v-img>
        <v-card-text
          >You must be logged in to view the transactions...</v-card-text
        >
      </v-card>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../clients/supabase";
import { useAuthStore } from "../stores/auth";
import Grid from "@/components/Grid.vue"; // Adjust the path as needed
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as XLSX from "@e965/xlsx"; // Import the updated xlsx library

const authStore = useAuthStore();

dayjs.extend(utc);
dayjs.extend(timezone);

const headers = ["name", "total_amount", "last_transaction"];
const customerSummaries = ref([]);
const hideZeroAmount = ref(true);

const convertToLocalTime = (timestamp) => {
  return timestamp
    ? dayjs(timestamp).tz("Europe/Rome").format("YYYY-MM-DD HH:mm:ss")
    : "N/A";
};

const fetchCustomerSummaries = async () => {
  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("id, name, created_at");

  if (customerError) {
    console.error("Error fetching customers:", customerError);
    return;
  }

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("id, ts_amount, created_at, customer_id");

  if (transactionError) {
    console.error("Error fetching transactions:", transactionError);
    return;
  }

  customerSummaries.value = customers.map((customer) => {
    const customerTransactions = transactions.filter(
      (trx) => trx.customer_id === customer.id
    );
    const totalAmount = customerTransactions
      .reduce((total, trx) => total + trx.ts_amount, 0)
      .toFixed(2); // Fixed to 2 decimal places

    const lastTransaction = customerTransactions.reduce((latest, trx) => {
      return trx.created_at > latest ? trx.created_at : latest;
    }, "");

    return {
      name: customer.name,
      total_amount: totalAmount,
      last_transaction: convertToLocalTime(lastTransaction), // Convert to local time or show 'N/A' if no transactions
    };
  });
};

const filteredCustomerSummaries = computed(() => {
  return hideZeroAmount.value
    ? customerSummaries.value.filter((customer) => customer.total_amount != 0)
    : customerSummaries.value;
});

onMounted(fetchCustomerSummaries);

const downloadExcel = () => {
  const sortedData = [...filteredCustomerSummaries.value].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const data = sortedData.map((customer) => ({
    Name: customer.name,
    "Total Amount": customer.total_amount,
    "Last Transaction": customer.last_transaction,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction Summary");

  XLSX.writeFile(workbook, "Transaction_Summary.xlsx");
};
</script>

<style scoped>
.download-btn {
  margin-bottom: 1rem;
  background-color: rgba(33, 150, 243, 0.1);
  color: #08371a;
  border: 2px solid #08371a;
  border-radius: 8px;
  min-width: 120px;
  padding: 3px;
}

.download-btn:hover {
  background-color: rgba(33, 150, 243, 0.2);
}
</style>
