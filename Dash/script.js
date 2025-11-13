/**
 * Discord Webhook Manager Pro - Enterprise JavaScript Application
 * Version: 2.1.0
 * Features: Advanced state management, real-time updates, error handling, performance optimization
 */

// ===== MAIN APPLICATION CLASS =====
class WebhookManagerPro {
    constructor() {
        this.version = '2.1.0';
        this.isInitialized = false;
        this.isOnline = true;
        
        // State Management
        this.state = {
            webhooks: [],
            templates: [],
            schedules: [],
            activities: [],
            settings: this.getDefaultSettings(),
            ui: this.getDefaultUIState(),
            analytics: this.getDefaultAnalytics()
        };
        
        // Services
        this.services = {
            storage: new StorageService(),
            api: new APIService(),
            analytics: new AnalyticsService(),
            validation: new ValidationService(),
            notification: new NotificationService(),
            scheduler: new SchedulerService(),
            formatter: new FormatterService()
        };
        
        // Components
        this.components = {};
        
        // Event System
        this.events = new EventEmitter();
        
        this.init();
    }

    // ===== INITIALIZATION =====
    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize services
            await this.initializeServices();
            
            // Load application state
            await this.loadApplicationState();
            
            // Initialize components
            await this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start background services
            this.startBackgroundServices();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            
            this.log('Application initialized successfully', 'success');
            
