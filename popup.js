const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("save");
const banner = document.getElementById("banner");
const bannerText = document.getElementById("banner-text");
const toggleEye = document.getElementById("toggleEye");

let isConnected = false;

// Toggle password visibility (only when not connected)
toggleEye.addEventListener("click", () => {
  if (isConnected) return;
  const isPassword = tokenInput.type === "password";
  tokenInput.type = isPassword ? "text" : "password";
  toggleEye.textContent = isPassword ? "🙈" : "👁";
});

function maskToken(token) {
  if (!token || token.length < 8) return "••••••••";
  return "••••••••••••" + token.slice(-4);
}

function setConnected(username, token) {
  isConnected = true;
  banner.className = "banner connected";
  bannerText.textContent = `Conectado como ${username}`;
  saveBtn.textContent = "Desconectar";
  saveBtn.style.background = "rgba(255,82,82,0.15)";
  saveBtn.style.color = "#ff5252";
  // Mask token — never show full value
  tokenInput.value = maskToken(token);
  tokenInput.type = "password";
  tokenInput.readOnly = true;
  tokenInput.style.opacity = "0.5";
  toggleEye.style.display = "none";
}

function setDisconnected(msg = "Não conectado") {
  isConnected = false;
  banner.className = "banner disconnected";
  bannerText.textContent = msg;
  saveBtn.textContent = "Conectar";
  saveBtn.style.background = "";
  saveBtn.style.color = "";
  tokenInput.value = "";
  tokenInput.type = "password";
  tokenInput.readOnly = false;
  tokenInput.style.opacity = "1";
  tokenInput.placeholder = "Cole seu token aqui...";
  toggleEye.style.display = "";
  toggleEye.textContent = "👁";
}

// Load saved token and validate
chrome.storage.local.get(["trackerxToken", "trackerxUser"], ({ trackerxToken, trackerxUser }) => {
  if (trackerxToken) {
    if (trackerxUser) {
      setConnected(trackerxUser, trackerxToken);
    } else {
      validateToken(trackerxToken);
    }
  }
});

async function validateToken(token) {
  try {
    const res = await fetch("https://trackerx.io/api/me", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) {
      setDisconnected("Token inválido");
      return null;
    }
    await chrome.storage.local.set({ trackerxUser: data.username });
    setConnected(data.username, token);
    return data.username;
  } catch {
    setDisconnected("Erro de conexão");
    return null;
  }
}

saveBtn.addEventListener("click", async () => {
  // If connected, disconnect
  if (isConnected) {
    await chrome.storage.local.remove(["trackerxToken", "trackerxUser"]);
    setDisconnected();
    tokenInput.focus();
    return;
  }

  // Connect flow
  const token = tokenInput.value.trim();
  if (!token) {
    setDisconnected("Token vazio");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Verificando...";

  const username = await validateToken(token);
  if (username) {
    await chrome.storage.local.set({ trackerxToken: token });
  } else {
    await chrome.storage.local.remove(["trackerxToken", "trackerxUser"]);
  }

  saveBtn.disabled = false;
});
