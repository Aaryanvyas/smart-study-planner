'use strict';

// Application State
const state = {
    isStudying: false,
    timerInterval: null,
    currentTimer: 0,
    currentSubject: null,
    theme: localStorage.getItem('theme') || 'light',
    subjects: JSON.parse(localStorage.getItem('subjects')) || [],
    sessions: JSON.parse(localStorage.getItem('sessions')) || []
};

// DOM Elements
const dom = {
    themeToggle: document.getElementById('theme-toggle'),
    timerDisplay: document.getElementById('timer-display'),
    subjectSelect: document.getElementById('subject-select'),
    startTimerBtn: document.getElementById('start-timer'),
    pauseTimerBtn: document.getElementById('pause-timer'),
    stopTimerBtn: document.getElementById('stop-timer'),
    subjectsList: document.getElementById('subjects-list'),
    sessionsList: document.getElementById('sessions-list'),
    subjectForm: document.getElementById('subject-form'),
    subjectModal: document.getElementById('subject-modal')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSubjects();
    loadSessions();
    setupEventListeners();
    updateStats();
});

// Theme Management
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    dom.themeToggle.innerHTML = state.theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

dom.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    initTheme();
});

// Timer Functionality
function startTimer() {
    if (!state.currentSubject) {
        showToast('Please select a subject first!', 'warning');
        return;
    }

    state.isStudying = true;
    state.timerInterval = setInterval(() => {
        state.currentTimer++;
        updateTimerDisplay();
    }, 1000);

    toggleTimerButtons(true);
}

function pauseTimer() {
    state.isStudying = false;
    clearInterval(state.timerInterval);
    toggleTimerButtons(false);
}

function stopTimer() {
    pauseTimer();
    if (state.currentTimer > 0) {
        saveSession();
    }
    resetTimer();
    updateStats();
}

function updateTimerDisplay() {
    const hours = Math.floor(state.currentTimer / 3600);
    const minutes = Math.floor((state.currentTimer % 3600) / 60);
    const seconds = state.currentTimer % 60;
    dom.timerDisplay.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function resetTimer() {
    state.currentTimer = 0;
    updateTimerDisplay();
}

function toggleTimerButtons(running) {
    dom.startTimerBtn.disabled = running;
    dom.pauseTimerBtn.disabled = !running;
    dom.stopTimerBtn.disabled = !running;
}

// Session Management
function saveSession() {
    const session = {
        subject: state.currentSubject,
        duration: state.currentTimer,
        date: new Date().toISOString()
    };

    state.sessions.push(session);
    localStorage.setItem('sessions', JSON.stringify(state.sessions));
    showToast('Session saved successfully!', 'success');
    loadSessions();
}

function loadSessions() {
    dom.sessionsList.innerHTML = state.sessions.slice(-5).reverse().map(session => `
        <div class="session-item">
            <div class="session-info">
                <div class="subject-color" style="background-color: ${getSubjectColor(session.subject)}"></div>
                <div>
                    <div class="session-subject">${session.subject}</div>
                    <div class="session-duration">${formatDuration(session.duration)}</div>
                </div>
            </div>
            <div class="session-actions">
                <small>${new Date(session.date).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

// Subject Management
function loadSubjects() {
    dom.subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
        state.subjects.map(subject => `
            <option value="${subject.name}">${subject.name}</option>
        `).join('');

    dom.subjectsList.innerHTML = state.subjects.map(subject => `
        <div class="subject-item">
            <div class="subject-info">
                <div class="subject-color" style="background-color: ${subject.color}"></div>
                <div>
                    <div class="subject-name">${subject.name}</div>
                    <div class="subject-progress">
                        ${calculateSubjectProgress(subject.name)}/7h this week
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${calculateProgressWidth(subject.name)}%"></div>
                    </div>
                </div>
            </div>
            <div class="subject-actions">
                <button class="btn-sm btn-danger" onclick="deleteSubject('${subject.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function calculateSubjectProgress(subjectName) {
    const subjectSessions = state.sessions.filter(s => s.subject === subjectName);
    return Math.floor(subjectSessions.reduce((acc, curr) => acc + curr.duration, 0) / 3600);
}

function calculateProgressWidth(subjectName) {
    const progress = calculateSubjectProgress(subjectName);
    return Math.min((progress / 7) * 100, 100);
}

function deleteSubject(subjectName) {
    state.subjects = state.subjects.filter(sub => sub.name !== subjectName);
    localStorage.setItem('subjects', JSON.stringify(state.subjects));
    loadSubjects();
    showToast('Subject deleted successfully!', 'success');
}

// Event Handlers
function setupEventListeners() {
    dom.startTimerBtn.addEventListener('click', startTimer);
    dom.pauseTimerBtn.addEventListener('click', pauseTimer);
    dom.stopTimerBtn.addEventListener('click', stopTimer);
    
    document.getElementById('add-subject-btn').addEventListener('click', () => 
        dom.subjectModal.classList.add('show'));
    
    dom.subjectForm.addEventListener('submit', handleSubjectSubmit);
    
    dom.subjectSelect.addEventListener('change', (e) => {
        state.currentSubject = e.target.value;
    });

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('show');
        });
    });
}

function handleSubjectSubmit(e) {
    e.preventDefault();
    const subjectName = document.getElementById('subject-name').value;
    const subjectColor = document.getElementById('subject-color').value;

    state.subjects.push({
        name: subjectName,
        color: subjectColor,
        target: 7
    });

    localStorage.setItem('subjects', JSON.stringify(state.subjects));
    dom.subjectModal.classList.remove('show');
    loadSubjects();
    showToast('Subject added successfully!', 'success');
    e.target.reset();
}

// Utility Functions
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast show ${type}`;
    document.getElementById('toast-message').textContent = message;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getSubjectColor(subjectName) {
    const subject = state.subjects.find(sub => sub.name === subjectName);
    return subject ? subject.color : '#666';
}

// Statistics
function updateStats() {
    const totalSeconds = state.sessions.reduce((acc, curr) => acc + curr.duration, 0);
    document.getElementById('total-time').textContent = formatDuration(totalSeconds);
    document.getElementById('total-subjects').textContent = state.subjects.length;
    document.getElementById('study-streak').textContent = calculateStreak();
}

function calculateStreak() {
    if (state.sessions.length === 0) return 0;
    
    const dates = [...new Set(state.sessions
        .map(s => new Date(s.date).toDateString()))].sort();
    
    let streak = 1;
    let currentDate = new Date(dates[0]);
    
    for (let i = 1; i < dates.length; i++) {
        const nextDate = new Date(dates[i]);
        const diffDays = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) streak++;
        else if (diffDays > 1) streak = 1;
        
        currentDate = nextDate;
    }
    
    return streak;
}
