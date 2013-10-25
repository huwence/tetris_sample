function Block(x, y, width, height, color, flag) {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
    this.color = color || '#ccc';
    this.flag = flag;
}

Block.prototype.draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this,y, this.width, this.height);
}

var WIDTH = 10,
    HEIGHT = WIDTH,
    CANVAS_WIDTH = 320,
    CANVAS_HEIGHT = 550,
    LEN = 3,
    NUM = 4,
    START_X = CANVAS_WIDTH / 2 - WIDTH / 2,
    START_Y = 0,
    VELOCITY_Y = 5, 
    PREFIX = 'COMPOSITE_';
    COMPOSITE = { 
        COMPOSITE_1: [[[1, 0], [1, 1], [0, 1]]], //Sqaure
        COMPOSITE_2: [[[0, -1], [0, 1], [0, 2]], [[-1, 0], [1, 0], [2, 0]]], //Rect
        COMPOSITE_3: [[[0, -1], [1, 0], [-1, 0]], [[0, -1], [1, 0], [0, 1]], [[1, 0], [0, 1], [-1, 0]], [[0, -1], [0, 1], [-1, 0]]],
        COMPOSITE_4: [[[1, 0], [0, -1], [0, -2]], [[1, 0], [2, 0], [0, 1]], [[0, 1], [0, 2], [-1, 0]], [[0, -1], [-1, 0], [-2, 0]]]
    },
    BLOCKS = [];

//type = 1, 2, 3, 4
function updateComposite(blocks) {
    if (!blocks.length)
        return;

    var block_start = blocks[i];

    block_start.draw(CONTEXT);
    for (var i = 1; i < LEN + 1; i ++) {
        block.x = block_start.x + composite[i][0] * WIDTH;
        block.y = block_start.y + composite[i][1] * HEIGHT;

        block.draw(CONTEXT);
    }

}

function updateBlock(block) {
    if (!block)
        return;

    block.draw(CONTEXT);
}

function generateComposite() {
    var type = Math.ceil(Math.random() * 4),
        composites = COMPOSITE[PREFIX + type];

    if (!composites)
        return;

    var composite = composites[0],
        block_start = new Block(START_X, START_Y, WIDTH, HEIGHT, 1);

    BLOCKS.push(block_start);

    for (var i = 0; i < LEN; i ++) {
        BLOCKS.push(new Block(START_X + composite[i][0] * WIDTH, START_Y + composite[i][1] * HEIGHT, WIDTH, HEIGHT));
    }
}

function update() {

    if (BLOCKS.length === 0) {
        generateComposite();
    }

    for (var i = 0, l = BLOCKS.length; i < l; i ++) {
        var block = BLOCKS[i],
            flag  = block.flag;

        //composite
        if (flag) {
            i += NUM;
            block.y += VELOCITY_Y;
            updateComposite([block, BLOCKS[i + 1], BLOCKS[i + 2], BLOCKS[i + 3]]);
        } else {
            updateBlock(block);
        }
    }
}
    

function main() {


}
