import { useEffect, useState } from "react";
import { useBluetoothService } from "../ServiceProvider";
import { DiscoveredDevice } from "../../services/bluetooth/bluetooth";

export function useBluetooth() {
    const service = useBluetoothService();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        async function start() {
            await service.start();
            service.on('devices-updated', (devices: DiscoveredDevice[]) => {
                setDevices(devices);
            });
        }
        start();
        return () => {
            service.stop();
        };
    }, [service]);

    return { devices };
}