"use strict";

// ============================================================
// CONFIGURATION
// ============================================================
const CFG = {
    WORLD_W: 800,
    MARBLE_R: 12,
    marbleRadius(count) { return count <= 16 ? 12 : count <= 40 ? 9 : count <= 70 ? 7 : 5; },
    GRAVITY: 520,
    FRICTION: 0.997,
    WALL_BOUNCE: 0.55,
    MARBLE_BOUNCE: 0.7,
    MAX_VEL: 900,
    SUB_STEPS: 4,
    FINISH_DELAY: 3,
    ELIM_FINISH_DELAY: 1.5,
    COUNTDOWN_SECS: 3,
    SPEED_VAR: 0.08,
    DEFAULT_COUNT: 8,
};

// ============================================================
// TRACK DEFINITIONS
// ============================================================
function buildTrackPath(sections) {
    const pts = [];
    const obs = [];
    let y = 0;
    for (const s of sections) {
        switch (s.type) {
            case 'straight': {
                pts.push({ y, l: s.l, r: s.r });
                y += s.len;
                pts.push({ y, l: s.l, r: s.r });
                break;
            }
            case 'taper': {
                pts.push({ y, l: s.l1, r: s.r1 });
                y += s.len;
                pts.push({ y, l: s.l2, r: s.r2 });
                break;
            }
            case 'curve': {
                const steps = 12;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const off = Math.sin(t * Math.PI * (s.periods || 1)) * s.amp;
                    pts.push({ y: y + t * s.len, l: s.l + off, r: s.r + off });
                }
                y += s.len;
                break;
            }
            case 'zigzag': {
                const segs = s.segs || 4;
                for (let i = 0; i <= segs; i++) {
                    const t = i / segs;
                    const dir = i % 2 === 0 ? -1 : 1;
                    const off = dir * s.amp;
                    pts.push({ y: y + t * s.len, l: s.baseL + (i > 0 ? off : 0), r: s.baseR + (i > 0 ? off : 0) });
                }
                y += s.len;
                break;
            }
            case 'funnel': {
                pts.push({ y, l: s.l1, r: s.r1 });
                y += s.len * 0.5;
                pts.push({ y, l: s.lm, r: s.rm });
                y += s.len * 0.5;
                pts.push({ y, l: s.l2, r: s.r2 });
                break;
            }
            case 'pegs': {
                for (let row = 0; row < s.rows; row++) {
                    const cols = row % 2 === 0 ? s.cols : s.cols - 1;
                    const offX = row % 2 === 0 ? 0 : s.spacingX * 0.5;
                    for (let c = 0; c < cols; c++) {
                        obs.push({
                            type: 'peg',
                            x: s.startX + offX + c * s.spacingX,
                            y: s.startY + row * s.spacingY,
                            r: s.pegR || 8,
                        });
                    }
                }
                break;
            }
            case 'bumpers': {
                for (const b of s.list) {
                    obs.push({ type: 'bumper', x: b.x, y: b.y, r: b.r || 22 });
                }
                break;
            }
            case 'bars': {
                for (const b of s.list) {
                    obs.push({ type: 'bar', x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 });
                }
                break;
            }
        }
    }
    return { path: pts, obstacles: obs, length: y };
}

