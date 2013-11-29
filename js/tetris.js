var FPS = 30,
    INTERVAL = 1000 / FPS,
    WIDTH = 20,
    HEIGHT = WIDTH,
    CANVAS_WIDTH = 320,
    CANVAS_HEIGHT = 400,
    FLOORS = CANVAS_HEIGHT / HEIGHT - 1,
    COUNTS = CANVAS_WIDTH / WIDTH, 
    START_X = CANVAS_WIDTH / 2 - WIDTH,
    START_Y = 0,
    VELOCITY_X = 0,
    VELOCITY_Y_STEP = 3, 
    VELOCITY_Y_RAW = VELOCITY_Y = 4, 
    GRID = [],
    BLOCKS = [],
    COMPOSITE = { 
        COMPOSITE_1: [[[-1, -1], [0, -1], [-1, 0]]], //Sqaure
        COMPOSITE_2: [[[0, -1], [0, -2], [0, -3]], [[1, 0], [2, 0], [3, 0]]], //Rect
        COMPOSITE_3: [[[0, -1], [1, 0], [-1, 0]], [[0, -1], [0, -2], [1, -1]], [[-1, -1], [0, -1], [1, -1]], [[0, -2], [0, -1], [-1, -1]]],
        COMPOSITE_4: [[[0, -1], [0, -2], [1, 0]], [[0, -1], [1, -1], [2, -1]], [[0, -1], [0, -2], [-1, -2]], [[0, -1], [-1, 0], [-2, 0]]],
        COMPOSITE_5: [[[0, -1], [1, -1], [-1, 0]], [[0, -1], [-1, -1], [-1, -2]], [[0, -1], [1, -1], [1, -2]], [[1, 0], [0, -1], [-1, -1]]]
    },
    COLORS = ['2F4F4F', '#8A2BE2', '#008B8B', '#1E90FF'],
    CONTEXT = null,
    CURRENT_BLOCK_HEADER = null,
    KEY_LEFT = 37,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_SPACE = 32,
    PREFIX = 'COMPOSITE_',
    IS_END = false,
    START = null

function Block(x, y, width, height, color) {
    this.x = x
    this.y = y
    this.width  = width
    this.height = height
    this.color = color || '#ccc'
}

Block.prototype.draw = function (ctx) {
    ctx.fillStyle  = this.color
    ctx.lineWidth = 1
    ctx.strokeStyle = '#fff'
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.stroke()
}

Block.prototype.updateShape = function () {
    if (!this.feature)
        return

    var composites = COMPOSITE[PREFIX + this.feature[0]],
        shape = this.feature[1] + 1

    this.feature[1] = shape >= composites.length ? 0 : shape
}

function generateComposite() {
    if (IS_END)
        return

    var type = Math.ceil(Math.random() * 5)
        color = Math.ceil(Math.random() * 3)
        composites = COMPOSITE[PREFIX + type]

    if (!composites)
        return

    var shape = Math.round(Math.random() * (composites.length - 1)),
        composite = composites[shape],
        block_header = new Block(START_X, START_Y, WIDTH, HEIGHT, color)
        block_header.feature = [type, shape]

    BLOCKS.push(block_header)

    for (var i = 0; i < 3; i ++) {
        var block = new Block(START_X + composite[i][0] * WIDTH, START_Y + composite[i][1] * HEIGHT, WIDTH, HEIGHT, color) 

        BLOCKS.push(block)
    }

    CURRENT_BLOCK_HEADER = block_header
}

function getGridPosition(x, y) {
    var col = Math.floor(x / WIDTH),
        row = Math.floor((y + HEIGHT) / HEIGHT)

    return {row: row, col: col}
}

function getGridCollision(row, col) {
    var is_collision = false,
        floor = GRID[row]

    if (row > FLOORS || (floor && floor.blocks[col]) || col < 0 || col > COUNTS - 1) {
        is_collision = true
    }

    return is_collision
}

function updateComposite(blocks, feature) {
    if (!blocks.length)
        return

    if (IS_END)
        return

    var header_x = blocks[0].x + VELOCITY_X,
        header_y = blocks[0].y + VELOCITY_Y,
        composite = COMPOSITE[PREFIX + feature[0]][feature[1]],
        pos, is_collision_x, is_collision_y, delta_x, delta_y

    for (var i = 0, l = blocks.length; i < l; i ++) {
        delta_x = i == 0 ? 0 : composite[i - 1][0] * WIDTH
        delta_y = i == 0 ? 0 : composite[i - 1][1] * HEIGHT
        current_x = header_x + delta_x
        current_y = header_y + delta_y

        pos_y = getGridPosition(blocks[i].x, current_y)
        is_collision_y = getGridCollision(pos_y.row, pos_y.col)

        if (is_collision_y) {
            current_y = (pos_y.row - 1) * HEIGHT
            blocks[0].y = current_y - delta_y
            break
        }

        pos_x = getGridPosition(current_x, blocks[i].y)
        is_collision_x = getGridCollision(pos_x.row, pos_x.col)

        if (is_collision_x) {
            current_x = blocks[i].x
            blocks[0].x = current_x - delta_x
        }
        
        blocks[i].x = current_x
        blocks[i].y = current_y
    }

    drawComposite(blocks, composite)

    if (is_collision_y) {
        delete blocks[0].feature
        setGridStatus(blocks)
        generateComposite()
    }
}

