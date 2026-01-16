const API_BASE = "https://training-day19-taskmanager-backend.onrender.com";
const API_URL = `${API_BASE}/tasks`;
const AUTH_URL = `${API_BASE}/auth`;

let isLoginMode = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
  }
  return config;
});

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById("authTitle").innerText = isLoginMode
    ? "Sign In"
    : "Sign Up";
  document.getElementById("authBtn").innerText = isLoginMode
    ? "Sign In"
    : "Sign Up";
  document.getElementById("authToggleText").innerText = isLoginMode
    ? "Don't have an account?"
    : "Already have an account?";
  document.getElementById("authToggleLink").innerText = isLoginMode
    ? "Sign Up"
    : "Sign In";
}

async function handleAuth() {
  const username = document.getElementById("usernameAuth").value;
  const password = document.getElementById("passwordAuth").value;
  const endpoint = isLoginMode ? "signin" : "signup";

  try {
    const res = await axios.post(`${AUTH_URL}/${endpoint}`, {
      username,
      password,
    });
    if (isLoginMode) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      initApp();
    } else {
      alert("Account created! Please Sign In.");
      toggleAuthMode();
    }
  } catch (e) {
    alert(e.response?.data?.msg || "Authentication failed");
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

function initApp() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("username");

  if (token && token !== "undefined" && token !== "null") {
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("mainContent").classList.remove("hidden");

    const welcomeEl = document.getElementById("welcomeUser");
    if (welcomeEl) welcomeEl.innerText = `Hi, ${user || "User"}`;

    loadTasks();
  } else {
    localStorage.clear();
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("mainContent").classList.add("hidden");
  }
}

async function loadTasks() {
  try {
    const { data } = await axios.get(API_URL);
    const list = document.getElementById("taskList");
    const count = document.getElementById("taskCount");
    const empty = document.getElementById("emptyState");

    list.innerHTML = "";
    count.innerText = `${data.length} Tasks`;
    if (empty) empty.classList.toggle("hidden", data.length > 0);

    data.forEach((task) => {
      const tagClass = `tag-${task.category.toLowerCase()}`;
      const dateOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      const formattedDate = new Date(task.createdAt).toLocaleDateString(
        "en-US",
        dateOptions
      );

      const div = document.createElement("div");
      div.className = "task-item";
      div.id = `task-${task._id}`;
      div.innerHTML = `
                <div class="check-btn ${
                  task.completed ? "completed" : ""
                }" onclick="toggleTask('${task._id}', ${task.completed})">
                     ${task.completed ? "✓" : ""}
                </div>
                <div class="task-content">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="tag ${tagClass}">${task.category}</span>
                        <span class="date-text">${formattedDate}</span>
                    </div>
                    <span class="task-title ${
                      task.completed ? "completed" : ""
                    }">${task.title}</span>
                </div>
                <div class="actions">
                    <div class="edit-btn" onclick="enterEditMode('${
                      task._id
                    }', '${task.title.replace(/'/g, "\\'")}')">Edit</div>
                    <div class="delete-icon" onclick="deleteTask('${
                      task._id
                    }')">Delete</div>
                </div>`;
      list.appendChild(div);
    });
  } catch (e) {
    if (e.response?.status === 401) logout();
  }
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const category = document.getElementById("categoryInput").value;

  if (!input.value.trim()) return;

  try {
    await axios.post(API_URL, {
      title: input.value,
      category: category,
    });
    input.value = "";
    loadTasks();
  } catch (e) {
    console.error(e);
  }
}

function enterEditMode(id, oldTitle) {
  const taskItem = document.getElementById(`task-${id}`);
  taskItem.innerHTML = `
        <input type="text" id="input-${id}" class="edit-input" value="${oldTitle}">
        <div class="actions">
            <div class="edit-btn" style="color: var(--success)" onclick="saveEdit('${id}')">Save</div>
            <div class="delete-icon" onclick="loadTasks()">Cancel</div>
        </div>
    `;
  const input = document.getElementById(`input-${id}`);
  input.focus();
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveEdit(id);
  });
}

async function saveEdit(id) {
  const newTitle = document.getElementById(`input-${id}`).value.trim();
  if (!newTitle) return;

  try {
    await axios.put(`${API_URL}/${id}`, { title: newTitle });
    loadTasks();
  } catch (e) {
    console.error("Update failed", e);
  }
}

async function toggleTask(id, status) {
  try {
    await axios.put(`${API_URL}/${id}`, { completed: !status });
    loadTasks();
  } catch (e) {
    console.error(e);
  }
}

async function deleteTask(id) {
  try {
    await axios.delete(`${API_URL}/${id}`);
    loadTasks();
  } catch (e) {
    console.error(e);
  }
}

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

initApp();