const TRACKS = [
    // 1) Klasik Düz İniş
    { id: 'classic', name: 'Klasik Düz İniş', desc: 'Basit düz parkur, birkaç tampon. Başlangıç seviyesi.', difficulty: 1, lengthLabel: 'Kısa',
      bg1: '#0a0a2e', bg2: '#162050', wallColor: '#4a90d9', trackColor: '#1a2a4e',
      get data() { return buildTrackPath([
        { type: 'straight', len: 120, l: 200, r: 600 },
        { type: 'taper', len: 180, l1: 200, r1: 600, l2: 260, r2: 540 },
        { type: 'straight', len: 150, l: 260, r: 540 },
        { type: 'bumpers', list: [{ x: 350, y: 490 }, { x: 450, y: 490 }] },
        { type: 'taper', len: 150, l1: 260, r1: 540, l2: 200, r2: 600 },
        { type: 'straight', len: 200, l: 200, r: 600 },
        { type: 'bumpers', list: [{ x: 300, y: 850 }, { x: 500, y: 850 }, { x: 400, y: 920, r: 25 }] },
        { type: 'straight', len: 350, l: 200, r: 600 },
      ]); }
    },
    // 2) Plinko Tahtası - tam Pachinko stili
    { id: 'plinko', name: 'Plinko Tahtası', desc: 'Dev Plinko/Pachinko tahtası! Tamamen şansa dayalı.', difficulty: 2, lengthLabel: 'Orta',
      bg1: '#0a1a0a', bg2: '#153020', wallColor: '#4ad95a', trackColor: '#102a15',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 130, r: 670 },
        { type: 'pegs', rows: 10, cols: 10, spacingX: 52, spacingY: 52, startX: 155, startY: 110, pegR: 8 },
        { type: 'straight', len: 600, l: 130, r: 670 },
        { type: 'taper', len: 100, l1: 130, r1: 670, l2: 250, r2: 550 },
        { type: 'straight', len: 60, l: 250, r: 550 },
        { type: 'taper', len: 100, l1: 250, r1: 550, l2: 130, r2: 670 },
        { type: 'pegs', rows: 8, cols: 10, spacingX: 52, spacingY: 52, startX: 155, startY: 880, pegR: 9 },
        { type: 'straight', len: 550, l: 130, r: 670 },
        { type: 'straight', len: 200, l: 130, r: 670 },
      ]); }
    },
    // 3) Kum Saati (Hourglass) - iki kez daralan huni
    { id: 'hourglass', name: 'Kum Saati', desc: 'Çift huni! Kum saati şeklinde daralıp genişler.', difficulty: 3, lengthLabel: 'Orta',
      bg1: '#1a1a00', bg2: '#2a2a10', wallColor: '#d9b44a', trackColor: '#2a2510',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 130, r: 670 },
        { type: 'funnel', len: 350, l1: 130, r1: 670, lm: 360, rm: 440, l2: 130, r2: 670 },
        { type: 'straight', len: 60, l: 130, r: 670 },
        { type: 'bumpers', list: [{ x: 300, y: 530 }, { x: 500, y: 530 }] },
        { type: 'funnel', len: 350, l1: 130, r1: 670, lm: 350, rm: 450, l2: 130, r2: 670 },
        { type: 'pegs', rows: 4, cols: 8, spacingX: 60, spacingY: 45, startX: 165, startY: 860, pegR: 7 },
        { type: 'straight', len: 250, l: 130, r: 670 },
        { type: 'funnel', len: 300, l1: 130, r1: 670, lm: 370, rm: 430, l2: 130, r2: 670 },
        { type: 'straight', len: 250, l: 130, r: 670 },
      ]); }
    },
    // 4) Yılan Yolu - sıkı zikzak
    { id: 'snake', name: 'Yılan Yolu', desc: 'Sıkı zikzak geçitler. Duvardan duvara!', difficulty: 3, lengthLabel: 'Orta',
      bg1: '#1a0a0a', bg2: '#3a1525', wallColor: '#d94a7a', trackColor: '#2a1020',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 180, r: 620 },
        { type: 'zigzag', len: 700, amp: 140, segs: 7, baseL: 220, baseR: 580 },
        { type: 'straight', len: 60, l: 180, r: 620 },
        { type: 'bumpers', list: [{ x: 300, y: 870 }, { x: 500, y: 870 }] },
        { type: 'zigzag', len: 600, amp: 120, segs: 6, baseL: 240, baseR: 560 },
        { type: 'straight', len: 250, l: 180, r: 620 },
      ]); }
    },
    // 5) Tampon Arenası - tamponlarla dolu alan
    { id: 'bumper_arena', name: 'Tampon Arenası', desc: 'Her yerde tamponlar! Kaotik sıçramalar.', difficulty: 4, lengthLabel: 'Orta',
      bg1: '#1a0020', bg2: '#300040', wallColor: '#e04ae9', trackColor: '#1a0030',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 150, r: 650 },
        { type: 'bumpers', list: [
          { x: 250, y: 120 }, { x: 400, y: 140, r: 28 }, { x: 550, y: 120 },
          { x: 200, y: 230 }, { x: 350, y: 250 }, { x: 500, y: 230 }, { x: 600, y: 260 },
        ]},
        { type: 'straight', len: 300, l: 150, r: 650 },
        { type: 'bumpers', list: [
          { x: 250, y: 420 }, { x: 400, y: 400, r: 30 }, { x: 550, y: 420 },
          { x: 300, y: 520 }, { x: 500, y: 520 },
          { x: 200, y: 600 }, { x: 400, y: 620, r: 26 }, { x: 600, y: 600 },
        ]},
        { type: 'straight', len: 400, l: 150, r: 650 },
        { type: 'taper', len: 150, l1: 150, r1: 650, l2: 300, r2: 500 },
        { type: 'bumpers', list: [{ x: 400, y: 930, r: 20 }] },
        { type: 'taper', len: 150, l1: 300, r1: 500, l2: 150, r2: 650 },
        { type: 'bumpers', list: [
          { x: 250, y: 1100 }, { x: 400, y: 1080, r: 28 }, { x: 550, y: 1100 },
          { x: 300, y: 1180 }, { x: 500, y: 1180 },
        ]},
        { type: 'straight', len: 400, l: 150, r: 650 },
      ]); }
    },
    // 6) Merdiven - basamaklı düşüşler
    { id: 'stairs', name: 'Merdiven Parkuru', desc: 'Basamak basamak iniş! Daralan ve genişleyen basamaklar.', difficulty: 2, lengthLabel: 'Orta',
      bg1: '#0a0a1e', bg2: '#101840', wallColor: '#6080d0', trackColor: '#0e1230',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 200, r: 600 },
        { type: 'taper', len: 60, l1: 200, r1: 600, l2: 280, r2: 520 },
        { type: 'straight', len: 100, l: 280, r: 520 },
        { type: 'taper', len: 60, l1: 280, r1: 520, l2: 180, r2: 620 },
        { type: 'straight', len: 100, l: 180, r: 620 },
        { type: 'taper', len: 60, l1: 180, r1: 620, l2: 300, r2: 500 },
        { type: 'straight', len: 100, l: 300, r: 500 },
        { type: 'taper', len: 60, l1: 300, r1: 500, l2: 160, r2: 640 },
        { type: 'straight', len: 100, l: 160, r: 640 },
        { type: 'bumpers', list: [{ x: 300, y: 770 }, { x: 500, y: 770 }] },
        { type: 'taper', len: 60, l1: 160, r1: 640, l2: 320, r2: 480 },
        { type: 'straight', len: 100, l: 320, r: 480 },
        { type: 'taper', len: 60, l1: 320, r1: 480, l2: 150, r2: 650 },
        { type: 'straight', len: 100, l: 150, r: 650 },
        { type: 'taper', len: 60, l1: 150, r1: 650, l2: 280, r2: 520 },
        { type: 'straight', len: 100, l: 280, r: 520 },
        { type: 'taper', len: 100, l1: 280, r1: 520, l2: 200, r2: 600 },
        { type: 'straight', len: 250, l: 200, r: 600 },
      ]); }
    },
    // 7) Spiral Düşüş - kıvrımlı uzun yol
    { id: 'spiral', name: 'Spiral Düşüş', desc: 'Döne döne aşağı! Eğrisel parkur.', difficulty: 3, lengthLabel: 'Uzun',
      bg1: '#0a1520', bg2: '#153040', wallColor: '#4ac0d9', trackColor: '#0a2030',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 200, r: 600 },
        { type: 'curve', len: 500, l: 200, r: 600, amp: 120, periods: 3 },
        { type: 'taper', len: 100, l1: 200, r1: 600, l2: 280, r2: 520 },
        { type: 'curve', len: 400, l: 280, r: 520, amp: 80, periods: 2 },
        { type: 'taper', len: 100, l1: 280, r1: 520, l2: 180, r2: 620 },
        { type: 'bumpers', list: [{ x: 300, y: 1220 }, { x: 500, y: 1220 }, { x: 400, y: 1300, r: 26 }] },
        { type: 'curve', len: 500, l: 180, r: 620, amp: 140, periods: 3 },
        { type: 'straight', len: 250, l: 180, r: 620 },
      ]); }
    },
    // 8) Dar Boğaz - çok dar geçit bölgeleri
    { id: 'narrows', name: 'Dar Boğaz', desc: 'Aşırı dar geçitler! Sıkışma ve kaos.', difficulty: 4, lengthLabel: 'Orta',
      bg1: '#1e0a0a', bg2: '#401015', wallColor: '#e06040', trackColor: '#2a0e0e',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 150, r: 650 },
        { type: 'taper', len: 150, l1: 150, r1: 650, l2: 350, r2: 450 },
        { type: 'straight', len: 120, l: 350, r: 450 },
        { type: 'taper', len: 100, l1: 350, r1: 450, l2: 150, r2: 650 },
        { type: 'pegs', rows: 4, cols: 8, spacingX: 58, spacingY: 45, startX: 175, startY: 490, pegR: 8 },
        { type: 'straight', len: 280, l: 150, r: 650 },
        { type: 'taper', len: 150, l1: 150, r1: 650, l2: 360, r2: 440 },
        { type: 'straight', len: 150, l: 360, r: 440 },
        { type: 'taper', len: 100, l1: 360, r1: 440, l2: 150, r2: 650 },
        { type: 'bumpers', list: [{ x: 300, y: 1080 }, { x: 500, y: 1080 }] },
        { type: 'taper', len: 120, l1: 150, r1: 650, l2: 340, r2: 460 },
        { type: 'straight', len: 100, l: 340, r: 460 },
        { type: 'taper', len: 120, l1: 340, r1: 460, l2: 150, r2: 650 },
        { type: 'straight', len: 250, l: 150, r: 650 },
      ]); }
    },
    // 9) Çivi Yağmuru - çiviler arasında uzun iniş
    { id: 'peg_rain', name: 'Çivi Yağmuru', desc: 'Üst üste çivi bölgeleri! Şans krallığı.', difficulty: 3, lengthLabel: 'Uzun',
      bg1: '#0a0a20', bg2: '#151540', wallColor: '#7070e0', trackColor: '#0e0e30',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 140, r: 660 },
        { type: 'pegs', rows: 6, cols: 10, spacingX: 50, spacingY: 48, startX: 165, startY: 110, pegR: 7 },
        { type: 'straight', len: 370, l: 140, r: 660 },
        { type: 'bumpers', list: [{ x: 300, y: 520 }, { x: 500, y: 520 }] },
        { type: 'straight', len: 100, l: 140, r: 660 },
        { type: 'pegs', rows: 7, cols: 10, spacingX: 50, spacingY: 50, startX: 165, startY: 660, pegR: 8 },
        { type: 'straight', len: 430, l: 140, r: 660 },
        { type: 'taper', len: 100, l1: 140, r1: 660, l2: 250, r2: 550 },
        { type: 'pegs', rows: 5, cols: 6, spacingX: 50, spacingY: 48, startX: 262, startY: 1210, pegR: 8 },
        { type: 'straight', len: 320, l: 250, r: 550 },
        { type: 'taper', len: 100, l1: 250, r1: 550, l2: 140, r2: 660 },
        { type: 'straight', len: 250, l: 140, r: 660 },
      ]); }
    },
    // 10) Huni Zinciri - peş peşe huniler
    { id: 'funnel_chain', name: 'Huni Zinciri', desc: '5 huni üst üste! Daralan kanallar zinciri.', difficulty: 4, lengthLabel: 'Uzun',
      bg1: '#15100a', bg2: '#302818', wallColor: '#d0a040', trackColor: '#201808',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 130, r: 670 },
        { type: 'funnel', len: 250, l1: 130, r1: 670, lm: 340, rm: 460, l2: 130, r2: 670 },
        { type: 'straight', len: 40, l: 130, r: 670 },
        { type: 'funnel', len: 250, l1: 130, r1: 670, lm: 350, rm: 450, l2: 180, r2: 620 },
        { type: 'straight', len: 40, l: 180, r: 620 },
        { type: 'funnel', len: 250, l1: 180, r1: 620, lm: 360, rm: 440, l2: 130, r2: 670 },
        { type: 'bumpers', list: [{ x: 300, y: 990 }, { x: 500, y: 990 }] },
        { type: 'straight', len: 60, l: 130, r: 670 },
        { type: 'funnel', len: 250, l1: 130, r1: 670, lm: 370, rm: 430, l2: 180, r2: 620 },
        { type: 'straight', len: 40, l: 180, r: 620 },
        { type: 'funnel', len: 250, l1: 180, r1: 620, lm: 340, rm: 460, l2: 130, r2: 670 },
        { type: 'straight', len: 250, l: 130, r: 670 },
      ]); }
    },
    // 11) Çubuk Labirenti - açılı çubuklarla dolu
    { id: 'bar_maze', name: 'Çubuk Labirenti', desc: 'Açılı çubuk engeller! Yön değiştirmeler.', difficulty: 3, lengthLabel: 'Orta',
      bg1: '#0a1a10', bg2: '#153525', wallColor: '#50c070', trackColor: '#0a2015',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 160, r: 640 },
        { type: 'bars', list: [
          { x1: 200, y1: 110, x2: 400, y2: 140 },
          { x1: 400, y1: 200, x2: 600, y2: 170 },
          { x1: 200, y1: 280, x2: 400, y2: 310 },
          { x1: 400, y1: 370, x2: 600, y2: 340 },
        ]},
        { type: 'straight', len: 400, l: 160, r: 640 },
        { type: 'bumpers', list: [{ x: 400, y: 530, r: 25 }] },
        { type: 'bars', list: [
          { x1: 200, y1: 600, x2: 350, y2: 640 },
          { x1: 450, y1: 640, x2: 600, y2: 600 },
          { x1: 250, y1: 720, x2: 550, y2: 740 },
          { x1: 200, y1: 820, x2: 400, y2: 850 },
          { x1: 400, y1: 900, x2: 600, y2: 870 },
        ]},
        { type: 'straight', len: 500, l: 160, r: 640 },
        { type: 'pegs', rows: 3, cols: 7, spacingX: 62, spacingY: 45, startX: 190, startY: 1070, pegR: 7 },
        { type: 'straight', len: 350, l: 160, r: 640 },
      ]); }
    },
    // 12) Karışık Cehennem - her engelden biraz
    { id: 'mixed_hell', name: 'Karışık Cehennem', desc: 'Tüm engeller bir arada! Tam kaos.', difficulty: 5, lengthLabel: 'Uzun',
      bg1: '#1a0010', bg2: '#350025', wallColor: '#e04080', trackColor: '#200015',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 140, r: 660 },
        { type: 'pegs', rows: 5, cols: 9, spacingX: 55, spacingY: 48, startX: 162, startY: 110, pegR: 8 },
        { type: 'straight', len: 310, l: 140, r: 660 },
        { type: 'funnel', len: 200, l1: 140, r1: 660, lm: 350, rm: 450, l2: 140, r2: 660 },
        { type: 'bumpers', list: [{ x: 280, y: 640 }, { x: 400, y: 620, r: 28 }, { x: 520, y: 640 }] },
        { type: 'straight', len: 100, l: 140, r: 660 },
        { type: 'zigzag', len: 400, amp: 100, segs: 4, baseL: 200, baseR: 600 },
        { type: 'bars', list: [
          { x1: 200, y1: 1180, x2: 400, y2: 1210 },
          { x1: 400, y1: 1260, x2: 600, y2: 1230 },
        ]},
        { type: 'straight', len: 200, l: 140, r: 660 },
        { type: 'pegs', rows: 4, cols: 8, spacingX: 60, spacingY: 50, startX: 168, startY: 1440, pegR: 9 },
        { type: 'straight', len: 280, l: 140, r: 660 },
        { type: 'funnel', len: 250, l1: 140, r1: 660, lm: 360, rm: 440, l2: 140, r2: 660 },
        { type: 'bumpers', list: [{ x: 300, y: 2000 }, { x: 500, y: 2000 }] },
        { type: 'straight', len: 250, l: 140, r: 660 },
      ]); }
    },
    // 13) Geniş Arena - çok geniş alan, çok tampon
    { id: 'wide_arena', name: 'Geniş Arena', desc: 'Ekstra geniş parkur! 20 bilye rahatça yarışır.', difficulty: 2, lengthLabel: 'Orta',
      bg1: '#0a0a1a', bg2: '#181838', wallColor: '#8080c0', trackColor: '#0e0e28',
      get data() { return buildTrackPath([
        { type: 'straight', len: 100, l: 100, r: 700 },
        { type: 'bumpers', list: [
          { x: 220, y: 140 }, { x: 400, y: 130, r: 25 }, { x: 580, y: 140 },
          { x: 300, y: 240 }, { x: 500, y: 240 },
        ]},
        { type: 'straight', len: 300, l: 100, r: 700 },
        { type: 'pegs', rows: 5, cols: 11, spacingX: 52, spacingY: 48, startX: 130, startY: 440, pegR: 7 },
        { type: 'straight', len: 340, l: 100, r: 700 },
        { type: 'funnel', len: 300, l1: 100, r1: 700, lm: 320, rm: 480, l2: 100, r2: 700 },
        { type: 'bumpers', list: [{ x: 250, y: 1120 }, { x: 400, y: 1100, r: 28 }, { x: 550, y: 1120 }] },
        { type: 'straight', len: 300, l: 100, r: 700 },
      ]); }
    },
    // 14) Süper Uzun Maraton
    { id: 'marathon', name: 'Süper Maraton', desc: 'En uzun parkur! Dayanıklılık testi.', difficulty: 4, lengthLabel: 'Çok Uzun',
      bg1: '#0a0020', bg2: '#200040', wallColor: '#b04ad9', trackColor: '#150030',
      get data() { return buildTrackPath([
        { type: 'straight', len: 80, l: 160, r: 640 },
        { type: 'pegs', rows: 5, cols: 8, spacingX: 55, spacingY: 48, startX: 185, startY: 110, pegR: 7 },
        { type: 'straight', len: 330, l: 160, r: 640 },
        { type: 'zigzag', len: 400, amp: 100, segs: 4, baseL: 210, baseR: 590 },
        { type: 'bumpers', list: [{ x: 300, y: 850 }, { x: 500, y: 850 }] },
        { type: 'straight', len: 100, l: 160, r: 640 },
        { type: 'funnel', len: 300, l1: 160, r1: 640, lm: 350, rm: 450, l2: 160, r2: 640 },
        { type: 'straight', len: 60, l: 160, r: 640 },
        { type: 'curve', len: 400, l: 160, r: 640, amp: 100, periods: 2 },
        { type: 'pegs', rows: 6, cols: 8, spacingX: 55, spacingY: 50, startX: 185, startY: 1730, pegR: 8 },
        { type: 'straight', len: 380, l: 160, r: 640 },
        { type: 'bars', list: [
          { x1: 200, y1: 2160, x2: 400, y2: 2190 },
          { x1: 400, y1: 2240, x2: 600, y2: 2210 },
        ]},
        { type: 'straight', len: 150, l: 160, r: 640 },
        { type: 'zigzag', len: 350, amp: 90, segs: 4, baseL: 220, baseR: 580 },
        { type: 'funnel', len: 250, l1: 160, r1: 640, lm: 340, rm: 460, l2: 160, r2: 640 },
        { type: 'bumpers', list: [{ x: 300, y: 3000 }, { x: 400, y: 2980, r: 24 }, { x: 500, y: 3000 }] },
        { type: 'straight', len: 200, l: 160, r: 640 },
        { type: 'pegs', rows: 4, cols: 8, spacingX: 55, spacingY: 48, startX: 185, startY: 3240, pegR: 8 },
        { type: 'straight', len: 350, l: 160, r: 640 },
      ]); }
    },
    // 15) Hız Testi - kısa ama yoğun
    { id: 'speed', name: 'Hız Testi', desc: 'Ultra kısa, ultra yoğun! Saf hız yarışı.', difficulty: 3, lengthLabel: 'Çok Kısa',
      bg1: '#001020', bg2: '#002040', wallColor: '#40c0ff', trackColor: '#001530',
      get data() { return buildTrackPath([
        { type: 'straight', len: 60, l: 200, r: 600 },
        { type: 'bumpers', list: [{ x: 320, y: 90 }, { x: 480, y: 90 }] },
        { type: 'taper', len: 80, l1: 200, r1: 600, l2: 300, r2: 500 },
        { type: 'straight', len: 60, l: 300, r: 500 },
        { type: 'taper', len: 80, l1: 300, r1: 500, l2: 200, r2: 600 },
        { type: 'pegs', rows: 3, cols: 6, spacingX: 58, spacingY: 40, startX: 225, startY: 310, pegR: 7 },
        { type: 'straight', len: 180, l: 200, r: 600 },
        { type: 'funnel', len: 150, l1: 200, r1: 600, lm: 350, rm: 450, l2: 200, r2: 600 },
        { type: 'bumpers', list: [{ x: 300, y: 670 }, { x: 500, y: 670 }] },
        { type: 'straight', len: 200, l: 200, r: 600 },
      ]); }
    },
];

