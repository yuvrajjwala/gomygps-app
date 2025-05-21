import Api from '@/config/Api';
import { setDevices, setLoading } from '../store/slices/deviceSlice';
import { store } from '../store/store';

let positionUpdateInterval: ReturnType<typeof setInterval> | null = null;
let isAuthenticated = false;

export const startPositionUpdates = (isAuthenticated: boolean) => {
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
  }
  isAuthenticated = isAuthenticated;

  const updatePositions = async () => {
    try {
        if(isAuthenticated){
            store.dispatch(setLoading(true));
        }
      const [responseDevices, responsePositions] = await Promise.all([
        Api.call("/api/devices", "GET", {}, false),
        Api.call("/api/positions", "GET", {}, false),
      ]);      
      if (responseDevices.status === 200 && responsePositions.status === 200) {
        const devicesWithPositions = responseDevices.data.map((device: any) => ({
          ...device,
          ...responsePositions.data.find(
            (position: any) => position.deviceId === device.id
          ),
        }));
        store.dispatch(setDevices(devicesWithPositions));
        store.dispatch(setLoading(false));
      }
    } catch (error) {
      console.error("Error updating positions:", error);
    }
    finally{
      isAuthenticated = false;
        store.dispatch(setLoading(false));
    }
  };

  // Initial update
  updatePositions();
    positionUpdateInterval = setInterval(updatePositions, 25000);
};

export const stopPositionUpdates = () => {
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
    positionUpdateInterval = null;
  }
  store.dispatch(setLoading(false));
}; 