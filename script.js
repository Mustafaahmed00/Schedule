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
    let currentTimeIndicator = null; // Variable to hold the time indicator element

    // Weekly Calendar View Elements
    const weeklyCalendarGrid = document.getElementById('weekly-grid-container');
    const currentWeekDisplay = document.getElementById('current-week-display');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    let currentWeekStartDate = getStartOfWeek(new Date());

    const activityCategorySelect = document.getElementById('activity-category');
    const dailyStatsContainer = document.getElementById('daily-stats');

    // Define categories
    const activityCategories = {
        none: { name: 'None', color: '#ff7043' }, // Default/original color
        work: { name: 'Work', color: '#42A5F5' }, // Blue
        personal: { name: 'Personal', color: '#66BB6A' }, // Green
        fitness: { name: 'Fitness', color: '#FFCA28' }, // Amber
        learning: { name: 'Learning', color: '#AB47BC' }, // Purple
        errands: { name: 'Errands', color: '#EF5350' } // Red
    };

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

    // Populate Category Dropdown
    function populateCategoryDropdown() {
        if (!activityCategorySelect) return;
        for (const key in activityCategories) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = activityCategories[key].name;
            activityCategorySelect.appendChild(option);
        }
    }

    if (activityForm) {
        activityForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Get values from the form
            const activityName = document.getElementById('activity-name').value;
            const startTime = document.getElementById('start-time').value;
            const endTime = document.getElementById('end-time').value;
            const notes = document.getElementById('notes').value;
            const category = activityCategorySelect ? activityCategorySelect.value : 'none'; // Get category

            // Basic validation (can be expanded)
            if (!activityName || !startTime || !endTime) {
                alert('Please fill in activity, start time, and end time.');
                return;
            }

            const newActivity = {
                id: Date.now(), // Unique ID for the activity
                name: activityName,
                date: new Date().toISOString().split('T')[0], // Add current date in YYYY-MM-DD format
                start: startTime,
                end: endTime,
                notes: notes,
                category: category, // Save category
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
        const existingActivityElements = timelineContainer.querySelectorAll('.activity-block');
        existingActivityElements.forEach(el => el.remove());

        const today = new Date().toISOString().split('T')[0];
        const todaysActivities = activities.filter(activity => activity.date === today);

        updateDailyStats(todaysActivities); // Call to update stats

        if (todaysActivities.length === 0 && timelineContainer.children.length <= 1) {
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

        todaysActivities.forEach(activity => {
            const activityBlock = document.createElement('div');
            activityBlock.classList.add('activity-block');
            activityBlock.dataset.id = activity.id;
            activityBlock.setAttribute('draggable', 'true');

            // Apply category color
            const categoryColor = activityCategories[activity.category]?.color || activityCategories.none.color;
            activityBlock.style.backgroundColor = categoryColor;
            // Adjust border color to be a darker shade of the category color
            // This is a simple way; a more robust method might involve a color manipulation library
            const darkerCategoryColor = shadeColor(categoryColor, -20); // Darken by 20%
            activityBlock.style.borderColor = darkerCategoryColor;

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
                <div class="resize-handle resize-handle-top"></div>
                <strong>${activity.name}</strong> (${activity.start} - ${activity.end})
                <p class="notes-preview">${activity.notes ? activity.notes.substring(0, 30) + (activity.notes.length > 30 ? '...' : '') : ''}</p>
                <div class="activity-actions">
                    <button class="complete-btn" data-id="${activity.id}">${activity.done ? 'Undo' : 'Done'}</button>
                    <button class="delete-btn" data-id="${activity.id}">Delete</button>
                </div>
                <div class="resize-handle resize-handle-bottom"></div>
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
        displayActivities(); // Re-render the list - this will call updateDailyStats
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
    populateCategoryDropdown(); // Populate categories
    createTimelineSlots(); // Create the visual timeline structure
    createCurrentTimeIndicator(); // Create the time indicator line
    updateCurrentTimeIndicator(); // Position it correctly on load
    setInterval(updateCurrentTimeIndicator, 60000); // Update every minute
    displayActivities();
    displayWeeklyGoals();
    displayMonthlyGoals();
    renderWeeklyCalendar(); // Render weekly calendar on load

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
    let isResizing = false;
    let resizeHandleType = null; // 'top' or 'bottom'
    let resizingActivityId = null;
    let initialY = 0;
    let initialHeight = 0;
    let initialTop = 0;

    function addDragAndDropListeners() {
        const activityBlocks = timelineContainer.querySelectorAll('.activity-block');
        activityBlocks.forEach(block => {
            block.addEventListener('dragstart', handleDragStart);
            // block.addEventListener('dragend', handleDragEnd); // Optional: for styling or cleanup

            const topHandle = block.querySelector('.resize-handle-top');
            const bottomHandle = block.querySelector('.resize-handle-bottom');

            if (topHandle) topHandle.addEventListener('mousedown', handleResizeMouseDown);
            if (bottomHandle) bottomHandle.addEventListener('mousedown', handleResizeMouseDown);
        });

        timelineContainer.addEventListener('dragover', handleDragOver);
        timelineContainer.addEventListener('drop', handleDrop);

        // Global listeners for mousemove and mouseup during resize
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    }

    function handleResizeMouseDown(event) {
        if (event.button !== 0) return; // Only left click
        isResizing = true;
        const block = event.target.closest('.activity-block');
        resizingActivityId = parseInt(block.dataset.id);
        resizeHandleType = event.target.classList.contains('resize-handle-top') ? 'top' : 'bottom';

        initialY = event.clientY;
        initialHeight = block.offsetHeight;
        initialTop = block.offsetTop;

        // Prevent dragging the whole block when trying to resize
        block.setAttribute('draggable', 'false');
        document.body.style.cursor = 'ns-resize'; // Change cursor globally
        event.preventDefault(); // Prevent text selection or other default actions
        console.log(`Resize started for ID: ${resizingActivityId}, handle: ${resizeHandleType}`);
    }

    function handleResizeMouseMove(event) {
        if (!isResizing || resizingActivityId === null) return;

        const dy = event.clientY - initialY;
        const block = timelineContainer.querySelector(`.activity-block[data-id="${resizingActivityId}"]`);
        if (!block) return;

        const hourHeight = 60;
        const minHeight = hourHeight / 4; // Minimum 15 minutes height

        if (resizeHandleType === 'bottom') {
            let newHeight = initialHeight + dy;
            if (newHeight < minHeight) newHeight = minHeight;
            block.style.height = `${newHeight}px`;
        } else if (resizeHandleType === 'top') {
            let newTop = initialTop + dy;
            let newHeight = initialHeight - dy;

            if (newHeight < minHeight) {
                newHeight = minHeight;
                newTop = initialTop + (initialHeight - minHeight); // Adjust top so bottom edge doesn't move
            }
            block.style.top = `${newTop}px`;
            block.style.height = `${newHeight}px`;
        }
    }

    function handleResizeMouseUp(event) {
        if (!isResizing || resizingActivityId === null) return;
        isResizing = false;
        document.body.style.cursor = ''; // Reset global cursor

        const block = timelineContainer.querySelector(`.activity-block[data-id="${resizingActivityId}"]`);
        if (!block) return;

        const activity = activities.find(act => act.id === resizingActivityId);
        if (!activity) return;

        const hourHeight = 60;
        const timelineStartHour = 6;

        const newPixelTop = parseFloat(block.style.top);
        const newPixelHeight = parseFloat(block.style.height);

        // Convert new pixel values back to time
        let newStartHour = Math.floor(newPixelTop / hourHeight) + timelineStartHour;
        let newStartMinute = Math.round(((newPixelTop % hourHeight) / hourHeight) * 60 / 15) * 15; // Snap to 15 mins
        if (newStartMinute >= 60) {
            newStartHour++;
            newStartMinute = 0;
        }

        const durationMinutes = Math.round((newPixelHeight / hourHeight) * 60 / 15) * 15; // Snap duration to 15 mins
        let newEndHour = newStartHour;
        let newEndMinute = newStartMinute + durationMinutes;

        // Clamp end time to not exceed timeline boundary (e.g., 22:00 for a 6-22 timeline)
        // Max minutes from timeline start: (22 - timelineStartHour) * 60
        const maxTotalMinutes = (22 - timelineStartHour) * 60;
        let endTotalMinutes = (newEndHour - timelineStartHour) * 60 + newEndMinute;

        if (endTotalMinutes > maxTotalMinutes) {
            endTotalMinutes = maxTotalMinutes;
            newEndHour = Math.floor(endTotalMinutes / 60) + timelineStartHour;
            newEndMinute = endTotalMinutes % 60;
        }

        // Format as HH:MM
        const newStartTimeStr = `${String(newStartHour).padStart(2, '0')}:${String(newStartMinute).padStart(2, '0')}`;
        const newEndTimeStr = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;

        // Update activity (ensure date is preserved or set if it was a new drop)
        activity.date = activity.date || new Date().toISOString().split('T')[0]; // Ensure date exists
        activity.start = newStartTimeStr;
        activity.end = newEndTimeStr;

        // Re-enable dragging for the block
        block.setAttribute('draggable', 'true');

        console.log(`Resize ended for ID: ${resizingActivityId}. New time: ${activity.start} - ${activity.end}`);
        resizingActivityId = null;
        resizeHandleType = null;

        displayActivities(); // Re-render all to ensure consistency
        saveData();
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

        // Clamp end time to not exceed timeline boundary (e.g., 22:00 for a 6-22 timeline)
        // Max minutes from timeline start: (22 - timelineStartHour) * 60
        const maxTotalMinutes = (22 - timelineStartHour) * 60;
        let endTotalMinutes = (newEndHour - timelineStartHour) * 60 + newEndMinute;

        if (endTotalMinutes > maxTotalMinutes) {
            endTotalMinutes = maxTotalMinutes;
            newEndHour = Math.floor(endTotalMinutes / 60) + timelineStartHour;
            newEndMinute = endTotalMinutes % 60;
        }

        // Format as HH:MM
        const newStartTimeStr = `${String(newStartHour).padStart(2, '0')}:${String(newStartMinute).padStart(2, '0')}`;
        const newEndTimeStr = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;

        // Update activity (ensure date is preserved or set if it was a new drop)
        activity.date = activity.date || new Date().toISOString().split('T')[0]; // Ensure date exists
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

    // --- Current Time Indicator Functions ---
    function createCurrentTimeIndicator() {
        if (!timelineContainer) return;
        currentTimeIndicator = document.createElement('div');
        currentTimeIndicator.id = 'current-time-indicator';
        timelineContainer.appendChild(currentTimeIndicator);
        console.log("Current time indicator created.");
    }

    function updateCurrentTimeIndicator() {
        if (!currentTimeIndicator || !timelineContainer) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const hourHeight = 60; // Corresponds to .time-slot min-height in CSS
        const timelineStartHour = 6; // Timeline starts at 6 AM

        // Calculate top position
        // Only display if current time is within timeline range (6 AM to 10 PM / 22:00)
        if (currentHour >= timelineStartHour && currentHour < 22) {
            const topPosition = (currentHour - timelineStartHour + currentMinute / 60) * hourHeight;
            currentTimeIndicator.style.top = `${topPosition}px`;
            currentTimeIndicator.style.display = 'block'; // Make sure it's visible
        } else {
            currentTimeIndicator.style.display = 'none'; // Hide if outside range
        }
        // console.log("Current time indicator updated to:", currentTimeIndicator.style.top);
    }

    // --- Weekly Calendar Functions ---
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day
        return new Date(d.setDate(diff));
    }

    function formatDate(date, includeDayName = false) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        if (includeDayName) {
            options.weekday = 'short';
        }
        return date.toLocaleDateString('en-CA', options); // 'en-CA' gives YYYY-MM-DD like format parts
    }

    function renderWeeklyCalendar() {
        if (!weeklyCalendarGrid || !currentWeekDisplay) return;

        weeklyCalendarGrid.innerHTML = ''; // Clear previous week
        const weekStart = new Date(currentWeekStartDate);
        currentWeekDisplay.textContent = `Week of ${formatDate(weekStart)}`;

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dayDateString = dayDate.toISOString().split('T')[0];

            const dayCell = document.createElement('div');
            dayCell.classList.add('week-day-cell');
            dayCell.dataset.date = dayDateString;

            const dayHeader = document.createElement('h4');
            dayHeader.textContent = formatDate(dayDate, true); // e.g., "Mon, 2023-10-30"
            dayCell.appendChild(dayHeader);

            const activitiesForDay = activities.filter(act => act.date === dayDateString);
            const activitiesList = document.createElement('ul');
            activitiesForDay.forEach(act => {
                const actItem = document.createElement('li');
                actItem.textContent = `${act.start} - ${act.name}`;
                // Apply category color to weekly view items as well
                const categoryColor = activityCategories[act.category]?.color || activityCategories.none.color;
                actItem.style.backgroundColor = categoryColor;
                // Potentially adjust text color for better contrast if needed on category colors
                // For now, assuming the dark text on these colors is fine.

                if (act.done) {
                    actItem.classList.add('completed');
                }
                // Optional: Make these clickable to jump to the day on the timeline, or open a modal
                activitiesList.appendChild(actItem);
            });
            dayCell.appendChild(activitiesList);
            weeklyCalendarGrid.appendChild(dayCell);
        }
    }

    function changeWeek(direction) {
        const newDate = new Date(currentWeekStartDate);
        newDate.setDate(currentWeekStartDate.getDate() + (direction * 7));
        currentWeekStartDate = newDate;
        renderWeeklyCalendar();
    }

    // Event listeners for weekly calendar navigation
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => changeWeek(1));

    // --- Statistics Functions ---
    function updateDailyStats(todaysActivitiesArray) {
        if (!dailyStatsContainer) return;

        const totalToday = todaysActivitiesArray.length;
        const completedToday = todaysActivitiesArray.filter(act => act.done).length;

        if (totalToday === 0) {
            dailyStatsContainer.innerHTML = '<p>No activities scheduled for today.</p>';
        } else {
            dailyStatsContainer.innerHTML = `<p>Today's Progress: <strong>${completedToday}</strong> / <strong>${totalToday}</strong> activities completed.</p>`;
        }
    }

    // --- Helper to darken a hex color ---
    // (Could be expanded for more color types if needed)
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        R = Math.round(R)
        G = Math.round(G)
        B = Math.round(B)

        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }
}); 