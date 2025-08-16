import Groq from "groq-sdk";
import { getApiConfig, validateApiConfig } from "@/config/api.js";
import { STATUS } from "@/config/constants.js";

class TextRetrievalTool {
    constructor() {
        validateApiConfig();
        const config = getApiConfig();

        this.apiKeys = config.GROQ.apiKeys;
        this.models = config.GROQ.models;
        this.temperature = config.GROQ.temperature;
        this.batchSize = config.GROQ.batchSize;
        this.retryAttempts = config.GROQ.retryAttempts;
        this.retryDelay = config.GROQ.retryDelay;
        this.maxTokens = config.GROQ.maxTokens;
        this.topP = config.GROQ.topP;
        this.stream = config.GROQ.stream;
        this.responseFormat = config.GROQ.responseFormat;

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
            results: messages.map(message => ({ id: message.id, fullName: STATUS.EXTRACTION.ERROR }))
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
                    "content": "[{\"id\":0,\"message\":\"TKThe  tai MSCBVNVX XHB  BUIMANHDUNG    B  B  S  Z\"}]"
                },
                {
                    "role": "assistant",
                    "content": "{\"results\": [{\"id\": 0, \"fullName\": \"BUI MANH DUNG\"}]}"
                },
                {
                    "role": "user",
                    "content": "[{\"id\":0,\"message\":\"TKThe  tai VCB MBVCB   CD  DL  DinhQuocTuan Dong hoc phi ki    em xin phep nop truoc    CT tu  DINH QUOC TUAN toi  TRUON CTLNHIDI   CRE\"},{\"id\":1,\"message\":\"TKThe  tai MSCBVNVX to viet anh chuyen tien XHB   B  B  N  M\"},{\"id\":2,\"message\":\"CHUYEN TIEN GIANG DAY LOP  NHLSP\"},{\"id\":3,\"message\":\"REM  CI  B O BAO HIEM XA HOI QUAN DONG DA F O  TRUONG CAO DANG NGHE CONG NGHIEP HA NOI DTLS REF  HOAN DONG TRUNG BHYT HSSV THEO QD  NGAY    UNC  Bank Charge  VAT\"},{\"id\":4,\"message\":\"NGUYEN THANH DAT lop cd  oto  ck HPHK  nam hoc\"},{\"id\":5,\"message\":\"TKThe  tai TCB Bui Hai Duong nop hoc phi FT  CTLNHIDI    CRE\"}]"
                },
                {
                    "role": "assistant",
                    "content": "{\"results\": [{\"id\": 0, \"fullName\": \"DINH QUOC TUAN\"},{\"id\": 1, \"fullName\": \"TO VIET ANH\"},{\"id\": 2, \"fullName\": \"NULL\"},{\"id\": 3, \"fullName\": \"NULL\"},{\"id\": 4, \"fullName\": \"NGUYEN THANH DAT\"},{\"id\": 5, \"fullName\": \"BUI HAI DUONG\"}]}"
                },
                {
                    "role": "user",
                    "content": messages
                }
            ],
            model: this.models[this.modelIndex].id,
            temperature: this.temperature,
            max_tokens: this.models[this.modelIndex].contextWindow,
            top_p: this.topP,
            stream: this.stream,
            response_format: this.responseFormat,
            stop: null
        });

        return JSON.parse(results.choices[0].message.content);
    }

    async callApiWithRetries(messages, retries = null) {
        const maxRetries = retries || this.retryAttempts;
        let currentRetries = maxRetries;

        while (currentRetries > 0) {
            try {
                return await this.callApi(messages);
            } catch (error) {
                console.log("---------------------------------");
                console.error("Error message:", error.message);
                console.error("API call failed. Retries left:", currentRetries - 1);
                console.log("---------------------------------");

                // Retry with a different API key and model
                this.changeAPIKeyAndModel()
                currentRetries -= 1;
                if (currentRetries === 0) {
                    console.error("All retries failed.");
                    return this.errorResult(JSON.parse(messages));
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    async retrieveData(rawMessages) {
        const messages = this.processMessages(rawMessages);

        let results = [];

        for (let i = 0; i < messages.length; i += this.batchSize) {
            const batch = messages.slice(i, i + this.batchSize);
            const response = await this.callApiWithRetries(JSON.stringify(batch));
            results.push(...response.results);
            this.changeAPIKeyAndModel()
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            // Log progress
            console.log(`Processed ${Math.min(i + this.batchSize, messages.length)} out of ${messages.length} messages`);
        }

        return results;
    }
}

// Create and export singleton instance
const textRetrievalTool = new TextRetrievalTool();
export default textRetrievalTool;