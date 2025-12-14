import { DrawingService, RemoteDrawing } from './drawing-service';
import { LocalDrawingService, LocalDrawing } from './local-drawing-service';

export enum StorageMode {
    Cloud = 'cloud',
    Local = 'local'
}

export const StorageManager = {
    // Sync Cloud to Local
    async syncToLocal(cloudDrawing: RemoteDrawing): Promise<LocalDrawing> {
        // Check if exists locally? For simple sync, we just create a new one or update if we tracked IDs.
        // Since IDs are different (Cloud ID vs Local AutoInc ID), we treat it as a copy Import.
        // We'll append (Cloud) to title to distinguish or just keep it.
        const data = JSON.parse(cloudDrawing.data);
        return await LocalDrawingService.create(cloudDrawing.title, data);
    },

    // Sync Local to Cloud
    async syncToCloud(localDrawing: LocalDrawing): Promise<RemoteDrawing> {
        const data = JSON.parse(localDrawing.data);
        return await DrawingService.create(localDrawing.title, data);
    }
};
