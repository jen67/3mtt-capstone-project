const API_URL = "https://threemtt-capstone-project-u9lv.onrender.com";


document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  // If no token, redirect to login page for any page except login or register page
  if (
    !token &&
    window.location.pathname !== "/login.html" &&
    window.location.pathname !== "/register.html"
  ) {
    window.location.href = "/login.html";
  } else if (
    token &&
    (window.location.pathname === "/login.html" ||
      window.location.pathname === "/register.html")
  ) {
    // If a token exists, and the user is on login or register page, redirect to the home page (index.html)
    window.location.href = "/index.html";
  } else if (token && window.location.pathname === "/index.html") {
    // If a token exists, fetch tasks for the logged-in user
    fetchAndDisplayTasks();
  }
});

// Function to fetch and display tasks
async function fetchAndDisplayTasks() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const tasks = await res.json();
    displayTasks(tasks); // Render tasks in the UI
  } catch (error) {
    displayFeedback("Error fetching tasks: " + error.message, "error");
    console.error("Error fetching tasks:", error);
  }
}

// Function to format date and time
function formatDateTime(dateTime) {
  const date = new Date(dateTime);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}

// Function to display tasks dynamically on the homepage
function displayTasks(tasks) {
  const taskListContainer = document.getElementById("task-list");
  taskListContainer.innerHTML = ""; // Clear existing tasks

  if (tasks.length === 0) {
    displayFeedback("No tasks found.", "info");
    return;
  }

  tasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");

    // Determine the priority class
    let priorityClass = '';
    if (task.priority === 'low') {
      priorityClass = 'low';
    } else if (task.priority === 'medium') {
      priorityClass = 'medium';
    } else if (task.priority === 'high') {
      priorityClass = 'high';
    }

    // Add completed class if the task is completed
    if (task.completed) {
      taskElement.classList.add("completed");
    }

    taskElement.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <span class="task-due">Due: ${formatDateTime(task.deadline)}</span>
      <span class="task-priority ${priorityClass}">${task.priority}</span>
      <span class="task-added"> ${new Date(task.createdAt).toLocaleDateString()}</span>
      <div class="task-actions">
        <input type="checkbox" class="complete-checkbox" data-id="${task._id}" ${task.completed ? 'checked' : ''}>
        <i class="fas fa-edit edit-icon" data-id="${task._id}"></i>
        <i class="fas fa-trash delete-icon" data-id="${task._id}"></i>
      </div>
    `;

    taskElement.querySelector(".complete-checkbox").addEventListener("change", (e) => {
      const taskId = e.target.getAttribute("data-id");
      const isCompleted = e.target.checked;
      markTaskAsComplete(taskId, isCompleted);
    });

    taskElement.querySelector(".delete-icon").addEventListener("click", (e) => {
      const taskId = e.target.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this task?")) {
        deleteTask(taskId);
      }
    });

    taskElement.querySelector(".edit-icon").addEventListener("click", (e) => {
      const taskId = e.target.getAttribute("data-id");
      openEditModal(taskId);
    });

    taskListContainer.appendChild(taskElement);
  });
}

// Function to mark a task as complete or incomplete
async function markTaskAsComplete(taskId, isCompleted) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: isCompleted }),
    });

    if (res.ok) {
      fetchAndDisplayTasks(); // Refresh the task list
      displayFeedback(`Task ${isCompleted ? 'marked as complete' : 'marked as incomplete'}!`, "success");
    } else {
      displayFeedback(`Failed to mark task as ${isCompleted ? 'complete' : 'incomplete'}.`, "error");
    }
  } catch (error) {
    displayFeedback(`Error marking task as ${isCompleted ? 'complete' : 'incomplete'}: ` + error.message, "error");
    console.error(`Error marking task as ${isCompleted ? 'complete' : 'incomplete'}:`, error);
  }
}

// Function to display feedback messages
function displayFeedback(message, type) {
  const feedbackMessage = document.getElementById("feedback-message");
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback-message ${type}`;
  setTimeout(() => {
    feedbackMessage.textContent = "";
    feedbackMessage.className = "feedback-message";
  }, 3000);
}

// Function to validate the deadline date
function validateDeadline(deadline) {
  const currentDate = new Date();
  const deadlineDate = new Date(deadline);
  if (deadlineDate < currentDate) {
    displayFeedback("Deadline cannot be in the past.", "error");
    return false;
  }
  return true;
}

// Add task logic
async function addTask(title, description, deadline, priority) {
  const token = localStorage.getItem("token");

  // Validate the deadline date
  if (!validateDeadline(deadline)) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, deadline, priority }),
    });

    const newTask = await res.json();

    if (res.ok) {
      // After successfully adding the task, fetch and display updated list
      fetchAndDisplayTasks(); // Refresh the task list
      document.getElementById("task-form").reset(); // Reset the form fields
      displayFeedback("Task added successfully!", "success");
    } else {
      displayFeedback("Failed to add task: " + newTask.error, "error");
    }
  } catch (error) {
    displayFeedback("Error adding task: " + error.message, "error");
    console.error("Error adding task:", error);
  }
}