            // Show welcome tour for first-time users
            if (this.isFirstVisit()) {
                setTimeout(() => this.showWelcomeTour(), 1000);
            }
            
        } catch (error) {
            this.handleCriticalError(error);
        }
    }

    async initializeServices() {
        // Initialize storage service
        await this.services.storage.init();
        
        // Initialize analytics service
        await this.services.analytics.init();
        
        // Initialize scheduler service
        await this.services.scheduler.init(this.handleScheduledTask.bind(this));
        
        // Check online status
        this.checkOnlineStatus();
        
        // Set up online/offline detection
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }

    async initializeComponents() {
        // Initialize UI components
        this.components = {
            navigation: new NavigationComponent(this),
            modals: new ModalComponent(this),
            forms: new FormComponent(this),
            tables: new TableComponent(this),
            charts: new ChartComponent(this),
            search: new SearchComponent(this),
            notifications: new NotificationComponent(this),
            tour: new TourComponent(this)
        };
        
        // Initialize tab components
        this.components.dashboard = new DashboardComponent(this);
        this.components.webhooks = new WebhookComponent(this);
        this.components.messages = new MessageComponent(this);
        this.components.scheduler = new SchedulerComponent(this);
        this.components.templates = new TemplateComponent(this);
        this.components.analytics = new AnalyticsComponent(this);
        this.components.settings = new SettingsComponent(this);
        
        // Initialize all components
        for (const [name, component] of Object.entries(this.components)) {
            if (typeof component.init === 'function') {
                await component.init();
            }
        }
    }

    // ===== STATE MANAGEMENT =====
    getDefaultSettings() {
        return {
            theme: 'auto',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateFormat: 'relative',
            notifications: {
                enabled: true,
                sound: true,
                desktop: false
            },
            security: {
                autoLock: false,
                lockTimeout: 30
            },
            performance: {
                cacheEnabled: true,
                realTimeUpdates: true,
                analytics: true
            },
            appearance: {
                compactMode: false,
                highContrast: false,
                reducedMotion: false
            }
        };
    }

    getDefaultUIState() {
        return {
            currentTab: 'dashboard',
            sidebarOpen: true,
            mobileMenuOpen: false,
            modals: {
                open: [],
                history: []
            },
            selections: {
                webhooks: new Set(),
                templates: new Set(),
                schedules: new Set()
            },
            filters: {
                webhooks: {},
                messages: {},
                schedules: {}
            },
            search: {
                query: '',
                results: [],
                active: false
            },
            loading: {
                global: false,
                components: new Set()
            }
        };
    }

    getDefaultAnalytics() {
        return {
            messages: {
                total: 0,
                successful: 0,
                failed: 0,
                today: 0
            },
            performance: {
                averageResponseTime: 0,
                successRate: 100,
                uptime: 100
            },
            usage: {
                webhooks: 0,
                templates: 0,
                schedules: 0,
                storage: 0
            }
        };
    }

    async loadApplicationState() {
        try {
            // Load settings
            const settings = await this.services.storage.get('settings');
            if (settings) {
                this.state.settings = { ...this.state.settings, ...settings };
            }
            
            // Load webhooks
            const webhooks = await this.services.storage.get('webhooks');
            if (webhooks) {
                this.state.webhooks = webhooks;
            }
            
            // Load templates
            const templates = await this.services.storage.get('templates');
            if (templates) {
                this.state.templates = templates;
            }
            
            // Load schedules
            const schedules = await this.services.storage.get('schedules');
            if (schedules) {
                this.state.schedules = schedules;
                this.services.scheduler.loadSchedules(schedules);
            }
            
            // Load activities
            const activities = await this.services.storage.get('activities');
            if (activities) {
                this.state.activities = activities.slice(-100); // Keep only last 100
            }
            
            // Apply settings
            this.applySettings();
            
        } catch (error) {
            this.log('Error loading application state', 'error', error);
            throw error;
        }
    }

    async saveApplicationState() {
        try {
            const savePromises = [
                this.services.storage.set('settings', this.state.settings),
                this.services.storage.set('webhooks', this.state.webhooks),
                this.services.storage.set('templates', this.state.templates),
                this.services.storage.set('schedules', this.state.schedules),
                this.services.storage.set('activities', this.state.activities.slice(-100))
            ];
            
            await Promise.all(savePromises);
            
        } catch (error) {
            this.log('Error saving application state', 'error', error);
            throw error;
        }
    }

    // ===== EVENT SYSTEM =====
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        
        // Online/offline events
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // Before unload event
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Visibility change event
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Custom events
        this.events.on('webhook:created', this.handleWebhookCreated.bind(this));
        this.events.on('webhook:updated', this.handleWebhookUpdated.bind(this));
        this.events.on('webhook:deleted', this.handleWebhookDeleted.bind(this));
        this.events.on('message:sent', this.handleMessageSent.bind(this));
        this.events.on('message:failed', this.handleMessageFailed.bind(this));
        this.events.on('schedule:executed', this.handleScheduleExecuted.bind(this));
        this.events.on('settings:changed', this.handleSettingsChanged.bind(this));
        this.events.on('error:occurred', this.handleErrorOccurred.bind(this));
    }

    handleGlobalKeydown(event) {
        // Ctrl/Cmd + K for search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.components.search.focus();
        }
        
        // Escape key
        if (event.key === 'Escape') {
            this.handleEscapeKey();
        }
        
        // Number keys for quick tab switching
        if (event.altKey && event.key >= '1' && event.key <= '7') {
            event.preventDefault();
            this.switchToTabByIndex(parseInt(event.key) - 1);
        }
    }

    handleOnlineStatusChange(online) {
        this.isOnline = online;
        
        if (online) {
            this.services.notification.show('You are back online', 'success');
            this.syncOfflineData();
        } else {
            this.services.notification.show('You are offline - some features may be limited', 'warning');
        }
        
        this.events.emit('connection:changed', { online });
    }

    // ===== WEBHOOK MANAGEMENT =====
    async createWebhook(webhookData) {
        this.setLoading('webhooks', true);
        
        try {
            // Validate webhook data
            const validation = this.services.validation.validateWebhook(webhookData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Create webhook object
            const webhook = {
                id: this.generateId(),
                ...webhookData,
                status: 'active',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                stats: {
                    totalMessages: 0,
                    successfulMessages: 0,
                    failedMessages: 0,
                    lastUsed: null,
                    averageResponseTime: 0
                },
                metadata: {
                    rateLimit: null,
                    lastChecked: null,
                    health: 'unknown'
                }
            };
            
            // Test webhook if online
            if (this.isOnline) {
                await this.testWebhookConnection(webhook);
            }
            
            // Add to state
            this.state.webhooks.push(webhook);
            
            // Save state
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('webhook:created', { webhook });
            
            // Log activity
            this.logActivity('webhook_created', `Created webhook "${webhook.name}"`);
            
            // Show notification
            this.services.notification.show('Webhook created successfully', 'success');
            
            return webhook;
            
        } catch (error) {
            this.log('Error creating webhook', 'error', error);
            this.services.notification.show(`Failed to create webhook: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('webhooks', false);
        }
    }

    async updateWebhook(webhookId, updates) {
        this.setLoading('webhooks', true);
        
        try {
            const webhookIndex = this.state.webhooks.findIndex(w => w.id === webhookId);
            if (webhookIndex === -1) {
                throw new Error('Webhook not found');
            }
            
            const currentWebhook = this.state.webhooks[webhookIndex];
            const updatedWebhook = {
                ...currentWebhook,
                ...updates,
                updated: new Date().toISOString()
            };
            
            // Validate if URL changed
            if (updates.url && updates.url !== currentWebhook.url) {
                const validation = this.services.validation.validateWebhook(updatedWebhook);
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
                
                // Test new URL if online
                if (this.isOnline) {
                    await this.testWebhookConnection(updatedWebhook);
                }
            }
            
            // Update state
            this.state.webhooks[webhookIndex] = updatedWebhook;
            
            // Save state
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('webhook:updated', { 
                oldWebhook: currentWebhook, 
                newWebhook: updatedWebhook 
            });
            
            // Log activity
            this.logActivity('webhook_updated', `Updated webhook "${updatedWebhook.name}"`);
            
            // Show notification
            this.services.notification.show('Webhook updated successfully', 'success');
            
            return updatedWebhook;
            
        } catch (error) {
            this.log('Error updating webhook', 'error', error);
            this.services.notification.show(`Failed to update webhook: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('webhooks', false);
        }
    }

    async deleteWebhook(webhookId) {
        this.setLoading('webhooks', true);
        
        try {
            const webhookIndex = this.state.webhooks.findIndex(w => w.id === webhookId);
            if (webhookIndex === -1) {
                throw new Error('Webhook not found');
            }
            
            const webhook = this.state.webhooks[webhookIndex];
            
            // Remove from state
            this.state.webhooks.splice(webhookIndex, 1);
            
            // Remove any selections
            this.state.ui.selections.webhooks.delete(webhookId);
            
            // Remove related schedules
            this.state.schedules = this.state.schedules.filter(s => s.webhookId !== webhookId);
            
            // Save state
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('webhook:deleted', { webhook });
            
            // Log activity
            this.logActivity('webhook_deleted', `Deleted webhook "${webhook.name}"`);
            
            // Show notification
            this.services.notification.show('Webhook deleted successfully', 'success');
            
        } catch (error) {
            this.log('Error deleting webhook', 'error', error);
            this.services.notification.show(`Failed to delete webhook: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('webhooks', false);
        }
    }

    async testWebhook(webhookId, messageData = null) {
        this.setLoading('webhook-test', true);
        
        try {
            const webhook = this.state.webhooks.find(w => w.id === webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            
            if (!this.isOnline) {
                throw new Error('Cannot test webhook while offline');
            }
            
            const testMessage = messageData || {
                content: 'This is a test message from Webhook Manager Pro!',
                embeds: [{
                    title: 'Test Embed',
                    description: 'If you can see this, your webhook is working correctly!',
                    color: 5814783,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Webhook Manager Pro'
                    }
                }]
            };
            
            const startTime = performance.now();
            
            const response = await this.sendDiscordWebhook(webhook.url, testMessage);
            
            const responseTime = performance.now() - startTime;
            
            // Update webhook stats
            await this.updateWebhookStats(webhookId, {
                success: true,
                responseTime
            });
            
            // Log activity
            this.logActivity('webhook_tested', `Tested webhook "${webhook.name}" - ${Math.round(responseTime)}ms`);
            
            // Show notification
            this.services.notification.show(`Webhook test successful! (${Math.round(responseTime)}ms)`, 'success');
            
            return {
                success: true,
                responseTime,
                response
            };
            
        } catch (error) {
            this.log('Error testing webhook', 'error', error);
            
            // Update webhook stats
            if (webhookId) {
                await this.updateWebhookStats(webhookId, {
                    success: false,
                    responseTime: 0
                });
            }
            
            this.services.notification.show(`Webhook test failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('webhook-test', false);
        }
    }

    async sendDiscordWebhook(url, data) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - webhook took too long to respond');
            }
            throw error;
        }
    }

    // ===== MESSAGE MANAGEMENT =====
    async sendMessage(webhookId, messageData, options = {}) {
        this.setLoading('message-send', true);
        
        try {
            const webhook = this.state.webhooks.find(w => w.id === webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            
            if (webhook.status !== 'active') {
                throw new Error('Webhook is not active');
            }
            
            if (!this.isOnline) {
                throw new Error('Cannot send message while offline');
            }
            
            const startTime = performance.now();
            
            const response = await this.sendDiscordWebhook(webhook.url, messageData);
            
            const responseTime = performance.now() - startTime;
            
            // Update webhook stats
            await this.updateWebhookStats(webhookId, {
                success: true,
                responseTime
            });
            
            // Log activity
            this.logActivity('message_sent', `Sent message via "${webhook.name}"`);
            
            // Emit event
            this.events.emit('message:sent', {
                webhookId,
                messageData,
                responseTime,
                response
            });
            
            // Show notification
            this.services.notification.show('Message sent successfully!', 'success');
            
            return {
                success: true,
                responseTime,
                response
            };
            
        } catch (error) {
            this.log('Error sending message', 'error', error);
            
            // Update webhook stats
            if (webhookId) {
                await this.updateWebhookStats(webhookId, {
                    success: false,
                    responseTime: 0
                });
            }
            
            // Emit event
            this.events.emit('message:failed', {
                webhookId,
                messageData,
                error: error.message
            });
            
            this.services.notification.show(`Failed to send message: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('message-send', false);
        }
    }

    // ===== SCHEDULER MANAGEMENT =====
    async createSchedule(scheduleData) {
        this.setLoading('schedules', true);
        
        try {
            // Validate schedule data
            const validation = this.services.validation.validateSchedule(scheduleData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Create schedule object
            const schedule = {
                id: this.generateId(),
                ...scheduleData,
                status: 'active',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                nextExecution: this.calculateNextExecution(scheduleData),
                stats: {
                    totalExecutions: 0,
                    successfulExecutions: 0,
                    failedExecutions: 0,
                    lastExecution: null
                }
            };
            
            // Add to state
            this.state.schedules.push(schedule);
            
            // Add to scheduler service
            this.services.scheduler.addSchedule(schedule);
            
            // Save state
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('schedule:created', { schedule });
            
            // Log activity
            this.logActivity('schedule_created', `Created schedule "${schedule.name}"`);
            
            // Show notification
            this.services.notification.show('Schedule created successfully', 'success');
            
            return schedule;
            
        } catch (error) {
            this.log('Error creating schedule', 'error', error);
            this.services.notification.show(`Failed to create schedule: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('schedules', false);
        }
    }

    async handleScheduledTask(schedule) {
        try {
            const webhook = this.state.webhooks.find(w => w.id === schedule.webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            
            if (webhook.status !== 'active') {
                throw new Error('Webhook is not active');
            }
            
            const startTime = performance.now();
            
            const response = await this.sendDiscordWebhook(webhook.url, schedule.messageData);
            
            const responseTime = performance.now() - startTime;
            
            // Update schedule stats
            await this.updateScheduleStats(schedule.id, {
                success: true,
                responseTime
            });
            
            // Update webhook stats
            await this.updateWebhookStats(webhook.id, {
                success: true,
                responseTime
            });
            
            // Log activity
            this.logActivity('schedule_executed', `Executed schedule "${schedule.name}"`);
            
            // Emit event
            this.events.emit('schedule:executed', {
                schedule,
                responseTime,
                response
            });
            
        } catch (error) {
            this.log('Error executing scheduled task', 'error', error);
            
            // Update schedule stats
            await this.updateScheduleStats(schedule.id, {
                success: false,
                responseTime: 0
            });
            
            // Emit event
            this.events.emit('schedule:failed', {
                schedule,
                error: error.message
            });
        }
    }

    // ===== TEMPLATE MANAGEMENT =====
    async createTemplate(templateData) {
        this.setLoading('templates', true);
        
        try {
            // Validate template data
            const validation = this.services.validation.validateTemplate(templateData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Create template object
            const template = {
                id: this.generateId(),
                ...templateData,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                usageCount: 0
            };
            
            // Add to state
            this.state.templates.push(template);
            
            // Save state
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('template:created', { template });
            
            // Log activity
            this.logActivity('template_created', `Created template "${template.name}"`);
            
            // Show notification
            this.services.notification.show('Template created successfully', 'success');
            
            return template;
            
        } catch (error) {
            this.log('Error creating template', 'error', error);
            this.services.notification.show(`Failed to create template: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading('templates', false);
        }
    }

    // ===== UTILITY METHODS =====
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    setLoading(component, loading) {
        if (loading) {
            this.state.ui.loading.components.add(component);
        } else {
            this.state.ui.loading.components.delete(component);
        }
        
        this.state.ui.loading.global = this.state.ui.loading.components.size > 0;
        
        this.updateLoadingUI();
    }

    updateLoadingUI() {
        const loadingOverlay = document.getElementById('globalLoading');
        if (loadingOverlay) {
            if (this.state.ui.loading.global) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }
    }

    log(message, level = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        console[level](`[${timestamp}] ${message}`, data || '');
        
        // Send to analytics service
        if (this.services.analytics) {
            this.services.analytics.track('log', { level, message });
        }
    }

    logActivity(type, message, metadata = {}) {
        const activity = {
            id: this.generateId(),
            type,
            message,
            timestamp: new Date().toISOString(),
            metadata
        };
        
        this.state.activities.push(activity);
        
        // Keep only last 100 activities
        if (this.state.activities.length > 100) {
            this.state.activities = this.state.activities.slice(-100);
        }
        
        // Emit event
        this.events.emit('activity:logged', { activity });
        
        // Save state (debounced)
        this.debouncedSave();
    }

    debouncedSave = this.debounce(() => {
        this.saveApplicationState().catch(error => {
            this.log('Error in debounced save', 'error', error);
        });
    }, 1000);

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== UI MANAGEMENT =====
    switchTab(tabName) {
        if (this.state.ui.currentTab === tabName) return;
        
        const oldTab = this.state.ui.currentTab;
        this.state.ui.currentTab = tabName;
        
        // Emit event
        this.events.emit('tab:changed', { oldTab, newTab: tabName });
        
        // Update UI
        this.updateTabUI();
    }

    updateTabUI() {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show current tab content
        const currentTabContent = document.getElementById(this.state.ui.currentTab);
        if (currentTabContent) {
            currentTabContent.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const currentNavLink = document.querySelector(`[data-tab="${this.state.ui.currentTab}"]`);
        if (currentNavLink) {
            currentNavLink.classList.add('active');
        }
    }

    // ===== SETTINGS MANAGEMENT =====
    async updateSettings(updates) {
        try {
            const oldSettings = { ...this.state.settings };
            this.state.settings = { ...this.state.settings, ...updates };
            
            // Apply settings changes
            this.applySettings();
            
            // Save settings
            await this.saveApplicationState();
            
            // Emit event
            this.events.emit('settings:changed', { 
                oldSettings, 
                newSettings: this.state.settings 
            });
            
            // Show notification
            this.services.notification.show('Settings updated successfully', 'success');
            
        } catch (error) {
            this.log('Error updating settings', 'error', error);
            this.services.notification.show(`Failed to update settings: ${error.message}`, 'error');
            throw error;
        }
    }

    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.state.settings.theme);
        
        // Apply reduced motion
        if (this.state.settings.appearance.reducedMotion) {
            document.documentElement.style.setProperty('--transition', '0s');
        } else {
            document.documentElement.style.removeProperty('--transition');
        }
        
        // Apply high contrast
        if (this.state.settings.appearance.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        
        // Apply compact mode
        if (this.state.settings.appearance.compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
    }

    // ===== ERROR HANDLING =====
    handleCriticalError(error) {
        this.log('Critical error occurred', 'error', error);
        
        // Show error boundary
        this.showErrorBoundary(error);
        
        // Send error to analytics
        if (this.services.analytics) {
            this.services.analytics.track('error', {
                message: error.message,
                stack: error.stack,
                context: 'critical'
            });
        }
    }

    showErrorBoundary(error) {
        const errorBoundary = document.getElementById('errorBoundary');
        if (errorBoundary) {
            errorBoundary.classList.add('active');
            
            const errorMessage = errorBoundary.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = error.message;
            }
        }
        
        // Hide loading screen
        this.hideLoadingScreen();
    }

    // ===== LOADING SCREEN =====
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.classList.remove('active', 'fade-out');
            }, 500);
        }
    }

    // ===== WELCOME TOUR =====
    isFirstVisit() {
        return !this.services.storage.get('hasVisitedBefore');
    }

    showWelcomeTour() {
        if (this.components.tour) {
            this.components.tour.start();
            
            // Mark as visited
            this.services.storage.set('hasVisitedBefore', true);
        }
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    startBackgroundServices() {
        // Start health checks
        this.startHealthChecks();
        
        // Start analytics reporting
        this.startAnalyticsReporting();
        
        // Start cache cleanup
        this.startCacheCleanup();
    }

    startHealthChecks() {
        setInterval(() => {
            this.checkWebhookHealth().catch(error => {
                this.log('Error in health check', 'error', error);
            });
        }, 300000); // 5 minutes
    }

    async checkWebhookHealth() {
        if (!this.isOnline) return;
        
        for (const webhook of this.state.webhooks) {
            if (webhook.status === 'active') {
                try {
                    await this.testWebhookConnection(webhook);
                } catch (error) {
                    this.log(`Health check failed for webhook "${webhook.name}"`, 'warn', error);
                }
            }
        }
    }

    // ===== LIFECYCLE METHODS =====
    handleBeforeUnload(event) {
        if (this.state.ui.loading.global) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return event.returnValue;
        }
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            // Tab became visible - refresh data
            this.refreshData();
        }
    }

    async refreshData() {
        // Refresh webhook statuses
        await this.checkWebhookHealth();
        
        // Refresh analytics
        this.updateAnalytics();
    }

    destroy() {
        // Clean up event listeners
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Stop background services
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        // Destroy components
        for (const component of Object.values(this.components)) {
            if (typeof component.destroy === 'function') {
                component.destroy();
            }
        }
        
        this.log('Application destroyed');
    }
}

// ===== SUPPORTING SERVICES =====
class StorageService {
    constructor() {
        this.prefix = 'whm_pro_';
        this.isPersistent = false;
    }

    async init() {
        // Check if storage is persistent
        if (navigator.storage && navigator.storage.persist) {
            this.isPersistent = await navigator.storage.persist();
        }
    }

    async get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    }

    async remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    async clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}

class APIService {
    constructor() {
        this.baseURL = 'https://api.webhookmanager.com/v1';
        this.timeout = 10000;
    }

    async request(endpoint, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
}

class AnalyticsService {
    constructor() {
        this.enabled = true;
        this.queue = [];
        this.flushInterval = 30000; // 30 seconds
    }

    async init() {
        // Load user consent
        const consent = await this.getConsent();
        this.enabled = consent === 'granted';
        
        // Start flush interval
        setInterval(() => this.flush(), this.flushInterval);
    }

    track(event, properties = {}) {
        if (!this.enabled) return;
        
        const eventData = {
            event,
            properties,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language
        };
        
        this.queue.push(eventData);
        
        // Flush immediately for important events
        if (['error', 'pageview', 'webhook_created'].includes(event)) {
            this.flush();
        }
    }

    async flush() {
        if (this.queue.length === 0) return;
        
        const events = [...this.queue];
        this.queue = [];
        
        try {
            // In a real application, this would send to your analytics service
            console.log('Analytics events:', events);
            
            // Store locally for debugging
            const existing = await this.getStoredEvents();
            const updated = [...existing, ...events].slice(-1000); // Keep last 1000 events
            localStorage.setItem('whm_analytics', JSON.stringify(updated));
            
        } catch (error) {
            console.error('Error flushing analytics:', error);
            // Requeue failed events
            this.queue.unshift(...events);
        }
    }

    async getConsent() {
        return localStorage.getItem('whm_analytics_consent') || 'denied';
    }

    async setConsent(granted) {
        this.enabled = granted;
        localStorage.setItem('whm_analytics_consent', granted ? 'granted' : 'denied');
    }

    async getStoredEvents() {
        try {
            return JSON.parse(localStorage.getItem('whm_analytics') || '[]');
        } catch {
            return [];
        }
    }
}

// Additional 4,000+ lines would include:
// - ValidationService with comprehensive validation rules
// - NotificationService with toast system
// - SchedulerService with cron-like functionality  
// - FormatterService for data formatting
// - All component classes (Navigation, Modal, Form, Table, Chart, etc.)
// - Tab-specific components (Dashboard, Webhook, Message, Scheduler, etc.)
// - Advanced error handling and recovery
// - Real-time data synchronization
// - Offline capability management
// - Performance monitoring and optimization
// - Accessibility features
// - Internationalization support
// - Plugin system architecture
// - Export/import functionality
// - Backup and restore features
// - Security and encryption
// - Team collaboration features
// - API rate limiting
// - Webhook signature verification
// - Advanced message templating with variables
// - Conditional logic for messages
// - Bulk operations
// - Advanced filtering and search
// - Data visualization components
// - Reporting and analytics
// - User preference management
// - Tour and onboarding system
// - Context menu system
// - Keyboard shortcut system
// - Drag and drop functionality
// - Real-time collaboration
// - Version control for templates
// - Webhook groups and organization
// - Advanced scheduling with timezones
// - Message preview system
// - Embed builder with visual editor
// - Attachment management
// - Webhook testing suite
// - Performance benchmarking
// - Health monitoring dashboard
// - Automated recovery systems
// - Data migration utilities
// - Plugin development tools
// - API documentation integration
// - Webhook analytics and insights
// - Custom webhook endpoints
// - Advanced security features
// - Compliance reporting
// - Audit logging
// - Team management
// - Role-based access control
// - Multi-tenant support
// - Real-time notifications
// - Mobile responsiveness
// - PWA features
// - Offline functionality
// - Data synchronization
// - Conflict resolution
// - Backup strategies
// - Disaster recovery
// - Performance profiling
// - Memory management
// - Code splitting
// - Lazy loading
// - Caching strategies
// - Bundle optimization
// - SEO optimization
// - Social media integration
// - Email notifications
// - SMS integrations
// - Slack/Discord integrations
// - Custom integration framework

// ===== APPLICATION BOOTSTRAP =====
// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.webhookManager = new WebhookManagerPro();
    
    // Expose app to global scope for debugging
    if (process.env.NODE_ENV === 'development') {
        window.app = window.webhookManager;
    }
});

// Handle errors that occur during initialization
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (window.webhookManager) {
        window.webhookManager.handleCriticalError(event.error);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.webhookManager) {
        window.webhookManager.log('Unhandled promise rejection', 'error', event.reason);
    }
});
