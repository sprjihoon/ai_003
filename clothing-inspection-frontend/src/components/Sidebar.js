import React from 'react';
import { logout } from '../utils/api';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  ListAlt as ListAltIcon,
  QrCodeScanner as QrCodeScannerIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider
} from '@mui/material';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const role = (user.role || '').toLowerCase();
  const tenantType = (user.tenant_type || localStorage.getItem('tenantType') || 'brand').toLowerCase();

  // 메뉴 정의: 기본 + 조건부
  const items = [
    { key:'workerDash', label:'작업 대시보드', icon:<ListAltIcon />, to:'/worker/dashboard', roles:['worker','inspector','admin','operator'] },
    { key:'adminDash', label:'대시보드', icon:<DashboardIcon />, to:'/dashboard', roles:['admin','operator'] },
    { key:'brandsMgmt', label:'브랜드 관리', icon:<InventoryIcon />, to:'/brands', roles:['operator','admin'] },
    { key:'workersStats', label:'작업자 통계', icon:<AssessmentIcon />, to:'/workers/stats', roles:['admin','inspector','operator'] },
    { key:'clothes', label:'의류목록', icon:<LocalShippingIcon />, to:'/clothes', roles:['inspector','operator','admin'] },
    { key:'inspections', label:'검수내역', icon:<AssessmentIcon />, to:'/inspections', roles:['inspector','operator','admin'] },
    { key:'defects', label:'불량 내역', icon:<AssessmentIcon />, to:'/defects', roles:['operator','inspector','admin'] },
    { key:'scan', label:'바코드스캔', icon:<QrCodeScannerIcon />, to:'/worker/scan', roles:['worker','inspector','admin'] },
    { key:'history', label:'작업내역', icon:<ListAltIcon />, to:'/worker/history', roles:['worker','inspector','admin'] },
    { key:'password', label:'비밀번호 변경', icon:<SettingsIcon />, to:'/change-password', roles:['worker','inspector','operator','admin'] },
    { key:'users', label:'사용자 관리', icon:<PeopleIcon />, to:'/users', roles:['admin','operator'] },
    { key:'uiSettings', label:'환경 설정', icon:<SettingsIcon />, to:'/settings/ui', roles:['admin','operator'] },
  ];

  // tenant_type 기반 필터: fulfillment ➔ 브랜드 관리 메뉴 추가, brand ➔ 제거
  const filteredItems = items.filter(it=>{
    // 예: 브랜드 관리 탭을 fulfillment 타입만 노출. (key === 'brands') etc.
    if(it.key==='brandsMgmt' && tenantType!=='fulfillment') return false;
    return it.roles.includes(role);
  });

  return (
    <List>
      {filteredItems.map(it=> (
        <ListItem button key={it.key} component={Link} to={it.to}>
          <ListItemIcon>{it.icon}</ListItemIcon>
          <ListItemText primary={it.label} />
        </ListItem>
      ))}
      <Divider />
      <ListItem button onClick={()=>{logout(); window.location.href='/'}}>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText primary="로그아웃" />
      </ListItem>
    </List>
  );
};

export default Sidebar; 