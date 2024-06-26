<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4" class="d-flex align-center justify-end">
        <div class="filter-date-range">
          <v-date-picker
            v-model="date"
            :max-width="300"
            single
            :locale="it"
          ></v-date-picker>
        </div>
      </v-col>
      <v-col cols="12" md="8"
        ><div class="scommesse">
          <p>
            Scommesse segnate: {{ scommesseSum }}€ | Rimesse in cassa calcio:
            {{ pagamentoVoucherOcassa.cassaCalcioSum }}€
          </p>
          <h2 class="mb-4">
            Voucher:
            {{ pagamentoVoucherOcassa.voucherSum }}€ |Totale scommesse:
            {{ scommesseSumTotal }}€
          </h2>
          <p>
            Voucher = "Paga debito" che includono la nota "voucher" (maiuscolo o
            minuscolo è indifferente)
          </p>
          <p>
            Scommesse segnate = transazioni con titolo "Scommesse" che non
            contengono un "#" (es: #ieri) o che sono uguali a "Mirko"
          </p>
          <p>
            Rimesse in cassa calcio: "Paga debito" che includono la nota
            "calcio" (es: cassa calcio)
          </p>
          <p>
            Totale scommesse: "scommesse segnate" tolte quelle "rimesse in cassa
            calcio" e quelle di "mirko"
          </p>
        </div>

        <div class="debiti">
          <h2 class="mt-4">
            Debiti pagati (contanti): {{ debitiPagatiContanti }}€
          </h2>
          <p>
            Debiti pagati = transazioni "Paga debito" che non hanno nella nota:
            "bancomat", "voucher", "cassa calcio", "mirko" o "#"
          </p>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <form id="filter-form" class="mt-4 mb-4">
          <div class="filter-container">
            <div class="filter-search">
              Cerca:
              <input
                name="query"
                v-model="searchQuery"
                class="form-control search-input"
              />
            </div>
          </div>
        </form>
        <div class="mb-2">
          <button
            class="show-all-button"
            @click="showAllTransactions = !showAllTransactions"
            :style="{
              backgroundColor: showAllTransactions ? '#3f84e5' : '#3f84e5',
            }"
          >
            {{ showAllTransactions ? "Mostra meno" : "Mostra tutto" }}
          </button>
        </div>
        <div class="table-container">
          <DemoGrid
            class="transaction-table"
            :data="filteredTransactions"
            :columns="gridColumns"
            :filter-key="searchQuery"
          >
            <!-- Custom cell rendering -->
            <template #cell="{ row, column }">
              <td v-if="column === 'ts_amount'">
                <span
                  :style="{
                    color:
                      row.title.toLowerCase() === 'scommesse' &&
                      row.ts_note.toLowerCase() !== 'mirko'
                        ? '#f8333c'
                        : row.title.toLowerCase() === '-paga debito' &&
                          row.ts_note.toLowerCase() !== 'mirko'
                        ? '#8dab7f'
                        : row.ts_note.toLowerCase().startsWith('mirko')
                        ? '#e3c5bb'
                        : 'black',
                  }"
                  >{{ row.ts_amount || "" }}</span
                >
              </td>
              <td v-else-if="column === 'title'">
                <span
                  :style="{
                    color:
                      row.title.toLowerCase() === 'scommesse' &&
                      row.ts_note.toLowerCase() !== 'mirko'
                        ? '#f8333c'
                        : row.title.toLowerCase() === '-paga debito' &&
                          row.ts_note.toLowerCase() !== 'mirko'
                        ? '#8dab7f'
                        : row.ts_note.toLowerCase().startsWith('mirko')
                        ? '#e3c5bb'
                        : 'black',
                  }"
                  >{{ row.title || "" }}</span
                >
              </td>
              <td v-else-if="column === 'ts_note'">
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
                  SALVA
                </button>
                <button
                  v-else
                  @click="editTransaction(row)"
                  class="edit-button"
                >
                  MODIFICA
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
import { useToast } from "vue-toast-notification";
import { it } from "vuetify/locale";

dayjs.extend(utc);
dayjs.extend(timezone);