// ============================================================
// MARBLE DATABASE
// ============================================================
const MARBLE_DB = [
    { name: 'Kırmızı Alev', color: '#FF3333', speed: 1.15, weight: 1.0, bounce: 1.0, luck: 0.95 },
    { name: 'Yeşil Yıldız', color: '#33DD33', speed: 0.95, weight: 1.1, bounce: 0.9, luck: 1.1 },
    { name: 'Mavi Şimşek', color: '#3388FF', speed: 1.2, weight: 0.9, bounce: 1.05, luck: 0.9 },
    { name: 'Sarı Güneş', color: '#FFDD33', speed: 1.05, weight: 1.0, bounce: 1.1, luck: 1.0 },
    { name: 'Turuncu Ateş', color: '#FF8833', speed: 1.1, weight: 1.05, bounce: 0.95, luck: 1.0 },
    { name: 'Mor Fırtına', color: '#AA44FF', speed: 1.0, weight: 0.95, bounce: 1.15, luck: 1.05 },
    { name: 'Pembe Rüzgar', color: '#FF66AA', speed: 1.1, weight: 0.9, bounce: 1.0, luck: 1.1 },
    { name: 'Turkuaz Dalga', color: '#33DDCC', speed: 1.0, weight: 1.1, bounce: 1.0, luck: 1.0 },
    { name: 'Beyaz Kar', color: '#EEEEFF', speed: 1.05, weight: 1.0, bounce: 1.1, luck: 0.95 },
    { name: 'Siyah Gece', color: '#444455', speed: 1.15, weight: 1.15, bounce: 0.85, luck: 0.9 },
    { name: 'Altın Yıldız', color: '#FFD700', speed: 1.0, weight: 1.0, bounce: 1.0, luck: 1.2 },
    { name: 'Gümüş Ok', color: '#C0C0D0', speed: 1.2, weight: 0.85, bounce: 1.05, luck: 0.95 },
    { name: 'Bakır Kalkan', color: '#CD7F32', speed: 0.9, weight: 1.2, bounce: 0.9, luck: 1.05 },
    { name: 'Zümrüt Taş', color: '#50C878', speed: 1.05, weight: 1.05, bounce: 0.95, luck: 1.05 },
    { name: 'Yakut Işık', color: '#E0115F', speed: 1.15, weight: 0.95, bounce: 1.1, luck: 0.85 },
    { name: 'Safir Rüya', color: '#0F52BA', speed: 1.0, weight: 1.0, bounce: 1.0, luck: 1.15 },
    { name: 'Ametist Güç', color: '#9966CC', speed: 1.05, weight: 1.1, bounce: 0.95, luck: 1.0 },
    { name: 'Opal Hayal', color: '#A8C3BC', speed: 0.95, weight: 0.95, bounce: 1.2, luck: 1.1 },
    { name: 'Lava Topu', color: '#FF4500', speed: 1.2, weight: 1.1, bounce: 0.85, luck: 0.85 },
    { name: 'Buz Kristal', color: '#88DDFF', speed: 1.0, weight: 0.9, bounce: 1.1, luck: 1.15 },
    { name: 'Orman Yeşili', color: '#228B22', speed: 0.95, weight: 1.15, bounce: 0.95, luck: 1.1 },
    { name: 'Gök Mavisi', color: '#87CEEB', speed: 1.1, weight: 0.95, bounce: 1.05, luck: 1.0 },
    { name: 'Kiraz Kırmızı', color: '#DC143C', speed: 1.1, weight: 1.0, bounce: 1.0, luck: 1.0 },
    { name: 'Neon Yeşil', color: '#39FF14', speed: 1.25, weight: 0.85, bounce: 1.0, luck: 0.8 },
    { name: 'Mercan', color: '#FF6F61', speed: 1.05, weight: 1.0, bounce: 1.05, luck: 1.05 },
    { name: 'Turkuaz', color: '#40E0D0', speed: 1.1, weight: 0.95, bounce: 1.0, luck: 1.05 },
    { name: 'Lavanta', color: '#B57EDC', speed: 0.95, weight: 1.0, bounce: 1.15, luck: 1.05 },
    { name: 'Hardal', color: '#FFDB58', speed: 1.0, weight: 1.15, bounce: 0.9, luck: 1.0 },
    { name: 'Çivit', color: '#4B0082', speed: 1.15, weight: 1.0, bounce: 0.95, luck: 0.95 },
    { name: 'Şeftali', color: '#FFCBA4', speed: 1.0, weight: 0.9, bounce: 1.1, luck: 1.15 },
    { name: 'Bordo', color: '#800020', speed: 1.05, weight: 1.2, bounce: 0.85, luck: 0.95 },
    { name: 'Elektrik', color: '#7DF9FF', speed: 1.3, weight: 0.8, bounce: 1.05, luck: 0.75 },
    { name: 'Pastel Pembe', color: '#FFD1DC', speed: 0.95, weight: 0.9, bounce: 1.1, luck: 1.2 },
    { name: 'Deniz Mavisi', color: '#006994', speed: 1.1, weight: 1.1, bounce: 0.95, luck: 0.95 },
    { name: 'Limon', color: '#FFF44F', speed: 1.15, weight: 0.85, bounce: 1.1, luck: 0.95 },
    { name: 'Krom', color: '#DBE0E3', speed: 1.05, weight: 1.15, bounce: 0.9, luck: 1.0 },
    { name: 'Magenta', color: '#FF00FF', speed: 1.2, weight: 0.9, bounce: 1.1, luck: 0.85 },
    { name: 'Haki', color: '#BDB76B', speed: 0.9, weight: 1.2, bounce: 0.85, luck: 1.15 },
    { name: 'Gül Kurusu', color: '#C08081', speed: 1.0, weight: 1.05, bounce: 1.0, luck: 1.1 },
    { name: 'Cam Göbeği', color: '#00CED1', speed: 1.1, weight: 0.95, bounce: 1.1, luck: 1.0 },
    { name: 'Tarçın', color: '#D2691E', speed: 1.05, weight: 1.1, bounce: 0.95, luck: 1.0 },
    { name: 'Leylak', color: '#C8A2C8', speed: 0.95, weight: 0.95, bounce: 1.15, luck: 1.1 },
    { name: 'Kobalt', color: '#0047AB', speed: 1.15, weight: 1.05, bounce: 0.95, luck: 0.9 },
    { name: 'Kadife', color: '#800080', speed: 1.0, weight: 1.05, bounce: 1.0, luck: 1.1 },
    { name: 'Karamel', color: '#FFD59A', speed: 1.05, weight: 1.0, bounce: 0.95, luck: 1.1 },
    { name: 'Petrol', color: '#006666', speed: 1.1, weight: 1.1, bounce: 0.9, luck: 0.95 },
    { name: 'Kayısı', color: '#FBCEB1', speed: 0.95, weight: 0.9, bounce: 1.1, luck: 1.2 },
    { name: 'Antrasit', color: '#293133', speed: 1.1, weight: 1.2, bounce: 0.8, luck: 0.95 },
    { name: 'Bej', color: '#F5F5DC', speed: 1.0, weight: 0.95, bounce: 1.05, luck: 1.15 },
    { name: 'Turkuaz 2', color: '#30D5C8', speed: 1.15, weight: 0.9, bounce: 1.05, luck: 0.95 },
    { name: 'Yavruağzı', color: '#E8ADAA', speed: 0.95, weight: 0.95, bounce: 1.1, luck: 1.15 },
    { name: 'Zeytin', color: '#808000', speed: 1.0, weight: 1.15, bounce: 0.9, luck: 1.0 },
    { name: 'Fuşya', color: '#FF00FF', speed: 1.2, weight: 0.85, bounce: 1.1, luck: 0.9 },
    { name: 'Mürdüm', color: '#660066', speed: 1.05, weight: 1.1, bounce: 0.95, luck: 1.0 },
    { name: 'Fildişi', color: '#FFFFF0', speed: 1.0, weight: 0.9, bounce: 1.05, luck: 1.2 },
    { name: 'Gece Mavisi', color: '#191970', speed: 1.15, weight: 1.05, bounce: 0.9, luck: 0.95 },
    { name: 'Açık Yeşil', color: '#90EE90', speed: 1.05, weight: 0.95, bounce: 1.1, luck: 1.05 },
    { name: 'Koyu Kırmızı', color: '#8B0000', speed: 1.1, weight: 1.15, bounce: 0.85, luck: 0.95 },
    { name: 'Göl Mavisi', color: '#4682B4', speed: 1.0, weight: 1.05, bounce: 1.0, luck: 1.1 },
    { name: 'Pas Rengi', color: '#B7410E', speed: 0.95, weight: 1.2, bounce: 0.85, luck: 1.05 },
    { name: 'Camgöbeği', color: '#00FFFF', speed: 1.2, weight: 0.85, bounce: 1.1, luck: 0.9 },
    { name: 'Ten Rengi', color: '#FFE4C4', speed: 1.0, weight: 0.95, bounce: 1.0, luck: 1.2 },
    { name: 'Çelik', color: '#71797E', speed: 1.05, weight: 1.15, bounce: 0.9, luck: 0.95 },
    { name: 'Parlak Turuncu', color: '#FF5F15', speed: 1.2, weight: 0.95, bounce: 1.0, luck: 0.9 },
    { name: 'Koyu Yeşil', color: '#006400', speed: 0.95, weight: 1.15, bounce: 0.9, luck: 1.15 },
    { name: 'Gri Mavi', color: '#6699CC', speed: 1.05, weight: 1.0, bounce: 1.05, luck: 1.05 },
    { name: 'Şarap', color: '#722F37', speed: 1.0, weight: 1.1, bounce: 0.9, luck: 1.1 },
    { name: 'Fosfor', color: '#CCFF00', speed: 1.25, weight: 0.8, bounce: 1.05, luck: 0.8 },
    { name: 'Bakır 2', color: '#B87333', speed: 0.95, weight: 1.2, bounce: 0.85, luck: 1.1 },
    { name: 'Buz Mavi', color: '#A5F2F3', speed: 1.1, weight: 0.9, bounce: 1.1, luck: 1.0 },
    { name: 'Çikolata', color: '#7B3F00', speed: 1.0, weight: 1.15, bounce: 0.9, luck: 1.0 },
    { name: 'Somon', color: '#FA8072', speed: 1.05, weight: 0.95, bounce: 1.05, luck: 1.1 },
    { name: 'Menekşe', color: '#8B008B', speed: 1.0, weight: 1.0, bounce: 1.1, luck: 1.05 },
    { name: 'Kestane', color: '#954535', speed: 0.95, weight: 1.15, bounce: 0.9, luck: 1.1 },
    { name: 'Ay Işığı', color: '#D6E6FF', speed: 1.1, weight: 0.85, bounce: 1.1, luck: 1.05 },
    { name: 'Yanık Turuncu', color: '#CC5500', speed: 1.15, weight: 1.05, bounce: 0.95, luck: 0.9 },
    { name: 'Su Yeşili', color: '#7FFFD4', speed: 1.05, weight: 0.95, bounce: 1.1, luck: 1.05 },
    { name: 'Grafit', color: '#383838', speed: 1.1, weight: 1.2, bounce: 0.8, luck: 0.9 },
    { name: 'Parlak Pembe', color: '#FF69B4', speed: 1.15, weight: 0.85, bounce: 1.1, luck: 0.95 },
    { name: 'Çam Yeşili', color: '#01796F', speed: 0.95, weight: 1.1, bounce: 0.95, luck: 1.15 },
    { name: 'Gün Batımı', color: '#FAD6A5', speed: 1.05, weight: 0.95, bounce: 1.05, luck: 1.1 },
    { name: 'Safran', color: '#F4C430', speed: 1.1, weight: 1.0, bounce: 1.0, luck: 1.0 },
    { name: 'Lacivert', color: '#000080', speed: 1.05, weight: 1.1, bounce: 0.9, luck: 1.0 },
    { name: 'Nar', color: '#C41E3A', speed: 1.15, weight: 1.0, bounce: 1.0, luck: 0.9 },
    { name: 'Turkuaz 3', color: '#48D1CC', speed: 1.1, weight: 0.9, bounce: 1.1, luck: 1.0 },
    { name: 'Tuğla', color: '#CB4154', speed: 1.0, weight: 1.15, bounce: 0.85, luck: 1.05 },
    { name: 'Altın Sarısı', color: '#DAA520', speed: 1.05, weight: 1.05, bounce: 0.95, luck: 1.1 },
    { name: 'Zümrüt 2', color: '#046307', speed: 0.9, weight: 1.1, bounce: 0.95, luck: 1.2 },
    { name: 'Gümüş 2', color: '#AAA9AD', speed: 1.1, weight: 1.0, bounce: 1.0, luck: 1.0 },
    { name: 'Erik', color: '#8E4585', speed: 1.0, weight: 1.05, bounce: 1.05, luck: 1.05 },
    { name: 'Limon Sarısı', color: '#FDFF00', speed: 1.2, weight: 0.85, bounce: 1.05, luck: 0.9 },
    { name: 'Okyanus', color: '#0077BE', speed: 1.05, weight: 1.05, bounce: 1.0, luck: 1.05 },
    { name: 'Alev Kırmızı', color: '#E25822', speed: 1.2, weight: 1.0, bounce: 0.95, luck: 0.85 },
    { name: 'Nane', color: '#98FF98', speed: 1.0, weight: 0.9, bounce: 1.15, luck: 1.1 },
    { name: 'Kömür', color: '#36454F', speed: 1.05, weight: 1.2, bounce: 0.8, luck: 1.0 },
    { name: 'Şeker Pembe', color: '#FF1493', speed: 1.15, weight: 0.85, bounce: 1.1, luck: 0.95 },
    { name: 'Yosun', color: '#8A9A5B', speed: 0.9, weight: 1.1, bounce: 0.95, luck: 1.2 },
    { name: 'Volkan', color: '#CF1020', speed: 1.25, weight: 1.1, bounce: 0.85, luck: 0.75 },
    { name: 'Amber', color: '#FFBF00', speed: 1.05, weight: 1.05, bounce: 1.0, luck: 1.05 },
    { name: 'Patlıcan', color: '#614051', speed: 1.0, weight: 1.1, bounce: 0.95, luck: 1.1 },
];

