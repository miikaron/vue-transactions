<template>
  <v-container>
    <v-form ref="form" @submit.prevent="addTransaction">
      <v-row>
        <v-col cols="12">
          <v-autocomplete
            v-model="newTransaction.customer_name"
            :items="customerNames"
            label="Nome cliente"
            required
            clearable
            :rules="[rules.required]"
            :filter="filterCustomerNames"
            class="responsive-input"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12">
          <v-select
            v-model="newTransaction.title"
            :items="transactionType"
            label="Title (tipo transazione)"
            required
            :rules="[rules.required]"
            class="responsive-input"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="newTransaction.ts_amount"
            label="Importo"
            type="number"
            required
            :rules="[rules.required, validateAmount]"
            class="responsive-input"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="newTransaction.accounting_date"
            label="Data contabile"
            type="date"
            required
            :rules="[rules.required]"
            class="responsive-input"
          ></v-text-field>
        </v-col>

        <!-- New ts_note field -->
        <v-col cols="12">
          <v-text-field
            v-model="newTransaction.ts_note"
            label="Annotazioni"
            type="text"
            class="responsive-input"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-btn
            :disabled="isLoading || !isFormValid"
            type="submit"
            color="primary"
            class="responsive-btn"
            >Aggiungi</v-btn
          >
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useToast } from "vue-toast-notification";
import { supabase } from "../../clients/supabase";

// Define refs
const form = ref(null);
const newTransaction = ref({
  title: "",
  ts_amount: "",
  accounting_date: getTodayDate(), // Set default to today's date
  customer_name: "",
  ts_note: "", // Initialize ts_note
});
const transactionType = ref([
  "-Paga debito",
  "Scommesse",
  "Sigarette",
  "Lotto",
  "Gratta&Vinci",
  "Consumazione bar",
  "Scambio merce",
  "Altro",
]);
const customerNames = ref([]);
const toast = useToast();
const isLoading = ref(false); // Add isLoading

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Validation rules
const rules = {
  required: (value) => !!value || "Required.",
};

// Custom validation rules for Amount field
const validateAmount = (value) => {
  if (value < 0 && newTransaction.value.title !== "-Paga debito") {
    return 'Amount must be positive or Title must be "-Paga debito".';
  }
  return true;
};

// Computed property to check form validity
const isFormValid = computed(() => {
  const amountValidation =
    validateAmount(newTransaction.value.ts_amount) === true;

  return (
    amountValidation &&
    newTransaction.value.title &&
    newTransaction.value.ts_amount &&
    newTransaction.value.customer_name
  );
});

// Fetch unique customer names from Supabase
const fetchCustomerNames = async () => {
  const { data, error } = await supabase.from("customers").select("name");
  if (error) {
    console.error("Error fetching customer names:", error);
    toast.error("Error fetching customer names");
  } else {
    // Sort customer names alphabetically
    customerNames.value = data.map((customer) => String(customer.name)).sort();
  }
};

// Custom filter function for customer names
const filterCustomerNames = (item, queryText) => {
  const search = queryText.toLowerCase().trim();
  return item.toLowerCase().includes(search);
};

// Add transaction to Supabase
const addTransaction = async () => {
  // Validate form before submitting
  if (!isFormValid.value) {
    toast.error("Please fill in all required fields correctly");
    return;
  }

  isLoading.value = true; // Set isLoading to true

  // Ensure amount is negative if title is '-Paga debito'
  if (
    newTransaction.value.title === "-Paga debito" &&
    parseFloat(newTransaction.value.ts_amount) > 0
  ) {
    newTransaction.value.ts_amount = -Math.abs(newTransaction.value.ts_amount);
  }

  // Get the customer ID based on the selected customer name
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("name", newTransaction.value.customer_name)
    .single();

  if (customerError) {
    console.error("Error fetching customer ID:", customerError);
    toast.error("Customer not found");
  } else {
    // Create a timestamp for created_at
    const createdAt = new Date().toISOString();

    // Insert new transaction
    const { error } = await supabase.from("transactions").insert([
      {
        title: newTransaction.value.title,
        ts_amount: newTransaction.value.ts_amount,
        accounting_date: newTransaction.value.accounting_date,
        created_at: createdAt,
        customer_id: customer.id,
        ts_note: newTransaction.value.ts_note, // Insert ts_note field
      },
    ]);

    if (error) {
      console.error("Error adding transaction:", error);
      toast.error("Error adding transaction");
    } else {
      toast.success("Transaction added successfully!");
      // Reset form and validation state after successful insert
      newTransaction.value = {
        title: "",
        ts_amount: "",
        accounting_date: getTodayDate(), // Reset to today's date
        customer_name: "",
        ts_note: "", // Reset ts_note
      };
      await nextTick(() => {
        form.value.resetValidation(); // Reset form validation
      });
    }
  }

  isLoading.value = false; // Set isLoading back to false
};

// Fetch data on mounted
onMounted(fetchCustomerNames);
</script>
