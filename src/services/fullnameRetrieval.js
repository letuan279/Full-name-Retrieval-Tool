import Groq from "groq-sdk";

class TextRetrievalTool {
    constructor(apiKeys, models, temperature = 0.6) {
        this.apiKeys = apiKeys;
        this.models = models;
        this.temperature = temperature;
        this.apiKeyIndex = 0;
        this.modelIndex = 0;
    }

    preprocessText(text) {
        text = text.replace(/[^a-zA-Z0-9]+/g, ' ');
        text = text.replace(/([a-zA-Z])([\d])/g, '$1 $2');
        text = text.replace(/([\d])([a-zA-Z])/g, '$1 $2');
        text = text.replace(/\s+/g, ' ');
        text = text.replace(/[0-9]+/g, '');
        return text.trim();
    }

    processMessages(rawMessages) {
        let messages = rawMessages.split('\n').filter(i => i.trim() !== '');
        return messages.map((message, index) => ({
            id: index,
            message: this.preprocessText(message)
        }));
    }

    processMessagesWithId(messageWithId) {
        return messageWithId.map((data) => ({
            id: data.id,
            message: this.preprocessText(data.message)
        }));
    }

    changeAPIKeyAndModel() {
        this.apiKeyIndex = (this.apiKeyIndex + 1) % this.apiKeys.length;
        this.modelIndex = (this.modelIndex + 1) % this.models.length;
    }

    errorResult(messages) {
        return {
            results: messages.map(message => ({ id: message.id, fullName: "ERROR" }))
        }
    }

    async callApi(messages) {
        const groq = new Groq({
            apiKey: this.apiKeys[this.apiKeyIndex],
            dangerouslyAllowBrowser: true
        });

        const results = await groq.chat.completions.create({
            messages: [
                {
                    "role": "system",
                    "content": "You are a bank employee who is determining the full name of the transferor based on the message in the transaction. If the name cannot be found it will be recorded as NULL\n\nThe input will be an array of JSON with the following structure:\n------------\n[{\n\"id\": \"ID of the message\",\n\"message\": \"Content of the transaction message\"\n}]\n------------\n\nThe output will be an array of JSON with the following structure:\n------------\n{\"results\": [{\"id\": \"ID of the message\",\"fullName\": \"Name of the sender in that message\"},...]}\n-------------\nNo explanation included, and there must be a space between the last name, middle name and first name."
                },
                {
                    "role": "user",
                    "content": "[{\"id\":0,\"message\":\"TKThe :0357485800, tai MSCBVNVX. XHB24401873 BUIMANHDUNG 05.10.20050357485800 -B2B020097042208092114262024S51Z828594\"}]"
                },
                {
                    "role": "assistant",
                    "content": "{\"results\": [{\"id\": 0, \"fullName\": \"BUI MANH DUNG\"}]}"
                },
                {
                    "role": "user",
                    "content": "[{\"id\":0,\"message\":\"TKThe :1040141644, tai VCB. MBVCB.6723772738.388355.CD46DL1, DinhQuocTuan Dong hoc phi ki 1 2024-2025 em xin phep nop truoc 6.000.000.CT tu 1040141644 DINH QUOC TUAN toi 12210001700374 TRUON-CTLNHIDI000009519203381-11-CRE-002\"},{\"id\":1,\"message\":\"TKThe :021233706666, tai MSCBVNVX. TO VIET ANH chuyen tien XHB24400210 To Viet Anh 02122006 0969843916 -B2B0200970422080810245120246N1M561029\"},{\"id\":2,\"message\":\"@3381881@CHUYEN TIEN GIANG DAY LOP 24NHLSP03 04\"},{\"id\":3,\"message\":\"REM 9901CI240621000007872 B/O BAO HIEM XA HOI QUAN DONG DA F/O-1221700374 TRUONG CAO DANG NGHE CONG NGHIEP HA NOI DTLS-REF/202406211010011000187701203003 HOAN DONG TRUNG BHYT HSSV THEO QD 533 NGAY 19/6/2024 .UNC 00353 Bank Charge .00 VAT .00\"},{\"id\":4,\"message\":\"1221700374 NGUYEN THANH DAT lop cd47oto5 ck HPHK1 nam hoc 2024.2025\"}]"
                },
                {
                    "role": "assistant",
                    "content": "{\"results\": [{\"id\": 0, \"fullName\": \"DINH QUOC TUAN\"},{\"id\": 1, \"fullName\": \"TO VIET ANH\"},{\"id\": 2, \"fullName\": \"NULL\"},{\"id\": 3, \"fullName\": \"NULL\"},{\"id\": 4, \"fullName\": \"NGUYEN THANH DAT\"}]}"
                },
                {
                    "role": "user",
                    "content": messages
                }
            ],
            model: this.models[this.modelIndex].id,
            temperature: this.temperature,
            max_tokens: this.models[this.modelIndex].context_window,
            top_p: 1,
            stream: false,
            response_format: {
                type: "json_object"
            },
            stop: null
        });

        return JSON.parse(results.choices[0].message.content);
    }

    async callApiWithRetries(messages, retries = 3) {
        while (retries > 0) {
            try {
                return await this.callApi(messages);
            } catch (error) {
                console.log("---------------------------------");
                console.error("Error message:", error.message);
                console.error("API call failed. Retries left:", retries - 1);
                console.log("---------------------------------");

                // Retry with a different API key and model
                this.changeAPIKeyAndModel()
                retries -= 1;
                if (retries === 0) {
                    console.error("All retries failed.");
                    return this.errorResult(JSON.parse(messages));
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    async retrieveData(rawMessages) {
        const messages = this.processMessages(rawMessages);

        let results = [];

        for (let i = 0; i < messages.length; i += 10) {
            const batch = messages.slice(i, i + 10);
            const response = await this.callApiWithRetries(JSON.stringify(batch));
            results.push(...response.results);
            this.changeAPIKeyAndModel()

            // Log progress
            console.log(`Processed ${Math.min(i + 10, messages.length)} out of ${messages.length} messages`);
        }

        return results;
    }
}

// Usage
const apiKeys = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_API_KEY'))
    .map(key => import.meta.env[key])
    .filter(Boolean);

const models = [
    { id: "mixtral-8x7b-32768", context_window: 32768 },
    { id: "llama-3.1-8b-instant", context_window: 8000 },
    { id: "llama3-8b-8192", context_window: 8192 },
    { id: "llama3-groq-8b-8192-tool-use-preview", context_window: 8192 }
];

const textRetrievalTool = new TextRetrievalTool(apiKeys, models);
export default textRetrievalTool;