// Handle task form submission
if (window.location.pathname === "/index.html") {
  document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("task-title").value;
    const description = document.getElementById("task-description").value;
    const deadline = document.getElementById("task-due-date").value;
    const priority = document.getElementById("task-priority").value;

    addTask(title, description, deadline, priority); // Add the task to the backend
  });
}

// Logout functionality
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("token"); // Remove token from localStorage
  window.location.href = "/login.html"; // Redirect to login page
});

// Sign-up logic
async function signUp(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Redirect to login page after successful registration
      alert("Registration successful! Please log in.");
      window.location.href = "/login.html";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Error signing up:", error);
    alert("An error occurred during registration. Please try again.");
  }
}

// Sign-up form submission handler
if (window.location.pathname === "/register.html") {
  document.getElementById("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    signUp(username, password);
  });
}

// Login logic
async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Store the JWT token in localStorage and redirect to home page
      localStorage.setItem("token", data.token);
      window.location.href = "/index.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("An error occurred during login. Please try again.");
  }
}

// Login form submission handler
if (window.location.pathname === "/login.html") {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    login(username, password);
  });
}

// Toggle task list visibility and display all tasks in the same page
document.getElementById("view-all-tasks-btn")?.addEventListener("click", () => {
  const taskListContainer = document.getElementById("task-list-container");
  const currentDisplay = taskListContainer.style.display;

  // Toggle visibility of the task list container
  taskListContainer.style.display =
    currentDisplay === "none" ? "block" : "none";

  // Fetch and display tasks if the task list is being shown
  if (taskListContainer.style.display === "block") {
    fetchAndDisplayTasks(); // Fetch and display tasks when the button is clicked
  }
});

// Filter tasks based on search input
document.getElementById("search-input")?.addEventListener("input", (e) => {
  const searchText = e.target.value.toLowerCase();
  const taskElements = document.querySelectorAll(".task");

  let found = false;
  taskElements.forEach((taskElement) => {
    const title = taskElement.querySelector("h3").textContent.toLowerCase();
    const description = taskElement.querySelector("p").textContent.toLowerCase();

    if (title.includes(searchText) || description.includes(searchText)) {
      taskElement.style.display = "";
      found = true;
    } else {
      taskElement.style.display = "none";
    }
  });

  if (!found) {
    displayFeedback("No tasks match your search.", "info");
  }
});

// Function to delete a task
async function deleteTask(taskId) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchAndDisplayTasks(); // Refresh the task list
      displayFeedback("Task deleted successfully!", "success");
    } else {
      displayFeedback("Failed to delete task.", "error");
    }
  } catch (error) {
    displayFeedback("Error deleting task: " + error.message, "error");
    console.error("Error deleting task:", error);
  }
}

// Function to open the edit task modal
function openEditModal(taskId) {
  console.log("Opening edit modal for task:", taskId); // Debugging log
  const modal = document.getElementById("edit-task-modal");
  const closeModal = modal.querySelector(".close");
  const editForm = document.getElementById("edit-task-form");

  // Fetch the task details and populate the form
  fetchTaskDetails(taskId);

  // Show the modal
  modal.style.display = "block";

  // Close the modal when the close button is clicked
  closeModal.onclick = () => {
    modal.style.display = "none";
  };

  // Close the modal when clicking outside of the modal content
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Handle form submission
  editForm.onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById("edit-task-title").value;
    const description = document.getElementById("edit-task-description").value;
    const deadline = document.getElementById("edit-task-due-date").value;
    const priority = document.getElementById("edit-task-priority").value;

    updateTask(taskId, title, description, deadline, priority);
    modal.style.display = "none";
  };
}

// Function to fetch task details and populate the edit form
async function fetchTaskDetails(taskId) {
  console.log("Fetching details for task:", taskId); // Debugging log
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch task details");
    }

    const task = await res.json();
    console.log("Fetched task details:", task); // Debugging log

    // Prefill the form fields
    document.getElementById("edit-task-title").value = task.title;
    document.getElementById("edit-task-description").value = task.description;
    document.getElementById("edit-task-due-date").value = new Date(task.deadline).toISOString().slice(0, 16);
    document.getElementById("edit-task-priority").value = task.priority;
  } catch (error) {
    displayFeedback("Error fetching task details: " + error.message, "error");
    console.error("Error fetching task details:", error);
  }
}

// Function to update a task
async function updateTask(taskId, title, description, deadline, priority) {
  console.log("Updating task:", taskId); // Debugging log
  const token = localStorage.getItem("token");

  // Validate the deadline date
  if (!validateDeadline(deadline)) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, deadline, priority }),
    });

    if (res.ok) {
      fetchAndDisplayTasks(); // Refresh the task list
      displayFeedback("Task updated successfully!", "success");
    } else {
      displayFeedback("Failed to update task.", "error");
    }
  } catch (error) {
    displayFeedback("Error updating task: " + error.message, "error");
    console.error("Error updating task:", error);
  }
}

// Export functions for testing
module.exports = {
  formatDateTime,
  validateDeadline,
};