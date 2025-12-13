import {
  ExportImageIcon,
  GithubIcon,
  OpenFileIcon,
  SaveFileIcon,
  SaveFileIcon as OverwriteIcon, // Icon for overwrite
  TrashIcon,
} from '../../icons';
import { useState } from 'react';
import { useBoard, useListRender } from '@plait-board/react-board';
import {
  BoardTransforms,
  PlaitBoard,
  PlaitElement,
  PlaitTheme,
  ThemeColorMode,
  Viewport,
} from '@plait/core';
import { loadFromJSON, saveAsJSON } from '../../../data/json';
import MenuItem from '../../menu/menu-item';
import MenuItemLink from '../../menu/menu-item-link';
import { saveAsImage, saveAsSvg } from '../../../utils/image';
import { useDrawnix } from '../../../hooks/use-drawnix';
import { useI18n } from '../../../i18n';
import Menu from '../../menu/menu';
import { useContext } from 'react';
import { MenuContentPropsContext } from '../../menu/common';
import { EVENT } from '../../../constants';
import { getShortcutKey } from '../../../utils/common';
import { DrawingService } from '../../../api/drawing-service';
import { CloudFileDialog } from '../../dialog/cloud-file-dialog';
import { Dialog, DialogContent, DialogHeading } from '../../dialog/dialog';

export const SaveToFile = () => {
  const board = useBoard();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="save-button"
      onSelect={() => {
        saveAsJSON(board);
      }}
      icon={SaveFileIcon}
      aria-label={t('menu.saveFile')}
      shortcut={getShortcutKey('CtrlOrCmd+S')}
    >{t('menu.saveFile')}</MenuItem>
  );
};
SaveToFile.displayName = 'SaveToFile';

export const SaveToServerMenuItem = ({ onClick }: { onClick: () => void }) => {
  const { t } = useI18n();
  return (
    <MenuItem
      onSelect={onClick}
      icon={SaveFileIcon}
      aria-label={t('menu.saveToServer')}
    >
      {t('menu.saveToServer')}
    </MenuItem>
  );
};

