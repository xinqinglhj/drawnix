import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeading } from './dialog';
import { DrawingService, RemoteDrawing } from '../../api/drawing-service';
import { useI18n } from '../../i18n';
import './cloud-file-dialog.scss';
import { TrashIcon } from '../icons';

export interface CloudFileDialogProps {
    onClose: () => void;
    onOpen: (drawing: RemoteDrawing, readonly: boolean) => void;
}

export const CloudFileDialog: React.FC<CloudFileDialogProps> = ({
    onClose,
    onOpen,
}) => {
    const { t } = useI18n();
    const [drawings, setDrawings] = useState<RemoteDrawing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const fetchDrawings = async () => {
        setLoading(true);
        try {
            const result = await DrawingService.getAll({
                page,
                pageSize,
                title: search
            });
            setDrawings(result.data);
            setTotal(result.total);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when parameters change
    useEffect(() => {
        fetchDrawings();
    }, [page, pageSize]);

    // Handle search enter or blur
    const handleSearch = () => {
        setPage(1); // Reset to page 1 on search
        fetchDrawings();
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm(t('cloud.deleteConfirm'))) {
            try {
                await DrawingService.delete(id);
                fetchDrawings(); // Reload current page
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    const totalPage = Math.ceil(total / pageSize);

    return (
        <Dialog
            open={true}
            onOpenChange={(val) => !val && onClose()}
        >
            <DialogContent className="cloud-file-dialog">
                <DialogHeading>{t('cloud.dialogTitle')}</DialogHeading>

                {/* Search Bar */}
                <div style={{ padding: '0 10px 10px 10px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={t('cloud.searchPlaceholder')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '8px 16px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                </div>

                <div className="cloud-file-list">
                    {loading && <div>{t('cloud.loading')}</div>}
                    {error && <div className="error">{error}</div>}
                    {!loading && !error && drawings.length === 0 && (
                        <div className="empty">{t('cloud.empty')}</div>
                    )}
                    {drawings.map((drawing) => (
                        <div
                            key={drawing.id}
                            className="cloud-file-item"
                        >
                            <div className="file-info">
                                <span className="file-title">{drawing.title}</span>
                                <span className="file-date">
                                    {new Date(drawing.updated_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="file-actions">
                                <button
                                    className="action-btn"
                                    onClick={() => onOpen(drawing, true)}
                                    title={t('cloud.view') || 'View'}
                                >
                                    {t('cloud.view') || 'View'}
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() => onOpen(drawing, false)}
                                    title={t('cloud.edit') || 'Edit'}
                                >
                                    {t('cloud.edit') || 'Edit'}
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDelete(e, drawing.id)}
                                    title={t('general.delete')}
                                >
                                    {TrashIcon}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Footer */}
                {total > 0 && (
                    <div style={{
                        padding: '10px',
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#666'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{t('cloud.rowsPerPage')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{ padding: '2px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                            <span>{t('cloud.total').replace('{{total}}', total.toString())}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                style={{ cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                            >
                                {t('cloud.prev')}
                            </button>
                            <span>
                                {t('cloud.pageInfo')
                                    .replace('{{page}}', page.toString())
                                    .replace('{{totalPage}}', totalPage.toString())}
                            </span>
                            <button
                                disabled={page >= totalPage}
                                onClick={() => setPage(p => p + 1)}
                                style={{ cursor: page >= totalPage ? 'not-allowed' : 'pointer', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                            >
                                {t('cloud.next')}
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