// ============================================================
// PROCEDURAL TRACK GENERATOR
// ============================================================
function generateRandomTrack() {
    const names = ['Rastgele Parkur', 'Kaotik Yol', 'Sürpriz Pist', 'Bilinmeyen Rota', 'Gizem Parkuru', 'Macera Yolu'];
    const bgs = [
        { bg1: '#0a102e', bg2: '#1a2850', wc: '#5a90e9', tc: '#0e1838' },
        { bg1: '#1a0a1e', bg2: '#2a1540', wc: '#c04ae9', tc: '#15082a' },
        { bg1: '#0a1a12', bg2: '#153828', wc: '#4ae97a', tc: '#0a2015' },
        { bg1: '#1e1a0a', bg2: '#403520', wc: '#e9c04a', tc: '#2a2510' },
        { bg1: '#1a0a0a', bg2: '#401520', wc: '#e94a6a', tc: '#200810' },
    ];
    const theme = bgs[Math.floor(Math.random() * bgs.length)];
    const sections = [];
    const baseL = 150 + Math.floor(Math.random() * 80);
    const baseR = 800 - baseL;
    sections.push({ type: 'straight', len: 100, l: baseL, r: baseR });

    const sectionTypes = ['straight', 'taper', 'curve', 'zigzag', 'funnel', 'pegs', 'bumpers'];
    const numSections = 6 + Math.floor(Math.random() * 6);
    let curL = baseL, curR = baseR, curY = 100;

    for (let i = 0; i < numSections; i++) {
        const t = sectionTypes[Math.floor(Math.random() * sectionTypes.length)];
        switch (t) {
            case 'straight':
                sections.push({ type: 'straight', len: 80 + Math.random() * 150, l: curL, r: curR });
                curY += 80 + Math.random() * 150;
                break;
            case 'taper': {
                const nL = 150 + Math.floor(Math.random() * 200);
                const nR = 800 - 150 - Math.floor(Math.random() * 200);
                sections.push({ type: 'taper', len: 120 + Math.random() * 150, l1: curL, r1: curR, l2: nL, r2: nR });
                curL = nL; curR = nR;
                curY += 120 + Math.random() * 150;
                break;
            }
            case 'curve':
                sections.push({ type: 'curve', len: 200 + Math.random() * 200, l: curL, r: curR, amp: 50 + Math.random() * 100, periods: 1 + Math.floor(Math.random() * 2) });
                curY += 200 + Math.random() * 200;
                break;
            case 'zigzag':
                sections.push({ type: 'zigzag', len: 300 + Math.random() * 300, amp: 80 + Math.random() * 100, segs: 3 + Math.floor(Math.random() * 4), baseL: curL + 50, baseR: curR - 50 });
                curY += 300 + Math.random() * 300;
                break;
            case 'funnel': {
                const mid = (curL + curR) / 2;
                const narrow = 40 + Math.random() * 40;
                sections.push({ type: 'funnel', len: 200 + Math.random() * 150, l1: curL, r1: curR, lm: mid - narrow, rm: mid + narrow, l2: curL, r2: curR });
                curY += 200 + Math.random() * 150;
                break;
            }
            case 'pegs':
                sections.push({ type: 'pegs', rows: 3 + Math.floor(Math.random() * 5), cols: 5 + Math.floor(Math.random() * 4), spacingX: 40 + Math.random() * 20, spacingY: 40 + Math.random() * 15, startX: curL + 20, startY: curY + 30, pegR: 7 + Math.random() * 4 });
                break;
            case 'bumpers': {
                const list = [];
                const n = 2 + Math.floor(Math.random() * 3);
                for (let j = 0; j < n; j++) {
                    list.push({ x: curL + 50 + Math.random() * (curR - curL - 100), y: curY + 30 + j * 70, r: 18 + Math.random() * 12 });
                }
                sections.push({ type: 'bumpers', list });
                break;
            }
        }
    }
    sections.push({ type: 'straight', len: 200, l: curL, r: curR });

    const trackData = buildTrackPath(sections);
    return {
        id: 'random', name: names[Math.floor(Math.random() * names.length)],
        desc: 'Prosedürel olarak oluşturulmuş rastgele parkur!',
        difficulty: 3, lengthLabel: 'Rastgele',
        bg1: theme.bg1, bg2: theme.bg2, wallColor: theme.wc, trackColor: theme.tc,
        get data() { return trackData; },
        _data: trackData
    };
}

