import { useEffect } from "react";
import { logger } from "../../utils";
import { useBluetoothService } from "../ServiceProvider";

export function useBluetooth() {
    const service = useBluetoothService();

    useEffect(() => {
        service.start((devices) => {
            logger.info('Devices updated', { devices });
        });
    }, [service]);
}