import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import khongDau from '@/utils/khongDau';

import clientInput from '@/services/clientInput';

export const useStudentSearchStore = defineStore('studentSearch', () => {
    const studentInfo = ref([])
    const searchTool = ref(null)
    const tableData = ref([])

    const setStudentInfo = (data) => {
        studentInfo.value = clientInput.getStudentInputExcel(data)
    }

    const addMoreStudentInfo = (data) => {
        studentInfo.value = studentInfo.value.concat(clientInput.getStudentInputExcel(data))
    }

    const storeStudentInfo = () => {
        localStorage.setItem('studentInfo', JSON.stringify(studentInfo.value))
        setTimeout(() => {
            updateSearchTool()
        }, 0)
    }

    const loadStudentInfo = () => {
        studentInfo.value = JSON.parse(localStorage.getItem("studentInfo") || "[]");
        setTimeout(() => {
            updateSearchTool()
        }, 0)
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
        addMoreStudentInfo,
        storeStudentInfo,
        loadStudentInfo,
        searchTool,
        getStudentInfoByName,
        tableData,
    }
})