// ============================================================
// UTILITIES
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function fmtTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return `${String(m).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`; }

// ============================================================
// PHYSICS HELPERS
// ============================================================
function closestPointOnSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: ax, y: ay };
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
    return { x: ax + t * dx, y: ay + t * dy };
}

function circleSegCollision(cx, cy, cr, ax, ay, bx, by) {
    const cp = closestPointOnSeg(cx, cy, ax, ay, bx, by);
    const dx = cx - cp.x, dy = cy - cp.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < cr && d > 0.001) {
        const nx = dx / d, ny = dy / d;
        return { nx, ny, depth: cr - d, px: cp.x, py: cp.y };
    }
    return null;
}

function circleCircleCol(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    const minD = r1 + r2;
    if (d < minD && d > 0.001) {
        const nx = dx / d, ny = dy / d;
        return { nx, ny, depth: minD - d };
    }
    return null;
}

// ============================================================
// TRACK WALL SEGMENTS (generated from path)
// ============================================================
function buildWallSegs(path) {
    const left = [], right = [];
    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        left.push({ x1: a.l, y1: a.y, x2: b.l, y2: b.y });
        right.push({ x1: a.r, y1: a.y, x2: b.r, y2: b.y });
    }
    return { left, right };
}

function getTrackBounds(path, y) {
    for (let i = 0; i < path.length - 1; i++) {
        if (y >= path[i].y && y <= path[i + 1].y) {
            const t = (y - path[i].y) / (path[i + 1].y - path[i].y || 1);
            return { l: lerp(path[i].l, path[i + 1].l, t), r: lerp(path[i].r, path[i + 1].r, t) };
        }
    }
    const last = path[path.length - 1];
    return { l: last.l, r: last.r };
}

// ============================================================
// AUDIO
// ============================================================
const Audio = {
    ctx: null, enabled: true,
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(freq, dur, type, vol) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur);
    },
    beep() { this.tone(440, 0.2, 'sine', 0.18); },
    go() { this.tone(880, 0.3, 'sine', 0.2); setTimeout(() => this.tone(1320, 0.2, 'sine', 0.15), 150); },
    bounce() { this.tone(200 + Math.random() * 300, 0.08, 'triangle', 0.06); },
    finish() { [0, 80, 160, 240].forEach((d, i) => setTimeout(() => this.tone(523 + i * 130, 0.25, 'triangle', 0.12), d)); },
};

// ============================================================
// PARTICLE SYSTEM
// ============================================================
class Particles {
    constructor() { this.list = []; }
    emit(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            this.list.push({
                x, y, vx: rnd(-80, 80), vy: rnd(-120, 20),
                life: 1, decay: rnd(1.5, 3), r: rnd(2, 5), color
            });
        }
    }
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.vy += 200 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) this.list.splice(i, 1);
        }
    }
    draw(ctx, camY) {
        for (const p of this.list) {
            ctx.globalAlpha = clamp(p.life, 0, 1);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y - camY, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    clear() { this.list = []; }
}

// ============================================================
// MARBLE CLASS
// ============================================================
class Marble {
    constructor(data, index, total) {
        this.name = data.name;
        this.color = data.color;
        this.speed = data.speed;
        this.weight = data.weight;
        this.bounciness = data.bounce;
        this.luck = data.luck;
        this.r = CFG.marbleRadius(total);
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.finished = false;
        this.finishTime = null;
        this.position = 0;
        this.trail = [];
        this._cele = false;
        this.eliminated = false;
    }

    placeAtStart(index, total, path) {
        const bounds = getTrackBounds(path, 30);
        const w = bounds.r - bounds.l;
        const r = this.r;
        const cols = Math.min(total, Math.max(4, Math.floor(w / (r * 2.8))));
        const col = index % cols;
        const row = Math.floor(index / cols);
        this.x = bounds.l + (col + 1) * (w / (cols + 1));
        this.y = 30 + row * (r * 2.8);
        this.vx = 0; this.vy = 0;
    }

    update(dt) {
        if (this.finished) return;
        const g = CFG.GRAVITY * this.speed * (1 + rnd(-CFG.SPEED_VAR, CFG.SPEED_VAR));
        this.vy += g * dt;
        this.vx *= CFG.FRICTION;
        this.vy *= CFG.FRICTION;
        const maxV = CFG.MAX_VEL;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > maxV) { this.vx *= maxV / spd; this.vy *= maxV / spd; }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    addTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
    }

    reset(index, total, path) {
        this.finished = false;
        this.finishTime = null;
        this.position = 0;
        this.vx = 0; this.vy = 0;
        this.trail = [];
        this._cele = false;
        this.eliminated = false;
        this.placeAtStart(index, total, path);
    }
}

