export const enum TouchSwipeEventType {
	tap = 'tap',
	up = 'swipeup',
	down = 'swipedown',
	left = 'swipeleft',
	right = 'swiperight'
}

export default class TouchSweep {
	private element: HTMLElement;
	private eventData: Record<string, unknown>;
	private threshold: number;
	private isDragging: boolean;
	private coords: Record<'startX' | 'startY' | 'moveX' | 'moveY' | 'endX' | 'endY', number>;
	private scratchCoords: Record<'x' | 'y', number>;

	constructor(element = document.body, data = {}, threshold = 40) {
		this.element = element;
		this.eventData = data;
		this.threshold = threshold;
		this.isDragging = false;

		this.coords = {
			startX: 0,
			startY: 0,
			moveX: 0,
			moveY: 0,
			endX: 0,
			endY: 0
		};
		this.scratchCoords = {
			x: 0,
			y: 0
		};

		this.onStart = this.onStart.bind(this);
		this.onMove = this.onMove.bind(this);
		this.onEnd = this.onEnd.bind(this);

		this.bind();

		return this;
	}

	public bind(): void {
		const { element } = this;
		element.addEventListener('touchstart', this.onStart, false);
		element.addEventListener('touchmove', this.onMove, false);
		element.addEventListener('touchend', this.onEnd, false);
		element.addEventListener('mousedown', this.onStart, false);
		element.addEventListener('mousemove', this.onMove, false);
		element.addEventListener('mouseup', this.onEnd, false);
	}

	public unbind(): void {
		const { element } = this;
		element.removeEventListener('touchstart', this.onStart, false);
		element.removeEventListener('touchmove', this.onMove, false);
		element.removeEventListener('touchend', this.onEnd, false);
		element.removeEventListener('mousedown', this.onStart, false);
		element.removeEventListener('mousemove', this.onMove, false);
		element.removeEventListener('mouseup', this.onEnd, false);
	}

	private getCoords(event: MouseEvent | TouchEvent): Record<'x' | 'y', number> {
		const out = this.scratchCoords;
		const isMouseEvent = 'pageX' in event;
		out.x = isMouseEvent ? event.pageX : event.changedTouches[0].screenX;
		out.y = isMouseEvent ? event.pageY : event.changedTouches[0].screenY;
		return out;
	}

	private onStart(event: MouseEvent | TouchEvent): void {
		const { x, y } = this.getCoords(event);

		this.isDragging = true;
		this.coords.startX = x;
		this.coords.startY = y;
	}

	private onMove(event: MouseEvent | TouchEvent): void {
		if (!this.isDragging) return;

		const { x, y } = this.getCoords(event);
		this.coords.moveX = x;
		this.coords.moveY = y;
		this.dispatchMove();
	}

	private onEnd(event: MouseEvent | TouchEvent): void {
		const { x, y } = this.getCoords(event);

		this.isDragging = false;
		this.coords.endX = x;
		this.coords.endY = y;
		this.dispatchEnd();
		this.resetCoords();
	}

	private resetCoords (): void {
		Object.assign(this.coords, {
			startX: 0,
			startY: 0,
			moveX: 0,
			moveY: 0,
			endX: 0,
			endY: 0
		});
	}

	private dispatchMove (): void {
		const { coords } = this
		const event = new CustomEvent('swipemove', {
			detail: { coords }
		});

		this.element.dispatchEvent(event);
	}

	private getEndEventName(): TouchSwipeEventType | '' {
		const threshold = this.threshold;
		const { startX, startY, endX, endY } = this.coords;
		const distX = Math.abs(endX - startX)
		const distY = Math.abs(endY - startY)
		const isSwipeX = distX > distY

		if (isSwipeX) {
			if (endX < startX && Math.abs(endX - startX) > threshold) {
				return TouchSwipeEventType.left;
			}

			if (endX > startX && Math.abs(endX - startX) > threshold) {
				return TouchSwipeEventType.right;
			}
		} else {
			if (endY < startY && Math.abs(endY - startY) > threshold) {
				return TouchSwipeEventType.up;
			}

			if (endY > startY && Math.abs(endY - startY) > threshold) {
				return TouchSwipeEventType.down;
			}
		}

		if (endY === startY && endX === startX) {
			return TouchSwipeEventType.tap;
		}

		return '';
	}

	private dispatchEnd(): void {
		const eventName = this.getEndEventName();

		if (!eventName) {
			return;
		}

		const event = new CustomEvent(eventName, {
			detail: this.eventData
		});

		this.element.dispatchEvent(event);
	}
}
