import { useEffect, useState } from "react";
import { logger } from "../../utils";
import { useBluetoothService } from "../ServiceProvider";
import { NobleDevice } from "../../types/ble";

export function useBluetooth() {
    const service = useBluetoothService();
    const [devices, setDevices] = useState<NobleDevice[]>([]);

    useEffect(() => {
        service.start((devices) => {
            logger.info('Devices updated', { devices });
            setDevices(devices);
        });
    }, [service]);

    return { devices };
}