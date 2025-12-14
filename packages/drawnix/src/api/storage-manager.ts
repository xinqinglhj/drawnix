import { DrawingService, RemoteDrawing } from './drawing-service';
import { LocalDrawingService, LocalDrawing } from './local-drawing-service';

export enum StorageMode {
    Cloud = 'cloud',
    Local = 'local'
}

export const StorageManager = {
    // Sync Cloud to Local
    async syncToLocal(cloudDrawing: RemoteDrawing): Promise<LocalDrawing> {
        let dataStr = cloudDrawing.data;
        if (!dataStr) {
            // Fetch full details if data is missing (common in list views)
            try {
                const full = await DrawingService.getOne(cloudDrawing.id);
                dataStr = full.data;
            } catch (e) {
                console.error("Failed to fetch full cloud drawing for sync", e);
                throw new Error("Could not fetch full drawing data from server.");
            }
        }

        const data = JSON.parse(dataStr);
        return await LocalDrawingService.create(cloudDrawing.title, data);
    },

    // Sync Local to Cloud
    async syncToCloud(localDrawing: LocalDrawing): Promise<RemoteDrawing> {
        // Local drawings likely have data if fetched from IDB getAll, but checking is safe
        let dataStr = localDrawing.data;
        if (!dataStr) {
            try {
                const full = await LocalDrawingService.getOne(localDrawing.id);
                dataStr = full.data;
            } catch (e) {
                throw new Error("Could not fetch full local drawing data.");
            }
        }
        const data = JSON.parse(dataStr);
        return await DrawingService.create(localDrawing.title, data);
    }
};
