// English translations

export default {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    mainMenu: 'Main Menu',
  },
  
  // Main Menu
  mainMenu: {
    title: 'RutiMind',
    subtitle: 'The smart way to self-manage',
    parentPanel: 'Parent Panel',
    parentPanelDesc: 'Manage and track skills',
    studentMode: 'Student Mode',
    studentModeDesc: 'Complete skills',
    education: 'Education Content',
    educationDesc: 'Learn and explore',
    version: 'RutiMind v2.0',
  },
  
  // Authentication
  auth: {
    welcomeTitle: 'Welcome to Parent Panel!',
    welcomeSubtitle: 'Please sign in to track your child\'s progress.',
    signInWithGoogle: 'Sign in with Google',
    securityInfo: 'Secure login and data protection',
    pinSetupTitle: 'Create PIN',
    pinSetupSubtitle: 'Set a 4-6 digit PIN to access the app',
    pinEntryTitle: 'Enter PIN',
    pinEntrySubtitle: 'Enter your PIN to continue',
    pinMismatch: 'PINs do not match',
    pinTooShort: 'PIN must be at least 4 digits',
    pinTooLong: 'PIN must be at most 6 digits',
    pinIncorrect: 'Incorrect PIN',
    pinLockout: 'Too many failed attempts. Please wait {{minutes}} minutes.',
    signOut: 'Sign Out',
  },
  
  // Skills
  skills: {
    title: 'Skills List',
    subtitle: 'Edit and manage skills',
    categories: 'Skill Categories',
    selected: 'Selected Skills',
    addSkill: 'Add Skill',
    removeSkill: 'Remove Skill',
    maxSkillsReached: 'You can select a maximum of {{max}} skills',
    alreadySelected: 'This skill is already selected',
    uploadImage: 'Upload Photo',
    duration: 'Duration',
    minutes: 'minutes',
    totalDuration: 'Total Duration',
    maxDuration: 'Total duration cannot exceed 2 hours',
    noImageSelected: 'Please upload a photo for each skill',
    noDurationSet: 'Please set duration for each skill',
    saveSuccess: 'Skills saved successfully',
    waitTime: 'Wait Time',
    emptyState: 'Select skills from the left panel',
  },
  
  // Reinforcers
  reinforcers: {
    title: 'Reinforcers',
    subtitle: 'Edit and manage reinforcers',
    list: 'Reinforcer List',
    selected: 'Selected Reinforcers',
    addReinforcer: 'Add Reinforcer',
    name: 'Name',
    slot: 'Slot',
    slotDescription: 'After how many positive behaviors should this reinforcer appear?',
    saveSuccess: 'Reinforcers saved successfully',
    emptyState: 'No reinforcers added yet',
  },
  
  // Progress
  progress: {
    title: 'Progress Chart',
    subtitle: 'Track progress',
    dailyProgress: 'Daily Progress',
    totalSkills: 'Total Skills',
    completedSkills: 'Completed',
    successRate: 'Success Rate',
    yesResponses: 'Yes Responses',
    noResponses: 'No Responses',
    noResponse: 'No Response',
    selectDate: 'Select Date',
    noDataAvailable: 'No data available for this date',
    sessionDetails: 'Session Details',
  },
  
  // Student Flow
  student: {
    readyTitle: 'ARE YOU READY?',
    readySubtitle: 'When you\'re ready to start completing your skills, click "Yes"!',
    readyYes: 'Yes, Let\'s Start!',
    readyNo: 'No, Back to Main Menu',
    waitingTitle: 'Waiting...',
    waitingSubtitle: 'Starting in {{seconds}} seconds',
    skillQuestion: 'Did you do this?',
    respond: 'Respond',
    timeRemaining: '{{seconds}} seconds remaining',
    sessionComplete: 'Session Complete!',
    sessionCompleteMessage: 'Congratulations! You completed all skills.',
    backToMenu: 'Back to Main Menu',
    noSkillsConfigured: 'Skills list is empty. Please add skills from parent panel first.',
  },
  
  // Dashboard
  dashboard: {
    welcome: 'Welcome! 👋',
    currentStats: 'Current statistics',
    activeSkills: 'Active Skills',
    completed: 'Completed',
    quickActions: 'Quick Actions',
    skillsList: 'Skills List',
    skillsListDesc: 'Manage and edit skills',
    timeSettings: 'Time Settings',
    timeSettingsDesc: 'Customize durations',
    progressReport: 'Progress Report',
    progressReportDesc: 'Track progress',
    photoGallery: 'Photo Gallery',
    photoGalleryDesc: 'Store memories',
  },
  
  // Education
  education: {
    title: 'Education Content',
    subtitle: 'Learn and explore',
    selfManagement: 'Self-Management',
    appUsage: 'App Usage',
    comingSoon: 'Education videos coming soon!',
    
    // Self-management topics
    selfCues: 'Giving Oneself Cues',
    selfInstruction: 'Self-Instruction',
    selfMonitoring: 'Self-Monitoring',
    selfEvaluation: 'Self-Evaluation',
    selfReinforcement: 'Self-Reinforcement',
    
    // App usage topics
    parentMode: 'Using Parent Mode',
    studentMode: 'Using Student Mode',
  },
  
  // Validation
  validation: {
    required: 'This field is required',
    minLength: 'Must be at least {{min}} characters',
    maxLength: 'Must be at most {{max}} characters',
    invalidEmail: 'Enter a valid email address',
    invalidNumber: 'Enter a valid number',
    minValue: 'Must be at least {{min}}',
    maxValue: 'Must be at most {{max}}',
  },
  
  // Errors
  errors: {
    generic: 'An error occurred. Please try again.',
    network: 'Network connection error',
    authentication: 'Authentication error. Please try again.',
    permission: 'Permission required for this action',
    notFound: 'Content not found',
    serverError: 'Server error. Please try again later.',
  },
};
