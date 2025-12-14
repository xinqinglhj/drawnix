import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface LocalDrawing {
    id: number;
    title: string;
    data: string; // JSON string of drawing data
    created_at: string;
    updated_at: string;
}

interface DrawnixDB extends DBSchema {
    drawings: {
        key: number; // keyPath: 'id', autoIncrement: true
        value: LocalDrawing;
        indexes: { 'created_at': string };
    };
}

const DB_NAME = 'drawnix-db';
const STORE_NAME = 'drawings';

export const LocalDrawingService = {
    async getDB(): Promise<IDBPDatabase<DrawnixDB>> {
        return openDB<DrawnixDB>(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('created_at', 'created_at');
                }
            },
        });
    },

    async getAll(params: { page?: number; pageSize?: number; title?: string } = {}): Promise<{ total: number; data: LocalDrawing[] }> {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        let drawings = await store.getAll();

        // Sort by updated_at desc (in-memory specific for now as IDB sorting complex queries is tricky without huge indices)
        drawings.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        // Filter by title
        if (params.title) {
            const lowerTitle = params.title.toLowerCase();
            drawings = drawings.filter(d => d.title.toLowerCase().includes(lowerTitle));
        }

        const total = drawings.length;

        // Paging
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const data = drawings.slice(start, end);

        return { total, data };
    },

    async getOne(id: number): Promise<LocalDrawing> {
        const db = await this.getDB();
        const drawing = await db.get(STORE_NAME, id);
        if (!drawing) {
            throw new Error(`Drawing with id ${id} not found locally`);
        }
        return drawing;
    },

    async create(title: string, data: any): Promise<LocalDrawing> {
        const db = await this.getDB();
        const now = new Date().toISOString();
        const drawing: Omit<LocalDrawing, 'id'> = {
            title,
            data: JSON.stringify(data),
            created_at: now,
            updated_at: now,
        };
        const id = await db.add(STORE_NAME, drawing as LocalDrawing);
        return { ...drawing, id } as LocalDrawing;
    },

    async update(id: number, title: string | undefined, data: any | undefined): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const existing = await store.get(id);
        if (!existing) {
            throw new Error(`Drawing with id ${id} not found locally`);
        }

        const updated: LocalDrawing = {
            ...existing,
            updated_at: new Date().toISOString(),
        };

        if (title !== undefined) updated.title = title;
        if (data !== undefined) updated.data = JSON.stringify(data);

        await store.put(updated);
        await tx.done;
    },

    async delete(id: number): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    }
};
