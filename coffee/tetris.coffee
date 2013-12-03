FPS = 30
INTERVAL = 1000 / FPS
WIDTH = 20
HEIGHT = WIDTH
CANVAS_WIDTH = 320
CANVAS_HEIGHT = 400
FLOORS = CANVAS_HEIGHT / HEIGHT - 1
COUNTS = CANVAS_WIDTH / WIDTH
START_X = CANVAS_WIDTH / 2 - WIDTH
START_Y = 0
VELOCITY_X = 0
VELOCITY_Y_STEP = 3
VELOCITY_Y_RAW = VELOCITY_Y = 4
GRID = []
BLOCKS = []
COMPOSITE = {
    COMPOSITE_1: [[[-1, -1], [0, -1], [-1, 0]]], #Sqaure
    COMPOSITE_2: [[[0, -1], [0, -2], [0, -3]], [[1, 0], [2, 0], [3, 0]]], #Rect
    COMPOSITE_3: [[[0, -1], [1, 0], [-1, 0]], [[0, -1], [0, -2], [1, -1]], [[-1, -1], [0, -1], [1, -1]], [[0, -2], [0, -1], [-1, -1]]],
    COMPOSITE_4: [[[0, -1], [0, -2], [1, 0]], [[0, -1], [1, -1], [2, -1]], [[0, -1], [0, -2], [-1, -2]], [[0, -1], [-1, 0], [-2, 0]]],
    COMPOSITE_5: [[[0, -1], [1, -1], [-1, 0]], [[0, -1], [-1, -1], [-1, -2]]],
    COMPOSITE_6: [[[0, -1], [1, -1], [1, -2]], [[1, 0], [0, -1], [-1, -1]]]
}
COLORS = ['#2F4F4F', '#8A2BE2', '#008B8B', '#FF9900', '#1E90FF']
CONTEXT = null
CURRENT_BLOCK_HEADER = null
START = null
KEY_LEFT = [37, 72]
KEY_RIGHT = [39, 76]
KEY_DOWN = [40, 74]
KEY_SPACE = [32, 38]
PREFIX = 'COMPOSITE_'
IS_END = false

class Block

    constructor: (x, y, width, height, color) ->
        @x = x
        @y = y
        @width = width
        @height = height
        @color = color

    draw: (ctx) ->
        ctx.beginPath()
        ctx.rect(@x, @y, @width - 1, @height - 1)
        ctx.fillStyle  = @color
        ctx.fill()
        ctx.lineWidth = 0.5
        ctx.strokeStyle = '#fff'
        ctx.stroke()

    updateShape: () ->
        return if not @feature?

        composites = COMPOSITE[PREFIX + @feature[0]]
        shape = @feature[1] + 1

        @feature[1] = if shape >= composites.length then 0 else shape

