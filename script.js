const fileInput = document.getElementById('fileInput');
const scanCameraBtn = document.getElementById('scanCamera');
const pasteBtn = document.getElementById('pasteBtn');
const resultBox = document.getElementById('resultBox');
const historyList = document.getElementById('history');
const video = document.getElementById('cameraStream');

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
    setResult("Подозрительно (нет HTTPS): " + url, "warning");
  else
    setResult("Неизвестный формат: " + url, "warning");
}

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

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
};

pasteBtn.onclick = async () => {
  const text = await navigator.clipboard.readText();
  if (text) analyze(text);
};

scanCameraBtn.onclick = async () => {
  video.style.display = 'block';
  let stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function loop() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(data.data, canvas.width, canvas.height);

    if (qr) {
      stream.getTracks().forEach(t => t.stop());
      video.style.display = 'none';
      analyze(qr.data);
      return;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};
