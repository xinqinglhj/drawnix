import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeading, DialogClose } from './dialog';
import { DrawingService, RemoteDrawing } from '../../api/drawing-service';
import { useI18n } from '../../i18n';
import './cloud-file-dialog.scss';
import { TrashIcon } from '../icons';

export interface CloudFileDialogProps {
    onClose: () => void;
    onOpen: (drawing: RemoteDrawing) => void;
}

export const CloudFileDialog: React.FC<CloudFileDialogProps> = ({
    onClose,
    onOpen,
}) => {
    const { t } = useI18n();
    const [drawings, setDrawings] = useState<RemoteDrawing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDrawings = async () => {
        setLoading(true);
        try {
            const data = await DrawingService.getAll();
            setDrawings(data);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrawings();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm(t('cloud.deleteConfirm'))) {
            try {
                await DrawingService.delete(id);
                fetchDrawings();
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    return (
        <Dialog
            open={true}
            onOpenChange={(val) => !val && onClose()}
        >
            <DialogContent className="cloud-file-dialog">
                <DialogHeading>{t('cloud.dialogTitle')}</DialogHeading>
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
                            onClick={() => onOpen(drawing)}
                        >
                            <div className="file-info">
                                <span className="file-title">{drawing.title}</span>
                                <span className="file-date">
                                    {new Date(drawing.updated_at).toLocaleString()}
                                </span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(e, drawing.id)}
                                title={t('general.delete')}
                            >
                                {TrashIcon}
                            </button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
