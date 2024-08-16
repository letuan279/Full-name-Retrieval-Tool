<script setup>
defineProps(["TogglePopup"]);
import { computed } from "vue";

import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

const handleInfoInput = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (
            !confirm(
                `Bạn có chắc chắn muốn nhập ${text.split("\n").length - 1} sinh viên?`
            )
        )
            return;
        studentSearchStore.setStudentInfo(text);
        alert(
            `Đã nhập thành công ${studentSearchStore.studentInfo.length} sinh viên`
        );
    } catch (error) {
        alert("Error reading clipboard data: ", error.message);
    }
};
</script>

<template>
    <div class="popup">
        <div class="popup-inner">
            <button class="popup-close" @click="TogglePopup()">❌</button>
            <h2 class="popup-heading">
                Thông tin sinh viên ({{ studentSearchStore.studentInfo.length }})
            </h2>
            <div class="student-table">
                <table>
                    <tr>
                        <th>STT</th>
                        <th>Mã hồ sơ</th>
                        <th>Họ tên</th>
                        <th>Ngày sinh</th>
                        <th>Ngành tuyển sinh</th>
                    </tr>
                    <tr v-for="(student, index) in studentSearchStore.studentInfo" :key="index + 'x'">
                        <td>{{ index + 1 }}</td>
                        <td>{{ student.maHoXo }}</td>
                        <td>{{ student.hoTen }}</td>
                        <td>{{ student.ngaySinh }}</td>
                        <td>{{ student.nganh }}</td>
                    </tr>
                </table>
            </div>
            <div class="action">
                <button class="btn" @click="handleInfoInput">Nhập thông tin</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    background-color: rgba(0, 0, 0, 0.2);
    height: 100vh;

    display: flex;
    align-items: center;
    justify-content: center;
}

.popup-inner {
    position: relative;
    background: #fff;
    width: 60%;
    height: fit-content;
    padding: 12px 32px;
    border-radius: 10px;
}

.popup-heading {
    font-weight: bold;
    text-align: center;
    font-size: 40px;
}

.popup-close {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 0;
    background: transparent;
    color: #fff;
    font-size: 20px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
}

.popup-close:hover {
    transform: scale(1.2);
}

.action {
    display: flex;
}

.student-table {
    width: 100%;
    height: 380px;
    overflow-y: auto;
}

.student-table table {
    width: 100%;
    border-collapse: collapse;
}

.student-table th,
.student-table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
}

.student-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    position: sticky;
    top: 0;
}
</style>
