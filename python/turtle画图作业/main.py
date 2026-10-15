# -*- coding: utf-8 -*-
import turtle
import random
import math

WIDTH, HEIGHT = 900, 620
HORIZON = -60
GROUND_BOTTOM = -310
TOP = 310

FRAME_MS = 33
HOLD_FRAMES = 70
MOVE_FRAMES = 50

SEASON_ORDER = ["SPRING", "SUMMER", "AUTUMN", "WINTER"]
SEASON_CN = {"SPRING": "春", "SUMMER": "夏", "AUTUMN": "秋", "WINTER": "冬"}

SUN_R = 30
SUN_CENTER = (0.0, -400.0)
SUN_RADIUS = 662.0
SEASON_ANGLE = {
    "SPRING": math.radians(116.7),
    "SUMMER": math.radians(99.1),
    "AUTUMN": math.radians(80.8),
    "WINTER": math.radians(62.9),
}
EXIT_ANGLE = math.radians(35.0)
ENTRY_ANGLE = math.radians(142.0)
FRAMES_PER_RAD = 163.0


def sun_point(angle):
    return (SUN_CENTER[0] + SUN_RADIUS * math.cos(angle),
            SUN_CENTER[1] + SUN_RADIUS * math.sin(angle))


SUN_POS = {s: sun_point(a) for s, a in SEASON_ANGLE.items()}

SKY = (150, 205, 235)
GRASS_GREEN = (95, 170, 70)
GRASS_DEAD = (150, 140, 80)
SNOW_GROUND = (245, 248, 255)
CROWN_GREEN = (60, 150, 60)
CROWN_DEAD = (150, 120, 70)
TRUNK = (110, 70, 40)
SNOW = (255, 255, 255)

PALETTE = {
    "SPRING": [(255, 182, 193), (255, 105, 180), (255, 250, 250), (255, 215, 0)],
    "SUMMER": [(230, 40, 40), (255, 140, 0), (199, 21, 133), (148, 0, 211)],
    "AUTUMN": [(255, 200, 0), (230, 120, 20), (160, 30, 20), (210, 105, 30)],
    "WINTER": [],
}

screen = None
sky_pen = None
ground_pen = None
tree_pen = None
flower_pen = None
sun_pen = None
snow_pen = None

current_idx = 0
current_season = SEASON_ORDER[0]
phase = "HOLD"
frame_in_state = 0
sun_pos = SUN_POS["SPRING"]
sun_angle = SEASON_ANGLE["SPRING"]
move_legs = []
leg = 0
leg_frame = 0
grass_progress = 0.5
snow_active = False
flowers = []
trees = []
snows = []


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return (int(lerp(c1[0], c2[0], t)),
            int(lerp(c1[1], c2[1], t)),
            int(lerp(c1[2], c2[2], t)))


def ease(t):
    return t * t * (3 - 2 * t)


def make_pen():
    p = turtle.Turtle()
    p.hideturtle()
    p.speed(0)
    p.penup()
    return p


def draw_house(pen, x, base_y, w, h, body_col, roof_col):
    pen.penup()
    pen.goto(x, base_y)
    pen.color(body_col)
    pen.pendown()
    pen.begin_fill()
    pen.goto(x + w, base_y)
    pen.goto(x + w, base_y + h)
    pen.goto(x, base_y + h)
    pen.goto(x, base_y)
    pen.end_fill()

    pen.goto(x, base_y + h)
    pen.color(roof_col)
    pen.begin_fill()
    pen.goto(x + w / 2, base_y + h + w * 0.5)
    pen.goto(x + w, base_y + h)
    pen.goto(x, base_y + h)
    pen.end_fill()

    pen.color((90, 60, 40))
    pen.begin_fill()
    pen.goto(x + w * 0.38, base_y)
    pen.goto(x + w * 0.38, base_y + h * 0.45)
    pen.goto(x + w * 0.62, base_y + h * 0.45)
    pen.goto(x + w * 0.62, base_y)
    pen.end_fill()

    pen.penup()
    pen.goto(x + w * 0.15, base_y + h * 0.55)
    pen.dot(w * 0.15, (255, 250, 200))
    pen.penup()


def draw_sky_and_town():
    p = sky_pen
    p.penup()
    p.goto(-WIDTH / 2, HORIZON)
    p.color(SKY)
    p.pendown()
    p.begin_fill()
    p.goto(WIDTH / 2, HORIZON)
    p.goto(WIDTH / 2, TOP)
    p.goto(-WIDTH / 2, TOP)
    p.goto(-WIDTH / 2, HORIZON)
    p.end_fill()
    p.penup()

    draw_house(p, -400, HORIZON, 80, 70, (235, 200, 140), (150, 60, 50))
    draw_house(p, -300, HORIZON, 95, 85, (240, 220, 180), (120, 70, 40))
    draw_house(p, -185, HORIZON, 70, 60, (230, 190, 150), (150, 60, 50))


