const fileInput = document.getElementById('fileInput');
const scanCameraBtn = document.getElementById('scanCamera');
const pasteTextBtn = document.getElementById('pasteText');
const pasteImageBtn = document.getElementById('pasteImage');
const resultBox = document.getElementById('resultBox');
const historyList = document.getElementById('history');
const video = document.getElementById('cameraStream');

let cameraStream = null;

/* =============== ФУНКЦИИ =============== */

function setResult(text, level) {
  resultBox.textContent = text;
  resultBox.className = 'result ' + level;

  let li = document.createElement('li');
  li.textContent = text;
  historyList.prepend(li);
}

function analyze(text) {
  let url = text.trim();

  try {
    new URL(url);
  } catch {
    setResult("Некорректная ссылка", "danger");
    return;
  }

  if (url.startsWith("https://"))
    setResult("Безопасно: " + url, "safe");
  else if (url.startsWith("http://"))
    setResult("Подозрительно: " + url, "warning");
  else
    setResult("Неизвестный формат: " + url, "warning");
}

/* =============== 1. ЗАГРУЗКА ФАЙЛА =============== */

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  readImage(file);
};

/* =============== ВСПОМОГАТЕЛЬНОЕ СКАНИРОВАНИЕ КАРТИНКИ =============== */

function readImage(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(data.data, canvas.width, canvas.height);

    if (qr) analyze(qr.data);
    else setResult("QR-код не найден", "danger");
  };
}

/* =============== 2. ВСТАВКА ТЕКСТА ИЗ БУФЕРА (ПК) =============== */

pasteTextBtn.onclick = async () => {
  let text = await navigator.clipboard.readText();
  if (text) analyze(text);
};

/* =============== 3. ВСТАВКА ИЗОБРАЖЕНИЯ ИЗ БУФЕРА (ПК) =============== */

pasteImageBtn.onclick = async () => {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
      const blob = await item.getType(item.types[0]);
      readImage(blob);
      return;
    }
  }
  setResult("В буфере нет изображения", "warning");
};

/* =============== 4. СКАНИРОВАНИЕ ЧЕРЕЗ КАМЕРУ (ТЕЛЕФОН) =============== */

scanCameraBtn.onclick = async () => {
  video.style.display = 'block';

  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = cameraStream;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function loop() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(data.data, canvas.width, canvas.height);

    if (qr) {
      cameraStream.getTracks().forEach(t => t.stop());
      video.style.display = 'none';
      analyze(qr.data);
      return;
    }

    requestAnimationFrame(loop); // продолжать сканировать
  }

  requestAnimationFrame(loop);
};
