// Almacén simple en memoria para compartir números generados entre rutas
// sin necesidad de un Context Provider pesado.

type Listener = (numbers: number[]) => void;

let sharedNumbers: number[] = [];
const listeners: Set<Listener> = new Set();

export const setSharedNumbers = (numbers: number[]) => {
    sharedNumbers = numbers;
    listeners.forEach(listener => listener(sharedNumbers));
};

export const getSharedNumbers = () => {
    return sharedNumbers;
};

export const subscribeToSharedNumbers = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
