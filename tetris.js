var FPS = 6,
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
    VELOCITY_Y_STEP = 10, 
    VELOCITY_Y_RAW = VELOCITY_Y = 5, 
    GRID = [],
    BLOCKS = [],
    COMPOSITE = { 
        COMPOSITE_1: [[[-1, -1], [0, -1], [-1, 0]]], //Sqaure
        COMPOSITE_2: [[[0, -1], [0, -2], [0, -3]], [[1, 0], [2, 0], [3, 0]]], //Rect
        COMPOSITE_3: [[[0, -1], [1, 0], [-1, 0]], [[0, -1], [0, -2], [1, -1]], [[-1, -1], [0, -1], [1, -1]], [[0, -2], [0, -1], [-1, -1]]],
        COMPOSITE_4: [[[0, -1], [0, -2], [1, 0]], [[0, -1], [1, -1], [2, -1]], [[0, -1], [0, -2], [-1, -2]], [[0, -1], [-1, 0], [-2, 0]]],
        COMPOSITE_5: [[[0, -1], [1, -1], [-1, 0]], [[0, -1], [-1, -1], [-1, -2]]],
        COMPOSITE_6: [[[0, -1], [1, -1], [1, -2]], [[1, 0], [0, -1], [-1, -1]]]
    },
    COLORS = ['#8A2BE2', '#008B8B', '#FF9900', '#1E90FF'],
    CONTEXT = null,
    CURRENT_BLOCK_HEADER = null,
    KEY_LEFT_1 = 37, 
    KEY_LEFT_2 = 72,
    KEY_RIGHT_1 = 39,
    KEY_RIGHT_2 = 76,
    KEY_DOWN_1 = 40,
    KEY_DOWN_2 = 74,
    KEY_SPACE_1 = 32,
    KEY_SPACE_2 = 38,
    PREFIX = 'COMPOSITE_',
    IS_END = false,
    START = null,
    SCORE_ELEMENT = document.getElementById('amount'),
    SCORE = 0

function Block(x, y, width, height, color) {
    this.x = x
    this.y = y
    this.width  = width
    this.height = height
    this.color = color || '#ccc'
}

Block.prototype.draw = function (ctx) {
    ctx.beginPath()
    ctx.rect(this.x, this.y, this.width - 1, this.height - 1)
    ctx.fillStyle  = this.color
    ctx.fill()
    ctx.lineWidth = .5
    ctx.strokeStyle = '#fff'
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

    var type = Math.ceil(Math.random() * 6)
        color = COLORS[Math.floor(Math.random() * COLORS.length)]
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
        is_collision_x, is_collision_y, delta_x, delta_y

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
        //GRID.splice(0, {blocks: new Array(COUNTS), count: 0})
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

function removeEliminatedBlock() {
    //first all clear
    var new_blocks = [];

    for (var i = 0, l = BLOCKS.length; i < l; i ++) {
        if (!BLOCKS[i].flag) {
            new_blocks.push(BLOCKS[i])
        } else {
            SCORE += 1
        }
    }

    BLOCKS = new_blocks
}

function update() {
    CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (BLOCKS.length === 0) {
        generateComposite()
    }

    removeEliminatedBlock()

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
            updateScore()
            START = +new Date()
        }

        render()
    })
}

function handleEvent(type, code) {
    var is_key_down = type === 'keydown'

    switch (code) {
        case KEY_LEFT_1: case KEY_LEFT_2:
            VELOCITY_X = is_key_down ? - WIDTH : 0
            break

        case KEY_RIGHT_1: case KEY_RIGHT_2:
            VELOCITY_X = is_key_down ? WIDTH : 0
            break

        case KEY_DOWN_1: case KEY_DOWN_2:
            VELOCITY_Y = is_key_down ? VELOCITY_Y_RAW + VELOCITY_Y_STEP : VELOCITY_Y_RAW 
            break

        case KEY_SPACE_1: case KEY_SPACE_2:
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

function updateScore() {
    SCORE_ELEMENT.innerHTML = SCORE
}
    
function main() {
    bindEvent()

    var canvas = document.getElementById('stage')

    canvas.width  = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    for (var i = 0; i <= FLOORS; i ++) {
        GRID[i] = {blocks: new Array(COUNTS), count: 0}
    }

    CONTEXT = canvas.getContext('2d')
    START = +new Date()
    render()
}

main()
