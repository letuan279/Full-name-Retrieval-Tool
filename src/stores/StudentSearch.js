import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import khongDau from 'khong-dau'

export const useStudentSearchStore = defineStore('studentSearch', () => {
    const studentInfo = ref([])
    const searchTool = ref(null)
    const tableData = ref([])

    const setStudentInfo = (data) => {
        const filteredData = data.split("\n")
        if (filteredData[filteredData.length - 1] === "") {
            filteredData.pop()
        }

        studentInfo.value = filteredData.map((line, index) => {
            const lineData = line.split("\t")
            return {
                id: index + 1,
                maHoXo: lineData[0].trim(),
                hoTen: lineData[1].trim(),
                ngaySinh: lineData[2].trim(),
                nganh: lineData[3].trim(),
            }
        })
    }

    const storeStudentInfo = () => {
        localStorage.setItem('studentInfo', JSON.stringify(studentInfo.value))
    }

    const loadStudentInfo = () => {
        studentInfo.value = JSON.parse(localStorage.getItem("studentInfo") || "[]");
    }

    const updateSearchTool = () => {
        searchTool.value = new Map()
        studentInfo.value.forEach((student) => {
            const hoTen = khongDau(student.hoTen).toUpperCase()
            if (!searchTool.value.has(hoTen)) {
                searchTool.value.set(hoTen, [])
            }
            searchTool.value.get(hoTen).push(student)
        })
    }

    watch(studentInfo, () => {
        storeStudentInfo()
        updateSearchTool()
        console.log(searchTool.value);
    })

    const getStudentInfoByName = (name) => {
        if (searchTool.value.has(name)) {
            return searchTool.value.get(name)
        }

        return []
    }

    return {
        studentInfo,
        setStudentInfo,
        storeStudentInfo,
        loadStudentInfo,
        searchTool,
        getStudentInfoByName,
        tableData
    }
})