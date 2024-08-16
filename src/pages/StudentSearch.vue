<script setup>
import "@/assets/StudentSearch.css";
import { ref, computed, onMounted, nextTick } from "vue";
import textRetrievalTool from "@/services/fullnameRetrieval";

// Store import
import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

// Modal handle
import StudentInfoInputModal from "@/components/StudentInfoInputModal.vue";
const showStudentInfoInputModal = ref(false);
const togglePopupStudentInfo = () => {
  showStudentInfoInputModal.value = !showStudentInfoInputModal.value;
};
import StudentSearchModal from "@/components/StudentSearchModal.vue";
const showStudentSearchModal = ref(false);
const togglePopupStudentSearch = () => {
  showStudentSearchModal.value = !showStudentSearchModal.value;
};
const currentSearchStudent = ref(null);
const handleSetCurrentStudent = (event) => {
  const currentStudentId = event.currentTarget.getAttribute("data-id");
  currentSearchStudent.value = tableData.value.find(
    (item) => item.id === parseInt(currentStudentId)
  );
  togglePopupStudentSearch();
};
const handleSearchChooseStudent = (student) => {
  tableData.value.forEach((item) => {
    if (item.id === currentSearchStudent.value.id) {
      item.studentInfo = [student];
    }
  });

  // Change UI
  // Get current table row by data-id
  const currentTableRows = document.querySelector(
    `.table-row[data-id="${currentSearchStudent.value.id}"]`
  );

  const oldBackgroundColor = currentTableRows.style.backgroundColor;
  currentTableRows.style.backgroundColor = "#f7fee7";
  setTimeout(() => {
    currentTableRows.style.backgroundColor = oldBackgroundColor;
  }, 1000);

  togglePopupStudentSearch();
};

// Refs
const tableData = ref(studentSearchStore.tableData);
const rawMessage = ref("");
const isExtractingName = ref(false);

// Computed
const numOfNullName = computed(() => {
  return tableData.value.filter((item) => item.name === "NULL").length || 0;
});
const numOfErrorName = computed(() => {
  return tableData.value.filter((item) => item.name === "ERROR").length || 0;
});
const numOfExtractedName = computed(() => {
  return (
    tableData.value.filter(
      (item) =>
        item.name !== "" && item.name !== "NULL" && item.name !== "ERROR"
    ).length || 0
  );
});
const numOfManyStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length > 1).length || 0
  );
});
const numOfOneStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length === 1).length || 0
  );
});
const numOfNoStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length === 0).length || 0
  );
});

// Handle main action
const handleMessageInput = () => {
  try {
    navigator.clipboard.readText().then((text) => {
      if (text.trim() === "") {
        alert("Clipboard is empty");
        return;
      }
      rawMessage.value = text;
      tableData.value = text.split("\n").map((message, index) => {
        return {
          id: index,
          message,
          name: "",
          studentInfo: [],
        };
      });
      const lastElement = tableData.value[tableData.value.length - 1];
      if (lastElement.message === "") {
        tableData.value.pop();
      }

      const emptyMessage = tableData.value.find((item) => item.message === "");
      if (emptyMessage) {
        alert("Có tồn tại tin nhắn trống, vui lòng kiểm tra lại");
        rawMessage.value = "";
        tableData.value = [];
        return;
      }

      // confirm to input message with num of message
      const confirmMessage = confirm(
        `Đã tìm thấy ${tableData.value.length} tin nhắn, bạn có muốn tiếp tục?`
      );
      if (!confirmMessage) {
        rawMessage.value = "";
        tableData.value = [];
      }
    });
  } catch (error) {
    alert("Error reading clipboard data");
  }
};

const handleExtractName = async () => {
  if (isExtractingName.value) {
    return;
  }

  if (rawMessage.value.trim() === "") {
    alert("Không có dữ liệu tin nhắn để trích xuất");
    return;
  }

  isExtractingName.value = true;

  const messages = textRetrievalTool.processMessagesWithId(tableData.value);
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    const response = await textRetrievalTool.callApiWithRetries(
      JSON.stringify(batch)
    );
    handleAddDataToTable(response.results);
    textRetrievalTool.changeAPIKeyAndModel();

    // Log progress
    console.log(
      `Processed ${Math.min(i + 10, messages.length)} out of ${
        messages.length
      } messages`
    );
  }

  isExtractingName.value = false;
};

const handleAddDataToTable = (data) => {
  tableData.value = tableData.value.map((item) => {
    // Add Name
    const found = data.find((result) => result.id === item.id);
    if (found) {
      item.name = found.fullName.toUpperCase();
    }

    // Add Student
    item.studentInfo = studentSearchStore.getStudentInfoByName(item.name);

    return item;
  });
};

const handleChooseStudent = (event, row, chooseStudent) => {
  const tableElement = document.querySelector(".table");
  const rowElement = event.currentTarget;
  const initialScrollTop = tableElement.scrollTop;
  const initialRowOffsetTop = rowElement.offsetTop;

  tableData.value.forEach((item) => {
    if (item.id === row.id) {
      item.studentInfo = [chooseStudent];
    }
  });

  // Change UI
  // Get current table row by data-id
  const currentTableRows = document.querySelector(
    `.table-row[data-id="${row.id}"]`
  );

  const oldBackgroundColor = currentTableRows.style.backgroundColor;
  currentTableRows.style.backgroundColor = "#f7fee7";
  setTimeout(() => {
    currentTableRows.style.backgroundColor = oldBackgroundColor;
  }, 1000);

  nextTick(() => {
    const newRowOffsetTop = rowElement.offsetTop;
    const scrollDifference = newRowOffsetTop - initialRowOffsetTop;
    tableElement.scrollTop = initialScrollTop + scrollDifference;
  });
};

