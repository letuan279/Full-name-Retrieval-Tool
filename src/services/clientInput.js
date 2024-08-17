
class ClientInput {
    constructor() {
    }

    getStudentInputExcel(excelTextFromClipboard) {
        const filteredData = excelTextFromClipboard.split("\n")
        if (filteredData[filteredData.length - 1] === "") {
            filteredData.pop()
        }

        return filteredData.map((line, index) => {
            const lineData = line.split(/\t+/)
            return {
                id: index + 1,
                maHoXo: lineData[0]?.trim() ?? "",
                hoTen: lineData[1]?.trim() ?? "",
                ngaySinh: lineData[2]?.trim() ?? "",
                nganh: lineData[3]?.trim() ?? "",
            }
        })
    }

    getMessageInputExcel(messageTextFromClipboard) {
        const filteredData = messageTextFromClipboard.split("\n")
        if (filteredData[filteredData.length - 1] === "") {
            filteredData.pop()
        }

        return filteredData.map((line, index) => {
            const lineData = line.split(/\t+/)
            return {
                id: index + 1,
                date: lineData[0]?.trim() ?? "",
                money: lineData[1]?.trim() ?? "",
                message: lineData[2]?.trim() ?? "",
                name: "",
                studentInfo: []
            }
        })
    }
}

const clientInput = new ClientInput()
export default clientInput