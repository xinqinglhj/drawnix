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
    },

    // Bulk Sync: Cloud -> Local
    async syncAllToLocal(onProgress?: (current: number, total: number) => void): Promise<void> {
        let page = 1;
        const pageSize = 50;
        let hasMore = true;
        let processed = 0;
        let total = 0;

        while (hasMore) {
            const result = await DrawingService.getAll({ page, pageSize });
            if (page === 1) total = result.total;

            if (result.data.length === 0) {
                hasMore = false;
                break;
            }

            for (const drawing of result.data) {
                try {
                    await this.syncToLocal(drawing);
                } catch (e) {
                    console.error(`Failed to sync drawing ${drawing.id} to local`, e);
                }
                processed++;
                onProgress?.(processed, total);
            }

            if (result.data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        }
    },

    // Bulk Sync: Local -> Cloud
    async syncAllToCloud(onProgress?: (current: number, total: number) => void): Promise<void> {
        let page = 1;
        const pageSize = 50;
        let hasMore = true;
        let processed = 0;
        let total = 0;

        while (hasMore) {
            const result = await LocalDrawingService.getAll({ page, pageSize });
            if (page === 1) total = result.total;

            if (result.data.length === 0) {
                hasMore = false;
                break;
            }

            for (const drawing of result.data) {
                try {
                    await this.syncToCloud(drawing);
                } catch (e) {
                    console.error(`Failed to sync local drawing ${drawing.id} to cloud`, e);
                }
                processed++;
                onProgress?.(processed, total);
            }

            if (result.data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        }
    }
};
