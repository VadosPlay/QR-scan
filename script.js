const resultBox = document.getElementById("resultBox");
const historyList = document.getElementById("historyList");
const fileInput = document.getElementById("fileInput");
const pasteBtn = document.getElementById("pasteBtn");
const cameraBtn = document.getElementById("cameraBtn");
const cameraBox = document.getElementById("cameraBox");
const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");

let cameraStream = null;

/* ---------- Функции ---------- */
function showResult(text, status = "yellow") {
    resultBox.textContent = text;
    resultBox.className = "result " + status;

    let li = document.createElement("li");
    li.textContent = text;
    li.style.borderLeftColor = (status === "green") ? "#0f0" :
                               (status === "red")   ? "#f00" : "#ff0";
    historyList.prepend(li);
}

function analyzeText(data) {
    if (!data) return showResult("QR не найден", "red");

    let isURL = /^(https?:\/\/|www\.)/.test(data);

    if (isURL) {
        showResult("Найдена ссылка:\n" + data, "green");
    } else {
        showResult("Текст: " + data, "yellow");
    }
}

/* ---------- Загрузка файла ---------- */
fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        processImage(e.target.result);
    };
    reader.readAsDataURL(file);
});

/* ---------- Обработка изображения ---------- */
function processImage(imgUrl) {
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, canvas.width, canvas.height);

        if (code) analyzeText(code.data);
        else showResult("QR-код не найден", "red");
    };
}

/* ---------- Вставка из буфера (ПК) ---------- */
if (pasteBtn) {
    pasteBtn.addEventListener("click", async () => {
        try {
            const items = await navigator.clipboard.read();

            for (let item of items) {
                if (item.types.includes("image/png")) {
                    const blob = await item.getType("image/png");
                    const url = URL.createObjectURL(blob);
                    return processImage(url);
                }
                if (item.types.includes("text/plain")) {
                    const text = await item.getType("text/plain");
                    const data = await text.text();
                    return analyzeText(data);
                }
            }
            showResult("Буфер пуст или не поддерживает формат", "red");

        } catch (err) {
            showResult("Ошибка доступа к буферу", "red");
        }
    });
}

/* ---------- Камера (телефон) ---------- */
cameraBtn?.addEventListener("click", async () => {
    cameraBox.classList.remove("hidden");
    if (!cameraStream) {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = cameraStream;
    }
});

/* ---------- Кнопка съёмки QR ---------- */
captureBtn?.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, canvas.width, canvas.height);

    if (code) {
        analyzeText(code.data);
    } else {
        showResult("QR-код не найден", "red");
    }
});
