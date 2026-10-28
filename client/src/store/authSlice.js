import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorMessage } from '../api';

const save = (token) => localStorage.setItem('staffsync_token', token);

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/login', creds); save(data.token); return data; }
  catch (e) { return rejectWithValue(errorMessage(e)); }
});

export const register = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/register', form); save(data.token); return data; }
  catch (e) { return rejectWithValue(errorMessage(e)); }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/auth/me'); return data.user; }
  catch (e) { return rejectWithValue(errorMessage(e)); }
});

const hasToken = !!localStorage.getItem('staffsync_token');

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, status: hasToken ? 'loading' : 'idle', error: null },
  reducers: {
    logout(state) { localStorage.removeItem('staffsync_token'); state.user = null; state.status = 'idle'; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'busy'; s.error = null; })
      .addCase(register.pending, (s) => { s.status = 'busy'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.user = a.payload.user; s.status = 'idle'; })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload.user; s.status = 'idle'; })
      .addCase(login.rejected, (s, a) => { s.status = 'idle'; s.error = a.payload; })
      .addCase(register.rejected, (s, a) => { s.status = 'idle'; s.error = a.payload; })
      .addCase(loadUser.fulfilled, (s, a) => { s.user = a.payload; s.status = 'idle'; })
      .addCase(loadUser.rejected, (s) => { localStorage.removeItem('staffsync_token'); s.user = null; s.status = 'idle'; });
  },
});

export const { logout, clearError } = slice.actions;
export default slice.reducer;