const handleExportData = () => {
  if (tableData.value.length === 0) {
    alert("Không có dữ liệu để xuất");
    return;
  }

  // if (numOfNoStudentInfo.value > 0) {
  //   alert("Có tin nhắn chưa có thông tin sinh viên, vui lòng kiểm tra lại");
  //   return;
  // }

  if (numOfManyStudentInfo.value > 0) {
    alert("Có tin nhắn có nhiều thông tin sinh viên, vui lòng kiểm tra lại");
    return;
  }

  try {
    let rawExcelData = "";
    tableData.value.forEach((item) => {
      rawExcelData += `${item.studentInfo[0]?.maHoXo || ""}\t${
        item.studentInfo[0]?.hoTen || ""
      }\t${item.studentInfo[0]?.ngaySinh || ""}\t${
        item.studentInfo[0]?.nganh || ""
      }\n`;
    });

    navigator.clipboard.writeText(rawExcelData).then(() => {
      alert("Dữ liệu đã được sao chép vào clipboard");
    });
  } catch (error) {
    alert("Error exporting data: ", error.message);
  }
};

// Load data from local
onMounted(() => {
  try {
    studentSearchStore.loadStudentInfo();
  } catch (error) {
    alert("Error loading student data from local: ", error.message);
  }
});
</script>

<template>
  <div class="container">
    <div class="panel">
      <h2 class="panel-heading">⚙️ Bảng điều khiển ⚙️</h2>
      <div class="panel-btn">
        <button @click="togglePopupStudentInfo">
          ✍🏻 Nhập dữ liệu sinh viên
        </button>
        <button @click="handleMessageInput">📨 Nhập dữ liệu tin nhắn</button>
        <button @click="handleExtractName">⚗️ Trích xuất tên</button>
        <button @click="handleExportData">💾 Xuất dữ liệu</button>
      </div>
    </div>
    <div class="content">
      <div class="table">
        <table>
          <tr>
            <th>Tin nhắn giao dịch <br />{{ `${tableData.length} 💬` }}</th>
            <th>
              Tên trích xuất<br />{{
                `${numOfExtractedName} ✅ | ${numOfNullName} ⚠️ | ${numOfErrorName} 🚫`
              }}
            </th>
            <th>
              Thông tin sinh viên<br />{{
                `${numOfOneStudentInfo} 🙋🏻‍♂️ | ${numOfManyStudentInfo} 👨🏻‍👩🏻‍👦🏻‍👦🏻 | ${numOfNoStudentInfo} 👤`
              }}
            </th>
            <th>👁️‍🗨️</th>
          </tr>
          <tr
            class="table-row"
            v-for="(data, index) in tableData"
            :key="index + 'y'"
            :data-id="data.id"
          >
            <td>{{ data.message }}</td>
            <td>{{ data.name }}</td>
            <td>
              <div class="student-box">
                <div v-if="data.studentInfo.length === 0">
                  <div class="student-no-item">
                    <td>Không tìm thấy</td>
                  </div>
                </div>

                <div v-if="data.studentInfo.length === 1">
                  <div class="student-one-item">
                    <td>{{ data.studentInfo[0].maHoXo }}</td>
                    <td>{{ data.studentInfo[0].hoTen }}</td>
                    <td>{{ data.studentInfo[0].ngaySinh }}</td>
                    <td>{{ data.studentInfo[0].nganh }}</td>
                  </div>
                </div>

                <tr
                  class="student-box-item"
                  v-if="data.studentInfo.length > 1"
                  v-for="(student, i) in data.studentInfo"
                  @click="handleChooseStudent($event, data, student)"
                  :key="i + 'z'"
                >
                  <td>{{ student.maHoXo }}</td>
                  <td>{{ student.hoTen }}</td>
                  <td>{{ student.ngaySinh }}</td>
                  <td>{{ student.nganh }}</td>
                </tr>
              </div>
            </td>
            <td
              :data-id="data.id"
              class="student-search"
              @click="handleSetCurrentStudent($event)"
            >
              🔍
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <StudentInfoInputModal
    v-if="showStudentInfoInputModal"
    :TogglePopup="togglePopupStudentInfo"
  >
  </StudentInfoInputModal>
  <StudentSearchModal
    v-if="showStudentSearchModal"
    :TogglePopup="togglePopupStudentSearch"
    :CurrentSearchStudent="currentSearchStudent"
    :handleSearchChooseStudent="handleSearchChooseStudent"
  >
  </StudentSearchModal>

  <!-- Spinner -->
  <div class="spinner" v-if="isExtractingName"></div>
</template>

<style scoped>
/* CSS btn */
.panel-btn {
  margin-top: 5px;
  display: flex;
  justify-content: space-evenly;
}

.panel-btn button {
  padding: 5px 10px;
  border: 2px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}

.panel-btn button:hover {
  background-color: #e6f7d7;
}
</style>
