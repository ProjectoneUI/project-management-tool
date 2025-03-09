// Gemeinsame Navigation für alle Seiten
document.addEventListener('DOMContentLoaded', function() {
  // Aktuelle Seite ermitteln
  const currentPage = window.location.pathname.split('/').pop();
  
  // Navigationsstruktur
  const navItems = [
    { id: 'dashboard', icon: '📊', text: 'Dashboard', url: 'atlassian-style.html' },
    { id: 'projects', icon: '📋', text: 'Projekte', url: 'project-detail.html' },
    { id: 'tasks', icon: '✅', text: 'Aufgaben', url: 'simple.html' },
    { id: 'documents', icon: '📄', text: 'Dokumente', url: 'document-page.html' },
    { id: 'calendar', icon: '📅', text: 'Kalender', url: 'calendar-view.html' },
    { id: 'ai-assistant', icon: '🤖', text: 'KI-Assistent', url: 'ai-assistant.html' }
  ];
  
  // Sidebar-Element finden oder erstellen
  let sidebar = document.querySelector('.sidebar');
  if (!sidebar) {
    console.warn('Keine .sidebar gefunden, Navigation kann nicht eingefügt werden');
    return;
  }
  
  // Sidebar-Menü finden oder erstellen
  let sidebarMenu = sidebar.querySelector('.sidebar-menu');
  if (!sidebarMenu) {
    sidebarMenu = document.createElement('div');
    sidebarMenu.className = 'sidebar-menu';
    sidebar.appendChild(sidebarMenu);
  } else {
    // Bestehende Menüeinträge löschen
    sidebarMenu.innerHTML = '';
  }
  
  // Menüeinträge erstellen
  navItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'sidebar-menu-item';
    
    // Aktiven Menüpunkt markieren
    if (currentPage === item.url || 
        (currentPage === '' && item.id === 'dashboard') || 
        (currentPage === 'index.html' && item.id === 'dashboard')) {
      menuItem.classList.add('active');
    }
    
    menuItem.innerHTML = `
      <div class="sidebar-menu-item-icon">${item.icon}</div>
      <span>${item.text}</span>
    `;
    
    // Link-Funktionalität hinzufügen
    menuItem.addEventListener('click', function() {
      window.location.href = item.url;
    });
    
    sidebarMenu.appendChild(menuItem);
  });
  
  // Logo-Klick zur Startseite
  const sidebarLogo = sidebar.querySelector('.sidebar-logo');
  if (sidebarLogo) {
    sidebarLogo.style.cursor = 'pointer';
    sidebarLogo.addEventListener('click', function() {
      window.location.href = 'index.html';
    });
  }
}); 