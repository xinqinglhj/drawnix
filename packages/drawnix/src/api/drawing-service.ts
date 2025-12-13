const API_BASE_URL = 'http://localhost:3000/api';

export interface RemoteDrawing {
    id: number;
    title: string;
    data: string;
    created_at: string;
    updated_at: string;
}

export const DrawingService = {
    async getAll(params: { page?: number; pageSize?: number; title?: string } = {}): Promise<{ total: number; data: RemoteDrawing[] }> {
        const query = new URLSearchParams({
            page: (params.page || 1).toString(),
            pageSize: (params.pageSize || 10).toString(),
            title: params.title || '',
        });
        const response = await fetch(`${API_BASE_URL}/drawings?${query}`);
        if (!response.ok) {
            throw new Error('Failed to fetch drawings');
        }
        const result = await response.json();
        return result; // result is { message, total, data }
    },

    async getOne(id: number): Promise<RemoteDrawing> {
        const response = await fetch(`${API_BASE_URL}/drawings/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch drawing');
        }
        const result = await response.json();
        return result.data;
    },

    async create(title: string, data: any): Promise<RemoteDrawing> {
        const response = await fetch(`${API_BASE_URL}/drawings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, data }),
        });
        if (!response.ok) {
            throw new Error('Failed to create drawing');
        }
        const result = await response.json();
        return result.data;
    },

    async update(id: number, title: string | undefined, data: any | undefined): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/drawings/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, data }),
        });
        if (!response.ok) {
            throw new Error('Failed to update drawing');
        }
    },

    async delete(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/drawings/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete drawing');
        }
    },
};
