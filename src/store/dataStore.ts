// Almacén simple en memoria para compartir números generados entre rutas
// sin necesidad de un Context Provider pesado.

type Listener = (numbers: number[]) => void;

let sharedNumbers: number[] = [];
let sharedGeneratorConfig: any = null;
const listeners: Set<Listener> = new Set();

export const setSharedNumbers = (numbers: number[], config?: any) => {
    sharedNumbers = numbers;
    if (config) sharedGeneratorConfig = config;
    listeners.forEach(listener => listener(sharedNumbers));
};

export const setSharedGeneratorConfig = (config: any) => {
    sharedGeneratorConfig = config;
};

export const getSharedNumbers = () => {
    return sharedNumbers;
};

export const getSharedGeneratorConfig = () => {
    return sharedGeneratorConfig;
};

export const subscribeToSharedNumbers = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