function setGridStatus(blocks) {
    var down_rows = []

    for (var i = 0, l = blocks.length; i < l; i ++) {
        var pos = getGridPosition(blocks[i].x, blocks[i].y),
            floor = GRID[pos.row - 1]

        if (!floor) {
            IS_END = true
            return
        }

        floor.blocks[pos.col] = blocks[i]

        if (++ floor.count === COUNTS) {
            down_rows.push(pos.row - 1)
        }
    }

    setBlocksFlag(down_rows)
}

function setBlocksFlag(rows) {
    if (!rows.length)
        return

    rows.sort(function (a, b) {
        return a < b
    });

    var blocks, max_row = rows[rows.length - 1]

    for (var i = 0, l = rows.length; i < l; i ++) {
        blocks = GRID[rows[i]].blocks
        for (var j = 0, k = blocks.length; j < k; j ++) {
            blocks[j].flag = 1
        }
    }

    blocks = GRID[max_row].blocks

    for (var i = 0, l = blocks.length; i < l; i ++) {
        var cal_row = max_row, 
            pos = getGridPosition(blocks[i].x, blocks[i].y),
            floor

        while ((floor = GRID[-- cal_row]) != undefined) {
            if (floor.blocks[pos.col]) 
                floor.blocks[pos.col].step = rows.length
        }
    }

    for (var i = 0, l = rows.length; i < l; i ++) {
        GRID.splice(rows[i], 1)
    }

    for (var i = 0, l = rows.length; i < l; i ++) {
        GRID.unshift({blocks: new Array(COUNTS), count: 0})
    }
}

function drawComposite(blocks, composite_params) {
    for (var i = 0, l = blocks.length; i < l; i ++) {
        if (i != 0) {
            blocks[i].x = blocks[0].x + composite_params[i - 1][0] * WIDTH
            blocks[i].y = blocks[0].y + composite_params[i - 1][1] * HEIGHT
        }

        blocks[i].draw(CONTEXT)
    }
}

function update() {
    CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (BLOCKS.length === 0) {
        generateComposite()
    }

    for (var i = 0, l = BLOCKS.length; i < l; i ++) {
        var block = BLOCKS[i],
            pos = getGridPosition(block.x, block.y)
            flag = block.flag,
            step = block.step,
            feature = block.feature

        if (feature) {
            updateComposite([block, BLOCKS[i + 1], BLOCKS[i + 2], BLOCKS[i + 3]], feature)
            i += 4
        } else {
            if (flag) {
                BLOCKS.splice(i, 1)
                -- l
                continue
            } 

            if (step) {
                BLOCKS[i].y += step * HEIGHT
                delete BLOCKS[i].step
            }

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
        var now = +new Date(),
            delta = now - START

        if (delta >= INTERVAL) {
            update()
            START = +new Date()
        }

        render()
    })
}

function handleEvent(type, code) {
    var is_key_down = type === 'keydown'

    switch (code) {
        case KEY_LEFT:
            VELOCITY_X = is_key_down ? - WIDTH : 0
            break

        case KEY_RIGHT:
            VELOCITY_X = is_key_down ? WIDTH : 0
            break

        case KEY_DOWN:
            VELOCITY_Y = is_key_down ? VELOCITY_Y_RAW + VELOCITY_Y_STEP : VELOCITY_Y_RAW 
            break

        case KEY_SPACE:
            if (is_key_down) {
                CURRENT_BLOCK_HEADER.updateShape()
            }

            break

        default:
            break
    }
}

function bindEvent() {

    ['keydown', 'keyup'].forEach(function (keyevent){
        document.addEventListener(keyevent, function (e) {

            var code = e.keyCode || e.which
                type = e.type

            handleEvent(type, code)
        })
    })

}
    
function main() {
    bindEvent();

    var canvas = document.getElementById('stage')

    canvas.width  = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    canvas.style.background = '#000'

    for (var i = 0; i <= FLOORS; i ++) {
        GRID[i] = {blocks: new Array(COUNTS), count: 0};
    }

    CONTEXT = canvas.getContext('2d')
    START = +new Date()
    render()
}

main()