def init_trees():
    global trees
    trees = []
    for i in range(14):
        x = 10 + i * 30 + random.uniform(-8, 8)
        base_y = random.uniform(-100, -70)
        h = random.uniform(34, 62)
        r = random.uniform(22, 34)
        trees.append({
            "x": x,
            "base_y": base_y,
            "h": h,
            "r": r,
            "progress": random.uniform(0.2, 0.6),
        })


def init_snow():
    global snows
    snows = []
    for _ in range(60):
        snows.append({
            "x": random.uniform(-WIDTH / 2, WIDTH / 2),
            "y": random.uniform(GROUND_BOTTOM, TOP),
            "r": random.uniform(1.5, 4.0),
            "vy": random.uniform(1.5, 4.5),
            "vx": random.uniform(-0.6, 0.6),
        })


def plant_flowers(n):
    for _ in range(n):
        flowers.append({
            "x": random.uniform(-420, 420),
            "y": random.uniform(-285, -105),
            "size": random.uniform(9, 16),
            "slot": random.randint(0, 9),
        })


def draw_ground():
    p = ground_pen
    p.clear()
    col = lerp_color(GRASS_DEAD, GRASS_GREEN, grass_progress)
    if current_season == "WINTER":
        col = lerp_color(col, SNOW_GROUND, 0.65)
    p.penup()
    p.goto(-WIDTH / 2, HORIZON)
    p.color(col)
    p.pendown()
    p.begin_fill()
    p.goto(WIDTH / 2, HORIZON)
    p.goto(WIDTH / 2, GROUND_BOTTOM)
    p.goto(-WIDTH / 2, GROUND_BOTTOM)
    p.goto(-WIDTH / 2, HORIZON)
    p.end_fill()
    p.penup()


def draw_trees():
    p = tree_pen
    p.clear()
    for t in trees:
        prog = t["progress"]
        p.penup()
        p.goto(t["x"], t["base_y"])
        p.pendown()
        p.color(TRUNK)
        p.pensize(7)
        p.goto(t["x"], t["base_y"] + t["h"])
        p.penup()

        if prog <= 0.12:
            p.pensize(3)
            p.goto(t["x"], t["base_y"] + t["h"])
            p.pendown()
            for ang in (35, 145, 90):
                p.setheading(ang)
                p.forward(t["r"] * 0.9)
                p.backward(t["r"] * 0.9)
            p.penup()
        else:
            crown = lerp_color(CROWN_DEAD, CROWN_GREEN, prog)
            cx = t["x"]
            cy = t["base_y"] + t["h"] + t["r"] * 0.55
            p.goto(cx, cy)
            p.dot(t["r"] * 2.0, crown)
            p.goto(cx - t["r"] * 0.65, cy - t["r"] * 0.35)
            p.dot(t["r"] * 1.5, crown)
            p.goto(cx + t["r"] * 0.65, cy - t["r"] * 0.35)
            p.dot(t["r"] * 1.5, crown)


def draw_flowers():
    p = flower_pen
    p.clear()
    pal = PALETTE[current_season]
    if not pal:
        return
    n = len(pal)
    for fl in flowers:
        col = pal[fl["slot"] % n]
        cx, cy, s = fl["x"], fl["y"], fl["size"]
        p.penup()
        for k in range(5):
            ang = math.radians(k * 72)
            p.goto(cx + math.cos(ang) * s * 0.6, cy + math.sin(ang) * s * 0.6)
            p.dot(s * 1.1, col)
        p.goto(cx, cy)
        p.dot(s * 0.9, col)


def draw_sun():
    p = sun_pen
    p.clear()
    x, y = sun_pos
    p.penup()
    p.goto(x, y)
    p.dot(SUN_R * 2 + 10, (255, 190, 40))
    p.dot(SUN_R * 2, (255, 225, 110))
    p.color((255, 190, 40))
    p.pensize(3)
    for i in range(12):
        p.penup()
        p.goto(x, y)
        p.setheading(i * 30)
        p.forward(SUN_R + 7)
        p.pendown()
        p.forward(13)
        p.penup()


def draw_snow():
    p = snow_pen
    p.clear()
    if not snow_active:
        return
    for f in snows:
        p.penup()
        p.goto(f["x"], f["y"])
        p.dot(f["r"] * 2, SNOW)


def redraw():
    draw_ground()
    draw_trees()
    draw_flowers()
    draw_sun()
    draw_snow()


