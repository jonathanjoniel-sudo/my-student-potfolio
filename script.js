// ---------- Shared: footer year and mobile menu ----------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const toggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = navList.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
}

// ---------- Academic planner ----------
const taskForm = document.getElementById("task-form");
if (taskForm) {
  const input = document.getElementById("task-input");
  const dateInput = document.getElementById("task-date");
  const list = document.getElementById("task-list");
  const errorEl = document.getElementById("task-error");
  const countEl = document.getElementById("task-count");
  let tasks = [];
  let filter = "all";

  function load() {
    try { tasks = JSON.parse(localStorage.getItem("tasks")) || []; }
    catch (e) { tasks = []; }
  }
  function save() {
    try { localStorage.setItem("tasks", JSON.stringify(tasks)); } catch (e) {}
  }

  function render() {
    list.innerHTML = "";
    const visible = tasks.filter(t =>
      filter === "all" || (filter === "done" ? t.done : !t.done));

    if (visible.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = tasks.length ? "No tasks in this view." : "No tasks yet. Add your first one above.";
      list.appendChild(li);
    }

    visible.forEach(task => {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " done" : "");

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = task.done;
      box.setAttribute("aria-label", "Mark complete: " + task.text);
      box.addEventListener("change", () => toggleTask(task.id));

      const text = document.createElement("span");
      text.className = "text";
      const title = document.createElement("span");
      title.className = "title";
      title.textContent = task.text; // textContent prevents HTML injection
      text.appendChild(title);
      if (task.due) {
        const due = document.createElement("small");
        due.className = "due";
        due.textContent = "Due " + task.due;
        text.appendChild(due);
      }

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete";
      del.setAttribute("aria-label", "Delete task: " + task.text);
      del.addEventListener("click", () => deleteTask(task.id));

      li.append(box, text, del);
      list.appendChild(li);
    });

    const left = tasks.filter(t => !t.done).length;
    countEl.textContent = left + " of " + tasks.length + " tasks left";
  }

  function addTask(text, due) {
    tasks.push({ id: Date.now(), text, due, done: false });
    save(); render();
  }
  function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    save(); render();
  }
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save(); render();
  }

  taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      errorEl.textContent = "Enter a task before adding it.";
      input.classList.add("invalid");
      return;
    }
    errorEl.textContent = "";
    input.classList.remove("invalid");
    addTask(text, dateInput.value);
    taskForm.reset();
    input.focus();
  });

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === chip));
      render();
    });
  });

  load();
  render();
}

// ---------- Contact form validation ----------
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const fields = ["name", "email", "phone", "message"];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digitsOnly = /^\d+$/;

  function validate(id) {
    const el = document.getElementById(id);
    const value = el.value.trim();
    let msg = "";
    if (!value) msg = "This field cannot be empty.";
    else if (id === "email" && !emailPattern.test(value)) msg = "Enter a valid email, like name@example.com.";
    else if (id === "phone" && !digitsOnly.test(value)) msg = "Use digits only, with no spaces, dashes or + sign.";
    document.getElementById(id + "-error").textContent = msg;
    el.classList.toggle("invalid", msg !== "");
    return msg === "";
  }

  fields.forEach(id => document.getElementById(id).addEventListener("blur", () => validate(id)));

  contactForm.addEventListener("submit", e => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    const results = fields.map(validate); // validate every field
    if (results.every(Boolean)) {
      status.textContent = "Thank you, " + document.getElementById("name").value.trim() + ". Your message was sent.";
      contactForm.reset();
    } else {
      status.textContent = "";
      document.querySelector(".invalid").focus();
    }
  });
}

// ---------- Password strength checker ----------
const pwInput = document.getElementById("pw");
if (pwInput) {
  const bar = document.getElementById("pw-bar");
  const label = document.getElementById("pw-label");
  const tip = document.getElementById("pw-tip");
  const items = document.querySelectorAll("#pw-checks li");
  const common = ["password", "123456", "12345678", "qwerty", "abc123", "letmein",
    "admin", "welcome", "iloveyou", "monkey", "111111", "password1", "123456789", "000000"];

  const rules = {
    length: p => p.length >= 12,
    lower: p => /[a-z]/.test(p),
    upper: p => /[A-Z]/.test(p),
    number: p => /\d/.test(p),
    symbol: p => /[^A-Za-z0-9]/.test(p),
    common: p => !common.some(w => p.toLowerCase().includes(w))
  };
  const advice = {
    length: "Use 12 or more characters. A short passphrase of random words works well.",
    lower: "Add a lowercase letter.",
    upper: "Add an uppercase letter.",
    number: "Add a number.",
    symbol: "Add a symbol such as ! or #.",
    common: "Avoid common words like \"password\" or \"123456\"."
  };
  const levels = [
    { name: "Very weak", color: "#b42318" },
    { name: "Weak", color: "#d9622b" },
    { name: "Fair", color: "#e9a23b" },
    { name: "Strong", color: "#6aa84f" },
    { name: "Very strong", color: "#1a7f4b" }
  ];

  function check() {
    const p = pwInput.value;
    if (!p) {
      bar.style.width = "0";
      label.textContent = "Enter a password to begin.";
      tip.textContent = "";
      items.forEach(li => li.classList.remove("pass"));
      return;
    }
    let passed = 0;
    let firstFail = null;
    items.forEach(li => {
      const rule = li.dataset.rule;
      const ok = rules[rule](p);
      li.classList.toggle("pass", ok);
      if (ok) passed++; else if (!firstFail) firstFail = rule;
    });
    let score = passed - 1;               // 0 to 5
    if (!rules.common(p)) score = Math.min(score, 0);
    if (p.length < 8) score = Math.min(score, 1);
    score = Math.max(0, Math.min(4, score));
    const level = levels[score];
    bar.style.width = ((score + 1) * 20) + "%";
    bar.style.background = level.color;
    label.textContent = "Strength: " + level.name;
    tip.textContent = firstFail ? advice[firstFail] : "";
  }

  pwInput.addEventListener("input", check);
  document.getElementById("pw-toggle").addEventListener("click", e => {
    const show = pwInput.type === "password";
    pwInput.type = show ? "text" : "password";
    e.target.textContent = show ? "Hide" : "Show";
    e.target.setAttribute("aria-pressed", show);
  });
}
