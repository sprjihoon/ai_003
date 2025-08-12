import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Edit, Save, Cancel, Refresh } from '@mui/icons-material';
import { Delete } from '@mui/icons-material';

const AdminUserManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [tenants,setTenants] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const [editId, setEditId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTenantId, setEditTenantId] = useState('');

  const load = async () => {
    const all = await fetchWithAuth('/users/all');
    setAdmins(all.filter(u => u.role === 'admin'));
  };

  useEffect(() => { load();
    // fetch tenants for dropdown
    (async()=>{
      try{ const list = await fetchWithAuth('/admin/tenants'); setTenants(list);}catch{}}
    )();
  }, []);

  const availableTenants = tenants.filter(t=> !admins.some(a=>a.tenant_id===t.tenant_id));

  const handleCreate = async () => {
    if (!tenantId || !username || !password) {
      alert('tenantId, username, password 필수');
      return;
    }
    await fetchWithAuth('/users/register', {
      method: 'POST',
      body: JSON.stringify({ tenantId, username, password, email, company, role: 'admin' })
    });
    setTenantId(''); setUsername(''); setPassword(''); setEmail(''); setCompany('');
    load();
  };

  const handleDelete = async (id)=>{
    if(!window.confirm('삭제하시겠습니까?')) return;
    await fetchWithAuth(`/users/${id}`, { method:'DELETE' });
    load();
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setEditEmail(u.email || '');
    setEditCompany(u.company || '');
    setEditTenantId(u.tenant_id || '');
  };

  const handleUpdate = async () => {
    await fetchWithAuth(`/users/${editId}`, {
      method: 'PUT',
      body: JSON.stringify({ email: editEmail, company: editCompany, tenantId: editTenantId })
    });
    setEditId(null);
    load();
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>어드민 계정 관리</Typography>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="tenant-label">tenantId</InputLabel>
          <Select labelId="tenant-label" label="tenantId" value={tenantId} onChange={e=>setTenantId(e.target.value)}>
             {availableTenants.map(t=>(<MenuItem key={t.tenant_id} value={t.tenant_id}>{t.tenant_id}</MenuItem>))}
          </Select>
        </FormControl>
        <TextField label="username" value={username} onChange={e=>setUsername(e.target.value)} />
        <TextField label="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <TextField label="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <TextField label="company" value={company} onChange={e=>setCompany(e.target.value)} />
        <Button variant="contained" onClick={handleCreate}>추가</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>tenant_id</TableCell>
            <TableCell>username</TableCell>
            <TableCell>email</TableCell>
            <TableCell>company</TableCell>
            <TableCell>createdAt</TableCell>
            <TableCell>액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {admins.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>
                {editId===u.id ? (
                  <Select value={editTenantId} onChange={e=>setEditTenantId(e.target.value)} sx={{minWidth:120}}>
                    {tenants.map(t=>(<MenuItem key={t.tenant_id} value={t.tenant_id}>{t.tenant_id}</MenuItem>))}
                  </Select>
                ) : (u.tenant_id || '없음') }
              </TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>
                {editId===u.id ? (
                  <TextField value={editEmail} onChange={e=>setEditEmail(e.target.value)} />
                ) : u.email }
              </TableCell>
              <TableCell>
                {editId===u.id ? (
                  <TextField value={editCompany} onChange={e=>setEditCompany(e.target.value)} />
                ) : u.company }
              </TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                {editId===u.id ? (
                  <>
                    <IconButton onClick={handleUpdate}><Save /></IconButton>
                    <IconButton onClick={()=>setEditId(null)}><Cancel /></IconButton>
                  </>
                ) : (
                  <>
                    <IconButton onClick={()=>startEdit(u)}><Edit /></IconButton>
                    <IconButton onClick={()=>handleDelete(u.id)}><Delete /></IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <IconButton onClick={load} sx={{ mt:1 }}><Refresh /></IconButton>
    </Container>
  );
};

export default AdminUserManagement; 