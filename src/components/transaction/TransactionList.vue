<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="header">Transaction List</h1>
        <form id="filter-form" class="mb-4">
          <div class="filter-container">
            <div class="filter-search">
              Search:
              <input
                name="query"
                v-model="searchQuery"
                class="form-control search-input"
              />
            </div>
            <label class="filter-today">
              <input type="checkbox" v-model="filterToday" />
              <span class="label-text">Today's transactions</span>
            </label>
          </div>
        </form>
        <div class="table-container">
          <DemoGrid
            class="transaction-table"
            :data="filteredTransactions"
            :columns="gridColumns"
            :filter-key="searchQuery"
          >
            <!-- Custom cell rendering -->
            <template #cell="{ row, column }">
              <td v-if="column === 'ts_note'">
                <input
                  v-if="editableRows[row.id]"
                  type="text"
                  v-model="row.ts_note"
                  :style="{
                    width: `${Math.max((row.ts_note || '').length * 8, 100)}px`,
                    minHeight: '40px',
                  }"
                  class="editable-input"
                  @input="updateRowNote(row.id, row.ts_note)"
                />
                <span v-else>{{ row.ts_note || "" }}</span>
              </td>
              <td v-else-if="column === 'actions'">
                <button
                  v-if="editableRows[row.id]"
                  @click="saveTransaction(row)"
                  class="save-button"
                >
                  SAVE
                </button>
                <button
                  v-else
                  @click="editTransaction(row)"
                  class="edit-button"
                >
                  EDIT
                </button>
              </td>
              <td v-else>
                {{ row[column] }}
              </td>
            </template>
          </DemoGrid>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import DemoGrid from "../Grid.vue";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { supabase } from "../../clients/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useToast } from "vue-toast-notification"; // Import the toast library

dayjs.extend(utc);
dayjs.extend(timezone);

const toast = useToast(); // Initialize the toast

const searchQuery = ref("");
const filterToday = ref(true);
const gridColumns = [
  "created_at",
  "ts_amount",
  "customer_name",
  "title",
  "ts_note",
  "actions",
  "accounting_date",
];
const flatTransactions = ref([]);
const editableRows = ref({}); // Track editable rows
const originalNotes = ref({}); // Track original ts_note values

const convertToLocalTime = (timestamp) => {
  return dayjs(timestamp).tz("Europe/Rome").format("YYYY-MM-DD HH:mm:ss");
};

const fetchTransactions = async () => {
  const { data, error } = await supabase.from("transactions").select(`
    *,
    customer:customer_id (id, name)
  `);
  if (error) {
    console.error("Error fetching transactions:", error);
  } else {
    updateTransactions(data);
  }
};

const updateTransactions = (data) => {
  flatTransactions.value = data.map((transaction) => ({
    ...transaction,
    created_at: convertToLocalTime(transaction.created_at), // Convert to local time
    customer_name: transaction.customer.name, // Use customer_name
    ts_note: transaction.ts_note || "", // Initialize ts_note as an empty string if null
  }));
};

const filteredTransactions = computed(() => {
  if (!filterToday.value) {
    return flatTransactions.value;
  }
  const today = dayjs().tz("Europe/Rome").format("YYYY-MM-DD");
  return flatTransactions.value.filter(
    (transaction) =>
      transaction.accounting_date &&
      transaction.accounting_date.startsWith(today) // Check for the existence of accounting_date
  );
});

const editTransaction = (transaction) => {
  if (transaction.ts_note === null) {
    transaction.ts_note = ""; // Initialize ts_note as an empty string if null
  }
  editableRows.value[transaction.id] = true;
  originalNotes.value[transaction.id] = transaction.ts_note; // Store original ts_note
};

const saveTransaction = async (transaction) => {
  if (transaction.ts_note === originalNotes.value[transaction.id]) {
    // No changes, just exit edit mode
    delete editableRows.value[transaction.id];
    delete originalNotes.value[transaction.id];
    return;
  }

  const { error } = await supabase
    .from("transactions")
    .update({ ts_note: transaction.ts_note })
    .eq("id", transaction.id);

  if (error) {
    console.error("Error updating ts_note:", error);
    return;
  }

  toast.success("Transaction note updated successfully!");

  delete editableRows.value[transaction.id];
  delete originalNotes.value[transaction.id];
};

const updateRowNote = (transactionId, newNote) => {
  const transaction = flatTransactions.value.find(
    (tr) => tr.id === transactionId
  );
  if (transaction) {
    transaction.ts_note = newNote;
  }
};

let transactionChannel;

const setupRealTimeUpdates = () => {
  transactionChannel = supabase
    .channel("transaction-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions" },
      (payload) => fetchTransactions()
    )
    .subscribe();
};

const cleanUpRealTimeUpdates = () => {
  if (transactionChannel) {
    supabase.removeChannel(transactionChannel);
  }
};

onMounted(() => {
  fetchTransactions();
  setupRealTimeUpdates();
});

onBeforeUnmount(() => {
  cleanUpRealTimeUpdates();
});
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  width: 100%;
}

.header {
  font-size: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.filter-search .form-control {
  border: 1px solid #ccc;
  margin-left: 5px;
  padding: 5px;
}

.filter-today {
  margin-left: auto;
  align-items: center;
}

.label-text {
  margin-left: 5px;
}

.transaction-table {
  width: 100%;
}

.transaction-table table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: #42b983;
  color: rgba(255, 255, 255, 0.66);
  cursor: pointer;
  user-select: none;
  padding: 10px 20px;
  min-width: 120px;
}

td {
  background-color: #f9f9f9;
  padding: 10px 20px;
  min-width: 120px;
}

th.active .arrow {
  opacity: 1;
}

.arrow {
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  margin-left: 5px;
  opacity: 0.66;
}

.arrow.asc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #fff;
}

.arrow.dsc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #fff;
}

/* Button styles for edit and save */
.edit-button {
  background-color: yellow;
  padding: 5px 10px;
  cursor: pointer;
}

.save-button {
  background-color: green;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
}

/* Edit mode styling for input field */
.editable-input {
  border: 2px solid orange;
}

@media (max-width: 960px) {
  .header {
    font-size: 1.25rem;
  }

  .transaction-table {
    font-size: 0.875rem;
  }
}

@media (max-width: 600px) {
  .header {
    font-size: 1rem;
  }

  .transaction-table {
    font-size: 0.75rem;
  }

  th,
  td {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  th {
    display: none;
  }

  tr {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  td {
    padding-left: 50%;
    text-align: left;
    position: relative;
  }

  td::before {
    content: attr(data-title);
    position: absolute;
    left: 10px;
    width: 40%;
    white-space: nowrap;
    font-weight: bold;
  }
}
</style>