const toast = useToast();

const searchQuery = ref("");
const gridColumns = [
  "created_at",
  "title",
  "ts_amount",
  "customer_name",
  "ts_note",
  "actions",
  "accounting_date",
];
const flatTransactions = ref([]);
const editableRows = ref({});
const originalNotes = ref({});

const date = ref(dayjs().toDate()); // the date picker is set to today by default
const showAllTransactions = ref(false);

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
    created_at: convertToLocalTime(transaction.created_at),
    customer_name: transaction.customer.name,
    ts_note: transaction.ts_note || "",
  }));
};

const filteredTransactions = computed(() => {
  let transactions = flatTransactions.value;
  if (showAllTransactions.value) {
    return transactions;
  }
  // Sort the transactions array based on the created_at field in descending order
  transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (date.value) {
    const selectedDate = dayjs(date.value)
      .tz("Europe/Rome")
      .startOf("day")
      .toDate();
    const endOfSelectedDate = dayjs(date.value)
      .tz("Europe/Rome")
      .endOf("day")
      .toDate();
    transactions = transactions.filter(
      (transaction) =>
        new Date(transaction.created_at) >= selectedDate &&
        new Date(transaction.created_at) <= endOfSelectedDate
    );
  }

  return transactions;
});

// Totale debiti pagati in contanti
const filteredDebitiPagati = computed(() => {
  return filteredTransactions.value.filter(
    (transaction) => transaction.title.trim().toLowerCase() === "-paga debito"
  );
});

const debitiPagatiContanti = computed(() => {
  return filteredDebitiPagati.value
    .filter(
      (transaction) =>
        !transaction.ts_note.trim().toLowerCase().includes("bancomat") &&
        !transaction.ts_note.trim().toLowerCase().includes("voucher") &&
        !transaction.ts_note.trim().toLowerCase().includes("mirko") &&
        !transaction.ts_note.trim().toLowerCase().includes("#") &&
        !transaction.ts_note.trim().toLowerCase().includes("calcio")
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.ts_amount), 0)
    .toFixed(2);
});

// Filtro display tipo transazione (scommessa)
const filteredTransactionsWithoutMirkoOrYesterday = computed(() => {
  return filteredTransactions.value.filter(
    (transaction) =>
      !transaction.ts_note.trim().toLowerCase().includes("#") &&
      transaction.ts_note.trim().toLowerCase() !== "mirko"
  );
});

const scommesseSum = computed(() => {
  return filteredTransactionsWithoutMirkoOrYesterday.value
    .filter(
      (transaction) => transaction.title.trim().toLowerCase() === "scommesse"
    )
    .reduce((sum, transaction) => sum + transaction.ts_amount, 0)
    .toFixed(2);
});

// Filtra per tipo pagamento
const pagamentoVoucherOcassa = computed(() => {
  const voucherSum = filteredTransactionsWithoutMirkoOrYesterday.value
    .filter((transaction) =>
      transaction.ts_note.trim().toLowerCase().includes("voucher")
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.ts_amount), 0)
    .toFixed(2);
  const cassaCalcioSum = filteredTransactionsWithoutMirkoOrYesterday.value
    .filter((transaction) =>
      transaction.ts_note.trim().toLowerCase().includes("calcio")
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.ts_amount), 0)
    .toFixed(2);
  return { voucherSum, cassaCalcioSum };
});

// Calcola il valore finale delle transazioni (scommesse)
const scommesseSumTotal = computed(() => {
  return (
    parseFloat(scommesseSum.value) -
    parseFloat(pagamentoVoucherOcassa.value.cassaCalcioSum)
  ).toFixed(2);
});

// Other functions
const editTransaction = (transaction) => {
  if (transaction.ts_note === null) {
    transaction.ts_note = "";
  }
  editableRows.value[transaction.id] = true;
  originalNotes.value[transaction.id] = transaction.ts_note;
};

const saveTransaction = async (transaction) => {
  if (transaction.ts_note === originalNotes.value[transaction.id]) {
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

.label-text {
  margin-left: 5px;
}

.show-all-button {
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
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
