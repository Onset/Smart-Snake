import Direction, {
	positionDelta,
	turnLeft,
	turnRight,
} from '../constants/Directions'
import { BoardFieldContent, BoardFieldContentNullable } from './Board'
import { truncate } from 'fs'
import Food from './Food'

const SPACING = 1

interface Position {
	x: number
	y: number
}

export default class Snake {
	private x: number
	private y: number
	private path: Position[] = []
	private color: string
	private direction: Direction
	private hasChangedDirection: boolean = false
	private pendingDirection: 'left' | 'right' | null = null
	private getContent: (x: number, y: number) => BoardFieldContent
	private claim: (x: number, y: number) => BoardFieldContentNullable
	private release: (x: number, y: number) => void
	private eat: (food: Food) => void
	private alive: boolean = true

	constructor(
		x: number,
		y: number,
		color: string,
		getContent: (x: number, y: number) => BoardFieldContent,
		claim: (
			x: number,
			y: number,
			content: BoardFieldContent
		) => BoardFieldContentNullable,
		release: (x: number, y: number, content: BoardFieldContent) => void,
		eat: (food: Food) => void
	) {
		this.x = x
		this.y = y
		this.path.push({ x, y })
		this.direction = Direction.right
		this.color = color
		this.getContent = getContent
		this.claim = (x: number, y: number) => claim(x, y, this)
		this.release = (x: number, y: number) => release(x, y, this)
		this.eat = eat

		this.move()
	}

	public isAlive() {
		return this.alive
	}

	public getColor() {
		return this.color
	}

	public getDirection() {
		return this.direction
	}

	public isObstacle() {
		return true
	}

	public isFood() {
		return false
	}

	public getPosition() {
		return {
			x: this.x,
			y: this.y,
		}
	}

	public move() {
		if (!this.alive) {
			return
		}

		const delta = positionDelta(this.direction)
		const newX = this.x + delta.x
		const newY = this.y + delta.y
		const contentToClaim = this.getContent(newX, newY)
		this.hasChangedDirection = false

		if (contentToClaim.isObstacle()) {
			this.alive = false
			return
		}

		this.x = newX
		this.y = newY
		this.path.push({ x: this.x, y: this.y })

		const claimedContent = this.claim(this.x, this.y)
		if (claimedContent.isFood()) {
			this.eat(claimedContent as Food)
		} else {
			if (this.path.length > 2) {
				const tail = this.path.shift()
				this.release(tail.x, tail.y)
			}
		}

		if (this.pendingDirection !== null) {
			const pending = this.pendingDirection
			this.pendingDirection = null
			if (pending === 'left') {
				this.turnLeft()
			} else if (pending === 'right') {
				this.turnRight()
			}
		}
	}

	public turnLeft() {
		if (this.hasChangedDirection) {
			this.pendingDirection = 'left'
		} else {
			this.hasChangedDirection = true
			this.direction = turnLeft(this.direction)
		}
	}

	public turnRight() {
		if (this.hasChangedDirection) {
			this.pendingDirection = 'right'
		} else {
			this.hasChangedDirection = true
			this.direction = turnRight(this.direction)
		}
	}

	public draw(
		c: CanvasRenderingContext2D,
		xStart: number,
		yStart: number,
		fieldSize: number
	) {
		c.beginPath()
		c.fillStyle = this.color
		c.rect(
			xStart + SPACING,
			yStart + SPACING,
			fieldSize - 2 * SPACING,
			fieldSize - 2 * SPACING
		)
		c.fill()
	}
}
