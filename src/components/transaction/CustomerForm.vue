<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Create New Customer</h1>
        <v-form ref="form" @submit.prevent="createCustomer">
          <v-text-field
            ref="nameInput"
            v-model="name"
            label="Customer Name"
            :rules="[rules.required]"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary">Create Customer</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { useToast } from "vue-toast-notification";
import { supabase } from "../../clients/supabase";
import { v4 as uuidv4 } from "uuid";

const toast = useToast();
const form = ref(null);
const name = ref("");
const nameInput = ref(null);

const rules = {
  required: (value) => !!value || "Required.",
};

const createCustomer = async () => {
  // Clear previous error messages
  toast.clear();

  // Trim whitespace and cast to lowercase
  const trimmedName = name.value.trim().toLowerCase();

  // Debugging: Ensure the name value is correct
  if (!trimmedName) {
    toast.error("Customer name is required.");
    return;
  }

  // Check if the name is unique
  const { data: existingCustomers, error: fetchError } = await supabase
    .from("customers")
    .select("id")
    .eq("name", trimmedName);

  if (fetchError) {
    // Handle the error during fetching the customer
    toast.error("An error occurred while checking the name. Please try again.");
    console.error("Error:", fetchError);
    return;
  }

  if (existingCustomers.length > 0) {
    // Show error message if name is not unique
    toast.error("Customer name already exists.");
    return;
  }

  // Create the new customer
  const { error: insertError } = await supabase.from("customers").insert([
    {
      id: uuidv4(),
      name: trimmedName,
      created_at: new Date().toISOString(),
      last_transaction: null,
      total_amount: 0,
    },
  ]);

  if (insertError) {
    // Handle the error if insert fails
    toast.error(
      "An error occurred while creating the customer. Please try again."
    );
    console.error("Error:", insertError);
    return;
  }

  // Optionally, provide success feedback
  toast.success("Customer created successfully!");

  // Reset the form
  name.value = "";
  await nextTick(() => {
    // Reset validation
    form.value.resetValidation();
    // Exit focus on the name input
    nameInput.value.blur();
  });
};
</script>

<style scoped></style>
