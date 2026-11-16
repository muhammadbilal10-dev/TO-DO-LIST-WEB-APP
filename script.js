(() => {
  const STORAGE_KEY = "todo-app.tasks.v1";

  const form = document.getElementById("add-form");
  const input = document.getElementById("new-task");
  const list = document.getElementById("task-list");
  const emptyMsg = document.getElementById("empty");
  const summary = document.getElementById("summary");
  const clearBtn = document.getElementById("clear-done");
  const filterBtns = document.querySelectorAll(".filter");

  let tasks = load();
  let filter = "all";
  let editingId = null;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch { /* storage unavailable; keep working in memory */ }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function addTask(text) {
    tasks.unshift({ id: uid(), text, done: false });
    save();
    render();
  }

  function updateTask(id, text) {
    const t = tasks.find(t => t.id === id);
    if (t && text) t.text = text;
    editingId = null;
    save();
    render();
  }

  function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (t) t.done = !t.done;
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  function visibleTasks() {
    if (filter === "active") return tasks.filter(t => !t.done);
    if (filter === "done") return tasks.filter(t => t.done);
    return tasks;
  }

  function button(label, cls, onClick, aria) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "icon-btn " + cls;
    b.textContent = label;
    b.setAttribute("aria-label", aria);
    b.addEventListener("click", onClick);
    return b;
  }

  function renderTask(task) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = task.done;
    cb.setAttribute("aria-label", "Mark “" + task.text + "” as done");
    cb.addEventListener("change", () => toggleTask(task.id));
    li.appendChild(cb);

    if (editingId === task.id) {
      const edit = document.createElement("input");
      edit.type = "text";
      edit.className = "edit-input";
      edit.value = task.text;
      edit.maxLength = 200;
      edit.setAttribute("aria-label", "Edit task");
      let finished = false;
      const commit = () => {
        if (finished) return;
        finished = true;
        updateTask(task.id, edit.value.trim());
      };
      edit.addEventListener("keydown", e => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { finished = true; editingId = null; render(); }
      });
      edit.addEventListener("blur", commit);
      li.appendChild(edit);

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(button("Save", "save", commit, "Save changes"));
      li.appendChild(actions);

      setTimeout(() => { edit.focus(); edit.select(); }, 0);
    } else {
      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;
      span.title = "Double-click to edit";
      span.addEventListener("dblclick", () => { editingId = task.id; render(); });
      li.appendChild(span);

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(button("Edit", "edit", () => { editingId = task.id; render(); }, "Edit “" + task.text + "”"));
      actions.appendChild(button("Delete", "delete", () => deleteTask(task.id), "Delete “" + task.text + "”"));
      li.appendChild(actions);
    }
    return li;
  }

  function render() {
    list.innerHTML = "";
    const items = visibleTasks();
    items.forEach(t => list.appendChild(renderTask(t)));

    const remaining = tasks.filter(t => !t.done).length;
    const doneCount = tasks.length - remaining;
    summary.textContent = tasks.length === 0
      ? "Nothing here yet."
      : remaining + (remaining === 1 ? " task" : " tasks") + " left, " + doneCount + " done";

    if (items.length === 0) {
      emptyMsg.hidden = false;
      emptyMsg.textContent =
        tasks.length === 0 ? "Add your first task above." :
        filter === "active" ? "All caught up. No open tasks." :
        filter === "done" ? "No completed tasks yet." : "";
    } else {
      emptyMsg.hidden = true;
    }

    clearBtn.hidden = doneCount === 0;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = "";
    input.focus();
  });

  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle("active", b === btn));
    render();
  }));

  clearBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  });

  render();
})();
