import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { Container, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import { Delete, Edit, Save, Cancel } from '@mui/icons-material';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const load = async () => {
    const list = await fetchWithAuth('/brands');
    setBrands(list);
  };

  useEffect(()=>{ load(); },[]);

  const handleCreate = async () => {
    await fetchWithAuth('/brands', {
      method:'POST',
      body: JSON.stringify({ name:newName, code:newCode })
    });
    setNewName(''); setNewCode('');
    load();
  };

  const startEdit = (b)=>{ setEditId(b.id); setEditName(b.name); setEditCode(b.code); };

  const handleUpdate = async () => {
    await fetchWithAuth(`/brands/${editId}`, {
      method:'PUT',
      body: JSON.stringify({ name:editName, code:editCode })
    });
    setEditId(null); setEditName(''); setEditCode('');
    load();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('삭제하시겠습니까?')) return;
    await fetchWithAuth(`/brands/${id}`, { method:'DELETE' });
    load();
  };

  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h5" gutterBottom>브랜드 관리</Typography>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <TextField label="브랜드명" value={newName} onChange={e=>setNewName(e.target.value)} />
        <TextField label="코드" value={newCode} onChange={e=>setNewCode(e.target.value)} />
        <Button variant="contained" onClick={handleCreate}>추가</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>브랜드명</TableCell>
            <TableCell>코드</TableCell>
            <TableCell>액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {brands.map(b=> (
            <TableRow key={b.id}>
              <TableCell>{b.id}</TableCell>
              <TableCell>
                {editId===b.id ? (
                  <TextField value={editName} onChange={e=>setEditName(e.target.value)} />
                ) : b.name }
              </TableCell>
              <TableCell>
                {editId===b.id ? (
                  <TextField value={editCode} onChange={e=>setEditCode(e.target.value)} />
                ) : b.code }
              </TableCell>
              <TableCell>
                {editId===b.id ? (
                  <>
                    <IconButton onClick={handleUpdate}><Save /></IconButton>
                    <IconButton onClick={()=>setEditId(null)}><Cancel /></IconButton>
                  </>
                ):(
                  <>
                    <IconButton onClick={()=>startEdit(b)}><Edit /></IconButton>
                    <IconButton onClick={()=>handleDelete(b.id)}><Delete /></IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default BrandManagement; 