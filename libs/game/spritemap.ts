namespace sprites {
    export interface ISpriteMap {
        getOverlappingSprites(sprite: Sprite): Sprite[];
        draw(camera: scene.Camera): void;
        reset(sprites: Sprite[]): void;
    }

    export class SpriteMap implements ISpriteMap {
        private cellWidth: number;
        private cellHeight: number;
        private rowCount: number;
        private columnCount: number;
        private buckets: Sprite[][];

        constructor() {
            this.buckets = [];
        }

        /**
         * Returns a potential list of neighbors
         */
        private neighbors(sprite: Sprite): { [key: string]: Sprite } {
            const neighbors: { [key: string]: Sprite } = {};
            const layer = sprite.layer;

            const left = sprite.left;
            const top = sprite.top;
            const xn = Math.idiv(
                sprite.width + this.cellWidth - 1,
                this.cellWidth
            );
            const yn = Math.idiv(
                sprite.height + this.cellHeight - 1,
                this.cellHeight
            );
            for (let x = 0; x <= xn; x++) {
                for (let y = 0; y <= yn; y++) {
                    const key = this.key(left + Math.min(sprite.width, x * this.cellWidth),
                    top + Math.min(sprite.height, y * this.cellHeight))
                    this.insertAt(key, sprite)
                    this.mergeAt(key, layer, neighbors)
                }
            }
            neighbors[sprite.id] = undefined;
            return neighbors;
        }

        /**
         * Gets the overlaping sprites if any
         * @param sprite
         */
        public getOverlappingSprites(sprite: Sprite): Sprite[] {
            control.enablePerfCounter("spritemap_overlaps");
            const neighbors = this.neighbors(sprite);

            const overlappingSprites: Sprite[] = [];
            for (const key of Object.keys(neighbors)) {
                const neighbor = neighbors[key];
                if (neighbor && sprite.overlapsWith(neighbor)) {
                    overlappingSprites.push(neighbor);
                }
            }

            return overlappingSprites;
        }

        public draw(camera: scene.Camera) {
            for (let x = 0; x < this.columnCount; ++x) {
                for (let y = 0; y < this.rowCount; ++y) {
                    const left = x * this.cellWidth - camera.drawOffsetX;;
                    const top = y * this.cellHeight - camera.drawOffsetY;
                    const k = this.key(left, top);
                    const b = this.buckets[k];
                    if (b && b.length)
                        screen.drawRect(left, top, this.cellWidth, this.cellHeight, 5);
                }
            }
        }

        /**
         * Recompute hashes for all objects
         */
        private resizeBuckets(sprites: Sprite[]) {
            // rescale buckets
            let maxWidth = 0;
            let maxHeight = 0;
            for (const sprite of sprites) {
                if (sprite.width > maxWidth) maxWidth = sprite.width;
                if (sprite.height > maxHeight) maxHeight = sprite.height;
            }

            const tMap = game.currentScene().tileMap;

            // TODO: If we are not using a tile map, the number of buckets is based on the screen size
            // Anything outside the screen is but into one giant bucket
            const areaWidth = tMap ? tMap.areaWidth() : screen.width;
            const areaHeight = tMap ? tMap.areaHeight() : screen.height;

            this.cellWidth = Math.clamp(8, areaWidth >> 2, maxWidth * 2);
            this.cellHeight = Math.clamp(8, areaHeight >> 2, maxHeight * 2);
            this.rowCount = Math.ceil(areaHeight / this.cellHeight);
            this.columnCount = Math.ceil(areaWidth / this.cellWidth);
        }

        /**
         * Clears the spritemap and recomputes the buckets
         * @param sprites 
         */
        public reset(sprites: Sprite[]) {
            this.buckets = [];
            this.resizeBuckets(sprites);
        }

        private key(x: number, y: number): number {
            const xi = Math.clamp(0, this.columnCount, Math.idiv(x, this.cellWidth));
            const yi = Math.clamp(0, this.rowCount, Math.idiv(y, this.cellHeight));
            return xi + yi * this.columnCount;
        }

        private insertAt(key: number, sprite: Sprite) {
            let bucket = this.buckets[key];
            if (!bucket) bucket = this.buckets[key] = [];
            if (bucket.indexOf(sprite) < 0) bucket.push(sprite);
        }

        private mergeAt(key: number, layer: number, neighbors: { [key: string]: Sprite }) {
            const bucket = this.buckets[key];
            if (bucket) {
                for (const sprite of bucket) {
                    if ((sprite.layer & layer) && neighbors[sprite.id] === undefined) {
                        neighbors[sprite.id] = sprite;
                    }
                } 
            }
        }

        toString() {
            return `${this.buckets.length} buckets, ${this.buckets.filter(b => !!b).length} filled`;
        }
    }
}