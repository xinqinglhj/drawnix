import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeading } from './dialog';
import { DrawingService, RemoteDrawing } from '../../api/drawing-service';
import { useI18n } from '../../i18n';
import './cloud-file-dialog.scss';
import { TrashIcon } from '../icons';

import { LocalDrawingService } from '../../api/local-drawing-service';
import { StorageManager } from '../../api/storage-manager';

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

    // Tab State: 'cloud' | 'local'
    const [tab, setTab] = useState<'cloud' | 'local'>('cloud');

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const fetchDrawings = async () => {
        setLoading(true);
        try {
            let result;
            if (tab === 'local') {
                result = await LocalDrawingService.getAll({
                    page,
                    pageSize,
                    title: search
                });
            } else {
                result = await DrawingService.getAll({
                    page,
                    pageSize,
                    title: search
                });
            }
            // Temporarily cast generic LocalDrawing to RemoteDrawing for uniform state
            // (They structure is compatible enough for list view)
            setDrawings(result.data as any);
            setTotal(result.total);
            setError(null);
        } catch (e: any) {
            setError(e.message);
            // If cloud fails, maybe suggest local?
            if (tab === 'cloud') {
                // Don't auto-switch just yet to avoid confusion, but show error.
            }
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when parameters or TAB change
    useEffect(() => {
        fetchDrawings();
    }, [page, pageSize, tab]);

    // Handle search enter or blur
    const handleSearch = () => {
        setPage(1); // Reset to page 1 on search
        fetchDrawings();
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm(t('cloud.deleteConfirm'))) {
            try {
                if (tab === 'local') {
                    await LocalDrawingService.delete(id);
                } else {
                    await DrawingService.delete(id);
                }
                fetchDrawings(); // Reload current page
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    const handleSyncToLocal = async (drawing: RemoteDrawing) => {
        try {
            await StorageManager.syncToLocal(drawing);
            alert(t('cloud.syncSuccess') || 'Saved into Local Storage!');
        } catch (e: any) {
            alert('Sync failed: ' + e.message);
        }
    };

    const handleSyncToCloud = async (drawing: any) => { // using any for simplified local drawing type
        try {
            await StorageManager.syncToCloud(drawing);
            alert(t('cloud.syncSuccess') || 'Uploaded to Cloud!');
        } catch (e: any) {
            alert('Upload failed: ' + e.message);
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


                {/* Tabs */}
                <div className="tab-header" style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
                    <div
                        onClick={() => { setTab('cloud'); setPage(1); }}
                        style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: tab === 'cloud' ? '2px solid #007bff' : 'none',
                            color: tab === 'cloud' ? '#007bff' : '#666',
                            fontWeight: tab === 'cloud' ? 600 : 400
                        }}
                    >
                        {t('cloud.tabCloud') || 'Cloud Drawings'}
                    </div>
                    <div
                        onClick={() => { setTab('local'); setPage(1); }}
                        style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: tab === 'local' ? '2px solid #007bff' : 'none',
                            color: tab === 'local' ? '#007bff' : '#666',
                            fontWeight: tab === 'local' ? 600 : 400
                        }}
                    >
                        {t('cloud.tabLocal') || 'Local Drawings'}
                    </div>
                </div>

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

                                {/* Sync Actions */}
                                {tab === 'cloud' ? (
                                    <button
                                        className="action-btn"
                                        onClick={() => handleSyncToLocal(drawing)}
                                        title={t('cloud.syncToLocal') || 'Save to Local'}
                                    >
                                        💾
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn"
                                        onClick={() => handleSyncToCloud(drawing as any)}
                                        title={t('cloud.syncToCloud') || 'Upload to Cloud'}
                                    >
                                        ☁️
                                    </button>
                                )}

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
