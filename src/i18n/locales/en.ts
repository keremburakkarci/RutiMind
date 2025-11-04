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
    selectedSkills: 'Selected Skills',
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
    saved: 'Skills saved!',
    waitTime: 'Wait Time',
    fixedRow: 'Fixed Row',
    emptyState: 'Select skills from the left panel',
    noSkillsSelected: 'No skills selected yet',
    search: 'Search skills...',
    save: 'Save',
    errors: {
      missingImages: 'Please upload photos for all skills',
      totalDurationExceeded: 'Total duration cannot exceed 2 hours',
    },
  },
  
  // Reinforcers
  reinforcers: {
    title: 'Reinforcers',
    subtitle: 'Edit and manage reinforcers',
    library: 'Reinforcer Library',
    slots: 'Slot Layout',
    add: 'Add',
    addNew: 'Add New Reinforcer',
    list: 'Reinforcer List',
    selected: 'Selected Reinforcers',
    addReinforcer: 'Add Reinforcer',
    name: 'Name',
    namePlaceholder: 'Enter reinforcer name',
    slot: 'Slot',
    slotDescription: 'After how many positive behaviors should this reinforcer appear?',
    uploadImage: 'Upload Image',
    save: 'Save',
    saved: 'Reinforcers saved!',
    saveSuccess: 'Reinforcers saved successfully',
    emptyState: 'No reinforcers added yet',
    emptySlot: 'This slot is empty',
    noReinforcers: 'No reinforcers yet.\nAdd a new reinforcer using the "Add" button.',
    noSlotsSelected: 'At least one slot must be filled',
    deleteConfirm: 'Delete Reinforcer',
    deleteMessage: 'Are you sure you want to delete this reinforcer?',
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
    title: 'Error',
    generic: 'An error occurred. Please try again.',
    network: 'Network connection error',
    authentication: 'Authentication error. Please try again.',
    permission: 'Permission Required',
    cameraPermission: 'Gallery access permission is required to select photos.',
    imagePicker: 'An error occurred while uploading the image.',
    notFound: 'Content not found',
    serverError: 'Server error. Please try again later.',
    validation: 'Validation Error',
  },
  
  // Success messages
  success: {
    title: 'Success',
    saved: 'Saved!',
  },
};
