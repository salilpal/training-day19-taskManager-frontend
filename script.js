const API_URL = "https://training-day19-taskmanager-backend.onrender.com/tasks";

async function loadTasks() {
  try {
    const { data } = await axios.get(API_URL);
    const list = document.getElementById("taskList");
    const count = document.getElementById("taskCount");
    const empty = document.getElementById("emptyState");

    list.innerHTML = "";
    count.innerText = `${data.length} Tasks`;

    // Toggle empty state visibility
    if (empty) empty.classList.toggle("hidden", data.length > 0);

    data.forEach((task) => {
      // 1. Setup variables
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

      // 2. Create the element
      const div = document.createElement("div");
      div.className = "task-item";
      div.id = `task-${task._id}`;

      // 3. Set the HTML content
      div.innerHTML = `
        <div class="check-btn ${task.completed ? "completed" : ""}" 
             onclick="toggleTask('${task._id}', ${task.completed})">
             ${task.completed ? "✓" : ""}
        </div>
        <div class="task-content">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="tag ${tagClass}">${task.category}</span>
                <span class="date-text">${formattedDate}</span>
            </div>
            <span class="task-title ${task.completed ? "completed" : ""}">
                ${task.title}
            </span>
        </div>
        <div class="actions">
            <div class="edit-btn" onclick="enterEditMode('${
              task._id
            }', '${task.title.replace(/'/g, "\\'")}')">Edit</div>
            <div class="delete-icon" onclick="deleteTask('${
              task._id
            }')">Delete</div>
        </div>
      `;

      // 4. Append to list
      list.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load tasks:", e);
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
  // Allow saving with Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveEdit(id);
  });
}

async function saveEdit(id) {
  const newTitle = document.getElementById(`input-${id}`).value.trim();
  if (!newTitle) return;

  try {
    await axios.put(`${API_URL}/${id}`, { title: newTitle });
    loadTasks(); // Refresh list
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

// Allow pressing 'Enter' to add
document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

loadTasks();
