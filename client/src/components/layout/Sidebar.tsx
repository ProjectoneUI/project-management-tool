import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Collapse, 
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Assignment as AssignmentIcon, 
  Description as DescriptionIcon, 
  CalendarMonth as CalendarMonthIcon, 
  Person as PersonIcon, 
  ExpandLess, 
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';

// Sidebar-Breite
const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'persistent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Projekte-Menü öffnen/schließen
  const [projectsOpen, setProjectsOpen] = useState(false);
  
  // Projekte laden
  const { data: projects, isLoading } = useProjects();
  
  // Menüpunkte
  const menuItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: <DashboardIcon /> 
    },
    { 
      title: 'Projekte', 
      path: '/projects', 
      icon: <AssignmentIcon />,
      hasSubmenu: true
    },
    { 
      title: 'Aufgaben', 
      path: '/tasks', 
      icon: <AssignmentIcon /> 
    },
    { 
      title: 'Dokumente', 
      path: '/documents', 
      icon: <DescriptionIcon /> 
    },
    { 
      title: 'Kalender', 
      path: '/calendar', 
      icon: <CalendarMonthIcon /> 
    },
    { 
      title: 'KI-Assistent', 
      path: '/ai', 
      icon: <SmartToyIcon /> 
    },
    { 
      title: 'Profil', 
      path: '/profile', 
      icon: <PersonIcon /> 
    }
  ];
  
  // Menüpunkt auswählen
  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };
  
  // Projekte-Menü umschalten
  const handleProjectsToggle = () => {
    setProjectsOpen(!projectsOpen);
  };
  
  // Projekt auswählen
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    if (isMobile) {
      onClose();
    }
  };
  
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 1 }}>
        {isMobile && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      
      <List component="nav">
        {menuItems.map((item) => (
          item.hasSubmenu ? (
            <React.Fragment key={item.title}>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={handleProjectsToggle}
                  selected={location.pathname.startsWith(item.path)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.title} />
                  {projectsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              
              <Collapse in={projectsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton 
                    sx={{ pl: 4 }}
                    onClick={() => handleMenuItemClick(item.path)}
                    selected={location.pathname === item.path}
                  >
                    <ListItemText primary="Alle Projekte" />
                  </ListItemButton>
                  
                  {!isLoading && projects && projects.map((project: any) => (
                    <ListItemButton 
                      key={project._id}
                      sx={{ pl: 4 }}
                      onClick={() => handleProjectClick(project._id)}
                      selected={location.pathname === `/projects/${project._id}`}
                    >
                      <ListItemText 
                        primary={project.name} 
                        primaryTypographyProps={{ 
                          noWrap: true,
                          style: { maxWidth: '180px' }
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItem key={item.title} disablePadding>
              <ListItemButton 
                onClick={() => handleMenuItemClick(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 