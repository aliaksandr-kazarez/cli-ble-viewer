import { useEffect, useState } from "react";
import { logger } from "../../utils";
import { useBluetoothService } from "../ServiceProvider";
import { DiscoveredDevice } from "../../services/bluetoothService";

export function useBluetooth() {
    const service = useBluetoothService();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        async function start() {
            await service.start();
            service.on('devices-updated', (devices) => {
                logger.info('Devices updated', { devices });
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