export const SaveToServerDialog = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const board = useBoard();
  const { t } = useI18n();
  const { appState } = useDrawnix();
  const [title, setTitle] = useState('');

  const handleSave = async (isNew: boolean) => {
    if (!title && isNew) {
      alert('Please enter a title');
      return;
    }
    try {
      const saveData = {
        elements: board.children,
        viewport: board.viewport,
        theme: board.theme
      };

      if (!isNew && appState.currentDrawingId) {
        // Overwrite logic
        await DrawingService.update(appState.currentDrawingId, {
          data: JSON.stringify(saveData)
          // We don't update title here to keep it simple, or we could pass title if provided
        });
        alert('Overwritten successfully!');
      } else {
        // Create new
        await DrawingService.create(title, saveData);
        alert('Saved as new successfully!');
      }

      onClose();
      setTitle('');
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeading>{t('cloud.saveDialogTitle')}</DialogHeading>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>{t('cloud.enterTitle')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={appState.currentDrawingId ? "Leave empty to keep title (if overwriting)" : "Enter title"}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button onClick={onClose} style={{ padding: '5px 10px' }}>{t('cloud.cancel')}</button>

            {appState.currentDrawingId && (
              <button
                onClick={() => handleSave(false)}
                style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Overwrite current file"
              >
                <OverwriteIcon /> {t('cloud.overwrite')}
              </button>
            )}

            <button
              onClick={() => handleSave(true)}
              style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {appState.currentDrawingId ? t('cloud.saveAsNew') : t('cloud.save')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CloudDrawingsMenuItem = ({ onClick }: { onClick: () => void }) => {
  const { t } = useI18n();
  return (
    <MenuItem
      onSelect={onClick}
      icon={OpenFileIcon}
      aria-label={t('menu.cloudDrawings')}
    >
      {t('menu.cloudDrawings')}
    </MenuItem>
  );
};

export const CloudDrawingsDialog = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const board = useBoard();
  const listRender = useListRender();
  const { appState, setAppState } = useDrawnix();

  const clearAndLoad = (
    value: PlaitElement[],
    viewport?: Viewport,
    theme?: PlaitTheme
  ) => {
    board.children = value;
    board.viewport = viewport || { zoom: 1 };
    board.theme = theme || { themeColorMode: ThemeColorMode.default };
    listRender.update(board.children, {
      board: board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    BoardTransforms.fitViewport(board);
  };

  if (!open) return null;

  return (
    <CloudFileDialog
      onClose={onClose}
      onOpen={async (drawing, readonly) => {
        try {
          // Fetch full details including 'data'
          const fullDrawing = await DrawingService.getOne(drawing.id);
          const data = JSON.parse(fullDrawing.data);

          if (Array.isArray(data)) {
            clearAndLoad(data);
          } else {
            clearAndLoad(data.elements, data.viewport, data.theme);
          }

          // Update Global State
          setAppState(prev => ({
            ...prev,
            currentDrawingId: drawing.id,
            readonly: readonly
          }));

          onClose();
        } catch (e) {
          console.error('Failed to parse drawing data', e);
          alert('Failed to open drawing');
        }
      }}
    />
  );
};

export const OpenFile = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { t } = useI18n();
  const clearAndLoad = (
    value: PlaitElement[],
    viewport?: Viewport,
    theme?: PlaitTheme
  ) => {
    board.children = value;
    board.viewport = viewport || { zoom: 1 };
    board.theme = theme || { themeColorMode: ThemeColorMode.default };
    listRender.update(board.children, {
      board: board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    BoardTransforms.fitViewport(board);
  };
  return (
    <MenuItem
      data-testid="open-button"
      onSelect={() => {
        loadFromJSON(board).then((data) => {
          clearAndLoad(data.elements, data.viewport);
        });
      }}
      icon={OpenFileIcon}
      aria-label={t('menu.open')}
    >{t('menu.open')}</MenuItem>
  );
};
OpenFile.displayName = 'OpenFile';

export const SaveAsImage = () => {
  const board = useBoard();
  const menuContentProps = useContext(MenuContentPropsContext);
  const { t } = useI18n();
  return (
    <MenuItem
      icon={ExportImageIcon}
      data-testid="image-export-button"
      onSelect={() => {
        saveAsImage(board, true);
      }}
      submenu={
        <Menu onSelect={() => {
          const itemSelectEvent = new CustomEvent(EVENT.MENU_ITEM_SELECT, {
            bubbles: true,
            cancelable: true,
          });
          menuContentProps.onSelect?.(itemSelectEvent);
        }}>
          <MenuItem
            onSelect={() => {
              saveAsSvg(board);
            }}
            aria-label={t('menu.exportImage.svg')}
          >
            {t('menu.exportImage.svg')}
          </MenuItem>
          <MenuItem
            onSelect={() => {
              saveAsImage(board, true);
            }}
            aria-label={t('menu.exportImage.png')}
          >
            {t('menu.exportImage.png')}
          </MenuItem>
          <MenuItem
            onSelect={() => {
              saveAsImage(board, false);
            }}
            aria-label={t('menu.exportImage.jpg')}
          >
            {t('menu.exportImage.jpg')}
          </MenuItem>
        </Menu>
      }
      shortcut={getShortcutKey('CtrlOrCmd+Shift+E')}
      aria-label={t('menu.exportImage')}
    >
      {t('menu.exportImage')}
    </MenuItem>
  );
};
SaveAsImage.displayName = 'SaveAsImage';

export const CleanBoard = () => {
  const { appState, setAppState } = useDrawnix();
  const { t } = useI18n();
  return (
    <MenuItem
      icon={TrashIcon}
      data-testid="reset-button"
      onSelect={() => {
        setAppState({
          ...appState,
          openCleanConfirm: true,
        });
      }}
      shortcut={getShortcutKey('CtrlOrCmd+Backspace')}
      aria-label={t('menu.cleanBoard')}
    >
      {t('menu.cleanBoard')}
    </MenuItem>
  );
};
CleanBoard.displayName = 'CleanBoard';

export const Socials = () => {
  return (
    <MenuItemLink
      icon={GithubIcon}
      href="https://github.com/plait-board/drawnix"
      aria-label="GitHub"
    >
      GitHub
    </MenuItemLink>
  );
};
Socials.displayName = 'Socials';
