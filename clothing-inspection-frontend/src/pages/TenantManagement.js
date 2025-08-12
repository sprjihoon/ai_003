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
  Select,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { DeleteForever } from '@mui/icons-material';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantType, setTenantType] = useState('fulfillment');

  const load = async () => {
    const list = await fetchWithAuth('/admin/tenants');
    setTenants(list);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!tenantId || !tenantName) {
      alert('tenantId / tenantName 필수');
      return;
    }
    await fetchWithAuth('/admin/tenants', {
      method: 'POST',
      body: JSON.stringify({ tenantId, tenantName, tenantType })
    });
    setTenantId('');
    setTenantName('');
    load();
  };

  // 테넌트 전체 삭제 (account + data)
  const handleCascadeDelete = async (tid)=>{
    if(!window.confirm(`테넌트 ${tid} 와 관련된 모든 데이터가 삭제됩니다. 계속할까요?`)) return;
    if(!window.confirm('정말로 삭제하시겠습니까? (복구 불가)')) return;
    await fetchWithAuth(`/admin/tenants/${tid}/full`, { method:'DELETE' });
    load();
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>테넌트 관리</Typography>

      {/* Create form */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap:'wrap' }}>
        <TextField label="tenantId" value={tenantId} onChange={e => setTenantId(e.target.value)} />
        <TextField label="tenantName" value={tenantName} onChange={e => setTenantName(e.target.value)} />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="type-label">Type</InputLabel>
          <Select
            labelId="type-label"
            value={tenantType}
            label="Type"
            onChange={e => setTenantType(e.target.value)}
          >
            <MenuItem value="fulfillment">fulfillment</MenuItem>
            <MenuItem value="brand">brand</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleCreate}>추가</Button>
      </div>

      {/* List */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>tenant_id</TableCell>
            <TableCell>tenant_name</TableCell>
            <TableCell>type</TableCell>
            <TableCell>createdAt</TableCell>
            <TableCell>삭제</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenants.map(t => (
            <TableRow key={t.id}>
              <TableCell>{t.id}</TableCell>
              <TableCell>{t.tenant_id}</TableCell>
              <TableCell>{t.tenant_name}</TableCell>
              <TableCell>{t.tenant_type}</TableCell>
              <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <IconButton color="error" onClick={()=>handleCascadeDelete(t.tenant_id)}>
                  <DeleteForever />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <IconButton onClick={load} sx={{ mt: 1 }}><Refresh /></IconButton>
    </Container>
  );
};

export default TenantManagement; 