class Stage

    constructor: () ->
        @bindEvent()
        canvas = document.getElementById('stage')
        canvas.width  = CANVAS_WIDTH
        canvas.height = CANVAS_HEIGHT

        for i in [0..FLOORS]
            GRID.push({blocks: new Array(COUNTS), count: 0})

        CONTEXT = canvas.getContext('2d')
        START = +new Date()
        @render()

    generateComposite: () ->
        return if IS_END

        type = Math.ceil(Math.random() * 6)
        color = COLORS[Math.floor(Math.random() * COLORS.length)]
        composites = COMPOSITE[PREFIX + type]

        return if not composites?

        shape = Math.round(Math.random() * (composites.length - 1))
        composite = composites[shape]
        block_header = new Block(START_X, START_Y, WIDTH, HEIGHT, color)
        block_header.feature = [type, shape]

        BLOCKS.push(block_header)

        for i in [0..2]
            block = new Block(START_X + composite[i][0] * WIDTH, START_Y + composite[i][1] * HEIGHT, WIDTH, HEIGHT, color)

            BLOCKS.push(block)

        CURRENT_BLOCK_HEADER = block_header

    getGridPosition: (x, y) ->
        row:
            Math.floor((y + HEIGHT) / HEIGHT)
        col:
            Math.floor(x / WIDTH)

    getGridCollision: (row, col) ->
        is_collision = off
        floor = GRID[row]

        if row > FLOORS or (floor and floor.blocks[col]) or col < 0 or col > COUNTS - 1
            is_collision = on

        return is_collision

    updateComposite: (blocks, feature) ->
        return if not blocks.length or IS_END

        header_x = blocks[0].x + VELOCITY_X
        header_y = blocks[0].y + VELOCITY_Y
        composite = COMPOSITE[PREFIX + feature[0]][feature[1]]

        for i in [0..blocks.length - 1]
            delta_x = if i == 0 then 0 else composite[i - 1][0] * WIDTH
            delta_y = if i == 0 then 0 else composite[i - 1][1] * HEIGHT
            current_x = header_x + delta_x
            current_y = header_y + delta_y

            pos_y = @getGridPosition(blocks[i].x, current_y)
            is_collision_y = @getGridCollision(pos_y.row, pos_y.col)

            if is_collision_y
                current_y = (pos_y.row - 1) * HEIGHT
                blocks[0].y = current_y - delta_y
                break

            pos_x = @getGridPosition(current_x, blocks[i].y)
            is_collision_x = @getGridCollision(pos_x.row, pos_x.col)

            if is_collision_x
                current_x = blocks[i].x
                blocks[0].x = current_x - delta_x

            blocks[i].x = current_x
            blocks[i].y = current_y

        @drawComposite(blocks, composite)

        if is_collision_y
            delete blocks[0].feature
            @setGridStatus(blocks)
            @generateComposite()

    setBlocksFlag: (rows) ->
        if not rows.length
            return

        rows.sort((a, b) ->
            a < b
        )

        max_row = rows[rows.length - 1]

        for i in [0..rows.length - 1]
            blocks = GRID[rows[i]].blocks
            for j in [0..blocks.length - 1]
                blocks[j].flag = 1

        blocks = GRID[max_row].blocks

        for i in [0..blocks.length - 1]
            cal_row = max_row
            pos = @getGridPosition(blocks[i].x, blocks[i].y)

            while (floor = GRID[-- cal_row])?
                floor.blocks[pos.col].step = rows.length if floor.blocks[pos.col]?

        GRID.splice(rows[i], 1) for i in [0..rows.length - 1]
        GRID.unshift({blocks: new Array(COUNTS), count: 0}) for i in [0..rows.length - 1]

    setGridStatus: (blocks) ->
        down_rows = []
        for i in [0..blocks.length - 1]
            pos = @getGridPosition(blocks[i].x, blocks[i].y)
            floor = GRID[pos.row - 1]

            (IS_END = true; return) if not floor?

            floor.blocks[pos.col] = blocks[i]

            down_rows.push(pos.row - 1) if ++ floor.count == COUNTS

        @setBlocksFlag(down_rows)

    drawComposite: (blocks, composite_params) ->
        for i in [0..blocks.length - 1]
            if i != 0
                blocks[i].x = blocks[0].x + composite_params[i - 1][0] * WIDTH
                blocks[i].y = blocks[0].y + composite_params[i - 1][1] * HEIGHT

            blocks[i].draw(CONTEXT)

    update: () ->
        CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        if BLOCKS.length is 0
            @generateComposite()

        new_blocks = []
        for i in [0..BLOCKS.length - 1]
            new_blocks.push(BLOCKS[i]) if !BLOCKS[i].flag

        BLOCKS = new_blocks

        for i in [0..BLOCKS.length - 1]
            block = BLOCKS[i]
            pos = @getGridPosition(block.x, block.y)
            flag = block.flag
            step = block.step
            feature = block.feature

            if feature
                @updateComposite([block, BLOCKS[i + 1], BLOCKS[i + 2], BLOCKS[i + 3]], feature)
                i += 4
            else
                continue if flag

                if step
                    BLOCKS[i].y += step * HEIGHT
                    delete BLOCKS[i].step

                block.draw(CONTEXT)

    requestFrame: (callback) ->
        enterFrame = window.requestAnimationFrame       ||
                     window.webkitRequestAnimationFrame ||
                     window.mozRequestAnimationFrame    ||
                     window.oRequestAnimationFrame      ||
                     window.msRequestAnimationFrame     ||
                     (callback) ->
                         setTimeout(callback, 1000 / 60)

        enterFrame(callback)

    render: () ->
        self = @
        @requestFrame( () ->
            now = +new Date()
            delta = now - START

            if delta >= INTERVAL
                self.update()
                START = +new Date()

            self.render()
        )

    handleEvent: (type, code) ->
        is_key_down = type == 'keydown'

        if code in KEY_LEFT
            VELOCITY_X = if is_key_down then - WIDTH else 0
        else if code in KEY_RIGHT
            VELOCITY_X = if is_key_down then WIDTH else 0
        else if code in KEY_DOWN
            VELOCITY_Y = if is_key_down then VELOCITY_Y_RAW + VELOCITY_Y_STEP else VELOCITY_Y_RAW
        else if code is KEY_SPACE
            CURRENT_BLOCK_HEADER.updateShape() if is_key_down

    bindEvent: () ->
        self = @
        for evt in ['keydown', 'keyup']
            document.addEventListener(evt, (e) ->
                code = e.keyCode || e.which
                type = e.type

                self.handleEvent(type, code)
            )

do () ->
    new Stage
