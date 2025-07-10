import { useEffect, useState } from "react";
import { useScaleConnectionService } from "../ServiceProvider";
import { DiscoveredDevice } from "../../services/bluetoothService";
import { BatteryReading, ScaleWeightReading } from "../../services/scaleConnectionService";

export function useScales({ device }: { device: DiscoveredDevice }) {
    const scaleConnectionService = useScaleConnectionService();
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [weight, setWeight] = useState<ScaleWeightReading | null>(null);
    const [battery, setBattery] = useState<BatteryReading | null>(null);

    useEffect(() => {
        async function start() {
            try {
                setStatus('connecting');
                scaleConnectionService.connect(device);
                scaleConnectionService.on('weight', (weight) => {
                    setWeight(weight);
                });
                scaleConnectionService.on('battery', (battery) => {
                    setBattery(battery);
                });
                scaleConnectionService.on('connected', () => {
                    setStatus('connected');
                });
                scaleConnectionService.on('disconnected', () => {
                    setStatus('disconnected');
                });
            } catch (error) {
                setStatus('error');
            }
        }
        start();
        return () => {
            scaleConnectionService.disconnect();
            scaleConnectionService.removeAllListeners();
            setWeight(null);
            setBattery(null);   
            setStatus('disconnected');
        };
    }, [scaleConnectionService, device]);

    return { status, weight, battery };
}