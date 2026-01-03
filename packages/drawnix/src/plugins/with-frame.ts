import {
    PlaitBoard,
    PlaitElement,
    PlaitPlugin,
    PlaitPluginElementContext,
    toHostPoint,
    toViewBoxPoint,
    Point,
    idCreator,
    Transforms,
    BoardTransforms,
    PlaitPointerType,
    OnContextChanged,
    RectangleClient,
    ACTIVE_STROKE_WIDTH,
    PlaitOptionsBoard
} from '@plait/core';
import { CommonElementFlavour, createActiveGenerator, ActiveGenerator, hasResizeHandle } from '@plait/common';
import { WithDrawOptions, WithDrawPluginKey } from '@plait/draw';

export const FRAME_TYPE = 'frame';

export const FrameShape = {
    frame: FRAME_TYPE
};

export interface FrameElement extends PlaitElement {
    type: typeof FRAME_TYPE;
    text?: string;
}

export const FrameElement = {
    isFrame: (value: any): value is FrameElement => {
        return value.type === FrameShape.frame;
    }
}

export class FrameComponent extends CommonElementFlavour<FrameElement, PlaitBoard> implements OnContextChanged<FrameElement, PlaitBoard> {
    activeGenerator!: ActiveGenerator<FrameElement>;

    initializeGenerator() {
        this.activeGenerator = createActiveGenerator(this.board, {
            getRectangle: (element: FrameElement) => {
                return RectangleClient.getRectangleByPoints(element.points!);
            },
            getStrokeWidth: () => ACTIVE_STROKE_WIDTH,
            getStrokeOpacity: () => 1,
            hasResizeHandle: () => {
                return hasResizeHandle(this.board, this.element);
            },
        });
    }

    initialize(): void {
        super.initialize();
        this.initializeGenerator();
        this.drawFrame();
    }

    drawFrame() {
        const g = this.getElementG();
        const element = this.element;
        if (element.points && element.points.length > 1) {
            const p1 = element.points[0];
            const p2 = element.points[1];
            const x = Math.min(p1[0], p2[0]);
            const y = Math.min(p1[1], p2[1]);
            const width = Math.abs(p1[0] - p2[0]);
            const height = Math.abs(p1[1] - p2[1]);

            // Clear previous content
            g.innerHTML = '';

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x.toString());
            rect.setAttribute('y', y.toString());
            rect.setAttribute('width', width.toString());
            rect.setAttribute('height', height.toString());
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', '#000');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('stroke-dasharray', '8,4');
            rect.setAttribute('pointer-events', 'visible');

            g.appendChild(rect);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x.toString());
            text.setAttribute('y', (y - 8).toString());
            text.textContent = element.text || 'Frame';
            text.setAttribute('font-size', '14px');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#333');
            text.setAttribute('class', 'frame-label');
            text.setAttribute('cursor', 'pointer');
            text.setAttribute('pointer-events', 'visible');

            // Add double-click listener for text editing
            text.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const currentText = element.text || 'Frame';
                const newText = prompt('Enter frame label:', currentText);

                if (newText !== null) {
                    const index = this.board.children.findIndex(c => c.id === element.id);
                    if (index !== -1) {
                        Transforms.setNode(this.board, { text: newText }, [index]);
                    }
                }
            });

            g.appendChild(text);
        }
    }

    onContextChanged(value: PlaitPluginElementContext<FrameElement, PlaitBoard>, previous: PlaitPluginElementContext<FrameElement, PlaitBoard>) {
        if (value.element !== previous.element || value.hasThemeChanged) {
            this.drawFrame();
            this.activeGenerator.processDrawing(
                this.element,
                PlaitBoard.getActiveHost(this.board),
                {
                    selected: this.selected,
                }
            );
        } else {
            const needUpdate = value.selected !== previous.selected;
            if (needUpdate || value.selected) {
                this.activeGenerator.processDrawing(
                    this.element,
                    PlaitBoard.getActiveHost(this.board),
                    {
                        selected: this.selected,
                    }
                );
            }
        }
    }

    destroy(): void {
        super.destroy();
        this.activeGenerator?.destroy();
    }
}

export const withFrame: PlaitPlugin = (board: PlaitBoard) => {
    const { drawElement, pointerDown, pointerMove, pointerUp, getRectangle, isHit, isMovable, isAlign, isRectangleHit } = board;

    let startPoint: Point | null = null;
    let frameElement: FrameElement | null = null;
    let editingFrameId: string | null = null;

    board.drawElement = (context: PlaitPluginElementContext) => {
        const { element } = context;
        if (FrameElement.isFrame(element)) {
            return FrameComponent;
        }
        return drawElement(context);
    };

    board.getRectangle = (element: PlaitElement) => {
        if (FrameElement.isFrame(element)) {
            return RectangleClient.getRectangleByPoints(element.points!);
        }
        return getRectangle(element);
    };

    board.isHit = (element, point) => {
        if (FrameElement.isFrame(element)) {
            const rect = RectangleClient.getRectangleByPoints(element.points!);
            return RectangleClient.isPointInRectangle(point, rect);
        }
        return isHit(element, point);
    };

    board.isMovable = (element) => {
        if (FrameElement.isFrame(element)) {
            return true;
        }
        return isMovable(element);
    };

    board.isAlign = (element) => {
        if (FrameElement.isFrame(element)) {
            return true;
        }
        return isAlign(element);
    };

    board.isRectangleHit = (element, selection) => {
        if (FrameElement.isFrame(element)) {
            const elementRect = RectangleClient.getRectangleByPoints(element.points!);
            const selectionRect = RectangleClient.getRectangleByPoints([selection.anchor, selection.focus]);
            return RectangleClient.isHit(elementRect, selectionRect);
        }
        return isRectangleHit(element, selection);
    };

    board.pointerDown = (event: PointerEvent) => {
        if (board.pointer === FrameShape.frame) {
            const point = toViewBoxPoint(board, toHostPoint(board, event.x, event.y));
            startPoint = point;

            frameElement = {
                id: idCreator(),
                type: FrameShape.frame as 'frame',
                points: [point, point],
                text: 'Frame'
            };

            Transforms.insertNode(board, frameElement, [board.children.length]);

            event.preventDefault();
            return;
        }
        pointerDown(event);
    };

    board.pointerMove = (event: PointerEvent) => {
        if (startPoint && frameElement && board.pointer === FrameShape.frame) {
            const currentPoint = toViewBoxPoint(board, toHostPoint(board, event.x, event.y));
            const newPoints = [startPoint, currentPoint];

            const index = board.children.findIndex(c => c.id === frameElement!.id);
            if (index !== -1) {
                const path = [index];
                Transforms.setNode(board, { points: newPoints }, path);
                frameElement = { ...frameElement, points: newPoints };
            }
            return;
        }
        pointerMove(event);
    };

    board.pointerUp = (event: PointerEvent) => {
        if (startPoint && frameElement && board.pointer === FrameShape.frame) {
            startPoint = null;
            frameElement = null;
            BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
            return;
        }
        pointerUp(event);
    };

    // Register Frame as a custom geometry type with the draw plugin
    (board as PlaitOptionsBoard).setPluginOptions<WithDrawOptions>(
        WithDrawPluginKey,
        { customGeometryTypes: [FRAME_TYPE] }
    );

    return board;
};
