export default function removeVietnameseAccents(str) {
    const accentsMap = {
        'a': 'áàảãạăắằẳẵặâấầẩẫậ',
        'e': 'éèẻẽẹêếềểễệ',
        'i': 'íìỉĩị',
        'o': 'óòỏõọôốồổỗộơớờởỡợ',
        'u': 'úùủũụưứừửữự',
        'y': 'ýỳỷỹỵ',
        'd': 'đ',
        'A': 'ÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ',
        'E': 'ÉÈẺẼẸÊẾỀỂỄỆ',
        'I': 'ÍÌỈĨỊ',
        'O': 'ÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ',
        'U': 'ÚÙỦŨỤƯỨỪỬỮỰ',
        'Y': 'ÝỲỶỸỴ',
        'D': 'Đ'
    };

    let result = str;
    for (const [nonAccent, accents] of Object.entries(accentsMap)) {
        const regex = new RegExp('[' + accents + ']', 'g');
        result = result.replace(regex, nonAccent);
    }
    return result;
}