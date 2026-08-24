export const enGB = {
  sidebar: {
    DASHBOARD: 'Dashboard',
    SYSTEM: 'System',
    SYSTEM_DAEMONS: 'Daemons',
    SYSTEM_PROCESS: 'Process',
    DOCKER: 'Docker',
    SETTINGS: 'Settings',
    expand: 'Expand',
    navigation: 'Navigation'
  },
  common: {
    refresh: 'Refresh',
    search: 'Search',
    loadMore: 'Load more',
    reset: 'Reset',
    cancel: 'Cancel',
    save: 'Save',
    remove: 'Remove',
    start: 'Start',
    stop: 'Stop',
    restart: 'Restart',
    enable: 'Enable',
    disable: 'Disable',
    noResults: 'No results found.',
    comingSoon: 'Coming soon.',
    boot: 'Boot',
    // Aggiunte: mancavano del tutto — DaemonsView/ProcessView le usano
    // per il titolo di SharedAlert in caso di errore di fetch.
    error: 'Error',
    // Usato da LogsViewer.vue per il pulsante di chiusura pannello log.
    close: 'Close',
    // Usato da AppLayout.vue per il trigger della sidebar (prima era
    // una stringa italiana hardcoded nel componente, non passava da qui).
    toggleSidebar: 'Toggle sidebar',
  },
  daemons: {
    title: 'Daemons',
    running: '{n} running',
    failed: '{n} failed',
    shown: '{shown} / {total} shown',
    pinned: 'Pinned',
    searchPlaceholder: 'Search daemons (3+ chars)…',
    searchHint: 'Type {n} more {char} to search…',
    searchHintChar: 'character | characters',
    showing: 'Showing {n} daemons',
    noMatch: 'No daemons match your search.',
    notFound: 'No daemons found.',
    filterStatus: 'Status',
    filterBoot: 'Boot',
    resetFilters: 'Reset all filters',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    staticUnit: 'Static unit — cannot change',
    enableAtBoot: 'Enable at boot',
    disableAtBoot: 'Disable at boot',
    pin: 'Pin',
    unpin: 'Unpin',
    bootLabel: 'Boot',
    noDescription: 'No description',
    allSection: 'All',
    filtersModifyHint: 'Try modifying or clearing your filters',
    loadMoreRemaining: 'Load more — {n} remaining',
    daemonsCount: '{n} daemons',
    pinnedCount: '{n} pinned',
    searchHintTyping: 'Type {n} more {char} to search…',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusFailed: 'Failed',
    statusUnknown: 'Unknown',
    enabledEnabled: 'Enabled',
    enabledDisabled: 'Disabled',
    enabledStatic: 'Static',
    // Aggiunta: il tipo DaemonEnabled include anche 'unknown', il
    // Record in DaemonFilters.vue lo richiede per compilare.
    enabledUnknown: 'Unknown',
    // Aggiunte: usate dal toggle vista lista/griglia in DaemonList.vue
    // (e riusate anche da DockerList.vue per lo stesso controllo).
    viewList: 'List view',
    viewGrid: 'Grid view',
  },
  processes: {
    pid: 'PID',
    terminate: 'Terminate (SIGTERM)',
    kill: 'Kill (SIGKILL)',
    changePriority: 'Change Priority',
    // Aggiunte: mancava l'intera coppia titolo/sottotitolo usata da
    // ProcessView.vue nell'header di pagina.
    title: 'Processes',
    subtitle: '{running} running · {shown}/{total} shown',
  },
  docker: {
    title: 'Docker',
    running: '{n} running',
    containers: '{n} containers',
    images: '{n} images',
    notConnected: 'Not connected',
    notReachable: 'Docker not reachable',
    notReachableHint: 'Make sure Docker is installed and the daemon is running.',
    tabContainers: 'Containers',
    tabImages: 'Images',
    filterPlaceholder: 'Filter…',
    pullImage: 'Pull image',
    noContainers: 'No containers found.',
    noImages: 'No images found.',
    logs: 'Logs',
    logsPolling: 'polling every 2s',
    logsWaiting: 'No logs yet…',
    logsScrollHint: '↓ Scroll to bottom to resume auto-scroll',
    logsDownload: 'Download logs',
    logsLines: '{n} lines',
    logsLive: 'live',
    logsResumeTail: 'Resume live tail',
    pin: 'Pin',
    unpin: 'Unpin',
    pinned: 'Pinned',
    pinnedCount: '{n} pinned',
    allSection: 'All',
    filtersModifyHint: 'Try modifying your search or filters',
    removeImage: 'Remove image',
    imageSizeLabel: 'Size',
    imageCreatedLabel: 'Created',
    pullImageTitle: 'Pull Docker image',
    pullConnecting: 'Connecting…',
    pullPulling: 'Pulling…',
    pullButton: 'Pull',
    statusRunning: 'running',
    statusPaused: 'paused',
    statusRestarting: 'restarting',
    statusDead: 'dead',
    statusExited: 'exited',
    statusCreated: 'created',
    // Aggiunta: usata da ContainerCard/ContainerItem come aria-label
    // dell'intera card cliccabile ("Open logs for {name}").
    openLogsFor: 'Open logs for {name}',
  },

  settings: {
    title: 'Settings',
    subtitle: 'Preferences and accessibility',

    sectionLanguage: 'Language',
    language: 'Language',
    languageHint: 'Changes apply immediately.',

    sectionAppearance: 'Appearance',
    fontSize: 'Font size',
    fontSizeSmall: 'Small',
    fontSizeDefault: 'Default',
    fontSizeLarge: 'Large',
    fontSizeXL: 'Extra large',

    fontFamily: 'Font family',
    fontDefault: 'System default',
    fontDyslexic: 'OpenDyslexic (dyslexia-friendly)',
    fontMono: 'Monospace',
    fontSans: 'Inter (sans-serif)',

    lineHeight: 'Line spacing',
    lineHeightNormal: 'Normal',
    lineHeightRelaxed: 'Relaxed',
    lineHeightLoose: 'Loose',
    // Aggiunta: testo di esempio nel riquadro di anteprima dello slider.
    lineHeightPreviewText: 'The quick brown fox jumps over the lazy dog. This is how your text will look.',

    reducedMotion: 'Reduce motion',
    reducedMotionHint: 'Minimises animations and transitions.',

    highContrast: 'High contrast',
    highContrastHint: 'Increases border and text contrast.',

    // Aggiunte: bottone di reset e relativo dialog di conferma in
    // SettingsView.vue (prima eseguiva il reset senza chiedere conferma).
    resetToDefaults: 'Reset to defaults',
    resetConfirmTitle: 'Reset all settings?',
    resetConfirmDescription: 'This will restore every appearance and language preference to its default value. This cannot be undone.',
  },

  // Aggiunta: DashboardView.vue aveva ogni etichetta scritta in
  // italiano direttamente nel template, mai passata da t() — l'unica
  // vista dell'app rimasta non localizzata.
  dashboard: {
    cpu: 'CPU',
    gpu: 'GPU',
    memory: 'Memory',
    memoryAndSwap: 'Memory & swap',
    swap: 'Swap',
    cache: 'Cache',
    diskRoot: 'Disk (/)',
    disk: 'Disk',
    network: 'Network',
    readWriteCombined: 'read + write combined',
    // {used}/{percent}/{total} sono già formattati dal chiamante — la
    // chiave traduce solo la frase, non concatena parole sciolte:
    // l'ordine può cambiare liberamente da una lingua all'altra.
    usedOfTotal: '{used} ({percent}) of {total}',
    received: 'Received',
    sent: 'Sent',
    totalReceived: 'Total received {value}',
    totalSent: 'Total sent {value}',
    read: 'Read',
    write: 'Write',
    totalRead: 'Total read {value}',
    totalWritten: 'Total written {value}',
    tempAndPower: 'Temperature & power',
    // Placeholder con nome per <i18n-t>: {lmSensors}/{nvidiaSmi}
    // vengono riempiti da due <code> nel template, non da testo — così
    // il markup resta nel punto giusto qualunque sia l'ordine delle
    // parole nella lingua.
    sensorsUnavailable: 'No sensors detected — requires {lmSensors} (temperatures) and/or RAPL on Intel CPUs / {nvidiaSmi} for NVIDIA GPUs (power draw).',
    avg60s: '60s avg: {value}',
    filesystem: 'File system',
    fsDirectory: 'Directory',
    fsType: 'Type',
    fsTotal: 'Total',
    fsAvailable: 'Available',
    fsUsed: 'Used',
    fsEmpty: 'No file systems found.',
  },
}