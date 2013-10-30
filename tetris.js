var WIDTH = 20,
    HEIGHT = WIDTH,
    CANVAS_WIDTH = 320,
    CANVAS_HEIGHT = 400,
    LEN = 3,
    NUM = 4,
    FLOORS = CANVAS_HEIGHT / HEIGHT - 1,
    COUNTS = CANVAS_WIDTH / WIDTH - 1, 
    START_X = CANVAS_WIDTH / 2 - WIDTH,
    START_Y = 0,
    VELOCITY_Y = 2, 
    GRID = {},
    COMPOSITE = { 
        COMPOSITE_1: [[[-1, -1], [0, -1], [-1, 0]]], //Sqaure
        COMPOSITE_2: [[[0, -1], [0, -2], [0, -3]], [[1, 0], [2, 0], [3, 0]]], //Rect
        COMPOSITE_3: [[[0, -1], [1, 0], [-1, 0]], [[0, -1], [0, -2], [1, -1]], [[-1, -1], [0, -1], [1, -1]], [[0, -2], [0, -1], [-1, -1]]],
        COMPOSITE_4: [[[0, -1], [0, -2], [1, 0]], [[0, -1], [1, -1], [2, -1]], [[0, -1], [0, -2], [-1, -2]], [[0, -1], [-1, 0], [-2, 0]]]
    },
    BLOCKS = [],
    BLOCKS_HASH = {},
    FLOOR_MIN = null,
    CONTEXT = null,
    PREFIX = 'COMPOSITE_',
    FLOOR_PREFIX = 'FLOOR_',
    IS_END = false

function Block(guid, x, y, width, height, color) {
    this.guid = guid
    this.x = x
    this.y = y
    this.width  = width
    this.height = height
    this.color = color || '#ccc'
}

Block.prototype.draw = function (ctx) {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
}

function getGuid() {
    var now = +new Date(),
        random = Math.random().toString().split('.')[1] + ''

    return Number(random.substring(16) + now).toString(32)
}

function generateComposite() {
    if (IS_END)
        return

    var type = Math.ceil(Math.random() * 4),
        composites = COMPOSITE[PREFIX + type]

    if (!composites)
        return

    var shape = Math.round(Math.random() * (composites.length - 1)),
        composite = composites[shape],
        block_header_guid = getGuid(),
        block_header = new Block(block_header_guid, START_X, START_Y, WIDTH, HEIGHT, 'blue')
        block_header.feature = [type, shape]

    BLOCKS.push(block_header)
    BLOCKS_HASH[block_header_guid] = block_header

    for (var i = 0; i < LEN; i ++) {
        var guid = getGuid(),
            block = new Block(guid, START_X + composite[i][0] * WIDTH, START_Y + composite[i][1] * HEIGHT, WIDTH, HEIGHT) 

        BLOCKS.push(block)
        BLOCKS_HASH[guid] = block
    }

}

function updateCompositeHeader(blocks) {
    setCompsoiteBounding(blocks);

    var block_header = blocks[0],
        x = block_header.x,
        y = block_header.y + VELOCITY_Y,
        left = block_header.left,
        right = block_header.right,
        floor, index, grid, 
        is_collision = false

    if (CANVAS_HEIGHT - HEIGHT < y) {
        delete block_header.feature

        y = CANVAS_HEIGHT - HEIGHT
        is_collision = true
        generateComposite()
    }

    if (0 > left) {
        x = x + WIDTH 
    }

    if (CANVAS_WIDTH < right) {
        x = x - WIDTH
    }

    floor = Math.floor((y + HEIGHT) / HEIGHT)
    index = Math.floor(x / WIDTH)

    grid = GRID[FLOOR_PREFIX + floor]

    if (grid && grid.items[index]) {
        delete block_header.feature

        generateComposite()
        x = index * WIDTH 
        y = (floor - 1) * HEIGHT
        is_collision = true

        if (0 === floor - 1) {
            IS_END = true
        }
    }

    block_header.x = x
    block_header.y = y

    return is_collision
}

function setCompositeBounding(blocks) {
    var left = 0, right = 0

    for (var i = 0, l = blocks.length; i < l; i ++) {
        left = Math.min(left, blocks[i].x)
        right = Math.max(right, blocks[i].x + WIDTH)
    }

    blocks[0].left = left
    blocks[0].right = right
}

//type = 1, 2, 3, 4
function updateComposite(blocks, feature) {
    if (!blocks.length)
        return

    var is_collision = updateCompositeHeader(blocks),
        composite = COMPOSITE[PREFIX + feature[0]][feature[1]],
        floor, index

    if (IS_END)
        return

    for (var i = 0, l = blocks.length; i < l; i ++) {

        if (i != 0) {
            blocks[i].x = blocks[0].x + composite[i - 1][0] * WIDTH
            blocks[i].y = blocks[0].y + composite[i - 1][1] * HEIGHT
        }

        if (is_collision) {
            index = Math.floor(blocks[i].x / WIDTH)
            floor = Math.floor(blocks[i].y  / HEIGHT)
            con = GRID[FLOOR_PREFIX + floor]

            con.items[index] = blocks[i].guid
            con.num += 1
        }

        blocks[i].draw(CONTEXT)
    }
}

function updateGrid(blocks) {
    FLOOR_MIN = null

    for (var i = 0, l = blocks.length; i < l; i ++) {
        var floor = Math.floor(blocks[i].y / HEIGHT),
            index = Math.floor(blocks[i].x / WIDTH),
            content = GRID[FLOOR_PREFIX + floor]

        content.items[index] = blocks[i].guid
        content.num += 1

        if (content.num === COUNTS) {
            for (var j = 0, k = content.items.length; j < k; j ++) {
                FLOOR_MIN = Math.min(FLOOR_MIN, floor)
                BLOCKS_HASH[content.items[j]].flag = 1
            }
        }
    }

}

function update() {
    if (BLOCKS.length === 0) {
        generateComposite()
    }

    for (var i = 0, l = BLOCKS.length; i < l; i ++) {
        var block = BLOCKS[i],
            floor = block.y % HEIGHT
            flag = block.flag,
            feature = block.feature

        if (flag) {
            BLOCKS.splice(i, 1)
            -- l
            continue
        }

        if (FLOOR_MIN && floor < FLOOR_MIN) {
            block.y += HEIGHT
        }

        if (feature) {
            updateComposite([block, BLOCKS[i + 1], BLOCKS[i + 2], BLOCKS[i + 3]], feature)
            i += NUM
        } else {
            block.draw(CONTEXT)
        }
    }
}

function requestFrame(callback) {
    var enterFrame = window.requestAnimationFrame       ||
                     window.webkitRequestAnimationFrame ||
                     window.mozRequestAnimationFrame    ||
                     window.oRequestAnimationFrame      ||
                     window.msRequestAnimationFrame     ||
                     function (callback) {
                         setTimeout(callback, 1000 / 60)
                     }

    enterFrame(callback)
}

function render() {
    requestFrame(function () {
        CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        update()
        render()
    })
}
    
function main() {
    var canvas = document.getElementById('stage')

    canvas.width  = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    canvas.style.background = '#000'

    for (var i = 0; i <= FLOORS; i ++) {
        GRID[FLOOR_PREFIX + i] = {
            'items': new Array(COUNTS),
            'num': 0
        } 
    }

    CONTEXT = canvas.getContext('2d')
    render()
}

main()