// ============================================================
// RENDERER
// ============================================================
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.scale = this.canvas.width / CFG.WORLD_W;
        this.viewH = this.canvas.height / this.scale;
    }

    clear(bg1, bg2) {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, bg1);
        grad.addColorStop(1, bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    beginWorld(camY) {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);
        ctx.translate(0, -camY);
    }

    endWorld() { this.ctx.restore(); }

    drawTrack(path, wallColor, trackColor, camY) {
        const ctx = this.ctx;
        const top = camY - 50;
        const bot = camY + this.viewH + 50;

        // Track fill
        ctx.fillStyle = trackColor;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (!started) { ctx.moveTo(p.l, p.y); started = true; }
            else ctx.lineTo(p.l, p.y);
        }
        for (let i = path.length - 1; i >= 0; i--) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            ctx.lineTo(p.r, p.y);
        }
        ctx.closePath();
        ctx.fill();

        // Walls
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = wallColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (i === 0 || path[i - 1].y < top - 200) ctx.moveTo(p.l, p.y);
            else ctx.lineTo(p.l, p.y);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (i === 0 || path[i - 1].y < top - 200) ctx.moveTo(p.r, p.y);
            else ctx.lineTo(p.r, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawObstacles(obstacles, camY, wallColor) {
        const ctx = this.ctx;
        const top = camY - 50, bot = camY + this.viewH + 50;
        for (const o of obstacles) {
            const oy = o.type === 'bar' ? Math.min(o.y1, o.y2) : o.y;
            if (oy < top - 50 || oy > bot + 50) continue;

            if (o.type === 'peg') {
                ctx.fillStyle = wallColor;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (o.type === 'bumper') {
                const grad = ctx.createRadialGradient(o.x - 3, o.y - 3, 2, o.x, o.y, o.r);
                grad.addColorStop(0, '#ff8888');
                grad.addColorStop(1, '#cc3333');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff6666';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (o.type === 'bar') {
                ctx.strokeStyle = wallColor;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(o.x1, o.y1);
                ctx.lineTo(o.x2, o.y2);
                ctx.stroke();
                ctx.lineCap = 'butt';
            }
        }
    }

    drawStartFinish(startY, finishY, trackPath) {
        const ctx = this.ctx;
        const bs = getTrackBounds(trackPath, startY);
        const bf = getTrackBounds(trackPath, finishY);

        // Start line
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(bs.l, startY);
        ctx.lineTo(bs.r, startY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 18px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BAŞLANGIÇ', (bs.l + bs.r) / 2, startY - 10);

        // Finish line
        const fw = bf.r - bf.l;
        const cells = 12;
        const cellW = fw / cells;
        for (let i = 0; i < cells; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#222222';
            ctx.fillRect(bf.l + i * cellW, finishY - 4, cellW, 8);
        }
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BİTİŞ', (bf.l + bf.r) / 2, finishY + 25);
    }

    drawMarble(m, showTrail) {
        const ctx = this.ctx;

        // Trail
        if (showTrail && m.trail.length > 1) {
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(m.trail[0].x, m.trail[0].y);
            for (let i = 1; i < m.trail.length; i++) {
                ctx.lineTo(m.trail[i].x, m.trail[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(m.x + 2, m.y + 3, m.r, m.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Marble body gradient
        const grad = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.1, m.x, m.y, m.r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, m.color);
        grad.addColorStop(1, darkenColor(m.color, 0.4));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        // Rim
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(m.x - m.r * 0.25, m.y - m.r * 0.25, m.r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeOff = m.r * 0.22;
        const eyeR = m.r * 0.18;
        const pupilR = eyeR * 0.55;
        const lookX = clamp(m.vx * 0.003, -1.5, 1.5);
        const lookY = clamp(m.vy * 0.002, -1, 1);
        for (const side of [-1, 1]) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(m.x + side * eyeOff, m.y - m.r * 0.1, eyeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(m.x + side * eyeOff + lookX, m.y - m.r * 0.1 + lookY, pupilR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eliminated X mark
        if (m.eliminated) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(m.x - m.r * 0.6, m.y - m.r * 0.6);
            ctx.lineTo(m.x + m.r * 0.6, m.y + m.r * 0.6);
            ctx.moveTo(m.x + m.r * 0.6, m.y - m.r * 0.6);
            ctx.lineTo(m.x - m.r * 0.6, m.y + m.r * 0.6);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    drawMarbleLabel(m) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const tw = ctx.measureText(m.name).width;
        const pad = 4;
        const lx = m.x - tw / 2 - pad;
        const ly = m.y - m.r - 18;
        ctx.fillRect(lx, ly, tw + pad * 2, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.name, m.x, ly + 8);
    }
}

function darkenColor(hex, factor) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return `rgb(${r},${g},${b})`;
}

// ============================================================
// GAME
// ============================================================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.particles = new Particles();
        this.state = 'menu';
        this.marbles = [];
        this.trackData = null;
        this.wallSegs = null;
        this.selectedTrack = TRACKS[0];
        this.selectedCount = CFG.DEFAULT_COUNT;
        this.selectedMarbles = [];
        this.camY = 0;
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = 0;
        this.raceSpeed = 1;
        this.showTrails = true;
        this._lastCd = -1;
        this._dustT = 0;
        this.tournament = { on: false, round: 0, total: 0, scores: {}, courses: [], marbleData: [] };
        this.elimination = { on: false, round: 0, elimPerRound: 1, survivors: [], eliminated: [] };
        this.autoLoop = false;
        this.autoLoopDelay = 0;
        this.raceCount = 0;
        this.lastT = performance.now();
        this.setupUI();
        Audio.init();
        this.loop();
    }

    // ---- UI ----
    setupUI() {
        document.addEventListener('click', () => Audio.resume(), { once: true });
        const $ = id => document.getElementById(id);
        $('btn-quick-race').onclick = () => { this.showScreen('setup'); this.populateSetup(); };
        $('btn-tournament').onclick = () => this.startTournament();
        $('btn-elimination').onclick = () => this.startElimination();
        $('btn-auto-race').onclick = () => this.startAutoRace();
        $('btn-settings').onclick = () => this.showScreen('settings');
        $('btn-back-settings').onclick = () => { this.applySettings(); this.showScreen('menu'); };
        $('btn-back-menu').onclick = () => this.showScreen('menu');
        $('btn-start-race').onclick = () => this.startRace();
        $('racer-count-slider').oninput = e => {
            this.selectedCount = +e.target.value;
            $('racer-count-display').textContent = this.selectedCount;
            this.refreshMarblePrev();
        };
        $('btn-shuffle-racers').onclick = () => this.refreshMarblePrev();
        $('btn-replay').onclick = () => this.replayRace();
        $('btn-new-race').onclick = () => { this.showScreen('setup'); this.populateSetup(); };
        $('btn-back-menu2').onclick = () => { this.cleanup(); this.elimination.on = false; this.autoLoop = false; this.showScreen('menu'); };
        $('btn-skip-race').onclick = () => this.skipRace();
        $('btn-next-tournament-race').onclick = () => this.nextTournamentRace();
        $('btn-end-tournament').onclick = () => { this.cleanup(); this.tournament.on = false; this.showScreen('menu'); };
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const map = { menu: 'menu-screen', setup: 'setup-screen', settings: 'settings-screen', race: 'race-hud', results: 'results-screen', tournament: 'tournament-screen' };
        if (map[name]) document.getElementById(map[name]).classList.add('active');
        this.state = name;
    }

    populateSetup() {
        const cl = document.getElementById('course-list');
        cl.innerHTML = '';
        const allTracks = [...TRACKS, { id: 'random', name: 'Rastgele Parkur', desc: 'Her seferinde farklı! Prosedürel oluşturulmuş sürpriz parkur.', difficulty: 3, lengthLabel: 'Rastgele', _isRandom: true }];
        allTracks.forEach(t => {
            const c = document.createElement('div');
            c.className = 'course-card' + (t === this.selectedTrack ? ' selected' : '');
            c.innerHTML = `<h4>${t._isRandom ? '🎲 ' + t.name : t.name}</h4><p>${t.desc}</p><div class="course-stats"><span>Zorluk: ${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}</span><span>${t.lengthLabel}</span></div>`;
            c.onclick = () => {
                document.querySelectorAll('.course-card').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
                this.selectedTrack = t._isRandom ? generateRandomTrack() : t;
            };
            cl.appendChild(c);
        });
        this.refreshMarblePrev();
    }

    refreshMarblePrev() {
        this.selectedMarbles = shuffle(MARBLE_DB).slice(0, this.selectedCount);
        const pv = document.getElementById('racer-preview');
        pv.innerHTML = '';
        this.selectedMarbles.forEach(m => {
            const b = document.createElement('div');
            b.className = 'racer-badge';
            b.innerHTML = `<span class="racer-color-dot" style="background:${m.color}"></span><span>${m.name}</span>`;
            pv.appendChild(b);
        });
    }

    applySettings() {
        this.raceSpeed = parseFloat(document.getElementById('race-speed').value);
        Audio.enabled = document.getElementById('sound-toggle').checked;
        this.showTrails = document.getElementById('trail-toggle').checked;
    }

    // ---- RACE ----
    startRace() {
        this.cleanup();
        this.trackData = this.selectedTrack.data;
        this.wallSegs = buildWallSegs(this.trackData.path);
        this.marbles = this.selectedMarbles.map((d, i) => {
            const m = new Marble(d, i, this.selectedMarbles.length);
            m.placeAtStart(i, this.selectedMarbles.length, this.trackData.path);
            return m;
        });
        this.camY = 0;
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CFG.COUNTDOWN_SECS + 1;
        this._lastCd = -1;
        this.showScreen('race');
        const nameText = this.autoLoop ? `${this.selectedTrack.name} (#${this.raceCount})` : this.selectedTrack.name;
        document.getElementById('course-name-hud').textContent = nameText;
        document.getElementById('countdown-overlay').classList.remove('hidden');
        this.setupProgressBar();
        this.state = 'countdown';
    }

    setupProgressBar() {
        const tr = document.getElementById('progress-bar-track');
        tr.innerHTML = '<div class="progress-flag">🏁</div>';
        this.marbles.forEach(m => {
            const d = document.createElement('div');
            d.className = 'progress-dot';
            d.style.backgroundColor = m.color;
            d.dataset.name = m.name;
            tr.appendChild(d);
        });
    }

    cleanup() {
        this.marbles = [];
        this.trackData = null;
        this.wallSegs = null;
        this.particles.clear();
        const b = document.querySelector('.finish-banner');
        if (b) b.remove();
    }

    replayRace() {
        if (!this.trackData) return;
        this.marbles.forEach((m, i) => m.reset(i, this.marbles.length, this.trackData.path));
        this.particles.clear();
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CFG.COUNTDOWN_SECS + 1;
        this._lastCd = -1;
        this.camY = 0;
        this.showScreen('race');
        document.getElementById('countdown-overlay').classList.remove('hidden');
        this.setupProgressBar();
        this.state = 'countdown';
    }

    skipRace() {
        this.marbles.forEach(m => {
            if (!m.finished) { m.finished = true; m.finishTime = this.raceTime + Math.random() * 2; m.y = this.trackData.length; }
        });
        this.raceFinished = true;
        this.showResults();
    }

    // ---- ELIMINATION MODE ----
    startElimination() {
        this.elimination.on = true;
        this.elimination.round = 0;
        this.elimination.elimPerRound = 1;
        this.selectedCount = MARBLE_DB.length;
        this.selectedMarbles = shuffle(MARBLE_DB);
        this.elimination.survivors = [...this.selectedMarbles];
        this.elimination.eliminated = [];
        this.selectedTrack = TRACKS[Math.floor(Math.random() * TRACKS.length)];
        this.startRace();
    }

    finishEliminationRound() {
        const sorted = [...this.marbles].sort((a, b) => {
            if (a.finishTime == null && b.finishTime == null) return b.y - a.y;
            if (a.finishTime == null) return 1;
            if (b.finishTime == null) return -1;
            return a.finishTime - b.finishTime;
        });
        const elimCount = Math.min(this.elimination.elimPerRound, sorted.length - 2);
        const toElim = sorted.slice(sorted.length - elimCount);
        toElim.forEach(m => {
            m.eliminated = true;
            this.elimination.eliminated.push(m.name);
        });
        this.elimination.survivors = this.elimination.survivors.filter(
            md => !this.elimination.eliminated.includes(md.name)
        );
        this.elimination.round++;

        // Show elimination banner
        const elimNames = toElim.map(m => m.name).join(', ');
        const banner = document.getElementById('elim-banner');
        const bannerText = document.getElementById('elim-banner-text');
        bannerText.textContent = `❌ ELENDİ: ${elimNames}`;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 2500);

        if (this.elimination.survivors.length <= 1) {
            setTimeout(() => {
                this.elimination.on = false;
                this.showResults();
            }, 3000);
        } else {
            const delay = this.elimination.survivors.length > 20 ? 2000 : 3500;
            setTimeout(() => {
                this.selectedMarbles = this.elimination.survivors;
                this.selectedCount = this.elimination.survivors.length;
                this.selectedTrack = TRACKS[Math.floor(Math.random() * TRACKS.length)];
                this.startRace();
            }, delay);
        }
    }

    startAutoRace() {
        this.autoLoop = true;
        this.raceCount = 0;
        this.launchAutoRace();
    }

    launchAutoRace() {
        const useRandom = Math.random() > 0.4;
        this.selectedTrack = useRandom ? generateRandomTrack() : TRACKS[Math.floor(Math.random() * TRACKS.length)];
        this.selectedCount = 6 + Math.floor(Math.random() * 7);
        this.selectedMarbles = shuffle(MARBLE_DB).slice(0, this.selectedCount);
        this.raceCount++;
        this.startRace();
    }

    startTournament() {
        const t = this.tournament;
        t.on = true;
        t.round = 0;
        t.total = Math.min(TRACKS.length, 7);
        t.courses = shuffle([...TRACKS]).slice(0, 7);
        t.marbleData = shuffle(MARBLE_DB).slice(0, 8);
        t.scores = {};
        t.marbleData.forEach(m => { t.scores[m.name] = 0; });
        this.selectedMarbles = t.marbleData;
        this.selectedCount = 8;
        this.selectedTrack = t.courses[0];
        document.getElementById('btn-next-tournament-race').style.display = '';
        this.startRace();
    }

    nextTournamentRace() {
        const t = this.tournament;
        t.round++;
        if (t.round >= t.total) { this.showTournamentFinal(); return; }
        this.selectedTrack = t.courses[t.round];
        this.startRace();
    }

    showTournamentStandings() {
        const t = this.tournament;
        const div = document.getElementById('tournament-standings');
        div.innerHTML = '';
        const sorted = Object.entries(t.scores).sort((a, b) => b[1] - a[1]);
        sorted.forEach(([name, pts], i) => {
            const d = t.marbleData.find(m => m.name === name);
            const row = document.createElement('div');
            row.className = 'tournament-row';
            row.innerHTML = `<span class="t-pos">${i + 1}.</span><span class="t-color" style="background:${d.color}"></span><span class="t-name">${name}</span><span class="t-points">${pts} puan</span>`;
            div.appendChild(row);
        });
        document.getElementById('tournament-race-info').textContent = `Yarış ${t.round + 1} / ${t.total} tamamlandı`;
        this.showScreen('tournament');
    }

    showTournamentFinal() {
        document.getElementById('btn-next-tournament-race').style.display = 'none';
        document.getElementById('tournament-race-info').textContent = 'Turnuva Tamamlandı!';
        this.showTournamentStandings();
    }

    showResults() {
        const sorted = [...this.marbles].sort((a, b) => {
            if (a.finishTime == null && b.finishTime == null) return b.y - a.y;
            if (a.finishTime == null) return 1;
            if (b.finishTime == null) return -1;
            return a.finishTime - b.finishTime;
        });
        const wt = sorted[0].finishTime || 0;

        if (this.tournament.on) {
            const pts = [25, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0];
            sorted.forEach((m, i) => { if (this.tournament.scores[m.name] !== undefined) this.tournament.scores[m.name] += (pts[i] || 0); });
        }

        // Podium
        const podium = document.getElementById('results-podium');
        podium.innerHTML = '';
        [1, 0, 2].forEach(idx => {
            if (idx >= sorted.length) return;
            const m = sorted[idx];
            const p = document.createElement('div');
            p.className = `podium-place podium-${idx + 1}`;
            p.innerHTML = `<div class="podium-avatar" style="background:${m.color};border-color:${['var(--gold)', 'var(--silver)', 'var(--bronze)'][idx]}"></div><div class="podium-name">${m.name}</div><div class="podium-time">${m.finishTime ? fmtTime(m.finishTime) : 'DNF'}</div><div class="podium-block">${idx + 1}</div>`;
            podium.appendChild(p);
        });

        // Table
        const tbl = document.getElementById('results-table');
        tbl.innerHTML = '';
        sorted.forEach((m, i) => {
            const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const diff = m.finishTime && wt ? `+${(m.finishTime - wt).toFixed(2)}s` : '';
            const row = document.createElement('div');
            row.className = `result-row ${cls}`;
            row.innerHTML = `<span class="result-pos">${i + 1}</span><span class="result-color" style="background:${m.color}"></span><span class="result-name">${m.name}</span><span class="result-time">${m.finishTime ? fmtTime(m.finishTime) : 'DNF'}</span><span class="result-diff">${i === 0 ? '' : diff}</span>`;
            tbl.appendChild(row);
        });

        if (this.tournament.on) this.showTournamentStandings();
        else {
            this.showScreen('results');
            if (this.autoLoop) {
                this.autoLoopDelay = 5;
            }
        }
    }

    updateHUD() {
        document.getElementById('race-timer').textContent = fmtTime(this.raceTime);

        // Elimination info
        const elimInfo = document.getElementById('elim-info');
        if (this.elimination.on) {
            elimInfo.classList.remove('hidden');
            const totalRounds = this.elimination.survivors.length + this.elimination.eliminated.length - 1;
            document.getElementById('elim-round-text').textContent = `Bölüm: ${this.elimination.round + 1} / ${totalRounds}`;
            document.getElementById('elim-remaining-text').textContent = `Kalan: ${this.elimination.survivors.length} bilye`;
        } else {
            elimInfo.classList.add('hidden');
        }

        const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
        const posDiv = document.getElementById('hud-positions');
        posDiv.innerHTML = '';
        sorted.forEach((m, i) => {
            const pct = this.trackData ? Math.round((m.y / this.trackData.length) * 100) : 0;
            const row = document.createElement('div');
            row.className = 'hud-position-row' + (i === 0 ? ' first' : '') + (m.eliminated ? ' pos-eliminated' : '');
            row.innerHTML = `<span class="pos-num">${i + 1}</span><span class="pos-color" style="background:${m.color}"></span><span class="pos-name">${m.name}</span><span class="pos-progress">${m.finished ? '🏁' : pct + '%'}</span>`;
            posDiv.appendChild(row);
        });
        // Progress dots
        document.querySelectorAll('.progress-dot').forEach(dot => {
            const m = this.marbles.find(x => x.name === dot.dataset.name);
            if (m && this.trackData) dot.style.left = clamp(m.y / this.trackData.length * 100, 0, 98) + '%';
        });
    }

    // ---- PHYSICS STEP ----
    physicsStep(dt) {
        if (!this.trackData) return;
        const { path, obstacles, length } = this.trackData;
        const walls = this.wallSegs;

        for (const m of this.marbles) {
            if (m.finished) continue;
            m.update(dt);

            // Wall collisions
            const allSegs = [...walls.left, ...walls.right];
            for (const seg of allSegs) {
                const c = circleSegCollision(m.x, m.y, m.r, seg.x1, seg.y1, seg.x2, seg.y2);
                if (c) {
                    m.x += c.nx * c.depth;
                    m.y += c.ny * c.depth;
                    const dot = m.vx * c.nx + m.vy * c.ny;
                    if (dot < 0) {
                        const bounce = CFG.WALL_BOUNCE * m.bounciness;
                        m.vx -= (1 + bounce) * dot * c.nx;
                        m.vy -= (1 + bounce) * dot * c.ny;
                        m.vx += rnd(-10, 10) * m.luck;
                    }
                }
            }

            // Obstacle collisions
            for (const o of obstacles) {
                if (o.type === 'peg' || o.type === 'bumper') {
                    const c = circleCircleCol(m.x, m.y, m.r, o.x, o.y, o.r);
                    if (c) {
                        m.x -= c.nx * c.depth;
                        m.y -= c.ny * c.depth;
                        const dot = m.vx * c.nx + m.vy * c.ny;
                        if (dot > 0) {
                            const bounce = (o.type === 'bumper' ? 1.2 : 0.8) * m.bounciness;
                            m.vx -= (1 + bounce) * dot * c.nx;
                            m.vy -= (1 + bounce) * dot * c.ny;
                            m.vx += rnd(-15, 15) * m.luck;
                            Audio.bounce();
                        }
                    }
                } else if (o.type === 'bar') {
                    const c = circleSegCollision(m.x, m.y, m.r, o.x1, o.y1, o.x2, o.y2);
                    if (c) {
                        m.x += c.nx * c.depth;
                        m.y += c.ny * c.depth;
                        const dot = m.vx * c.nx + m.vy * c.ny;
                        if (dot < 0) {
                            m.vx -= (1 + CFG.WALL_BOUNCE * m.bounciness) * dot * c.nx;
                            m.vy -= (1 + CFG.WALL_BOUNCE * m.bounciness) * dot * c.ny;
                        }
                    }
                }
            }

            // Finish check
            if (m.y >= length && !m.finished) {
                m.finished = true;
                m.finishTime = this.raceTime;
            }
        }

        // Marble-marble collisions
        for (let i = 0; i < this.marbles.length; i++) {
            for (let j = i + 1; j < this.marbles.length; j++) {
                const a = this.marbles[i], b = this.marbles[j];
                if (a.finished && b.finished) continue;
                const c = circleCircleCol(a.x, a.y, a.r, b.x, b.y, b.r);
                if (c) {
                    const totalW = a.weight + b.weight;
                    const wa = b.weight / totalW, wb = a.weight / totalW;
                    a.x -= c.nx * c.depth * wa;
                    a.y -= c.ny * c.depth * wa;
                    b.x += c.nx * c.depth * wb;
                    b.y += c.ny * c.depth * wb;
                    const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
                    const dot = dvx * c.nx + dvy * c.ny;
                    if (dot > 0) {
                        const bounce = CFG.MARBLE_BOUNCE;
                        a.vx -= (1 + bounce) * dot * c.nx * wa;
                        a.vy -= (1 + bounce) * dot * c.ny * wa;
                        b.vx += (1 + bounce) * dot * c.nx * wb;
                        b.vy += (1 + bounce) * dot * c.ny * wb;
                    }
                }
            }
        }
    }

    // ---- CAMERA ----
    updateCamera(dt) {
        if (!this.marbles.length || !this.trackData) return;
        const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
        const top4 = sorted.slice(0, Math.min(4, sorted.length));
        const avgY = top4.reduce((s, m) => s + m.y, 0) / top4.length;
        const targetY = avgY - this.renderer.viewH * 0.35;
        this.camY = lerp(this.camY, targetY, 1 - Math.exp(-4 * dt));
    }

    // ---- MAIN LOOP ----
    loop() {
        requestAnimationFrame(() => this.loop());
        const now = performance.now();
        let dt = Math.min((now - this.lastT) / 1000, 0.05);
        this.lastT = now;

        // Always render background
        if (this.state === 'menu' || this.state === 'setup' || this.state === 'settings' || this.state === 'results' || this.state === 'tournament') {
            this.renderer.clear('#0a0a2e', '#162050');
            if (this.state === 'results' && this.autoLoop && this.autoLoopDelay > 0) {
                this.autoLoopDelay -= dt;
                if (this.autoLoopDelay <= 0) {
                    this.launchAutoRace();
                }
            }
            return;
        }

        if (!this.trackData) return;
        const track = this.selectedTrack;

        if (this.state === 'countdown') {
            this.countdownTime -= dt;
            const ct = document.getElementById('countdown-text');
            const co = document.getElementById('countdown-overlay');
            const num = Math.ceil(this.countdownTime - 1);
            if (this.countdownTime > 1) {
                if (this._lastCd !== num) { this._lastCd = num; Audio.beep(); }
                ct.textContent = num;
                ct.style.animation = 'none'; ct.offsetHeight; ct.style.animation = 'countdownPop .5s ease-out';
            } else if (this.countdownTime > 0) {
                if (this._lastCd !== 0) { this._lastCd = 0; Audio.go(); }
                ct.textContent = 'BAŞLA!';
                ct.style.color = 'var(--success)';
                ct.style.fontSize = '6rem';
            } else {
                co.classList.add('hidden');
                ct.style.color = '#fff';
                ct.style.fontSize = '12rem';
                this.state = 'racing';
            }
            this.renderFrame(track);
            return;
        }

        if (this.state === 'racing') {
            const sDt = dt * this.raceSpeed;
            this.raceTime += sDt;
            const subDt = sDt / CFG.SUB_STEPS;
            for (let s = 0; s < CFG.SUB_STEPS; s++) this.physicsStep(subDt);

            // Trails
            this._dustT += sDt;
            if (this._dustT > 0.05) {
                this._dustT = 0;
                this.marbles.forEach(m => { if (!m.finished) m.addTrail(); });
            }

            // Finish particles
            this.marbles.forEach(m => {
                if (m.finished && !m._cele) {
                    m._cele = true;
                    this.particles.emit(m.x, m.y, m.color, 20);
                    if (m.position === 0 && !document.querySelector('.finish-banner')) {
                        Audio.finish();
                        const banner = document.createElement('div');
                        banner.className = 'finish-banner';
                        banner.textContent = `🏆 ${m.name} 🏆`;
                        document.body.appendChild(banner);
                        setTimeout(() => banner.remove(), 3000);
                    }
                }
            });

            // Positions
            const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
            sorted.forEach((m, i) => { m.position = i; });

            // All finished?
            if (this.marbles.every(m => m.finished) && !this.raceFinished) {
                this.raceFinished = true;
                this.finishTimer = this.elimination.on ? CFG.ELIM_FINISH_DELAY : CFG.FINISH_DELAY;
            }
            if (this.raceFinished) {
                this.finishTimer -= sDt;
                if (this.finishTimer <= 0) {
                    if (this.elimination.on) {
                        this.finishEliminationRound();
                        this.raceFinished = false;
                        this.finishTimer = 999;
                    } else {
                        this.showResults();
                    }
                }
            }

            // DNF
            const anyDone = this.marbles.some(m => m.finished);
            if (anyDone) {
                const wt = this.marbles.filter(m => m.finished).reduce((mn, m) => Math.min(mn, m.finishTime), Infinity);
                this.marbles.forEach(m => { if (!m.finished && this.raceTime > wt * 3) { m.finished = true; m.finishTime = this.raceTime; } });
            }

            this.particles.update(sDt);
            this.updateCamera(dt);
            this.updateHUD();
        }

        this.renderFrame(track);
    }

    renderFrame(track) {
        const r = this.renderer;
        r.clear(track.bg1, track.bg2);
        r.beginWorld(this.camY);
        r.drawTrack(this.trackData.path, track.wallColor, track.trackColor, this.camY);
        r.drawObstacles(this.trackData.obstacles, this.camY, track.wallColor);
        r.drawStartFinish(0, this.trackData.length, this.trackData.path);

        // Sort marbles by Y for draw order
        const sorted = [...this.marbles].sort((a, b) => a.y - b.y);
        sorted.forEach(m => r.drawMarble(m, this.showTrails));
        sorted.forEach(m => r.drawMarbleLabel(m));

        this.particles.draw(r.ctx, this.camY);
        r.endWorld();
    }
}

// ============================================================
// START
// ============================================================
window.addEventListener('DOMContentLoaded', () => new Game());
