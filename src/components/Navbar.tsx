import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  ListItemIcon,
  IconButton,
  AppBar
} from "@mui/material";

import { NavLink } from "react-router-dom";
import Logo from '../assets/images/VAZO-logo.png';
import ProfileSVG from '../assets/icons/profile.svg';
import CalculatorSVG from '../assets/icons/calculator.svg';
import SettingsSVG from '../assets/icons/settings.svg';
import LogoutSVG from '../assets/icons/logout.svg';
import { useState } from "react";

import { useTheme, useMediaQuery } from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/MenuOutlined";

const navbarItems = [
    {text: 'Profil', path: '/feature-chart', icon: ProfileSVG},
    {text: 'Kalkulator', path: '/', icon: CalculatorSVG},
    {text: 'Sekcja1', path: '/', icon: SettingsSVG},
    {text: 'Sekcja2', path: '/', icon: SettingsSVG},
]


export default function Navbar() {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [collapsed, setCollapsed] = useState(false);

    const drawerWidth = collapsed ? 80 : 250;
    return (
        !isMobile ? (
            <Drawer
            variant="permanent"
            anchor="left"
            sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
                width: drawerWidth,
                bgcolor: "#211331",
                color: "#fff",
                fontFamily: "Montserrat",
                transition: "width 0.3s ease",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
            },
            }}
        >
            <Toolbar
                sx={{
                    mt: 3,
                    gap: collapsed ? 0 : 1,
                    justifyContent: collapsed ? "center" : "flex-start",
                    userSelect: "none",
                }}
                >
                <Box component="img" src={Logo} width={collapsed ? 40 : 58} />
                {!collapsed && (
                    <Typography fontFamily="Poppins" fontSize={28}>
                    Life&Work
                    </Typography>
                )}
            </Toolbar>
            <List>
                {navbarItems.map((item) => (
                <ListItem key={item.text} sx={{ px: 1 }}>
                    <ListItemButton
                    component={NavLink}
                    to={item.path}
                    sx={{
                        borderRadius: 2,
                        p: 1.6,
                        justifyContent: collapsed ? "center" : "flex-start",
                        "&:hover": {
                        bgcolor: "#3a2b4c",
                        },
                        "&.active": {
                        bgcolor: "#667291",
                        fontWeight: 600,
                        },
                    }}
                    >
                    <ListItemIcon
                        sx={{
                        minWidth: 0,
                        mr: collapsed ? 0 : 2,
                        justifyContent: "center",
                        }}
                    >
                        <Box
                        component="img"
                        src={item.icon}
                        sx={{ width: 22, height: 22 }}
                        />
                    </ListItemIcon>

                    {!collapsed && (
                        <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                            fontFamily: "Montserrat, sans-serif",
                            fontWeight: 400,
                            fontSize: 18,
                        }}
                        />
                    )}
                    </ListItemButton>
                </ListItem>
                ))}
            </List>
            <List sx={{ mt: "auto", mb: 2, px: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                    sx={{
                        borderRadius: 2,
                        p: 1.6,
                        bgcolor: "#3E3B59",
                        "&:hover": { 
                            bgcolor: "#3a2b4c" 
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2
                    }}
                    >
                        <Box
                        component="img"
                        src={LogoutSVG}
                        sx={{ width: 22, height: 22, mr: 0}}
                        />

                        {!collapsed && (
                        <Typography
                        noWrap={true}
                            sx={{
                            fontFamily: "Montserrat, sans-serif",
                            fontWeight: 400,
                            fontSize: 18,
                            
                            }}
                        >
                            Wyloguj się
                        </Typography>
                        )}
                    </ListItemButton>
                </ListItem>
            </List>
            {/* Floating Collapse Button */}
            <IconButton
                onClick={() => setCollapsed(!collapsed)}
                sx={{
                    position: "absolute",
                    top: "50%",
                    right: !collapsed ? 4 : 25,
                    // transform: "translateY(-50%)",
                    bgcolor: "#3E3B59",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    "&:hover": {
                        bgcolor: "#3a2b4c",
                    },
                    boxShadow: 3,
                }}
            >
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
        </Drawer>
    ) : (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="fixed" sx={{ bgcolor: "#211331", py:1  }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexDirection: 'column' }}>
                    <Box display={'flex'} justifyContent={'center'} alignItems={'center'} gap={2} mt={0.5}>
                        <Box component="img" src={Logo} width={collapsed ? 30 : 40} />
                        <Typography
                            variant="h6"
                            sx={{ fontFamily: "Montserrat", fontWeight: 600 }}
                            >
                            Life&Work
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 3, overflowX: 'auto', mt: 1 }}>
                        {navbarItems.map((item) => (
                            <Typography
                            key={item.text}
                            component={NavLink}
                            to={item.path}
                            sx={{
                                textDecoration: "none",
                                color: "#fff",
                                fontFamily: "Montserrat",
                                fontSize: 18,
                                fontWeight: 400,
                                position: "relative",
                                "&:hover": {
                                    color: "#a3a3a3",
                                },
                                "&.active": {
                                    color: "#ffd700",
                                },
                            }}
                            >
                            {item.text}
                            </Typography>
                        ))}
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    )
        // <Drawer
        //     variant="permanent"
        //     anchor="left"
        //     sx={{
        //     width: drawerWidth,
        //     flexShrink: 0,
        //     "& .MuiDrawer-paper": {
        //         width: drawerWidth,
        //         bgcolor: "#211331",
        //         color: "#fff",
        //         fontFamily: "Montserrat",
        //         transition: "width 0.3s ease",
        //         overflowX: "hidden",
        //         display: "flex",
        //         flexDirection: "column",
        //     },
        //     }}
        // >
        //     <Toolbar
        //     sx={{
        //         mt: 3,
        //         gap: collapsed ? 0 : 1,
        //         justifyContent: collapsed ? "center" : "flex-start",
        //         userSelect: "none",
        //     }}
        //     >
        //     <Box component="img" src={Logo} width={collapsed ? 40 : 58} />
        //     {!collapsed && (
        //         <Typography fontFamily="Poppins" fontSize={28}>
        //         Life&Work
        //         </Typography>
        //     )}
        //     </Toolbar>
        //     <List>
        //     {navbarItems.map((item) => (
        //     <ListItem key={item.text} sx={{ px: 1 }}>
        //         <ListItemButton
        //         component={NavLink}
        //         to={item.path}
        //         sx={{
        //             borderRadius: 2,
        //             p: 1.6,
        //             justifyContent: collapsed ? "center" : "flex-start",
        //             "&:hover": {
        //             bgcolor: "#3a2b4c",
        //             },
        //             "&.active": {
        //             bgcolor: "#667291",
        //             fontWeight: 600,
        //             },
        //         }}
        //         >
        //         <ListItemIcon
        //             sx={{
        //             minWidth: 0,
        //             mr: collapsed ? 0 : 2,
        //             justifyContent: "center",
        //             }}
        //         >
        //             <Box
        //             component="img"
        //             src={item.icon}
        //             sx={{ width: 22, height: 22 }}
        //             />
        //         </ListItemIcon>

        //         {!collapsed && (
        //             <ListItemText
        //             primary={item.text}
        //             primaryTypographyProps={{
        //                 fontFamily: "Montserrat, sans-serif",
        //                 fontWeight: 400,
        //                 fontSize: 18,
        //             }}
        //             />
        //         )}
        //         </ListItemButton>
        //     </ListItem>
        //     ))}
        // </List>
        //     <List sx={{ mt: "auto", mb: 2, px: 1 }}>
        //         <ListItem disablePadding>
        //             <ListItemButton
        //             sx={{
        //                 borderRadius: 2,
        //                 p: 1.6,
        //                 bgcolor: "#3E3B59",
        //                 "&:hover": { 
        //                     bgcolor: "#3a2b4c" 
        //                 },
        //                 display: 'flex',
        //                 alignItems: 'center',
        //                 justifyContent: 'center',
        //                 gap: 2
        //             }}
        //             >
        //                 <Box
        //                 component="img"
        //                 src={LogoutSVG}
        //                 sx={{ width: 22, height: 22, mr: 0}}
        //                 />

        //                 {!collapsed && (
        //                 <Typography
        //                 noWrap={true}
        //                     sx={{
        //                     fontFamily: "Montserrat, sans-serif",
        //                     fontWeight: 400,
        //                     fontSize: 18,
                            
        //                     }}
        //                 >
        //                     Wyloguj się
        //                 </Typography>
        //                 )}
        //             </ListItemButton>
        //         </ListItem>
        //     </List>
        //     {/* Floating Collapse Button */}
        //     <IconButton
        //         onClick={() => setCollapsed(!collapsed)}
        //         sx={{
        //             position: "absolute",
        //             top: "50%",
        //             right: !collapsed ? 4 : 25,
        //             // transform: "translateY(-50%)",
        //             bgcolor: "#3E3B59",
        //             color: "#fff",
        //             width: 32,
        //             height: 32,
        //             "&:hover": {
        //                 bgcolor: "#3a2b4c",
        //             },
        //             boxShadow: 3,
        //         }}
        //     >
        //         {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        //     </IconButton>
        // </Drawer>
  );
}

