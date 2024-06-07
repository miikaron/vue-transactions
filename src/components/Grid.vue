<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  data: Array,
  columns: Array,
  filterKey: String,
});

const sortKey = ref("");
const sortOrders = ref(props.columns.reduce((o, key) => ((o[key] = 1), o), {}));

const filteredData = computed(() => {
  let { data, filterKey } = props;
  if (filterKey) {
    filterKey = filterKey.toLowerCase();
    data = data.filter((row) => {
      return Object.keys(row).some((key) => {
        return String(row[key]).toLowerCase().indexOf(filterKey) > -1;
      });
    });
  }
  const key = sortKey.value;
  if (key) {
    const order = sortOrders.value[key];
    data = data.slice().sort((a, b) => {
      a = a[key];
      b = b[key];
      return (a === b ? 0 : a > b ? 1 : -1) * order;
    });
  }
  return data;
});

function sortBy(key) {
  sortKey.value = key;
  sortOrders.value[key] *= -1;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>

<template>
  <div class="table-container">
    <table v-if="filteredData.length" class="responsive-table">
      <thead>
        <tr>
          <th
            v-for="key in columns"
            @click="sortBy(key)"
            :class="{ active: sortKey == key }"
            :key="key"
          >
            {{ capitalize(key) }}
            <span
              class="arrow"
              :class="sortOrders[key] > 0 ? 'asc' : 'dsc'"
            ></span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in filteredData" :key="entry.id">
          <template v-for="key in columns" :key="entry.id + '-' + key">
            <td :data-title="capitalize(key)">
              <template v-if="$slots.cell">
                <!-- Use the scoped slot for custom cell rendering -->
                <slot name="cell" :row="entry" :column="key"></slot>
              </template>
              <template v-else>
                {{ entry[key] }}
              </template>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
    <p v-else>No matches found.</p>
  </div>
</template>

<style scoped>
.table-container {
  overflow-x: auto;
}

/* Default styles */
table {
  border: 2px solid #42b983;
  border-radius: 3px;
  background-color: #fff;
  width: 100%;
  table-layout: auto;
}

th {
  background-color: #42b983;
  color: rgba(255, 255, 255, 0.66);
  cursor: pointer;
  user-select: none;
}

td {
  background-color: #f9f9f9;
}

th,
td {
  min-width: 120px;
  padding: 10px 20px;
}

th.active {
  color: #fff;
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

/* Responsive adjustments */
@media (max-width: 960px) {
  table {
    font-size: 0.875rem; /* Smaller font size for medium devices */
  }

  th,
  td {
    padding: 8px 16px;
  }
}

@media (max-width: 600px) {
  table {
    font-size: 0.75rem; /* Smaller font size for small devices */
  }

  th,
  td {
    padding: 6px 12px;
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