def update_vegetation():
    global grass_progress
    for t in trees:
        prog = t["progress"]
        if current_season == "SPRING":
            prog = min(1.0, prog + random.uniform(0.0, 0.03))
        elif current_season == "SUMMER":
            prog = min(1.0, prog + random.uniform(0.01, 0.05))
        elif current_season == "AUTUMN":
            prog = max(0.0, prog - random.uniform(0.0, 0.03))
        elif current_season == "WINTER":
            prog = max(0.0, prog - random.uniform(0.01, 0.04))
        t["progress"] = prog

    g = grass_progress
    if current_season == "SPRING":
        g = min(1.0, g + random.uniform(0.0, 0.03))
    elif current_season == "SUMMER":
        g = min(1.0, g + random.uniform(0.01, 0.05))
    elif current_season == "AUTUMN":
        g = max(0.0, g - random.uniform(0.0, 0.03))
    elif current_season == "WINTER":
        g = max(0.0, g - random.uniform(0.01, 0.04))
    grass_progress = g


def update_snow():
    for f in snows:
        f["y"] -= f["vy"]
        f["x"] += f["vx"]
        if f["y"] < GROUND_BOTTOM:
            f["y"] = random.uniform(TOP, TOP + 40)
            f["x"] = random.uniform(-WIDTH / 2, WIDTH / 2)
        if f["x"] < -WIDTH / 2:
            f["x"] = WIDTH / 2
        elif f["x"] > WIDTH / 2:
            f["x"] = -WIDTH / 2


def on_enter(season):
    global current_season, sun_pos, sun_angle, phase, frame_in_state, snow_active
    global flowers, snows
    current_season = season
    sun_angle = SEASON_ANGLE[season]
    sun_pos = sun_point(sun_angle)
    phase = "HOLD"
    frame_in_state = 0
    if season == "WINTER":
        flowers = []
        init_snow()
        snow_active = True
    else:
        if season == "SPRING":
            snow_active = False
            snows = []
        plant_flowers(6 + random.randint(0, 3))
    if hasattr(screen, "title"):
        screen.title("四季小镇 - " + SEASON_CN[season])


def start_moving():
    global phase, frame_in_state, move_legs, leg, leg_frame
    cur = SEASON_ORDER[current_idx]
    if cur == "WINTER":
        legs = [
            (SEASON_ANGLE["WINTER"], EXIT_ANGLE),
            (ENTRY_ANGLE, SEASON_ANGLE["SPRING"]),
        ]
    else:
        nxt = SEASON_ORDER[(current_idx + 1) % 4]
        legs = [(SEASON_ANGLE[cur], SEASON_ANGLE[nxt])]
    move_legs = []
    for a0, a1 in legs:
        dur = max(1, int(round(abs(a1 - a0) * FRAMES_PER_RAD)))
        move_legs.append((a0, a1, dur))
    leg = 0
    leg_frame = 0
    phase = "MOVING"
    frame_in_state = 0


def arrive():
    global current_idx
    current_idx = (current_idx + 1) % 4
    on_enter(SEASON_ORDER[current_idx])


def move_sun(a0, a1, k):
    global sun_pos, sun_angle
    sun_angle = lerp(a0, a1, k)
    sun_pos = sun_point(sun_angle)


def tick():
    global frame_in_state, leg, leg_frame
    frame_in_state += 1
    if phase == "MOVING":
        a0, a1, dur = move_legs[leg]
        leg_frame += 1
        k = leg_frame / dur
        if k >= 1.0:
            k = 1.0
        move_sun(a0, a1, ease(k))
        if k >= 1.0:
            if leg + 1 < len(move_legs):
                leg += 1
                leg_frame = 0
            else:
                arrive()
    else:
        update_vegetation()
        if frame_in_state >= HOLD_FRAMES:
            start_moving()

    if snow_active:
        update_snow()

    redraw()
    screen.update()
    screen.ontimer(tick, FRAME_MS)


def main():
    global screen, sky_pen, ground_pen, tree_pen, flower_pen, sun_pen, snow_pen
    screen = turtle.Screen()
    screen.setup(WIDTH, HEIGHT)
    if hasattr(screen, "title"):
        screen.title("四季小镇")
    screen.colormode(255)
    screen.bgcolor(SKY)
    screen.tracer(0)

    sky_pen = make_pen()
    ground_pen = make_pen()
    tree_pen = make_pen()
    flower_pen = make_pen()
    sun_pen = make_pen()
    snow_pen = make_pen()

    init_trees()
    init_snow()
    draw_sky_and_town()
    on_enter("SPRING")
    tick()
    if hasattr(screen, "mainloop"):
        screen.mainloop()
    elif hasattr(turtle, "mainloop"):
        turtle.mainloop()


if __name__ == "__main__":
    main()
