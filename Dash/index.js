// Global State Management
class WebhookManager {
    constructor() {
        this.webhooks = this.loadFromStorage('webhooks') || [];
        this.templates = this.loadFromStorage('templates') || [];
        this.schedules = this.loadFromStorage('schedules') || [];
        this.activities = this.loadFromStorage('activities') || [];
        this.settings = this.loadFromStorage('settings') || { theme: 'light' };
        
        this.currentEditingId = null;
        this.chart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.applyTheme();
        this.startScheduleChecker();
    }

    // Storage Management
    loadFromStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Error loading ${key} from storage:`, error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
            this.showNotification('Error saving data', 'error');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(link.getAttribute('data-tab'));
            });
        });

        // Theme Toggle
        document.getElementById('themeIcon').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal Controls
        this.setupModalControls();
        
        // Form Submissions
        this.setupFormHandlers();
        
        // Quick Actions
        this.setupQuickActions();
    }

    setupModalControls() {
        // Webhook Modal
        document.getElementById('newWebhookBtn').addEventListener('click', () => {
            this.openWebhookModal();
        });

        document.getElementById('addWebhookBtn').addEventListener('click', () => {
            this.openWebhookModal();
        });

        document.getElementById('cancelWebhook').addEventListener('click', () => {
            this.closeWebhookModal();
        });

        // Test Modal
        document.querySelector('[data-action="test-webhook"]').addEventListener('click', () => {
            this.openTestModal();
        });

        document.getElementById('cancelTest').addEventListener('click', () => {
            this.closeTestModal();
        });

        // Schedule Modal
        document.getElementById('newScheduleBtn').addEventListener('click', () => {
            this.openScheduleModal();
        });

        document.querySelector('[data-action="schedule-message"]').addEventListener('click', () => {
            this.openScheduleModal();
        });

        document.getElementById('cancelSchedule').addEventListener('click', () => {
            this.closeScheduleModal();
        });

        // Template Modal
        document.getElementById('newTemplateBtn').addEventListener('click', () => {
            this.openTemplateModal();
        });

        document.querySelector('[data-action="create-template"]').addEventListener('click', () => {
            this.openTemplateModal();
        });

        // Close modals on X click
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    setupFormHandlers() {
        // Webhook Form
        document.getElementById('webhookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWebhook();
        });

        // Test Form
        document.getElementById('testForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendTestMessage();
        });

        // Schedule Form
        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSchedule();
        });
    }

    setupQuickActions() {
        document.querySelector('[data-action="view-analytics"]').addEventListener('click', () => {
            this.switchTab('analytics');
        });
    }

    // Theme Management
    toggleTheme() {
        const themeIcon = document.getElementById('themeIcon');
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.settings.theme = newTheme;
        this.saveToStorage('settings', this.settings);
        this.applyTheme();
        
        themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.settings.theme);
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.className = this.settings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Tab Management
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'webhooks':
                this.loadWebhooks();
                break;
            case 'scheduler':
                this.loadSchedules();
                break;
            case 'templates':
                this.loadTemplates();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    // Dashboard
    loadDashboard() {
        this.updateStats();
        this.loadRecentActivity();
    }

    updateStats() {
        document.getElementById('totalWebhooks').textContent = this.webhooks.length;
        document.getElementById('activeSchedules').textContent = this.schedules.filter(s => s.active).length;
        
        const totalMessages = this.activities.filter(a => a.type === 'message_sent').length;
        document.getElementById('totalMessages').textContent = totalMessages;
        
        const failedMessages = this.activities.filter(a => a.type === 'message_failed').length;
        document.getElementById('failedMessages').textContent = failedMessages;
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        const recentActivities = this.activities.slice(-5).reverse();
        
        activityList.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityColor(type) {
        const colors = {
            'webhook_created': '#5865f2',
            'message_sent': '#57f287',
            'message_failed': '#ed4245',
            'schedule_created': '#fee75c',
            'template_created': '#eb459e'
        };
        return colors[type] || '#5865f2';
    }

    getActivityIcon(type) {
        const icons = {
            'webhook_created': 'fas fa-link',
            'message_sent': 'fas fa-paper-plane',
            'message_failed': 'fas fa-exclamation-triangle',
            'schedule_created': 'fas fa-clock',
            'template_created': 'fas fa-layer-group'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    // Webhook Management
    loadWebhooks() {
        const webhooksGrid = document.getElementById('webhooksGrid');
        
        if (this.webhooks.length === 0) {
            webhooksGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-link" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No Webhooks Yet</h3>
                    <p>Create your first webhook to get started</p>
                    <button class="btn btn-primary mt-2" onclick="app.openWebhookModal()">
                        <i class="fas fa-plus"></i> Create Webhook
                    </button>
                </div>
            `;
            return;
        }

        webhooksGrid.innerHTML = this.webhooks.map(webhook => `
            <div class="webhook-card">
                <div class="webhook-header">
                    <div class="webhook-info">
                        <h3>${this.escapeHtml(webhook.name)}</h3>
                        <p>${this.escapeHtml(webhook.description || 'No description')}</p>
                    </div>
                    <div class="webhook-status ${webhook.active ? '' : 'inactive'}">
                        <i class="fas fa-circle"></i>
                        ${webhook.active ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div class="webhook-actions">
                    <button class="btn btn-primary btn-sm" onclick="app.testWebhook('${webhook.id}')">
                        <i class="fas fa-bolt"></i> Test
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="app.editWebhook('${webhook.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteWebhook('${webhook.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    openWebhookModal(webhookId = null) {
        const modal = document.getElementById('webhookModal');
        const form = document.getElementById('webhookForm');
        const title = document.getElementById('webhookModalTitle');
        
        this.currentEditingId = webhookId;
        
        if (webhookId) {
            // Edit mode
            title.textContent = 'Edit Webhook';
            const webhook = this.webhooks.find(w => w.id === webhookId);
            if (webhook) {
                document.getElementById('webhookName').value = webhook.name;
                document.getElementById('webhookUrl').value = webhook.url;
                document.getElementById('webhookDescription').value = webhook.description || '';
                document.getElementById('webhookAvatar').value = webhook.avatar || '';
                document.getElementById('webhookUsername').value = webhook.username || '';
            }
        } else {
            // Create mode
            title.textContent = 'Add New Webhook';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeWebhookModal() {
        document.getElementById('webhookModal').style.display = 'none';
        this.currentEditingId = null;
    }

    saveWebhook() {
        const formData = {
            name: document.getElementById('webhookName').value.trim(),
            url: document.getElementById('webhookUrl').value.trim(),
            description: document.getElementById('webhookDescription').value.trim(),
            avatar: document.getElementById('webhookAvatar').value.trim(),
            username: document.getElementById('webhookUsername').value.trim(),
            active: true
        };

        // Basic validation
        if (!formData.name || !formData.url) {
            this.showNotification('Name and URL are required', 'error');
            return;
        }

        if (!this.isValidWebhookUrl(formData.url)) {
            this.showNotification('Please enter a valid Discord webhook URL', 'error');
            return;
        }

        if (this.currentEditingId) {
            // Update existing webhook
            const index = this.webhooks.findIndex(w => w.id === this.currentEditingId);
            if (index !== -1) {
                this.webhooks[index] = { ...this.webhooks[index], ...formData };
                this.addActivity('webhook_updated', `Updated webhook "${formData.name}"`);
            }
        } else {
            // Create new webhook
            const newWebhook = {
                id: this.generateId(),
                ...formData,
                created: new Date().toISOString()
            };
            this.webhooks.push(newWebhook);
            this.addActivity('webhook_created', `Created webhook "${formData.name}"`);
        }

        this.saveToStorage('webhooks', this.webhooks);
        this.closeWebhookModal();
        this.loadWebhooks();
        this.updateStats();
        this.showNotification('Webhook saved successfully!', 'success');
    }

    editWebhook(webhookId) {
        this.openWebhookModal(webhookId);
    }

    deleteWebhook(webhookId) {
        if (confirm('Are you sure you want to delete this webhook?')) {
            const webhook = this.webhooks.find(w => w.id === webhookId);
            this.webhooks = this.webhooks.filter(w => w.id !== webhookId);
            this.saveToStorage('webhooks', this.webhooks);
            this.addActivity('webhook_deleted', `Deleted webhook "${webhook.name}"`);
            this.loadWebhooks();
            this.updateStats();
            this.showNotification('Webhook deleted successfully!', 'success');
        }
    }

    // Test Webhook
    openTestModal() {
        const modal = document.getElementById('testModal');
        const select = document.getElementById('testWebhookSelect');
        
        // Populate webhook dropdown
        select.innerHTML = '<option value="">Choose a webhook...</option>' +
            this.webhooks.map(webhook => `
                <option value="${webhook.id}">${this.escapeHtml(webhook.name)}</option>
            `).join('');
        
        modal.style.display = 'block';
    }

    closeTestModal() {
        document.getElementById('testModal').style.display = 'none';
    }

    async sendTestMessage() {
        const webhookId = document.getElementById('testWebhookSelect').value;
        const message = document.getElementById('testMessage').value;
        const useEmbed = document.getElementById('testUseEmbed').checked;

        if (!webhookId || !message) {
            this.showNotification('Please select a webhook and enter a message', 'error');
            return;
        }

        const webhook = this.webhooks.find(w => w.id === webhookId);
        if (!webhook) {
            this.showNotification('Webhook not found', 'error');
            return;
        }

        try {
            this.showNotification('Sending test message...', 'info');
            
            const payload = useEmbed ? {
                embeds: [{
                    title: "Test Message",
                    description: message,
                    color: 5814783,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: "Sent from Webhook Manager"
                    }
                }]
            } : {
                content: message
            };

            // Add custom username and avatar if specified
            if (webhook.username) payload.username = webhook.username;
            if (webhook.avatar) payload.avatar_url = webhook.avatar;

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                this.addActivity('message_sent', `Test message sent via "${webhook.name}"`);
                this.showNotification('Test message sent successfully!', 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.addActivity('message_failed', `Failed to send test message via "${webhook.name}"`);
            this.showNotification('Failed to send test message: ' + error.message, 'error');
        }

        this.closeTestModal();
        this.updateStats();
    }

    testWebhook(webhookId) {
        this.openTestModal();
        document.getElementById('testWebhookSelect').value = webhookId;
    }

    // Schedule Management
    loadSchedules() {
        const schedulesList = document.getElementById('schedulesList');
        
        if (this.schedules.length === 0) {
            schedulesList.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-clock" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No Scheduled Messages</h3>
                    <p>Schedule your first message to get started</p>
                    <button class="btn btn-primary mt-2" onclick="app.openScheduleModal()">
                        <i class="fas fa-plus"></i> Schedule Message
                    </button>
                </div>
            `;
            return;
        }

        schedulesList.innerHTML = this.schedules.map(schedule => {
            const webhook = this.webhooks.find(w => w.id === schedule.webhookId);
            return `
                <div class="schedule-item">
                    <div class="schedule-info">
                        <h4>${this.escapeHtml(schedule.name)}</h4>
                        <div class="schedule-meta">
                            <span><i class="fas fa-link"></i> ${webhook ? webhook.name : 'Unknown Webhook'}</span>
                            <span><i class="fas fa-clock"></i> ${this.formatDateTime(schedule.scheduleTime)}</span>
                            <span><i class="fas fa-redo"></i> ${schedule.repeat}</span>
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn btn-secondary btn-sm" onclick="app.toggleSchedule('${schedule.id}')">
                            <i class="fas ${schedule.active ? 'fa-pause' : 'fa-play'}"></i>
                            ${schedule.active ? 'Pause' : 'Resume'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteSchedule('${schedule.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openScheduleModal() {
        const modal = document.getElementById('scheduleModal');
        const select = document.getElementById('scheduleWebhook');
        
        // Populate webhook dropdown
        select.innerHTML = '<option value="">Select webhook...</option>' +
            this.webhooks.map(webhook => `
                <option value="${webhook.id}">${this.escapeHtml(webhook.name)}</option>
            `).join('');
        
        // Set minimum datetime to current time
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // At least 1 minute in future
        document.getElementById('scheduleDate').min = now.toISOString().slice(0, 16);
        
        modal.style.display = 'block';
    }

    closeScheduleModal() {
        document.getElementById('scheduleModal').style.display = 'none';
    }

    saveSchedule() {
        const formData = {
            webhookId: document.getElementById('scheduleWebhook').value,
            message: document.getElementById('scheduleMessage').value,
            scheduleTime: document.getElementById('scheduleDate').value,
            repeat: document.getElementById('scheduleRepeat').value,
            name: `Scheduled: ${document.getElementById('scheduleMessage').value.substring(0, 30)}...`,
            active: true
        };

        if (!formData.webhookId || !formData.message || !formData.scheduleTime) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }

        const schedule = {
            id: this.generateId(),
            ...formData,
            created: new Date().toISOString()
        };

        this.schedules.push(schedule);
        this.saveToStorage('schedules', this.schedules);
        this.addActivity('schedule_created', `Created schedule "${schedule.name}"`);
        this.closeScheduleModal();
        this.loadSchedules();
        this.updateStats();
        this.showNotification('Message scheduled successfully!', 'success');
    }

    toggleSchedule(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (schedule) {
            schedule.active = !schedule.active;
            this.saveToStorage('schedules', this.schedules);
            this.loadSchedules();
            this.showNotification(`Schedule ${schedule.active ? 'activated' : 'paused'}`, 'success');
        }
    }

    deleteSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this schedule?')) {
            this.schedules = this.schedules.filter(s => s.id !== scheduleId);
            this.saveToStorage('schedules', this.schedules);
            this.loadSchedules();
            this.updateStats();
            this.showNotification('Schedule deleted successfully!', 'success');
        }
    }

    startScheduleChecker() {
        setInterval(() => {
            const now = new Date();
            this.schedules.forEach(schedule => {
                if (schedule.active && new Date(schedule.scheduleTime) <= now) {
                    this.executeSchedule(schedule);
                }
            });
        }, 60000); // Check every minute
    }

    async executeSchedule(schedule) {
        const webhook = this.webhooks.find(w => w.id === schedule.webhookId);
        if (!webhook) return;

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: schedule.message
                })
            });

            if (response.ok) {
                this.addActivity('message_sent', `Scheduled message sent via "${webhook.name}"`);
                
                // Handle repetition
                if (schedule.repeat !== 'once') {
                    const nextTime = this.calculateNextSchedule(schedule);
                    if (nextTime) {
                        schedule.scheduleTime = nextTime.toISOString();
                        this.saveToStorage('schedules', this.schedules);
                    }
                } else {
                    // Remove one-time schedules after execution
                    this.schedules = this.schedules.filter(s => s.id !== schedule.id);
                    this.saveToStorage('schedules', this.schedules);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.addActivity('message_failed', `Failed to send scheduled message via "${webhook.name}"`);
        }

        this.updateStats();
        this.loadSchedules();
    }

    calculateNextSchedule(schedule) {
        const current = new Date(schedule.scheduleTime);
        switch (schedule.repeat) {
            case 'daily':
                return new Date(current.setDate(current.getDate() + 1));
            case 'weekly':
                return new Date(current.setDate(current.getDate() + 7));
            case 'monthly':
                return new Date(current.setMonth(current.getMonth() + 1));
            default:
                return null;
        }
    }

    // Template Management
    loadTemplates() {
        const templatesGrid = document.getElementById('templatesGrid');
        
        if (this.templates.length === 0) {
            templatesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-layer-group" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No Templates Yet</h3>
                    <p>Create your first template to get started</p>
                    <button class="btn btn-primary mt-2" onclick="app.openTemplateModal()">
                        <i class="fas fa-plus"></i> Create Template
                    </button>
                </div>
            `;
            return;
        }

        templatesGrid.innerHTML = this.templates.map(template => `
            <div class="template-card" onclick="app.useTemplate('${template.id}')">
                <h4>${this.escapeHtml(template.name)}</h4>
                <div class="template-content">${this.escapeHtml(template.content)}</div>
                <div class="template-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.useTemplate('${template.id}')">
                        <i class="fas fa-paper-plane"></i> Use
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); app.deleteTemplate('${template.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    openTemplateModal() {
        // Simple template creation - in a full app, this would be a modal
        const name = prompt('Enter template name:');
        if (!name) return;

        const content = prompt('Enter template content:');
        if (!content) return;

        const template = {
            id: this.generateId(),
            name: name,
            content: content,
            created: new Date().toISOString()
        };

        this.templates.push(template);
        this.saveToStorage('templates', this.templates);
        this.addActivity('template_created', `Created template "${name}"`);
        this.loadTemplates();
        this.showNotification('Template created successfully!', 'success');
    }

    useTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            this.openTestModal();
            setTimeout(() => {
                document.getElementById('testMessage').value = template.content;
            }, 100);
        }
    }

    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            const template = this.templates.find(t => t.id === templateId);
            this.templates = this.templates.filter(t => t.id !== templateId);
            this.saveToStorage('templates', this.templates);
            this.addActivity('template_deleted', `Deleted template "${template.name}"`);
            this.loadTemplates();
            this.showNotification('Template deleted successfully!', 'success');
        }
    }

    // Analytics
    loadAnalytics() {
        this.updateAnalyticsStats();
        this.renderChart();
    }

    updateAnalyticsStats() {
        const totalMessages = this.activities.filter(a => a.type === 'message_sent').length;
        const failedMessages = this.activities.filter(a => a.type === 'message_failed').length;
        const successRate = totalMessages > 0 ? ((totalMessages - failedMessages) / totalMessages * 100).toFixed(1) : 100;

        document.getElementById('successRate').textContent = `${successRate}%`;
        document.getElementById('analyticsTotalWebhooks').textContent = this.webhooks.length;
        
        // Calculate average response time (mock data for demo)
        document.getElementById('avgResponseTime').textContent = '~150ms';
    }

    renderChart() {
        const ctx = document.getElementById('messageChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        // Generate sample data for the last 7 days
        const labels = [];
        const successData = [];
        const failureData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
            
            // Mock data - in real app, this would come from actual logs
            successData.push(Math.floor(Math.random() * 20) + 5);
            failureData.push(Math.floor(Math.random() * 5));
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Successful',
                        data: successData,
                        backgroundColor: '#57f287',
                        borderColor: '#57f287',
                        borderWidth: 1
                    },
                    {
                        label: 'Failed',
                        data: failureData,
                        backgroundColor: '#ed4245',
                        borderColor: '#ed4245',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Message Delivery History (Last 7 Days)'
                    }
                }
            }
        });
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    isValidWebhookUrl(url) {
        return url.startsWith('https://discord.com/api/webhooks/');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    formatDateTime(datetimeString) {
        const date = new Date(datetimeString);
        return date.toLocaleString();
    }

    addActivity(type, message) {
        const activity = {
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        };
        this.activities.push(activity);
        
        // Keep only last 100 activities
        if (this.activities.length > 100) {
            this.activities = this.activities.slice(-100);
        }
        
        this.saveToStorage('activities', this.activities);
        
        // Update UI if on dashboard
        if (document.getElementById('dashboard').classList.contains('active')) {
            this.loadRecentActivity();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        const iconEl = notification.querySelector('.notification-icon');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        iconEl.className = icons[type] || icons.info;
        messageEl.textContent = message;
        
        // Set type class
        notification.className = `notification ${type} show`;
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

// Initialize the application
const app = new WebhookManager();

// Make app globally available for onclick handlers
window.app = app;
