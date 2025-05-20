import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Device {
  id: string;
  name: string;
  status: string;
  speed: number;
  lastUpdate: string;
  [key: string]: any;
}

interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
}

const initialState: DeviceState = {
  devices: [],
  loading: false,
  error: null,
};

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setDevices: (state, action: PayloadAction<Device[]>) => {
      state.devices = action.payload;
    },
  
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setDevices, setLoading, setError } = deviceSlice.actions;
export default deviceSlice.reducer; 