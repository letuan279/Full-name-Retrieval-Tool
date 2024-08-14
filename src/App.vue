<script setup>
import { ref, computed, onMounted } from 'vue';
import textRetrievalTool from './services/fullnameRetrieval';

const rawInputMessage = ref('');
const outputData = ref([]);

const isRunning = ref(false);

const inputData = computed(() => {
  return rawInputMessage.value.split('\n').map((message, index) => {
    return {
      id: index,
      message,
    };
  }).filter((item) => item.message.trim() !== '');
});
const countInput = computed(() => inputData.value.length);
const countOutput = computed(() => outputData.value.length);

const handleInputBtnClick = () => {
  try {
    navigator.clipboard.readText().then((text) => {
      if (text.trim() === '') {
        alert('Clipboard is empty');
        return;
      }
      rawInputMessage.value = text;
    });
  } catch (error) {
    alert('Error reading clipboard data');
  }
};

const handleRunClick = async () => {
  if (isRunning.value) {
    return;
  }

  if (rawInputMessage.value.trim() === '') {
    alert('Please input some transaction messages');
    return;
  }

  isRunning.value = true;
  outputData.value = [];

  const messages = textRetrievalTool.processMessages(rawInputMessage.value);
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    const response = await textRetrievalTool.callApiWithRetries(JSON.stringify(batch));
    outputData.value.push(...response.results);
    textRetrievalTool.changeAPIKeyAndModel()

    // Log progress
    console.log(`Processed ${Math.min(i + 10, messages.length)} out of ${messages.length} messages`);
  }

  isRunning.value = false;
};

const handleOutputClick = () => {
  if (outputData.value.length === 0) {
    alert('No output to copy');
    return;
  }
  const data = outputData.value.map((item) => item.fullName.toUpperCase().join('\n'));
  navigator.clipboard.writeText(data).then(() => {
    alert('Output copied to clipboard');
  }).catch(() => {
    alert('Error copying output to clipboard');
  });
};

const scrollHandle = () => {
  const inputScroll = document.getElementById('input-scroll');
  const outputScroll = document.getElementById('output-scroll');

  inputScroll.addEventListener('scroll', () => {
    outputScroll.scrollTop = inputScroll.scrollTop;
  });

  outputScroll.addEventListener('scroll', () => {
    inputScroll.scrollTop = outputScroll.scrollTop;
  });
}

onMounted(() => {
  scrollHandle();
});
</script>

<template>
  <main>
    <div class="container">
      <h1 class="heading">💩FULL-NAME RETRIEVAL TOOL v1👻</h1>
      <div class="content">
        <div class="content-field">
          <div id="input-scroll" class="zone zone-left">
            <div v-for="item in inputData" :key="item.id">
              <p class="line_clamp message">{{ item.message }}</p>
            </div>
          </div>
          <button :disabled="isRunning" class="btn" @click="handleInputBtnClick">Input</button>
          <p class="count">Count: {{ countInput }}</p>
        </div>
        <div class="action-field">
          <div class="spinner" v-if="isRunning"></div>
          <button :disabled="isRunning" class="btn action" @click="handleRunClick">Run</button>
        </div>
        <div class="content-field">
          <div id="output-scroll" class="zone zone-right">
            <div v-for="item in outputData" :key="item.id">
              <p class="message message-result">{{ item.fullName }}</p>
            </div>
          </div>
          <button :disabled="isRunning" class="btn" @click="handleOutputClick">Output</button>
          <p class="count">Count: {{ countOutput }}</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
body {
  background: #e7e5e4;
  font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  ;
}


.line_clamp {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}


.heading {
  text-align: center;
  font-weight: bold;
  font-size: 40px;
  /* text-decoration: underline; */
  padding-top: 50px;
}

.content {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

.content-field {
  margin-top: 20px;
}

.zone {
  height: 450px;
  width: 450px;
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: auto
}

.zone-left {
  width: 800px;
}

.zone-right {
  width: 350px;
}

.btn {
  background: #fef3c7;
  font-weight: bold;
  font-size: 20px;
  display: block;
  margin: 10px auto 0;
  width: 150px;
  height: 40px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  transition: all 0.2s;
}

.btn:hover {
  background: #e7e5e4;
  cursor: pointer;
}

.btn:disabled {
  background: #e7e5e4;
  cursor: not-allowed;
}

.count {
  margin-top: 10px;
  text-align: center;
  font-weight: bold;
  font-size: 36px;
}

.message {
  width: 90%;
  line-height: 30px;
  font-weight: 500;
  padding: 10px;
  margin: 5px auto;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
}

.message-result {
  text-align: center;
  background: #f7fee7;
}

.action {
  width: 100px;
  height: 100px;
  font-size: 20px;
  border-radius: 50%;
  transform: translateY(-50%);
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  border: 16px solid #e7e5e4;
  border-top: 16px solid #fef3c7;
  border-radius: 50%;
  animation: spin 2s linear infinite;
  z-index: 1;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>