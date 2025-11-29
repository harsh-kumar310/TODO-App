document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. SELECTORS ---
    const inp = document.querySelector(".task-input");
    const timeInp = document.querySelector(".time-input");
    const addBtn = document.querySelector(".input button");
    const taskList = document.querySelector(".order");
    const weekFilterContainer = document.querySelector(".week-filter");

    // --- 2. NOTIFICATION PERMISSION ---
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    // --- 3. EVENT LISTENERS ---
    loadTasks();

    addBtn.addEventListener("click", function() {
        const taskText = inp.value.trim();
        const taskTime = timeInp.value;

        if (taskText === "") {
            alert("Please enter a task!");
            return;
        }

        let taskDate = null;
        if (taskTime) {
            taskDate = new Date();
            const [hours, minutes] = taskTime.split(':');
            taskDate.setHours(hours, minutes, 0, 0);
        }

        addTaskToDOM(taskText, taskDate, false);
        if (taskDate) {
            scheduleNotification(taskText, taskDate);
        }
        
        inp.value = "";
        timeInp.value = "";
        saveTasks();
    });
    
    weekFilterContainer.addEventListener('click', function(e) {
        if (e.target.matches('.day-btn')) {
            document.querySelector('.day-btn.active').classList.remove('active');
            e.target.classList.add('active');
            filterTasks(e.target.dataset.day);
        }
    });

    taskList.addEventListener("click", function(event) {
    const item = event.target;
    const li = item.closest('li');

    if (!li) return; // Agar LI ke bahar click hua hai to kuch na karein

    // --- DELETE button ka logic ---
    if (item.classList.contains("delete")) {
        li.remove();
        saveTasks();
    } 
    // --- COMPLETE/INCOMPLETE ka logic ---
    else if (item.classList.contains("task-text") || item.classList.contains("task-time")) {
        li.classList.toggle("completed");
        saveTasks();
    }
    // --- EDIT button ka logic ---
    else if (item.classList.contains("edit")) {
        const taskTextSpan = li.querySelector('.task-text');
        const currentText = taskTextSpan.textContent;
        const originalDate = li.dataset.date ? new Date(li.dataset.date) : null;
        const currentTime = originalDate ? originalDate.toTimeString().slice(0, 5) : "";

        li.innerHTML = `
            <div class="task-content">
                <input type="text" class="edit-task-input" value="${currentText}">
                <input type="time" class="edit-time-input" value="${currentTime}">
                <div>
                    <button class="save">save</button>
                    <button class="cancel">cancel</button>
                </div>
            </div>
        `;
    }
    // --- SAVE button ka logic ---
    else if (item.classList.contains("save")) {
        const newText = li.querySelector('.edit-task-input').value.trim();
        const newTime = li.querySelector('.edit-time-input').value;

        if (newText) {
            let newDate = null;
            if (newTime) {
                newDate = new Date();
                const [hours, minutes] = newTime.split(':');
                newDate.setHours(hours, minutes, 0, 0);
            }
            
            // ===== BUG FIX: YAHAN NOTIFICATION KO PHIR SE SCHEDULE KAREIN =====
            if (newDate) {
                scheduleNotification(newText, newDate);
            }
            // ===================================================================

            const isCompleted = li.classList.contains('completed');
            li.remove(); 
            addTaskToDOM(newText, newDate, isCompleted); 
            saveTasks();
        }
    }
    // --- CANCEL button ka logic ---
    else if (item.classList.contains("cancel")) {
        taskList.innerHTML = ''; 
        loadTasks(); 
    }
});

    // --- 4. FUNCTIONS ---

    function addTaskToDOM(text, date, isCompleted) {
    const newLi = document.createElement("li");
    if (date) {
        newLi.dataset.date = date.toISOString();
    }
    if (isCompleted) newLi.classList.add("completed");
    
    // ===== START: Yahan Badlav Karein (Edit button jodein) =====
    newLi.innerHTML = `
        <div class="task-content">
            <span class="task-text">${text}</span>
            <div>
                <button class="edit">edit</button>
                <button class="delete">delete</button>
            </div>
        </div>
        ${date ? `<div class="task-time">Time: ${formatTimeAMPM(date)}</div>` : ''}`;
        taskList.appendChild(newLi);
    }
    
    function filterTasks(day) {
        const tasksForDay = [];
        document.querySelectorAll('.order li').forEach(task => {
            const hasDate = task.dataset.date;
            if (!hasDate && day !== 'all') {
                task.style.display = 'none';
                return;
            }
            if (day === 'all') {
                task.style.display = 'block';
                return;
            }
            
            const taskDay = new Date(hasDate).getDay().toString();
            if (taskDay === day) {
                task.style.display = 'block';
                tasksForDay.push(task.querySelector('.task-text').textContent);
            } else {
                task.style.display = 'none';
            }
        });

        if (day !== 'all' && tasksForDay.length > 0) {
            alert(`Tasks for this day:\n- ${tasksForDay.join('\n- ')}`);
        } else if (day !== 'all') {
            alert("No tasks scheduled for this day.");
        }
    }

    // ===== YEH FUNCTION AAPKA SABSE ZAROORI HAI =====
    function scheduleNotification(taskText, taskDate) {
        const now = new Date();
        if (taskDate > now) {
            const timeDifference = taskDate.getTime() - now.getTime();
            
            setTimeout(() => {
                if (Notification.permission === "granted") {
                    new Notification("Task Reminder!", { body: `Time for your task: "${taskText}"` });
                }

                const hour = taskDate.getHours();
                let greeting = (hour < 12) ? "शुभ प्रभात महोदय!" : "शुभ दोपहर महोदय!";
                const speechText = `${greeting} यह समय आपको ${taskText} टास्क को करने का हो गया है।`;

                // DEBUGGING KE LIYE CONSOLE MEIN MESSAGE PRINT KAREIN
                console.log("Bola jaane wala text:", speechText);

                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.lang = 'hi-IN';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);

            }, timeDifference);
        }
    }
    
    function formatTimeAMPM(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    function saveTasks() {
        const tasks = [];
        document.querySelectorAll(".order li").forEach(item => {
            tasks.push({
                text: item.querySelector('.task-text').textContent,
                completed: item.classList.contains("completed"),
                date: item.dataset.date || null
            });
        });
        localStorage.setItem("myTodoList", JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem("myTodoList")) || [];
        tasks.forEach(task => {
            const taskDate = task.date ? new Date(task.date) : null;
            addTaskToDOM(task.text, taskDate, task.completed);
            if (taskDate) {
                scheduleNotification(task.text, taskDate);
            }
        });
    }
});