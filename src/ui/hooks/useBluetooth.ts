import { useEffect, useState } from "react";
import { useBluetoothService } from "../ServiceProvider";
import { DiscoveredDevice } from "../../services/bluetooth/bluetooth";

export function useBluetooth({ onNewDevice = null }: { onNewDevice?: ((device: DiscoveredDevice) => void) | null } = {}) {
    const service = useBluetoothService();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        async function start() {
            await service.start();
            service.on('devices-updated', (devices: DiscoveredDevice[]) => {
                setDevices(devices);
            });

            if (onNewDevice !== null) {
                service.on('device-discovered', onNewDevice);
            }
        }
        start();
        return () => {
            service.stop();
            service.removeAllListeners();
        };
    }, [service]);

    return { devices };
}