/*
import { Drawer, List, ListItem, ListItemButton, ListItemText, Box, Toolbar, Typography, ListItemIcon } from "@mui/material"; import { NavLink } from "react-router-dom"; import Logo from '../assets/images/VAZO-logo.png'; import ProfileSVG from '../assets/icons/profile.svg'; import CalculatorSVG from '../assets/icons/calculator.svg'; import SettingsSVG from '../assets/icons/settings.svg'; import LogoutSVG from '../assets/icons/logout.svg'; const drawerWidth = 250; const navbarItems = [ {text: 'Profil', path: '/feature-chart', icon: ProfileSVG}, {text: 'Kalkulator', path: '/', icon: CalculatorSVG}, {text: 'Sekcja 1', path: '/', icon: SettingsSVG}, {text: 'Sekcja 2', path: '/', icon: SettingsSVG}, ] export default function Navbar() { return ( <Drawer variant="permanent" anchor="left" sx={{ width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "#211331", color: "#fff", fontFamily: 'Montserrat', }, }} > <Toolbar sx={{ mt: 3, gap: 1, userSelect: "none" }}> <Box component={'img'} src={Logo} width={58} height={'auto'}/> <Typography fontFamily={'Poppins'} fontSize={28}>Life&Work</Typography> </Toolbar> <List> {navbarItems.map((item) => ( <ListItem key={item.text}> <ListItemButton component={NavLink} to={item.path} sx={{ borderRadius: 2, p: 1.6, "&:hover": { bgcolor: "#3a2b4c", }, "&.active": { bgcolor: "#667291", color: "#fff", fontWeight: 600, }, }} > <ListItemIcon sx={{ minWidth: 36, color: "inherit", }} > <Box component="img" src={item.icon} sx={{ width: 22, height: 22 }} /> </ListItemIcon> <ListItemText primary={item.text} primaryTypographyProps={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400, fontSize: 20, }} /> </ListItemButton> </ListItem> ))} </List> <List sx={{ mt: "auto", mb: 2 }}> <ListItem> <ListItemButton sx={{ borderRadius: 2, p: 1.6, bgcolor: "#3E3B59", "&:hover": { bgcolor: "#3a2b4c" }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }} > <Box component="img" src={LogoutSVG} sx={{ width: 22, height: 22 }} /> <Typography sx={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400, fontSize: 20, }} > Wyloguj się </Typography> </ListItemButton> </ListItem> </List> </Drawer> ); }

*/