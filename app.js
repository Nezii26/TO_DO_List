const STORAGE_KEY = "doit.tasks.v1";
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("task-date");
const taskList = document.getElementById("task-list");
const formMessage = document.getElementById("form-message");
const navLinks = document.querySelectorAll(".nav-link");

let currentView = "all";
let tasks = loadTasks();

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function loadTasks() {
    try {
        const savedTasks = window.localStorage.getItem(STORAGE_KEY);
        if (!savedTasks) return [];

        const parsedTasks = JSON.parse(savedTasks);
        if (!Array.isArray(parsedTasks) || !parsedTasks.every(isValidTask)) {
            throw new Error("Saved task data has an invalid format.");
        }
        return parsedTasks;
    } catch (error) {
        console.error("Could not load saved tasks.", error);
        formMessage.textContent = "Saved tasks couldn't be read. New tasks may not be saved.";
        return [];
    }
}

function isValidTask(task) {
    return task !== null
        && typeof task === "object"
        && typeof task.id === "string"
        && typeof task.title === "string"
        && typeof task.completed === "boolean"
        && (task.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate));
}

function saveTasks() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        formMessage.textContent = "";
    } catch (error) {
        console.error("Could not save tasks.", error);
        formMessage.textContent = "Your changes couldn't be saved in this browser.";
    }
}

function formatDueDate(dateKey) {
    if (!dateKey) return "Today";
    if (dateKey === localDateKey()) return "Today";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateKey === localDateKey(tomorrow)) return "Tomorrow";

    const [year, month, day] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
        .format(new Date(year, month - 1, day));
}

function visibleTasks() {
    if (currentView === "completed") return tasks.filter(task => task.completed);
    if (currentView === "upcoming") {
        return tasks.filter(task => !task.completed && task.dueDate && task.dueDate > localDateKey());
    }
    if (currentView === "today") {
        return tasks.filter(task => !task.completed && (!task.dueDate || task.dueDate <= localDateKey()));
    }
    return tasks;
}

function createTaskElement(task) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-complete" : ""}`;
    item.dataset.taskId = task.id;

    const completeButton = document.createElement("button");
    completeButton.className = "complete-button";
    completeButton.type = "button";
    completeButton.dataset.action = "toggle";
    completeButton.setAttribute("aria-label", task.completed ? `Mark ${task.title} as not completed` : `Complete ${task.title}`);
    completeButton.setAttribute("aria-pressed", String(task.completed));
    completeButton.textContent = task.completed ? "✓" : "";

    const copy = document.createElement("div");
    copy.className = "task-copy";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    copy.append(title);

    const due = document.createElement("span");
    due.className = "task-due";
    due.textContent = formatDueDate(task.dueDate);
    if (!task.completed && task.dueDate && task.dueDate < localDateKey()) {
        due.classList.add("is-overdue");
        due.textContent = `Overdue · ${due.textContent}`;
    }
    copy.append(due);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.textContent = "×";

    item.append(completeButton, copy, deleteButton);
    return item;
}

function renderTasks() {
    taskList.replaceChildren();
    const filteredTasks = visibleTasks();
    const orderedTasks = filteredTasks.slice().sort((first, second) => {
        if (first.completed !== second.completed) return Number(first.completed) - Number(second.completed);
        if (!first.dueDate) return second.dueDate ? -1 : 0;
        if (!second.dueDate) return 1;
        return first.dueDate.localeCompare(second.dueDate);
    });

    if (orderedTasks.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = currentView === "completed" ? "✦" : "✿";
        const heading = document.createElement("strong");
        heading.textContent = currentView === "completed" ? "Your wins will show up here" : "Nothing on your list just yet";
        const message = document.createElement("p");
        message.textContent = currentView === "upcoming"
            ? "Add a due date to plan something for later."
            : currentView === "completed"
                ? "Finish a task and take a moment to celebrate."
                : "Add a task above and make a little progress.";
        emptyItem.append(icon, heading, message);
        taskList.append(emptyItem);
    } else {
        taskList.append(...orderedTasks.map(createTaskElement));
    }

    updateSummary();
}

function updateSummary() {
    const completedCount = tasks.filter(task => task.completed).length;
    const openCount = tasks.length - completedCount;
    const progress = tasks.length === 0 ? 0 : Math.round(completedCount / tasks.length * 100);

    document.getElementById("all-count").textContent = String(tasks.length);
    document.getElementById("todo-stat").textContent = String(openCount);
    document.getElementById("done-stat").textContent = String(completedCount);
    document.getElementById("progress-label").textContent = `${progress}%`;
    document.getElementById("progress-fill").style.width = `${progress}%`;
    document.getElementById("progress-bar").setAttribute("aria-valuenow", String(progress));
    document.getElementById("progress-caption").textContent = tasks.length === 0
        ? "Every step counts"
        : `${completedCount} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} complete`;
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) {
        formMessage.textContent = "Add a task name to continue.";
        taskInput.focus();
        return;
    }

    tasks.push({
        id: window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        dueDate: dueDateInput.value,
        completed: false
    });
    saveTasks();
    taskForm.reset();
    currentView = "all";
    setActiveView();
    renderTasks();
    taskInput.focus();
});

taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const item = button.closest("[data-task-id]");
    const task = tasks.find(candidate => candidate.id === item.dataset.taskId);
    if (!task) return;

    if (button.dataset.action === "toggle") task.completed = !task.completed;
    if (button.dataset.action === "delete") tasks = tasks.filter(candidate => candidate.id !== task.id);

    saveTasks();
    renderTasks();
});

function setActiveView() {
    const labels = {
        all: "All tasks",
        today: "Today",
        upcoming: "Upcoming",
        completed: "Completed"
    };
    document.getElementById("current-view-label").textContent = labels[currentView];
    document.getElementById("tasks-heading").textContent = currentView === "all" ? "My tasks" : labels[currentView];
    navLinks.forEach(link => {
        const isActive = link.dataset.view === currentView;
        link.classList.toggle("is-active", isActive);
        link.setAttribute("aria-pressed", String(isActive));
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        currentView = link.dataset.view;
        setActiveView();
        renderTasks();
    });
});

document.getElementById("today-date").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
}).format(new Date());

setActiveView();
renderTasks();
