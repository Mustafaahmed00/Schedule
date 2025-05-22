// JavaScript for Schedule Tracker will go here

document.addEventListener('DOMContentLoaded', () => {
    console.log('Schedule Tracker Loaded');
    const activityForm = document.getElementById('activity-form');
    const dailyScheduleSection = document.getElementById('daily-schedule');
    const timelineContainer = document.getElementById('timeline-container'); // For later use

    // Goal sections
    const weeklyGoalInput = document.getElementById('weekly-goal-text');
    const addWeeklyGoalBtn = document.getElementById('add-weekly-goal-btn');
    const weeklyGoalsList = document.getElementById('weekly-goals-list');
    const monthlyGoalInput = document.getElementById('monthly-goal-text');
    const addMonthlyGoalBtn = document.getElementById('add-monthly-goal-btn');
    const monthlyGoalsList = document.getElementById('monthly-goals-list');
    const quoteTextElement = document.getElementById('quote-text'); // Get the quote element
    const userNameInput = document.getElementById('user-name-input');
    const saveNameBtn = document.getElementById('save-name-btn');
    const welcomeMessageElement = document.getElementById('welcome-message');

    // Andrew Tate Quotes
    const tateQuotes = [
        "Your mindset is the only thing standing between you and success.",
        "Success is a decision, not a gift.",
        "Life is a fight. The sooner you accept that, the sooner you can start winning.",
        "Excuses are for losers. Winners find a way.",
        "Comfort is the enemy of progress.",
        "Hustle beats talent when talent doesn't hustle.",
        "The best way to predict the future is to create it.",
        "Be a wolf, not a sheep. The world belongs to the bold.",
        "You can have results or excuses, not both.",
        "Discipline is doing what you hate to do but doing it like you love it.",
        "My unmatched perspicacity coupled with sheer indefatigability makes me a feared opponent in any realm of human endeavour.",
        "Close your eyes. Focus on making yourself feel excited, powerful. Imagine yourself destroying goals with ease.",
        "Your mind must be stronger than your feelings.",
        "The man who goes to the gym every single day regardless of how he feels will always beat the man who goes to the gym when he feels like going to the gym."
        // Add more quotes here if desired
    ];

    // Arrays to store activities and goals
    let activities = [];
    let weeklyGoals = [];
    let monthlyGoals = [];

    // Load data from local storage on startup
    loadData();

    if (activityForm) {
        activityForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Get values from the form
            const activityName = document.getElementById('activity-name').value;
            const startTime = document.getElementById('start-time').value;
            const endTime = document.getElementById('end-time').value;
            const notes = document.getElementById('notes').value;

            // Basic validation (can be expanded)
            if (!activityName || !startTime || !endTime) {
                alert('Please fill in activity, start time, and end time.');
                return;
            }

            const newActivity = {
                id: Date.now(), // Unique ID for the activity
                name: activityName,
                start: startTime,
                end: endTime,
                notes: notes,
                done: false // To track if the activity was completed
            };

            activities.push(newActivity);
            console.log('Activity added:', newActivity);
            console.log('All activities:', activities);

            displayActivities(); // Call function to update the display
            saveData(); // Save after adding an activity

            // Clear the form fields
            activityForm.reset();
        });
    }

    function displayActivities() {
        // Clear only the activities, not the whole timeline structure
        const existingActivityElements = timelineContainer.querySelectorAll('.activity-block');
        existingActivityElements.forEach(el => el.remove());

        if (activities.length === 0 && timelineContainer.children.length <= 1) { // Check if only the heading is there or it's empty after slot creation
            // If timeline slots are already there, we might not want to overwrite them with this message.
            // For now, let's ensure the message appears if no activities and timeline is also empty.
            const noActivityMsg = document.createElement('p');
            noActivityMsg.id = 'no-activities-message'; // ID to easily remove/check later
            noActivityMsg.textContent = 'No activities scheduled yet. Add some!';
            // Check if message already exists
            if (!timelineContainer.querySelector('#no-activities-message')) {
                timelineContainer.appendChild(noActivityMsg);
            }
            return;
        } else {
            const noActivityMsg = timelineContainer.querySelector('#no-activities-message');
            if (noActivityMsg) noActivityMsg.remove();
        }

        activities.forEach(activity => {
            const activityBlock = document.createElement('div');
            activityBlock.classList.add('activity-block');
            activityBlock.dataset.id = activity.id;
            activityBlock.setAttribute('draggable', 'true');

            // Calculate position and height
            const hourHeight = 60; // Corresponds to .time-slot min-height in CSS
            const timelineStartHour = 6; // Timeline starts at 6 AM

            const [startHour, startMinute] = activity.start.split(':').map(Number);
            const [endHour, endMinute] = activity.end.split(':').map(Number);

            // Calculate top position
            // Offset from the top of the timelineContainer
            const topPosition = (startHour - timelineStartHour + startMinute / 60) * hourHeight;

            // Calculate height
            const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
            let blockHeight = durationHours * hourHeight;

            // Ensure minimum height and handle potential negative heights if end < start
            if (blockHeight <= 0) blockHeight = hourHeight / 2; // Default to 30 min height if invalid duration

            activityBlock.style.top = `${topPosition}px`;
            activityBlock.style.height = `${blockHeight}px`;

            activityBlock.innerHTML = `
                <strong>${activity.name}</strong> (${activity.start} - ${activity.end})
                <p class="notes-preview">${activity.notes ? activity.notes.substring(0, 30) + (activity.notes.length > 30 ? '...' : '') : ''}</p>
                <div class="activity-actions">
                    <button class="complete-btn" data-id="${activity.id}">${activity.done ? 'Undo' : 'Done'}</button>
                    <button class="delete-btn" data-id="${activity.id}">Delete</button>
                </div>
            `;
            if (activity.done) {
                activityBlock.classList.add('completed');
            }
            timelineContainer.appendChild(activityBlock);
        });

        addActivityEventListeners(); // Re-attach event listeners for new/updated blocks
        addDragAndDropListeners(); // Add D&D listeners
    }

    function createTimelineSlots() {
        timelineContainer.innerHTML = ''; // Clear previous slots if any
        for (let hour = 6; hour <= 22; hour++) { // 6 AM to 10 PM
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.dataset.hour = hour;

            const timeLabel = document.createElement('span');
            timeLabel.classList.add('time-label');
            timeLabel.textContent = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 || hour === 24 ? 'AM' : (hour === 12 ? 'PM' : 'PM')}`;
            if (hour === 12) timeLabel.textContent = '12:00 PM'; // Correct noon
            if (hour === 24) timeLabel.textContent = '12:00 AM (Midnight)'; // Correct midnight if we go up to 24

            timeSlot.appendChild(timeLabel);
            timelineContainer.appendChild(timeSlot);
        }
        console.log("Timeline slots created.");
    }

    function addActivityEventListeners() {
        const completeButtons = document.querySelectorAll('#daily-schedule .complete-btn');
        const deleteButtons = document.querySelectorAll('#daily-schedule .delete-btn');

        completeButtons.forEach(button => {
            button.addEventListener('click', function () {
                const activityId = parseInt(this.dataset.id);
                toggleActivityDone(activityId);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const activityId = parseInt(this.dataset.id);
                deleteActivity(activityId);
            });
        });
    }

    function toggleActivityDone(id) {
        activities = activities.map(activity => {
            if (activity.id === id) {
                return { ...activity, done: !activity.done };
            }
            return activity;
        });
        displayActivities(); // Re-render the list
        saveData(); // Save changes
    }

    function deleteActivity(id) {
        activities = activities.filter(activity => activity.id !== id);
        displayActivities(); // Re-render the list
        saveData(); // Save changes
    }

    // Initial display (in case there's saved data later)
    loadAndDisplayUserName(); // For personalization
    displayRandomQuote(); // Display a random quote on load
    createTimelineSlots(); // Create the visual timeline structure
    displayActivities();
    displayWeeklyGoals();
    displayMonthlyGoals();

    // We will add more JS functionality later

    // --- Local Storage Functions ---
    function saveData() {
        localStorage.setItem('activities', JSON.stringify(activities));
        localStorage.setItem('weeklyGoals', JSON.stringify(weeklyGoals));
        localStorage.setItem('monthlyGoals', JSON.stringify(monthlyGoals));
        console.log('Data saved to local storage');
    }

    function loadData() {
        const storedActivities = localStorage.getItem('activities');
        const storedWeeklyGoals = localStorage.getItem('weeklyGoals');
        const storedMonthlyGoals = localStorage.getItem('monthlyGoals');
        // const storedUserName = localStorage.getItem('userName'); // Will be handled by loadAndDisplayUserName

        if (storedActivities) {
            activities = JSON.parse(storedActivities);
        }
        if (storedWeeklyGoals) {
            weeklyGoals = JSON.parse(storedWeeklyGoals);
        }
        if (storedMonthlyGoals) {
            monthlyGoals = JSON.parse(storedMonthlyGoals);
        }
        console.log('Data loaded from local storage');
    }

    // --- Goal Management Functions ---
    function addGoal(type) {
        let goalText, goalsArray, displayFunction, inputElement;

        if (type === 'weekly') {
            inputElement = weeklyGoalInput;
            goalText = weeklyGoalInput.value.trim();
            goalsArray = weeklyGoals;
            displayFunction = displayWeeklyGoals;
        } else if (type === 'monthly') {
            inputElement = monthlyGoalInput;
            goalText = monthlyGoalInput.value.trim();
            goalsArray = monthlyGoals;
            displayFunction = displayMonthlyGoals;
        } else {
            return;
        }

        if (!goalText) {
            alert('Please enter a goal.');
            return;
        }

        const newGoal = {
            id: Date.now(),
            text: goalText,
            achieved: false // Can be used later
        };

        goalsArray.push(newGoal);
        inputElement.value = ''; // Clear input
        displayFunction();
        saveData(); // Save after adding a goal
    }

    function displayWeeklyGoals() {
        renderGoals(weeklyGoals, weeklyGoalsList, 'weekly');
    }

    function displayMonthlyGoals() {
        renderGoals(monthlyGoals, monthlyGoalsList, 'monthly');
    }

    function renderGoals(goalsArray, listElement, type) {
        listElement.innerHTML = ''; // Clear previous list
        if (goalsArray.length === 0) {
            listElement.innerHTML = `<li>No ${type} goals set yet.</li>`;
            return;
        }
        goalsArray.forEach(goal => {
            const listItem = document.createElement('li');
            listItem.textContent = goal.text;
            // Add a delete button for each goal
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-goal-btn');
            deleteBtn.dataset.id = goal.id;
            deleteBtn.dataset.type = type;
            listItem.appendChild(deleteBtn);
            listElement.appendChild(listItem);
        });
        addGoalEventListeners(); // Re-attach event listeners for new delete buttons
    }

    function deleteGoal(id, type) {
        if (type === 'weekly') {
            weeklyGoals = weeklyGoals.filter(goal => goal.id !== id);
            displayWeeklyGoals();
        } else if (type === 'monthly') {
            monthlyGoals = monthlyGoals.filter(goal => goal.id !== id);
            displayMonthlyGoals();
        }
        saveData(); // Save after deleting a goal
    }

    // Event listeners for goal sections
    if (addWeeklyGoalBtn) {
        addWeeklyGoalBtn.addEventListener('click', () => addGoal('weekly'));
    }
    if (addMonthlyGoalBtn) {
        addMonthlyGoalBtn.addEventListener('click', () => addGoal('monthly'));
    }

    function addGoalEventListeners() {
        const deleteGoalButtons = document.querySelectorAll('.delete-goal-btn');
        deleteGoalButtons.forEach(button => {
            // Prevent adding multiple listeners to the same button
            if (button.dataset.listenerAttached) return;

            button.addEventListener('click', function () {
                const goalId = parseInt(this.dataset.id);
                const goalType = this.dataset.type;
                deleteGoal(goalId, goalType);
            });
            button.dataset.listenerAttached = 'true';
        });
    }

    // --- Drag and Drop Functions ---
    let draggedActivityId = null;

    function addDragAndDropListeners() {
        const activityBlocks = timelineContainer.querySelectorAll('.activity-block');
        activityBlocks.forEach(block => {
            block.addEventListener('dragstart', handleDragStart);
            // block.addEventListener('dragend', handleDragEnd); // Optional: for styling or cleanup
        });

        timelineContainer.addEventListener('dragover', handleDragOver);
        timelineContainer.addEventListener('drop', handleDrop);
    }

    function handleDragStart(event) {
        draggedActivityId = parseInt(event.target.closest('.activity-block').dataset.id);
        event.dataTransfer.setData('text/plain', draggedActivityId); // Necessary for Firefox
        event.target.style.opacity = '0.5'; // Visual feedback
        console.log('Dragging activity ID:', draggedActivityId);
    }

    function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
        event.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(event) {
        event.preventDefault();
        if (draggedActivityId === null) return;

        const hourHeight = 60;
        const timelineStartHour = 6;
        // Calculate the drop position relative to the timeline container
        const timelineRect = timelineContainer.getBoundingClientRect();
        const dropY = event.clientY - timelineRect.top;

        // Calculate new start hour and minute based on Y position
        let newStartHour = Math.floor(dropY / hourHeight) + timelineStartHour;
        let newStartMinute = Math.floor((dropY % hourHeight) / (hourHeight / 60));
        // Snap to nearest 15 minutes for example
        newStartMinute = Math.round(newStartMinute / 15) * 15;
        if (newStartMinute >= 60) {
            newStartHour += 1;
            newStartMinute = 0;
        }

        // Clamp to timeline bounds (6 AM to 10 PM)
        if (newStartHour < timelineStartHour) newStartHour = timelineStartHour;
        // This needs to be more robust if activities can span past 10 PM or start very late

        const activity = activities.find(act => act.id === draggedActivityId);
        if (!activity) return;

        // Calculate original duration
        const [oldStartHour, oldStartMinute] = activity.start.split(':').map(Number);
        const [oldEndHour, oldEndMinute] = activity.end.split(':').map(Number);
        const durationMinutes = (oldEndHour * 60 + oldEndMinute) - (oldStartHour * 60 + oldStartMinute);

        // Calculate new end time based on new start time and original duration
        let newEndHour = newStartHour;
        let newEndMinute = newStartMinute + durationMinutes;

        newEndHour += Math.floor(newEndMinute / 60);
        newEndMinute %= 60;

        // Format as HH:MM
        const newStartTimeStr = `${String(newStartHour).padStart(2, '0')}:${String(newStartMinute).padStart(2, '0')}`;
        const newEndTimeStr = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;

        // Update activity
        activity.start = newStartTimeStr;
        activity.end = newEndTimeStr;

        // Reset opacity for the dragged element if it's still in the DOM
        const draggedElement = timelineContainer.querySelector(`.activity-block[data-id='${draggedActivityId}']`);
        if (draggedElement) {
            draggedElement.style.opacity = '';
        }

        draggedActivityId = null;
        displayActivities(); // Re-render
        saveData();        // Save changes
        console.log(`Activity ${activity.id} dropped to ${newStartTimeStr} - ${newEndTimeStr}`);
    }

    // --- Quote Functions ---
    function displayRandomQuote() {
        if (quoteTextElement && tateQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * tateQuotes.length);
            quoteTextElement.textContent = tateQuotes[randomIndex];
        }
    }

    // --- Personalization Functions ---
    function saveUserName() {
        const userName = userNameInput.value.trim();
        if (userName) {
            localStorage.setItem('userName', userName);
            displayWelcomeMessage(userName);
            userNameInput.value = ''; // Clear input after saving
            userNameInput.style.display = 'none'; // Hide input
            saveNameBtn.style.display = 'none'; // Hide button
        } else {
            alert('Please enter a name.');
        }
    }

    function loadAndDisplayUserName() {
        const userName = localStorage.getItem('userName');
        if (userName) {
            displayWelcomeMessage(userName);
            if (userNameInput) userNameInput.style.display = 'none';
            if (saveNameBtn) saveNameBtn.style.display = 'none';
        } else {
            if (welcomeMessageElement) welcomeMessageElement.textContent = 'Welcome! Enter your name above to personalize your schedule.';
            if (userNameInput) userNameInput.style.display = 'inline-block'; // Ensure it's visible if no name
            if (saveNameBtn) saveNameBtn.style.display = 'inline-block'; // Ensure it's visible if no name
        }
    }

    function displayWelcomeMessage(name) {
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = `Welcome back, ${name}! Here is your schedule:`;
        }
    }

    // Event Listeners for Personalization
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', saveUserName);
    }
}); 